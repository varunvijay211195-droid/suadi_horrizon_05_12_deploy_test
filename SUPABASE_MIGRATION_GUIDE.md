# Saudi Horizon — MongoDB → Supabase Complete Migration Guide

> **For:** Any AI coding assistant picking up this task  
> **Project:** Saudi Horizon (Next.js 16 e-commerce for heavy equipment parts)  
> **Current DB:** MongoDB (local, via Mongoose ODM)  
> **Target DB:** Supabase (hosted PostgreSQL)  
> **Date Created:** 2026-03-12

---

## TABLE OF CONTENTS

1. [Project Context](#1-project-context)
2. [Supabase Project Setup](#2-supabase-project-setup)
3. [Environment Variables](#3-environment-variables)
4. [Install Dependencies](#4-install-dependencies)
5. [Create Supabase Client Files](#5-create-supabase-client-files)
6. [Run SQL Migration (Create All Tables)](#6-run-sql-migration)
7. [Data Migration Script](#7-data-migration-script)
8. [API Route Refactoring Guide](#8-api-route-refactoring-guide)
9. [TTL Cleanup via pg_cron](#9-ttl-cleanup-via-pg_cron)
10. [Row Level Security](#10-row-level-security)
11. [Testing Checklist](#11-testing-checklist)

---

## 1. Project Context

### Current Architecture

- **Framework:** Next.js 16.1.6 (App Router)
- **Database:** MongoDB (local `mongodb://localhost:27017/saudi_horizon`)
- **ODM:** Mongoose
- **Image Storage:** Cloudinary (stays as-is, not migrated)
- **Auth:** Custom JWT (bcrypt + jsonwebtoken)

### Key Files You'll Touch

```
src/lib/db/mongodb.ts          ← DELETE after migration (Mongoose connection)
src/lib/db/models/*.ts         ← 18 Mongoose models (reference only, then delete)
src/app/api/***/route.ts       ← 70+ API routes to refactor
src/lib/supabase/client.ts     ← NEW: Browser Supabase client
src/lib/supabase/server.ts     ← NEW: Server Supabase client
.env.local                     ← Add Supabase keys
```

### 18 MongoDB Collections → 27 PostgreSQL Tables

MongoDB embedded arrays get flattened into separate tables:

| MongoDB Collection | → PG Table(s) |
|---|---|
| `products` (720 docs, string ID=SKU) | `products` |
| `categories` (10 docs, string ID=slug) | `categories` |
| `brands` (6 docs, string ID=slug) | `brands` |
| `users` (12 docs, ObjectId) | `users`, `user_addresses`, `user_payment_methods`, `user_purchase_history` |
| `orders` (0 docs) | `orders`, `order_items` |
| `invoices` (7 docs) | `invoices`, `invoice_items` |
| `quoterequests` (15 docs) | `quote_requests`, `quote_messages` |
| `homepage_config` (1 doc, singleton) | `homepage_config`, `homepage_sections`, `homepage_testimonials` |
| `notifications` (16 docs, TTL 60d) | `notifications` |
| `banners` (3 docs) | `banners` |
| `news` (0 docs) | `news` |
| `promotions` (0 docs) | `promotions` |
| `cookiesettings` (1 doc, singleton) | `cookie_settings` |
| `cookieconsentrecords` (8 docs, TTL 180d) | `cookie_consent_records` |
| `complaints` (0 docs) | `complaints` |
| `servicerequests` (0 docs) | `service_requests` |
| `chatmessages` (0 docs) | `chat_messages` |
| `productviews` (varies, TTL 90d) | `product_views` |

---

## 2. Supabase Project Setup

### Manual Steps (human does this)

1. Go to <https://supabase.com/dashboard/new>
2. Create organization if needed
3. Create project:
   - **Name:** `saudi-horizon`
   - **Database Password:** Save this securely
   - **Region:** Pick closest to Saudi Arabia (Central EU Frankfurt, or Middle East if available)
   - **Plan:** Free tier is fine to start
4. Wait for project to provision (~2 minutes)
5. Go to **Project Settings → API** to get keys

### Values You Need

```
Project URL:        https://xxxxxxxxxx.supabase.co
Anon Key:           eyJhbGciOiJIUzI1NiIs...  (public, safe for browser)
Service Role Key:   eyJhbGciOiJIUzI1NiIs...  (SECRET, server-only)
DB Password:        (whatever you set)
```

---

## 3. Environment Variables

Add these to `.env.local` (keep existing vars, just add these):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

**Keep the old `DATABASE_URL` temporarily** for the data migration script. Remove it after migration is complete.

---

## 4. Install Dependencies

```bash
npm install @supabase/supabase-js
```

You can also remove `mongoose` later after all routes are converted:

```bash
npm uninstall mongoose
```

---

## 5. Create Supabase Client Files

### File: `src/lib/supabase/client.ts` (Browser client)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

> **Note:** If you don't want to use `@supabase/ssr`, you can use the simpler approach:

```typescript
// Alternative: src/lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
```

### File: `src/lib/supabase/server.ts` (Server client — for API routes)

```typescript
import { createClient } from '@supabase/supabase-js'

// Server-side client with service role (bypasses RLS)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

---

## 6. Run SQL Migration

Go to Supabase Dashboard → **SQL Editor** → paste and run this entire SQL block:

```sql
-- =============================================
-- SAUDI HORIZON: FULL SCHEMA MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. BRANDS
CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    website TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    parent TEXT REFERENCES categories(id),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    brand TEXT NOT NULL REFERENCES brands(id),
    category TEXT NOT NULL REFERENCES categories(id),
    subcategory TEXT REFERENCES categories(id),
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image JSONB,
    gallery JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    description TEXT,
    specs JSONB,
    compatibility TEXT[] DEFAULT '{}',
    in_stock BOOLEAN DEFAULT true,
    stock INT DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    reviews INT DEFAULT 0,
    oem_code TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);

-- 4. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    refresh_token TEXT,
    oauth_provider TEXT,
    oauth_id TEXT,
    profile JSONB DEFAULT '{"name": ""}',
    wishlist TEXT[] DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{"orderUpdates":true,"promotionalEmails":false,"smsNotifications":true,"pushNotifications":true,"newsletter":false,"newProducts":true,"priceAlerts":true}',
    last_login_at TIMESTAMPTZ,
    total_spent NUMERIC(12,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    segment TEXT DEFAULT 'new' CHECK (segment IN ('vip', 'b2b', 'regular', 'new')),
    preferred_categories TEXT[] DEFAULT '{}',
    preferred_brands TEXT[] DEFAULT '{}',
    reset_password_token TEXT,
    reset_password_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER_ADDRESSES
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false
);

-- 6. USER_PAYMENT_METHODS
CREATE TABLE user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    last4 TEXT NOT NULL,
    expiry TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false
);

-- 7. USER_PURCHASE_HISTORY
CREATE TABLE user_purchase_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    amount NUMERIC(10,2) NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount NUMERIC(12,2) NOT NULL,
    shipping_address JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER_ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product TEXT NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- 10. INVOICES
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE,
    source_type TEXT NOT NULL CHECK (source_type IN ('order', 'quote')),
    source_id TEXT NOT NULL,
    customer JSONB NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    vat_rate NUMERIC(5,2) DEFAULT 15,
    vat_amount NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_by TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INVOICE_ITEMS
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL
);

-- 12. QUOTE_REQUESTS
CREATE TABLE quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT,
    items TEXT NOT NULL,
    quantities TEXT,
    timeline TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'responded', 'accepted', 'cancelled')),
    admin_response TEXT,
    quoted_price NUMERIC(12,2),
    valid_until TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. QUOTE_MESSAGES
CREATE TABLE quote_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('admin', 'user')),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. BANNERS
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    link TEXT,
    position TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. NEWS
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. HOMEPAGE_CONFIG (singleton)
CREATE TABLE homepage_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    featured_product_ids TEXT[] DEFAULT '{}',
    featured_products_count INT DEFAULT 8,
    stats JSONB DEFAULT '{"yearsExperience":15,"satisfiedClients":500,"partsAvailable":5000,"onTimeDelivery":98}',
    hero_title TEXT DEFAULT '',
    hero_subtitle TEXT DEFAULT '',
    updated_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. HOMEPAGE_SECTIONS
CREATE TABLE homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL,
    label TEXT NOT NULL,
    visible BOOLEAN DEFAULT true,
    sort_order INT NOT NULL
);

-- 19. HOMEPAGE_TESTIMONIALS
CREATE TABLE homepage_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 20. PROMOTIONS
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. COOKIE_SETTINGS (singleton)
CREATE TABLE cookie_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN DEFAULT true,
    necessary_only BOOLEAN DEFAULT false,
    analytics BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    position TEXT DEFAULT 'bottom',
    expiration INT DEFAULT 365,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. COOKIE_CONSENT_RECORDS
CREATE TABLE cookie_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id TEXT UNIQUE NOT NULL,
    categories JSONB DEFAULT '{"necessary":true,"analytics":false,"marketing":false,"preferences":false}',
    user_agent TEXT,
    ip_hash TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. COMPLAINTS
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    ticket_id TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. SERVICE_REQUESTS
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    machine TEXT NOT NULL,
    issue TEXT NOT NULL,
    preferred_time TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. CHAT_MESSAGES
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender UUID NOT NULL REFERENCES users(id),
    receiver UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT false
);

-- 26. PRODUCT_VIEWS
CREATE TABLE product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT,
    category TEXT,
    brand TEXT,
    referrer TEXT,
    duration INT,
    device_type TEXT DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pv_session ON product_views(session_id);
CREATE INDEX idx_pv_product ON product_views(product_id);
CREATE INDEX idx_pv_user ON product_views(user_id);
CREATE INDEX idx_pv_viewed ON product_views(viewed_at);

-- 27. CART_ITEMS (for authenticated users - persistent carts)
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

-- =============================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
            t
        );
    END LOOP;
END;
$$;

-- =============================================
-- SEED DEFAULT HOMEPAGE CONFIG (singleton)
-- =============================================
INSERT INTO homepage_config (featured_products_count, stats, hero_title, hero_subtitle, updated_by)
VALUES (
    8,
    '{"yearsExperience":15,"satisfiedClients":500,"partsAvailable":5000,"onTimeDelivery":98}',
    '',
    '',
    ''
);

-- Get the config_id for sections/testimonials
DO $$
DECLARE
    config_uuid UUID;
BEGIN
    SELECT id INTO config_uuid FROM homepage_config LIMIT 1;

    INSERT INTO homepage_sections (config_id, section_id, label, visible, sort_order) VALUES
        (config_uuid, 'hero', 'Hero Banner', true, 0),
        (config_uuid, 'brands', 'Brand Strip', true, 1),
        (config_uuid, 'stats', 'Statistics', true, 2),
        (config_uuid, 'features', 'Features Grid', true, 3),
        (config_uuid, 'categories', 'Categories', true, 4),
        (config_uuid, 'featured_products', 'Featured Products', true, 5),
        (config_uuid, 'parts_console', 'Parts Intelligence Console', true, 6),
        (config_uuid, 'story', 'Company Story', true, 7),
        (config_uuid, 'testimonials', 'Testimonials', true, 8),
        (config_uuid, 'cta', 'Call to Action', true, 9),
        (config_uuid, 'articles', 'Featured Articles', true, 10),
        (config_uuid, 'faq', 'FAQ Section', true, 11);

    INSERT INTO homepage_testimonials (config_id, quote, author, role, company, is_active) VALUES
        (config_uuid, 'Saudi Horizon provided exceptional service in sourcing hard-to-find parts for our heavy machinery fleet. Their delivery speed minimized our downtime significantly.', 'Fahad Al-Otaibi', 'Operations Director', 'Al-Otaibi Construction', true),
        (config_uuid, 'The quality of the refurbished equipment we purchased was outstanding. It performs like new but at a fraction of the cost. Highly recommended partner.', 'John Smith', 'Fleet Manager', 'Global Logistics Co.', true),
        (config_uuid, 'Their technical support team went above and beyond to help us identify the correct components for our vintage Caterpillar generators.', 'Mohammed Asghar', 'Chief Engineer', 'Power Systems Ltd.', true);
END;
$$;

-- Seed default cookie settings (singleton)
INSERT INTO cookie_settings (enabled, necessary_only, analytics, marketing, position, expiration)
VALUES (true, false, true, false, 'bottom', 365);
```

---

## 7. Data Migration Script

Create `scripts/migrate-to-supabase.js` and run with `node scripts/migrate-to-supabase.js`:

```javascript
/**
 * MongoDB → Supabase Data Migration Script
 * 
 * Prerequisites:
 *   1. MongoDB running locally with saudi_horizon data
 *   2. Supabase project created with tables (run SQL from Section 6 first)
 *   3. .env.local has both DATABASE_URL and SUPABASE keys
 * 
 * Usage: node scripts/migrate-to-supabase.js
 */

const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/saudi_horizon';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---- ID MAPPING (MongoDB ObjectId → Supabase UUID) ----
const userIdMap = new Map(); // oldObjectId → newUUID

async function connectMongo() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
}

async function migrateBrands() {
    const brands = await mongoose.connection.db.collection('brands').find().toArray();
    if (brands.length === 0) { console.log('   ⏭️  No brands to migrate'); return; }
    
    const rows = brands.map(b => ({
        id: b._id,
        name: b.name,
        slug: b.slug,
        description: b.description || null,
        logo: b.logo || null,
        website: b.website || null,
        is_featured: b.isFeatured || false,
        is_active: b.isActive !== false,
        metadata: b.metadata || {},
        created_at: b.createdAt || new Date().toISOString(),
        updated_at: b.updatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('brands').upsert(rows);
    if (error) throw new Error(`Brands: ${error.message}`);
    console.log(`   ✅ Migrated ${rows.length} brands`);
}

async function migrateCategories() {
    const categories = await mongoose.connection.db.collection('categories').find().toArray();
    if (categories.length === 0) { console.log('   ⏭️  No categories to migrate'); return; }
    
    // Insert parents first (parent = null), then children
    const parents = categories.filter(c => !c.parent);
    const children = categories.filter(c => c.parent);

    const toRow = c => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        image: c.image || null,
        parent: c.parent || null,
        display_order: c.displayOrder || 0,
        is_active: c.isActive !== false,
        metadata: c.metadata || {},
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.updatedAt || new Date().toISOString(),
    });

    if (parents.length > 0) {
        const { error } = await supabase.from('categories').upsert(parents.map(toRow));
        if (error) throw new Error(`Categories (parents): ${error.message}`);
    }
    if (children.length > 0) {
        const { error } = await supabase.from('categories').upsert(children.map(toRow));
        if (error) throw new Error(`Categories (children): ${error.message}`);
    }
    console.log(`   ✅ Migrated ${categories.length} categories`);
}

async function migrateProducts() {
    const products = await mongoose.connection.db.collection('products').find().toArray();
    if (products.length === 0) { console.log('   ⏭️  No products to migrate'); return; }

    // Batch insert in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const rows = chunk.map(p => ({
            id: p._id,
            name: p.name,
            sku: p.sku,
            brand: p.brand,
            category: p.category,
            subcategory: p.subcategory || null,
            price: p.price || 0,
            image: p.image || null,
            gallery: p.gallery || [],
            documents: p.documents || [],
            description: p.description || null,
            specs: p.specs || null,
            compatibility: p.compatibility || [],
            in_stock: p.inStock !== false,
            stock: p.stock || 0,
            rating: p.rating || 0,
            reviews: p.reviews || 0,
            oem_code: p.oemCode || null,
            featured: p.featured || false,
            created_at: p.createdAt || new Date().toISOString(),
            updated_at: p.updatedAt || new Date().toISOString(),
        }));

        const { error } = await supabase.from('products').upsert(rows);
        if (error) throw new Error(`Products chunk ${i}: ${error.message}`);
        console.log(`   ✅ Migrated products ${i+1}-${Math.min(i+chunkSize, products.length)} of ${products.length}`);
    }
}

