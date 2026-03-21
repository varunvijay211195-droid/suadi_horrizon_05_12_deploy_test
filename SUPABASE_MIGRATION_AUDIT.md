# Admin Panel — MongoDB → Supabase Migration Audit

> **Total API route files using MongoDB:** 55  
> **Mongoose `.aggregate()` routes (hardest to convert):** 6  
> **Lib helpers using MongoDB:** 3  
> **Admin pages:** 15  

---

## 🔴 TIER 1 — Complex (Aggregation Pipelines → SQL/RPC)

These routes use `Model.aggregate()` which has *no direct Supabase equivalent*. They must be rewritten as either **Supabase RPC functions** (PostgreSQL stored procedures) or **raw SQL queries via `supabase.rpc()`**.

| Route File | Aggregations Used | Difficulty |
|---|---|---|
| [admin/stats/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/stats/route.ts) | 5 pipelines: revenue sum, monthly revenue, top products (`$unwind` + `$group`), order status breakdown, month-over-month comparison | 🔴 **Very Hard** |
| [admin/analytics/sales/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/analytics/sales/route.ts) | 4 pipelines: sales trend (daily grouping), top products, category breakdown (`$lookup` + `$unwind`), summary stats | 🔴 **Very Hard** |
| [admin/analytics/inventory/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/analytics/inventory/route.ts) | 3 pipelines: inventory value (`$multiply` + `$group`), slow-moving cross-join (`$lookup`), category distribution | 🔴 **Hard** |
| [admin/analytics/users/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/analytics/users/route.ts) | 2 pipelines: new users trend (daily), users by role/status | 🟡 **Medium** |
| [admin/inventory/alerts/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/inventory/alerts/route.ts) | 1 pipeline: alert stats with `$cond` conditional counts | 🟡 **Medium** |
| [product-views/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/product-views/route.ts) | Aggregation for trending products | 🟡 **Medium** |

### Recommended Approach
Create PostgreSQL functions (callable via `supabase.rpc()`):

```sql
-- Example: Monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue(months_back int DEFAULT 6)
RETURNS TABLE(month text, sales numeric, count bigint) AS $$
  SELECT
    to_char(created_at, 'YYYY-MM') AS month,
    COALESCE(SUM(total_amount), 0) AS sales,
    COUNT(*) AS count
  FROM orders
  WHERE created_at >= NOW() - (months_back || ' months')::interval
    AND status != 'cancelled'
  GROUP BY 1
  ORDER BY 1;
$$ LANGUAGE sql STABLE;
```

---

## 🟠 TIER 2 — Product CRUD + Image Upload (Core Admin Workflow)

These are the **most-used admin features**. Product creation/editing involves Cloudinary image upload, which stays unchanged — only the DB save/query layer switches.

| Route File | Mongoose Calls | Supabase Equivalent |
|---|---|---|
| [products/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/products/route.ts) | `Product.find()`, `$regex` search, `$gte/$lte` price filter, `Product.countDocuments()`, `Product.insertMany()`, duplicate key error `11000` | `.from('products').select().ilike()`, `.gte()/.lte()`, `.insert()`, unique constraint error |
| [products/[id]/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/products/%5Bid%5D/route.ts) | `Product.findById()`, `.populate('brand category subcategory')`, `Product.findByIdAndUpdate()`, `Product.findByIdAndDelete()`, Cloudinary cleanup on image change/delete | `.from('products').select('*, brands(*), categories(*)').eq('id', id)`, `.update()`, `.delete()` |
| [upload/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/upload/route.ts) | **No MongoDB** — pure Cloudinary | ✅ **No change needed** |
| [upload/delete/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/upload/delete/route.ts) | **No MongoDB** — pure Cloudinary | ✅ **No change needed** |

### Key Patterns to Convert

**`normalizeProduct()` function** — Mongoose `.populate()` returns nested objects that need flattening. With Supabase joins, the response shape differs:

```typescript
// BEFORE (Mongoose)
const product = await Product.findById(id).populate('brand category');
return normalizeProduct(product);

// AFTER (Supabase)
const { data } = await supabase
  .from('products')
  .select('*, brand:brands(name, slug), category:categories(name, slug)')
  .eq('id', id)
  .single();
// Supabase returns { brand: { name, slug }, category: { name, slug } }
// Need to update normalizeProduct or flatten inline
```

**`Product.insertMany()` with `ordered: false`** → Supabase `.insert([...])` with `.onConflict('sku')` for upsert behavior.

