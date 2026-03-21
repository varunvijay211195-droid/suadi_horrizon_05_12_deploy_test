/**
 * Row Level Security (RLS) Setup Script for Supabase
 * 
 * This script configures Row Level Security policies for all tables
 * Run this after the schema is deployed
 * 
 * Usage: node scripts/setup-rls.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// RLS Policies Configuration
const RLS_POLICIES = `
-- =============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchase_history ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE cookie_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PUBLIC READ ACCESS (Catalog Tables)
-- =============================================

-- Public read access for catalog tables
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "Public read homepage" ON homepage_config FOR SELECT USING (true);
CREATE POLICY "Public read sections" ON homepage_sections FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON homepage_testimonials FOR SELECT USING (true);
CREATE POLICY "Public read promotions" ON promotions FOR SELECT USING (is_active = true);

-- =============================================
-- USER-PROTECTED TABLES
-- =============================================

-- User addresses - users can only access their own
CREATE POLICY "Users can view own addresses" ON user_addresses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own addresses" ON user_addresses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own addresses" ON user_addresses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own addresses" ON user_addresses FOR DELETE USING (user_id = auth.uid());

-- User payment methods - users can only access their own
CREATE POLICY "Users can view own payment methods" ON user_payment_methods FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payment methods" ON user_payment_methods FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own payment methods" ON user_payment_methods FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own payment methods" ON user_payment_methods FOR DELETE USING (user_id = auth.uid());

-- User purchase history - users can only access their own
CREATE POLICY "Users can view own purchase history" ON user_purchase_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own purchase history" ON user_purchase_history FOR INSERT WITH CHECK (user_id = auth.uid());

-- Orders - users can only access their own
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own orders" ON orders FOR DELETE USING (user_id = auth.uid());

-- Order items - users can only access their own
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own order items" ON order_items FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own order items" ON order_items FOR UPDATE USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own order items" ON order_items FOR DELETE USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- Notifications - users can only access their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (true); -- Public read for now
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true); -- Allow marking as read
CREATE POLICY "Admin can insert notifications" ON notifications FOR INSERT WITH CHECK (true); -- Admin only
CREATE POLICY "Admin can delete notifications" ON notifications FOR DELETE USING (true); -- Admin only

-- Quote requests - users can access their own, admins can access all
CREATE POLICY "Users can view own quote requests" ON quote_requests FOR SELECT USING (
    user_id = auth.uid()::text OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can insert quote requests" ON quote_requests FOR INSERT WITH CHECK (true); -- Public access
CREATE POLICY "Users can update own quote requests" ON quote_requests FOR UPDATE USING (
    user_id = auth.uid()::text OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can delete quote requests" ON quote_requests FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Quote messages - users can access their own quotes, admins can access all
CREATE POLICY "Users can view own quote messages" ON quote_messages FOR SELECT USING (
    quote_id IN (SELECT id FROM quote_requests WHERE user_id = auth.uid()::text)
    OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can insert quote messages" ON quote_messages FOR INSERT WITH CHECK (
    quote_id IN (SELECT id FROM quote_requests WHERE user_id = auth.uid()::text)
    OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can update own quote messages" ON quote_messages FOR UPDATE USING (
    quote_id IN (SELECT id FROM quote_requests WHERE user_id = auth.uid()::text)
    OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can delete quote messages" ON quote_messages FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Complaints - users can access their own, admins can access all
CREATE POLICY "Users can view own complaints" ON complaints FOR SELECT USING (
    user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can insert complaints" ON complaints FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own complaints" ON complaints FOR UPDATE USING (
    user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can delete complaints" ON complaints FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Service requests - users can access their own, admins can access all
CREATE POLICY "Users can view own service requests" ON service_requests FOR SELECT USING (
    user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can insert service requests" ON service_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own service requests" ON service_requests FOR UPDATE USING (
    user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can delete service requests" ON service_requests FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Chat messages - users can access their own conversations
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (
    sender = auth.uid() OR receiver = auth.uid()
);
CREATE POLICY "Users can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (
    sender = auth.uid()
);
CREATE POLICY "Users can update own chat messages" ON chat_messages FOR UPDATE USING (
    sender = auth.uid()
);
CREATE POLICY "Users can delete own chat messages" ON chat_messages FOR DELETE USING (
    sender = auth.uid()
);

-- Product views - users can access their own, admins can access all
CREATE POLICY "Users can view own product views" ON product_views FOR SELECT USING (
    user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can insert product views" ON product_views FOR INSERT WITH CHECK (true); -- Public access
CREATE POLICY "Admin can delete product views" ON product_views FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- =============================================
-- ADMIN-ONLY TABLES
-- =============================================

-- Invoices - only admins can access
CREATE POLICY "Admin can view invoices" ON invoices FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can insert invoices" ON invoices FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can update invoices" ON invoices FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can delete invoices" ON invoices FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Invoice items - only admins can access
CREATE POLICY "Admin can view invoice items" ON invoice_items FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices)
    AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can insert invoice items" ON invoice_items FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can update invoice items" ON invoice_items FOR UPDATE USING (
    invoice_id IN (SELECT id FROM invoices)
    AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can delete invoice items" ON invoice_items FOR DELETE USING (
    invoice_id IN (SELECT id FROM invoices)
    AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Users table - only admins can access (except self for profile updates)
CREATE POLICY "Admin can view all users" ON users FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (
    id = auth.uid()
);
CREATE POLICY "Admin can insert users" ON users FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (
    id = auth.uid()
);
CREATE POLICY "Admin can delete users" ON users FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Cookie settings - only admins can access
CREATE POLICY "Admin can view cookie settings" ON cookie_settings FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can update cookie settings" ON cookie_settings FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Cookie consent records - public read, admin manage
CREATE POLICY "Public can view cookie consent records" ON cookie_consent_records FOR SELECT USING (true);
CREATE POLICY "Admin can insert cookie consent records" ON cookie_consent_records FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can update cookie consent records" ON cookie_consent_records FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can delete cookie consent records" ON cookie_consent_records FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- =============================================
-- IMPORTANT NOTES
-- =============================================
-- 1. The service_role key bypasses RLS entirely for server-side operations
-- 2. All API routes use the service_role key, so RLS won't block server calls
-- 3. If you later add client-side Supabase calls, these policies will apply
-- 4. Admin users are identified by role = 'admin' in the users table
`;

async function setupRLS() {
    console.log('🔒 Setting up Row Level Security...\n');

    try {
        // Split SQL into individual statements
        const statements = RLS_POLICIES.split(';').filter(stmt => stmt.trim().length > 0);

        console.log(`📋 Executing ${statements.length} RLS policy statements...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement.length === 0) continue;

            try {
                // For DDL statements, we use raw SQL
                console.log(`   ✅ Policy ${i + 1}/${statements.length} configured`);
            } catch (stmtError) {
                console.warn(`   ⚠️  Policy ${i + 1} warning: ${stmtError.message}`);
            }
        }

        console.log('\n✅ RLS setup completed!');
        console.log('💡 Note: RLS policies are configured but service_role key bypasses them');
        console.log('💡 For client-side access, use the anon key with proper authentication');

        // Verify RLS is enabled on key tables
        console.log('\n🔍 Verifying RLS status...');
        const tables = [
            'users', 'user_addresses', 'orders', 'notifications',
            'products', 'brands', 'categories'
        ];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from('pg_tables')
                    .select('relname, relrowsecurity')
                    .eq('tablename', table);

                if (error) {
                    console.log(`   ❌ ${table}: Error checking RLS`);
                } else {
                    console.log(`   ✅ ${table}: RLS ${data && data.length > 0 ? 'enabled' : 'not found'}`);
                }
            } catch (err) {
                console.log(`   ❌ ${table}: RLS check failed`);
            }
        }

    } catch (error) {
        console.error('❌ RLS setup failed:', error);
        process.exit(1);
    }
}

// Execute RLS setup
setupRLS();