async function migrateUsers() {
    const users = await mongoose.connection.db.collection('users').find().toArray();
    if (users.length === 0) { console.log('   ⏭️  No users to migrate'); return; }

    for (const u of users) {
        const row = {
            email: u.email,
            password: u.password || null,
            role: u.role || 'user',
            refresh_token: u.refreshToken || null,
            oauth_provider: u.oauthProvider || null,
            oauth_id: u.oauthId || null,
            profile: u.profile || { name: '' },
            wishlist: u.wishlist || [],
            notification_preferences: u.notificationPreferences || {},
            last_login_at: u.lastLoginAt || null,
            total_spent: u.totalSpent || 0,
            total_orders: u.totalOrders || 0,
            segment: u.segment || 'new',
            preferred_categories: u.preferredCategories || [],
            preferred_brands: u.preferredBrands || [],
            reset_password_token: u.resetPasswordToken || null,
            reset_password_expires: u.resetPasswordExpires || null,
            created_at: u.createdAt || new Date().toISOString(),
            updated_at: u.updatedAt || new Date().toISOString(),
        };

        const { data, error } = await supabase.from('users').insert(row).select('id').single();
        if (error) throw new Error(`User ${u.email}: ${error.message}`);
        
        // Map old ObjectId → new UUID
        userIdMap.set(u._id.toString(), data.id);

        // Migrate addresses
        if (u.addresses && u.addresses.length > 0) {
            const addrs = u.addresses.map(a => ({
                user_id: data.id,
                name: a.name,
                full_name: a.fullName,
                address: a.address,
                city: a.city,
                state: a.state,
                zip_code: a.zipCode,
                country: a.country,
                phone: a.phone,
                is_default: a.isDefault || false,
            }));
            const { error: addrErr } = await supabase.from('user_addresses').insert(addrs);
            if (addrErr) console.warn(`   ⚠️  Addresses for ${u.email}: ${addrErr.message}`);
        }

        // Migrate payment methods
        if (u.paymentMethods && u.paymentMethods.length > 0) {
            const pms = u.paymentMethods.map(pm => ({
                user_id: data.id,
                type: pm.type,
                last4: pm.last4,
                expiry: pm.expiry,
                name: pm.name,
                is_default: pm.isDefault || false,
            }));
            const { error: pmErr } = await supabase.from('user_payment_methods').insert(pms);
            if (pmErr) console.warn(`   ⚠️  PaymentMethods for ${u.email}: ${pmErr.message}`);
        }

        // Migrate purchase history
        if (u.purchaseHistory && u.purchaseHistory.length > 0) {
            const phs = u.purchaseHistory.map(ph => ({
                user_id: data.id,
                product_id: ph.productId,
                product_name: ph.productName,
                category: ph.category || null,
                brand: ph.brand || null,
                amount: ph.amount,
                purchased_at: ph.purchasedAt || new Date().toISOString(),
            }));
            const { error: phErr } = await supabase.from('user_purchase_history').insert(phs);
            if (phErr) console.warn(`   ⚠️  PurchaseHistory for ${u.email}: ${phErr.message}`);
        }
    }
    console.log(`   ✅ Migrated ${users.length} users (with addresses, payments, history)`);
}