**Duplicate key error code `11000`** → Catch Supabase error code `23505` (unique_violation):
```typescript
// BEFORE
if (error.code === 11000) { ... }
// AFTER
if (error.code === '23505') { ... }
```

---

## 🟠 TIER 2 — Order Management

| Route File | Mongoose Calls | Notes |
|---|---|---|
| [orders/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/orders/route.ts) | `Order.create()`, `Order.findById().populate('items.product')`, `User.findById()`, `Product.find({ _id: { $in: [...] } })`, `user.save()` with purchase history push | Complex: Creates order → fetches product details → updates user marketing profile (segment, purchaseHistory, totalSpent) |
| [orders/[id]/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/orders/%5Bid%5D/route.ts) | `Order.findById().populate()`, `Order.findByIdAndUpdate()` | Standard CRUD |

### ⚠️ Special Complexity: Order POST

The order creation route does **6 MongoDB operations** in sequence:
1. `Order.create()` — insert order
2. `Order.findById().populate()` — re-fetch with populated items
3. `User.findById()` — get user for email
4. `Product.find({ _id: { $in: [...] } })` — batch product lookup
5. Update user fields (totalSpent, totalOrders, purchaseHistory, segment)
6. `user.save()` — save user updates

In Supabase, this becomes:
```typescript
const { data: order } = await supabase.from('orders').insert({...}).select().single();
const { data: user } = await supabase.from('users').select().eq('id', userId).single();
// ... compute purchase history entries
await supabase.from('purchase_history').insert(purchaseItems);
await supabase.from('users').update({ total_spent, total_orders, segment }).eq('id', userId);
```

---

## 🟡 TIER 3 — Banner Management

| Route File | Mongoose Calls | Supabase Equivalent |
|---|---|---|
| [admin/banners/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/banners/route.ts) | `Banner.find(query).sort()`, `Banner.create()` | `.from('banners').select().order()`, `.insert()` |
| [admin/banners/[id]/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/banners/%5Bid%5D/route.ts) | `Banner.findByIdAndUpdate()`, `Banner.findByIdAndDelete()` | `.update().eq('id')`, `.delete().eq('id')` |
| [banners/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/banners/route.ts) | `Banner.find()` (public endpoint) | `.from('banners').select()` |

---

## 🟡 TIER 3 — Invoice System

| Route File | Mongoose Calls | Notes |
|---|---|---|
| [admin/invoices/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/invoices/route.ts) | `Invoice.find()`, `Invoice.countDocuments()`, `Invoice.create()`, `$regex` search across nested fields (`customer.name`, `customer.email`), `Order.findById().populate('user')`, `QuoteRequest.findById()` | Invoice number generation uses `countDocuments` with regex |
| [admin/invoices/[id]/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/invoices/%5Bid%5D/route.ts) | `Invoice.findById()`, `Invoice.findByIdAndUpdate()`, `Invoice.findByIdAndDelete()` | Standard CRUD |
| [admin/invoices/[id]/send/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/invoices/%5Bid%5D/send/route.ts) | `Invoice.findById()`, `invoice.save()` (status update after email sent) | Also uses PDF generation + email — those parts stay unchanged |
| [admin/invoices/[id]/pdf/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/invoices/%5Bid%5D/pdf/route.ts) | `Invoice.findById()` | PDF generation stays the same |

### ⚠️ Special: Invoice Number Generation
```typescript
// BEFORE (Mongoose)
const count = await Invoice.countDocuments({
    invoiceNumber: { $regex: `^INV-${year}-` }
});
const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

// AFTER (Supabase) — use a sequence or max() + 1
const { count } = await supabase
  .from('invoices')
  .select('*', { count: 'exact', head: true })
  .like('invoice_number', `INV-${year}-%`);
```

### ⚠️ Special: Nested Field Search
```typescript
// BEFORE — Mongoose nested dot-notation
filter.$or = [
  { invoiceNumber: { $regex: search, $options: 'i' } },
  { 'customer.name': { $regex: search, $options: 'i' } },
  { 'customer.company': { $regex: search, $options: 'i' } },
];

// AFTER — Supabase JSONB query (customer is stored as JSONB in PG)
.or(`invoice_number.ilike.%${search}%,customer->>name.ilike.%${search}%,customer->>company.ilike.%${search}%`)
```

---

## 🟡 TIER 3 — Quote Request Management

| Route File | Mongoose Calls | Notes |
|---|---|---|
| [quotes/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/quotes/route.ts) | `QuoteRequest.create()` | Public endpoint |
| [admin/quotes/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/quotes/route.ts) | `QuoteRequest.find()`, `QuoteRequest.countDocuments()`, `QuoteRequest.findById()`, `quote.messages.push()`, `quote.save()` | Array push for messages needs special handling |

