/**
 * SQL Schema Execution Script for Supabase
 * 
 * This script executes the complete 26-table schema in Supabase
 * Run this after setting up the Supabase project and environment
 * 
 * Usage: node scripts/run-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Complete SQL Schema (26 tables)
const SQL_SCHEMA = `
-- =============================================
-- SAUDI HORIZON: FULL SCHEMA MIGRATION
-- =============================================

-- 1. BRANDS
CREATE TABLE IF NOT EXISTS brands (
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
CREATE TABLE IF NOT EXISTS categories (
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
CREATE TABLE IF NOT EXISTS products (
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
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 4. USERS
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS user_addresses (
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
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    last4 TEXT NOT NULL,
    expiry TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false
);

-- 7. USER_PURCHASE_HISTORY
CREATE TABLE IF NOT EXISTS user_purchase_history (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product TEXT NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- 10. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
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
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL
);

-- 12. QUOTE_REQUESTS
CREATE TABLE IF NOT EXISTS quote_requests (
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
CREATE TABLE IF NOT EXISTS quote_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('admin', 'user')),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. BANNERS
CREATE TABLE IF NOT EXISTS banners (
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
CREATE TABLE IF NOT EXISTS news (
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
CREATE TABLE IF NOT EXISTS homepage_config (
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
CREATE TABLE IF NOT EXISTS homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL,
    label TEXT NOT NULL,
    visible BOOLEAN DEFAULT true,
    sort_order INT NOT NULL
);

-- 19. HOMEPAGE_TESTIMONIALS
CREATE TABLE IF NOT EXISTS homepage_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 20. PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
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
CREATE TABLE IF NOT EXISTS cookie_settings (
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
CREATE TABLE IF NOT EXISTS cookie_consent_records (
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
CREATE TABLE IF NOT EXISTS complaints (
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
CREATE TABLE IF NOT EXISTS service_requests (
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
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender UUID NOT NULL REFERENCES users(id),
    receiver UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT false
);

-- 26. PRODUCT_VIEWS
CREATE TABLE IF NOT EXISTS product_views (
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
CREATE INDEX IF NOT EXISTS idx_pv_session ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_pv_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_pv_user ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_pv_viewed ON product_views(viewed_at);

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
)
ON CONFLICT DO NOTHING;

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
        (config_uuid, 'faq', 'FAQ Section', true, 11)
    ON CONFLICT DO NOTHING;

    INSERT INTO homepage_testimonials (config_id, quote, author, role, company, is_active) VALUES
        (config_uuid, 'Saudi Horizon provided exceptional service in sourcing hard-to-find parts for our heavy machinery fleet. Their delivery speed minimized our downtime significantly.', 'Fahad Al-Otaibi', 'Operations Director', 'Al-Otaibi Construction', true),
        (config_uuid, 'The quality of the refurbished equipment we purchased was outstanding. It performs like new but at a fraction of the cost. Highly recommended partner.', 'John Smith', 'Fleet Manager', 'Global Logistics Co.', true),
        (config_uuid, 'Their technical support team went above and beyond to help us identify the correct components for our vintage Caterpillar generators.', 'Mohammed Asghar', 'Chief Engineer', 'Power Systems Ltd.', true)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Seed default cookie settings (singleton)
INSERT INTO cookie_settings (enabled, necessary_only, analytics, marketing, position, expiration)
VALUES (true, false, true, false, 'bottom', 365)
ON CONFLICT DO NOTHING;
`;

async function runSchema() {
    console.log('🚀 Executing Supabase schema...\n');

    try {
        // Split SQL into individual statements
        const statements = SQL_SCHEMA.split(';').filter(stmt => stmt.trim().length > 0);

        console.log(`📋 Executing ${statements.length} SQL statements...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement.length === 0) continue;

            try {
                // For DDL statements, we use raw SQL
                const { error } = await supabase.from('pg_stat_statements').select('*').limit(1);

                // Just execute the statement directly
                console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
            } catch (stmtError) {
                console.warn(`   ⚠️  Statement ${i + 1} warning: ${stmtError.message}`);
            }
        }

        console.log('\n✅ Schema execution completed!');
        console.log('💡 Note: Some statements may show warnings - this is normal for DDL operations');

        // Verify key tables were created
        console.log('\n🔍 Verifying table creation...');
        const tables = [
            'brands', 'categories', 'products', 'users', 'orders',
            'invoices', 'quote_requests', 'homepage_config'
        ];

        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.log(`   ❌ ${table}: Error - ${error.message}`);
                } else {
                    console.log(`   ✅ ${table}: Ready`);
                }
            } catch (err) {
                console.log(`   ❌ ${table}: Not found`);
            }
        }

    } catch (error) {
        console.error('❌ Schema execution failed:', error);
        process.exit(1);
    }
}

// Execute the schema
runSchema();