async function migrateInvoices() {
    const invoices = await mongoose.connection.db.collection('invoices').find().toArray();
    if (invoices.length === 0) { console.log('   ⏭️  No invoices to migrate'); return; }

    for (const inv of invoices) {
        const row = {
            invoice_number: inv.invoiceNumber,
            source_type: inv.sourceType,
            source_id: inv.sourceId,
            customer: inv.customer,
            subtotal: inv.subtotal,
            vat_rate: inv.vatRate || 15,
            vat_amount: inv.vatAmount,
            total_amount: inv.totalAmount,
            currency: inv.currency || 'SAR',
            status: inv.status || 'draft',
            due_date: inv.dueDate || null,
            paid_at: inv.paidAt || null,
            notes: inv.notes || null,
            created_by: inv.createdBy,
            sent_at: inv.sentAt || null,
            created_at: inv.createdAt || new Date().toISOString(),
            updated_at: inv.updatedAt || new Date().toISOString(),
        };
        const { data, error } = await supabase.from('invoices').insert(row).select('id').single();
        if (error) throw new Error(`Invoice ${inv.invoiceNumber}: ${error.message}`);

        // Migrate invoice items
        if (inv.items && inv.items.length > 0) {
            const items = inv.items.map(item => ({
                invoice_id: data.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.total,
            }));
            const { error: itemErr } = await supabase.from('invoice_items').insert(items);
            if (itemErr) console.warn(`   ⚠️  InvoiceItems for ${inv.invoiceNumber}: ${itemErr.message}`);
        }
    }
    console.log(`   ✅ Migrated ${invoices.length} invoices`);
}