### ⚠️ Special: Array Push Pattern
```typescript
// BEFORE (Mongoose)
quote.messages.push({ sender: 'admin', text: adminResponse, createdAt: new Date() });
await quote.save();

// AFTER (Supabase) — messages is a JSONB array column
const { data: quote } = await supabase.from('quote_requests').select().eq('id', id).single();
const messages = [...(quote.messages || []), { sender: 'admin', text: adminResponse, created_at: new Date() }];
await supabase.from('quote_requests').update({ messages, status, admin_response: adminResponse }).eq('id', id);
```

---

## 🟢 TIER 4 — Simple CRUD (Straightforward Conversion)

| Route File | Mongoose Calls | Supabase Equivalent |
|---|---|---|
| [admin/notifications/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/notifications/route.ts) | `Notification.find()`, `countDocuments()` | `.from('notifications').select()`, `.select('*', { count: 'exact' })` |
| [admin/notifications/[id]/read/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/notifications/%5Bid%5D/read/route.ts) | `Notification.findByIdAndUpdate()` | `.update({ is_read: true }).eq('id', id)` |
| [admin/notifications/read-all/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/notifications/read-all/route.ts) | `Notification.updateMany()` | `.update({ is_read: true }).eq('is_read', false)` |
| [admin/alerts/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/alerts/route.ts) | `Product.countDocuments()`, `Order.countDocuments()`, `User.countDocuments()` | `.select('*', { count: 'exact', head: true })` |
| [admin/alerts/low-stock/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/alerts/low-stock/route.ts) | `Product.find({ stock: { $lt: threshold } })` | `.from('products').select().lt('stock', threshold)` |
| [admin/homepage/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/homepage/route.ts) | `HomepageConfig.getConfig()`, `config.save()` | `.from('homepage_config').select().single()`, `.upsert()` |
| [admin/settings/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/admin/settings/route.ts) | `Settings.find()`, `Settings.findOneAndUpdate()` with upsert | `.from('settings').select()`, `.upsert()` |
| [categories/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/categories/route.ts) | `Category.find()`, `Category.create()` | `.from('categories').select()`, `.insert()` |
| [brands/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/brands/route.ts) | `Brand.find()`, `Brand.create()` | `.from('brands').select()`, `.insert()` |
| [news/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/news/route.ts) | `News.find()`, `News.create()` | `.from('news').select()`, `.insert()` |
| [users/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/users/route.ts) | `User.find()`, `User.countDocuments()`, `User.findOne()`, `User.create()` | Standard Supabase CRUD |
| [users/[id]/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/users/%5Bid%5D/route.ts) | `User.findById()`, `User.findByIdAndUpdate()`, `User.findByIdAndDelete()` | Standard Supabase CRUD |

---

## 🟢 TIER 4 — Auth Routes

| Route File | Mongoose Calls | Special Notes |
|---|---|---|
| [auth/login/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/auth/login/route.ts) | `User.findOne({ email })`, `user.comparePassword()`, `user.save()` | **Password hashing** uses Mongoose middleware (`pre('save')`) — must manually use `bcrypt.compare()` with Supabase |
| [auth/register/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/auth/register/route.ts) | `User.findOne()`, `User.create()` | Password hashing in Mongoose `pre('save')` hook — must hash explicitly before `.insert()` |
| [auth/me/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/auth/me/route.ts) | `User.findById().select('-password')` | Use `.select('id, email, role, profile, ...')` |
| [auth/refresh/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/auth/refresh/route.ts) | `User.findById()`, `user.save()` | Refresh token rotation |
| [auth/forgot-password/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/auth/forgot-password/route.ts) | `User.findOne()`, `user.save()` | Stores reset token |
| [auth/reset-password/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/auth/reset-password/route.ts) | `User.findOne()`, `user.save()` | Validates token + hashes new password |
| [auth/logout/route.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/app/api/auth/logout/route.ts) | `User.findById()`, `user.save()` | Clears refresh token |

### ⚠️ Critical: Password Hashing
Mongoose uses `pre('save')` middleware to auto-hash passwords. With Supabase you must hash explicitly:
```typescript
// BEFORE — Mongoose handles it automatically in pre('save')
const user = await User.create({ email, password, profile: { name } });

// AFTER — Manual bcrypt
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 12);
const { data } = await supabase.from('users').insert({
  email, password: hashedPassword, profile: { name }
}).select().single();
```

---

## 🔧 Lib Helper Files Using MongoDB

