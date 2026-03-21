# Supabase API Route Refactoring Guide

This guide provides step-by-step instructions for converting the 70+ MongoDB API routes to use Supabase.

## Overview

The application currently uses Mongoose/MongoDB for all database operations. We need to systematically convert these to use Supabase PostgreSQL with proper SQL queries.

## Conversion Patterns

### 1. Basic CRUD Operations

#### MongoDB → Supabase Pattern

**Before (MongoDB):**
```javascript
// src/api/products.ts
import { Product } from '@/lib/models';

export async function GET() {
    const products = await Product.find({}).limit(10);
    return Response.json(products);
}
```

**After (Supabase):**
```javascript
// src/api/products/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(10);
    
    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json(data);
}
```

### 2. Field Name Conversions

#### CamelCase → snake_case

MongoDB uses camelCase field names, but PostgreSQL convention is snake_case.

**Field Mapping:**
- `productName` → `product_name`
- `productPrice` → `product_price`
- `productCategory` → `product_category`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `isFeatured` → `is_featured`
- `inStock` → `in_stock`
- `totalAmount` → `total_amount`
- `orderStatus` → `order_status`
- `trackingNumber` → `tracking_number`

### 3. Complex Query Conversions

#### Aggregation → SQL

**Before (MongoDB Aggregation):**
```javascript
const stats = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
]);
```

**After (Supabase SQL):**
```javascript
const { data, error } = await supabase
    .from('products')
    .select('category, count(*)')
    .group('category');
```

#### Joins → SQL Joins

**Before (MongoDB Populate):**
```javascript
const order = await Order.findById(id).populate('user').populate('items.product');
```

**After (Supabase SQL):**
```javascript
const { data, error } = await supabase
    .from('orders')
    .select(`
        *,
        user:users(*),
        items:order_items(*)
    `)
    .eq('id', id)
    .single();
```

### 4. Authentication & Authorization

#### User Context

**Before (MongoDB with auth):**
```javascript
export async function POST(request) {
    const user = await getCurrentUser();
    const body = await request.json();
    
    const order = await Order.create({
        ...body,
        userId: user.id
    });
}
```

**After (Supabase with auth):**
```javascript
export async function POST(request) {
    const supabase = createClient();
    const { data: user, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { data, error } = await supabase
        .from('orders')
        .insert({
            ...body,
            user_id: user.id
        })
        .select()
        .single();
}
```

## Route-by-Route Conversion Strategy

### Phase 1: Core Product Routes (Priority 1)

1. **`/api/products`** - Product listing and search
2. **`/api/products/[id]`** - Product details
3. **`/api/categories`** - Category management
4. **`/api/brands`** - Brand management

### Phase 2: User & Authentication (Priority 2)

1. **`/api/auth`** - Authentication endpoints
2. **`/api/user`** - User profile management
3. **`/api/user/addresses`** - Address management
4. **`/api/user/payment-methods`** - Payment methods

### Phase 3: Orders & Commerce (Priority 3)

1. **`/api/orders`** - Order management
2. **`/api/cart`** - Shopping cart
3. **`/api/checkout`** - Checkout flow
4. **`/api/invoices`** - Invoice generation

### Phase 4: Admin & Support (Priority 4)

1. **`/api/admin`** - Admin dashboard
2. **`/api/quotes`** - Quote requests
3. **`/api/complaints`** - Customer support
4. **`/api/news`** - Content management

## Implementation Steps

### Step 1: Create Supabase Server Client

**File: `src/lib/supabase/server.ts`**
```javascript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The 'set' method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### Step 2: Update Route Structure

Convert from `.ts` files to `route.ts` files in the new App Router structure:

```
src/api/
├── products.ts          → src/app/api/products/route.ts
├── products/[id].ts     → src/app/api/products/[id]/route.ts
├── categories.ts        → src/app/api/categories/route.ts
└── ...
```

### Step 3: Convert Each Route

For each route:

1. **Import the Supabase client**
2. **Convert MongoDB queries to Supabase SQL**
3. **Update field names (camelCase → snake_case)**
4. **Handle errors appropriately**
5. **Test the endpoint**

### Step 4: Update Frontend Calls

Update frontend components to use the new API endpoints:

```javascript
// Before
const response = await fetch('/api/products');

// After (if using server actions)
import { getProducts } from '@/app/actions/products';
const products = await getProducts();
```

## Common Conversion Examples

### 1. Product Search

**MongoDB:**
```javascript
const products = await Product.find({
    $or: [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
    ]
}).limit(20);
```

**Supabase:**
```javascript
const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    .limit(20);
```

### 2. User Orders with Items

**MongoDB:**
```javascript
const orders = await Order.find({ userId: user.id })
    .populate('items.product')
    .sort({ createdAt: -1 });
```

**Supabase:**
```javascript
const { data, error } = await supabase
    .from('orders')
    .select(`
        *,
        items:order_items(*,
            product:products(*)
        )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
```

### 3. Inventory Management

**MongoDB:**
```javascript
await Product.updateOne(
    { _id: productId },
    { $inc: { stock: -quantity } }
);
```

**Supabase:**
```javascript
const { data, error } = await supabase
    .from('products')
    .update({ stock: supabase.rpc('decrement_stock', { product_id: productId, quantity: quantity }) })
    .eq('id', productId);
```

## Error Handling

### MongoDB Error Handling
```javascript
try {
    const result = await Model.find({});
} catch (error) {
    if (error.name === 'ValidationError') {
        // Handle validation errors
    }
}
```

### Supabase Error Handling
```javascript
const { data, error } = await supabase.from('table').select('*');
if (error) {
    if (error.code === 'PGRST116') {
        // Handle not found
    } else if (error.code === 'PGRST301') {
        // Handle permission denied
    }
}
```

## Testing Strategy

1. **Unit Tests**: Test individual route functions
2. **Integration Tests**: Test API endpoints with real data
3. **End-to-End Tests**: Test complete user flows
4. **Performance Tests**: Ensure queries are optimized

## Rollback Plan

Keep MongoDB routes active during transition:

1. **Dual Implementation**: Maintain both MongoDB and Supabase versions
2. **Feature Flags**: Use environment variables to switch between implementations
3. **Gradual Migration**: Convert routes one by one
4. **Monitoring**: Track performance and errors during transition

## Performance Optimization

1. **Use Proper Indexes**: Ensure all query fields are indexed
2. **Limit Results**: Always use `.limit()` for large datasets
3. **Select Only Needed Fields**: Use `.select('field1,field2')` instead of `*`
4. **Use Raw SQL for Complex Queries**: When Supabase query builder is insufficient
5. **Implement Caching**: Use Redis or Supabase's built-in caching

## Next Steps

1. **Start with Phase 1 routes** (products, categories, brands)
2. **Test each converted route thoroughly**
3. **Update frontend components incrementally**
4. **Monitor performance and fix any issues**
5. **Proceed to Phase 2-4 routes**

This systematic approach ensures a smooth migration with minimal downtime and maintains data integrity throughout the process.