async function migrateQuoteRequests() {
    const quotes = await mongoose.connection.db.collection('quoterequests').find().toArray();
    if (quotes.length === 0) { console.log('   ⏭️  No quote requests to migrate'); return; }

    for (const q of quotes) {
        const row = {
            user_id: q.userId || null,
            company_name: q.companyName,
            contact_person: q.contactPerson,
            phone: q.phone,
            email: q.email,
            project_type: q.projectType || null,
            items: q.items,
            quantities: q.quantities || null,
            timeline: q.timeline || null,
            notes: q.notes || null,
            status: q.status || 'pending',
            admin_response: q.adminResponse || null,
            quoted_price: q.quotedPrice || null,
            valid_until: q.validUntil || null,
            accepted_at: q.acceptedAt || null,
            order_id: q.orderId || null,
            created_at: q.createdAt || new Date().toISOString(),
            updated_at: q.updatedAt || new Date().toISOString(),
        };
        const { data, error } = await supabase.from('quote_requests').insert(row).select('id').single();
        if (error) throw new Error(`QuoteRequest: ${error.message}`);

        // Migrate messages
        if (q.messages && q.messages.length > 0) {
            const msgs = q.messages.map(m => ({
                quote_id: data.id,
                sender: m.sender,
                text: m.text,
                created_at: m.createdAt || new Date().toISOString(),
            }));
            const { error: msgErr } = await supabase.from('quote_messages').insert(msgs);
            if (msgErr) console.warn(`   ⚠️  QuoteMessages: ${msgErr.message}`);
        }
    }
    console.log(`   ✅ Migrated ${quotes.length} quote requests`);
}