| File | Usage | Impact |
|---|---|---|
| [lib/db/mongodb.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/lib/db/mongodb.ts) | `connectDB()` — Mongoose connection singleton | Replace with `createClient()` from `@supabase/supabase-js` |
| [lib/notifications/adminNotifications.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/lib/notifications/adminNotifications.ts) | `connectDB()`, `Notification.create()`, `Settings.findOne()` | Notification creation + settings check |
| [lib/auth/adminAuth.ts](file:///c:/Users/vv/Desktop/saudi_horizon_fresh/src/lib/auth/adminAuth.ts) | `connectDB()` | Auth verification |

---

## ✅ Files That Need NO Database Changes

| File | Reason |
|---|---|
| `api/upload/route.ts` | Pure Cloudinary — no MongoDB |
| `api/upload/delete/route.ts` | Pure Cloudinary — no MongoDB |
| `api/auth/config/route.ts` | Returns static config |
| `api/health/route.ts` | Health check only |
| `api/hyperpay/*` | Payment gateway — doesn't directly use models |
| All admin **page.tsx** files (15) | Client components that call APIs — no direct DB access |

---

## 📊 Migration Effort Summary

| Tier | Count | Effort |
|---|---|---|
| 🔴 Tier 1 — Aggregation routes | 6 files | ~3-4 hours each (SQL functions) |
| 🟠 Tier 2 — Product + Order CRUD | 4 files | ~2-3 hours each |
| 🟡 Tier 3 — Banners/Invoices/Quotes | 8 files | ~1-2 hours each |
| 🟢 Tier 4 — Simple CRUD + Auth | 20+ files | ~30-60 min each |
| 🔧 Lib helpers | 3 files | ~1-2 hours total |
| ✅ No change needed | 6+ files | 0 |
| **Total estimated** | **~55 files** | **~40-60 hours** |

---

## 🎯 Recommended Migration Order

1. **Create `src/lib/db/supabase.ts`** — Supabase client singleton (replaces `mongodb.ts`)
2. **Tier 4 simple CRUD** first — categories, brands, notifications, settings (build confidence)
3. **Auth routes** — login, register, password flows (critical path, handles password hashing)
4. **Tier 3** — banners, quotes, invoices (medium complexity)
5. **Tier 2** — products + orders (highest-traffic admin features)
6. **Tier 1** — analytics/stats (create SQL functions, then call via RPC)
7. **Lib helpers** — update `adminNotifications.ts`, `adminAuth.ts`
8. **Remove** all Mongoose models, `mongodb.ts`, and `mongoose` from `package.json`

---

## 🔑 Global Find-and-Replace Patterns

Every route file follows this pattern:

```typescript
// REMOVE these two lines from every file:
import connectDB from '@/lib/db/mongodb';
import ModelName from '@/lib/db/models/ModelName';

// REPLACE with:
import { supabase } from '@/lib/db/supabase';
```

| Mongoose Pattern | Supabase Equivalent |
|---|---|
| `await connectDB()` | *(delete — Supabase client is always ready)* |
| `Model.find(query)` | `supabase.from('table').select().match(query)` |
| `Model.findById(id)` | `supabase.from('table').select().eq('id', id).single()` |
| `Model.findOne({ email })` | `supabase.from('table').select().eq('email', email).single()` |
| `Model.create(data)` | `supabase.from('table').insert(data).select().single()` |
| `Model.insertMany(arr)` | `supabase.from('table').insert(arr).select()` |
| `Model.findByIdAndUpdate(id, data)` | `supabase.from('table').update(data).eq('id', id).select().single()` |
| `Model.findByIdAndDelete(id)` | `supabase.from('table').delete().eq('id', id)` |
| `Model.countDocuments(query)` | `supabase.from('table').select('*', { count: 'exact', head: true }).match(query)` |
| `Model.updateMany(filter, update)` | `supabase.from('table').update(update).match(filter)` |
| `{ $regex: search, $options: 'i' }` | `.ilike('field', `%${search}%`)` |
| `{ field: { $gte: min, $lte: max } }` | `.gte('field', min).lte('field', max)` |
| `{ field: { $lt: threshold } }` | `.lt('field', threshold)` |
| `.sort({ createdAt: -1 })` | `.order('created_at', { ascending: false })` |
| `.skip(offset).limit(count)` | `.range(offset, offset + count - 1)` |
| `.select('field1 field2 -password')` | `.select('field1, field2')` |
| `.populate('ref')` | `.select('*, ref_table(*)')` |
| `.lean()` | *(not needed — Supabase returns plain objects)* |
| `error.code === 11000` | `error.code === '23505'` |