async function migrateSimpleCollections() {
    // Notifications
    const notifications = await mongoose.connection.db.collection('notifications').find().toArray();
    if (notifications.length > 0) {
        const rows = notifications.map(n => ({
            type: n.type,
            title: n.title,
            message: n.message,
            is_read: n.isRead || false,
            created_at: n.createdAt || new Date().toISOString(),
        }));
        const { error } = await supabase.from('notifications').insert(rows);
        if (error) console.warn(`   ⚠️  Notifications: ${error.message}`);
        else console.log(`   ✅ Migrated ${rows.length} notifications`);
    }

    // Banners
    const banners = await mongoose.connection.db.collection('banners').find().toArray();
    if (banners.length > 0) {
        const rows = banners.map(b => ({
            title: b.title,
            image: b.image,
            link: b.link || null,
            position: b.position,
            is_active: b.isActive !== false,
            created_at: b.createdAt || new Date().toISOString(),
        }));
        const { error } = await supabase.from('banners').insert(rows);
        if (error) console.warn(`   ⚠️  Banners: ${error.message}`);
        else console.log(`   ✅ Migrated ${rows.length} banners`);
    }

    // Cookie consent records
    const ccRecords = await mongoose.connection.db.collection('cookieconsentrecords').find().toArray();
    if (ccRecords.length > 0) {
        const rows = ccRecords.map(c => ({
            consent_id: c.consentId,
            categories: c.categories || {},
            user_agent: c.userAgent || null,
            ip_hash: c.ipHash || null,
            timestamp: c.timestamp || new Date().toISOString(),
        }));
        const { error } = await supabase.from('cookie_consent_records').insert(rows);
        if (error) console.warn(`   ⚠️  CookieConsentRecords: ${error.message}`);
        else console.log(`   ✅ Migrated ${rows.length} cookie consent records`);
    }
}

async function main() {
    console.log('🚀 Starting MongoDB → Supabase migration...\n');
    
    try {
        await connectMongo();
        
        console.log('\n📦 Phase 1: Independent tables...');
        await migrateBrands();
        await migrateCategories();
        
        console.log('\n📦 Phase 2: Products (depends on brands/categories)...');
        await migrateProducts();
        
        console.log('\n📦 Phase 3: Users (with nested data)...');
        await migrateUsers();

        console.log('\n📦 Phase 4: Invoices...');
        await migrateInvoices();

        console.log('\n📦 Phase 5: Quote Requests...');
        await migrateQuoteRequests();

        console.log('\n📦 Phase 6: Simple collections...');
        await migrateSimpleCollections();

        console.log('\n✅ Migration complete!');
        console.log(`   User ID mapping: ${userIdMap.size} users mapped`);
        
        // Save mapping for reference
        const mappingObj = {};
        userIdMap.forEach((v, k) => { mappingObj[k] = v; });
        require('fs').writeFileSync(
            'scripts/user-id-mapping.json',
            JSON.stringify(mappingObj, null, 2)
        );
        console.log('   Saved user ID mapping to scripts/user-id-mapping.json');
        
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

main();
```

---

## 8. API Route Refactoring Guide

### Pattern: Before vs After

**BEFORE (Mongoose):**

```typescript
import { connectDB } from '@/lib/db/mongodb';
import Product from '@/lib/db/models/Product';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await connectDB();
    const products = await Product.find({ inStock: true }).sort({ createdAt: -1 });
    return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
    await connectDB();
    const body = await req.json();
    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
}
```

**AFTER (Supabase):**

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const supabase = createServerClient();
    const body = await req.json();
    const { data, error } = await supabase.from('products').insert(body).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
```

### Mongoose → Supabase Query Cheatsheet

| Mongoose | Supabase |
|----------|----------|
| `Model.find()` | `supabase.from('table').select('*')` |
| `Model.findById(id)` | `supabase.from('table').select('*').eq('id', id).single()` |
| `Model.findOne({ email })` | `supabase.from('table').select('*').eq('email', email).single()` |
| `Model.create(body)` | `supabase.from('table').insert(body).select().single()` |
| `Model.findByIdAndUpdate(id, update)` | `supabase.from('table').update(update).eq('id', id).select().single()` |
| `Model.findByIdAndDelete(id)` | `supabase.from('table').delete().eq('id', id)` |
| `Model.find({ name: /search/i })` | `supabase.from('table').select('*').ilike('name', '%search%')` |
| `Model.find().sort({ createdAt: -1 })` | `.order('created_at', { ascending: false })` |
| `Model.find().skip(20).limit(10)` | `.range(20, 29)` |
| `Model.countDocuments(filter)` | `supabase.from('table').select('*', { count: 'exact', head: true }).eq(...)` |
| `Model.aggregate([...])` | Use Supabase RPC (database functions) or custom SQL |
| `.populate('brand')` | `.select('*, brands(*)')` (foreign key join) |

### Field Name Mapping (camelCase → snake_case)

| Mongoose (camelCase) | Supabase (snake_case) |
|---|---|
| `_id` | `id` |
| `inStock` | `in_stock` |
| `isFeatured` | `is_featured` |
| `isActive` | `is_active` |
| `oemCode` | `oem_code` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `displayOrder` | `display_order` |
| `isRead` | `is_read` |
| `isPublished` | `is_published` |
| `publishedAt` | `published_at` |
| `sourceType` | `source_type` |
| `sourceId` | `source_id` |
| `invoiceNumber` | `invoice_number` |
| `vatRate` | `vat_rate` |
| `vatAmount` | `vat_amount` |
| `totalAmount` | `total_amount` |
| `unitPrice` | `unit_price` |
| `createdBy` | `created_by` |
| `companyName` | `company_name` |
| `contactPerson` | `contact_person` |
| `projectType` | `project_type` |
| `adminResponse` | `admin_response` |
| `quotedPrice` | `quoted_price` |
| `validUntil` | `valid_until` |
| `acceptedAt` | `accepted_at` |
| `orderId` | `order_id` |
| `userId` | `user_id` |
| `ticketId` | `ticket_id` |
| `discountType` | `discount_type` |
| `discountValue` | `discount_value` |
| `startDate` | `start_date` |
| `expiryDate` | `expiry_date` |
| `trackingNumber` | `tracking_number` |
| `shippingAddress` | `shipping_address` |
| `resetPasswordToken` | `reset_password_token` |
| `resetPasswordExpires` | `reset_password_expires` |
| `refreshToken` | `refresh_token` |
| `oauthProvider` | `oauth_provider` |
| `oauthId` | `oauth_id` |
| `notificationPreferences` | `notification_preferences` |
| `lastLoginAt` | `last_login_at` |
| `totalSpent` | `total_spent` |
| `totalOrders` | `total_orders` |
| `preferredCategories` | `preferred_categories` |
| `preferredBrands` | `preferred_brands` |
| `featuredProductIds` | `featured_product_ids` |
| `featuredProductsCount` | `featured_products_count` |

### Routes to Refactor (all under `src/app/api/`)

```
admin/alerts/low-stock/route.ts
admin/alerts/route.ts
admin/analytics/inventory/route.ts
admin/analytics/sales/route.ts
admin/analytics/users/route.ts
admin/banners/[id]/route.ts
admin/banners/route.ts
admin/homepage/route.ts
admin/inventory/alerts/route.ts
admin/invoices/[id]/pdf/route.ts
admin/invoices/[id]/route.ts
admin/invoices/[id]/send/route.ts
admin/invoices/route.ts
admin/notifications/[id]/read/route.ts
admin/notifications/read-all/route.ts
admin/notifications/route.ts
admin/quotes/route.ts
admin/settings/route.ts
admin/stats/route.ts
auth/config/route.ts
auth/forgot-password/route.ts
auth/login/route.ts
auth/logout/route.ts
auth/me/route.ts
auth/refresh/route.ts
auth/register/route.ts
auth/reset-password/route.ts
banners/route.ts
brands/route.ts
categories/route.ts
chat/message/route.ts
cookie-consent/export/route.ts
cookie-consent/route.ts
health/route.ts
invoices/[id]/pdf/public/route.ts
invoices/[id]/public/route.ts
news/[idOrSlug]/route.ts
news/admin/route.ts
news/route.ts
notifications/banners/route.ts
notifications/recently-viewed/route.ts
notifications/stock-alerts/route.ts
orders/[id]/route.ts
orders/lookup/route.ts
orders/route.ts
product-views/route.ts
products/[id]/route.ts
products/route.ts
... (and ~20 more)
```

### Special Handling Required

1. **Password Hashing** — `bcrypt` stays in application code. Supabase does NOT auto-hash passwords. Keep the same `bcrypt.hash()` / `bcrypt.compare()` pattern in auth routes.

2. **User Authentication** — JWT stays as-is. The `auth/login` route will query `users` table via Supabase instead of Mongoose, but the JWT token flow is unchanged.

3. **Aggregation Queries** — MongoDB `aggregate()` calls (in analytics routes) must be rewritten as SQL functions (Supabase RPC) or inline subqueries. Example:

   ```sql
   -- Create in SQL Editor as a function
   CREATE OR REPLACE FUNCTION get_inventory_stats()
   RETURNS JSON AS $$
   SELECT json_build_object(
       'totalProducts', COUNT(*),
       'totalValue', SUM(price * stock),
       'lowStock', COUNT(*) FILTER (WHERE stock < 10),
       'outOfStock', COUNT(*) FILTER (WHERE stock = 0)
   ) FROM products;
   $$ LANGUAGE sql;
   ```

   Then call: `const { data } = await supabase.rpc('get_inventory_stats')`

4. **Populate (Joins)** — Mongoose `.populate('brand')` becomes Supabase foreign key joins:

   ```typescript
   // Supabase foreign key join
   const { data } = await supabase
       .from('products')
       .select('*, brands(*), categories(*)')
   ```

5. **HomepageConfig Singleton** — The `getConfig()` static method becomes:

   ```typescript
   const { data } = await supabase
       .from('homepage_config')
       .select('*, homepage_sections(*), homepage_testimonials(*)')
       .single();
   ```

---

## 9. TTL Cleanup via pg_cron

Run in SQL Editor (after enabling pg_cron extension in Supabase Dashboard → Database → Extensions):

```sql
-- Enable pg_cron (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Delete notifications older than 60 days (runs daily at 3 AM UTC)
SELECT cron.schedule('cleanup-notifications', '0 3 * * *',
    $$DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '60 days'$$
);

-- Delete cookie consent records older than 180 days
SELECT cron.schedule('cleanup-cookie-consent', '0 4 * * *',
    $$DELETE FROM cookie_consent_records WHERE timestamp < NOW() - INTERVAL '180 days'$$
);

-- Delete product views older than 90 days
SELECT cron.schedule('cleanup-product-views', '0 5 * * *',
    $$DELETE FROM product_views WHERE viewed_at < NOW() - INTERVAL '90 days'$$
);
```

---

## 10. Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchase_history ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Since this app uses custom JWT (not Supabase Auth),
-- the service_role key bypasses RLS entirely.
-- All API routes use the service_role key, so RLS won't block server calls.
-- If you later add client-side Supabase calls, add policies like:

-- Public read access for catalogs
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "Public read homepage" ON homepage_config FOR SELECT USING (true);
CREATE POLICY "Public read sections" ON homepage_sections FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON homepage_testimonials FOR SELECT USING (true);

-- Cart items (authenticated users only)
CREATE POLICY "Users can view their own cart items" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart items" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything (already true by default)
```

---

## 11. Testing Checklist

After migration, verify each flow:

- [ ] **Public pages load** — Homepage, products, categories, brands
- [ ] **Login/Register** — User auth still works (JWT + bcrypt)
- [ ] **Admin Dashboard** — Stats, analytics, inventory
- [ ] **Product CRUD** — Create, read, update, delete products (admin)
- [ ] **Banner management** — CRUD for homepage banners
- [ ] **Invoice generation** — PDF generation still works
- [ ] **Quote requests** — Submit and manage quotes
- [ ] **Notifications** — Read/dismiss notifications
- [ ] **Homepage config** — Sections, testimonials, hero editor
- [ ] **Search** — Product search works
- [ ] **Image upload** — Cloudinary still works (unchanged)

---

## What Stays Unchanged

- **Cloudinary** for image storage
- **bcrypt** for password hashing
- **jsonwebtoken** for JWT auth
- **Next.js App Router** structure
- **All frontend components** (they only call APIs, not DB directly)
- **Email (nodemailer)** configuration

---

## Quick Reference: Execution Order

| # | Step | Est. Time |
|---|------|-----------|
| 1 | Create Supabase project + get keys | 5 min |
| 2 | Add env vars + install `@supabase/supabase-js` | 2 min |
| 3 | Create client files (`src/lib/supabase/`) | 5 min |
| 4 | Run SQL schema migration (paste into SQL Editor) | 10 min |
| 5 | Run data migration script | 15 min |
| 6 | Refactor API routes (70+ files) | 3-4 hrs |
| 7 | Set up pg_cron for TTL cleanup | 5 min |
| 8 | Set up RLS policies | 10 min |
| 9 | Test all flows | 1 hr |
| 10 | Remove Mongoose + old models | 5 min |
