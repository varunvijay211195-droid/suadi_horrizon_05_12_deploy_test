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

import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/saudi_horizon';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required Supabase environment variables');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    process.exit(1);
}

let supabase;
try {
    supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase client initialized');
} catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    process.exit(1);
}

// ---- ID MAPPING (MongoDB ObjectId → Supabase UUID) ----
const userIdMap = new Map(); // oldObjectId → newUUID

async function connectMongo() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        console.error('   Connection URI:', MONGODB_URI.replace(/:([^:@]{4})[^:@]*@/, ':$1****@')); // Hide password
        throw error;
    }
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

const brandMap = new Map(); // name/slug -> id
const categoryMap = new Map(); // name/slug -> id

async function getOrCreateBrand(brandName) {
    if (!brandName) return null;
    const key = brandName.toString().toLowerCase().trim();
    if (brandMap.has(key)) return brandMap.get(key);

    console.log(`   🔸 Auto-creating missing brand: ${brandName}`);
    const id = brandName.toString().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const row = {
        id: id || `brand-${Date.now()}`,
        name: brandName,
        slug: id || `brand-${Date.now()}`,
        is_active: true
    };

    const { error } = await supabase.from('brands').upsert(row);
    if (error) {
        console.warn(`   ⚠️ Failed to auto-create brand ${brandName}: ${error.message}`);
        // Fallback to a generic 'other' brand if we can't create it
        return 'other';
    }

    brandMap.set(key, row.id);
    return row.id;
}

async function getOrCreateCategory(catName) {
    if (!catName) return null;
    const key = catName.toString().toLowerCase().trim();
    if (categoryMap.has(key)) return categoryMap.get(key);

    console.log(`   🔸 Auto-creating missing category: ${catName}`);
    const id = catName.toString().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const row = {
        id: id || `cat-${Date.now()}`,
        name: catName,
        slug: id || `cat-${Date.now()}`,
        is_active: true
    };

    const { error } = await supabase.from('categories').upsert(row);
    if (error) {
        console.warn(`   ⚠️ Failed to auto-create category ${catName}: ${error.message}`);
        return 'other';
    }

    categoryMap.set(key, row.id);
    return row.id;
}

async function migrateProducts() {
    console.log('📦 Phase 2: Products (with reference resolution)...');

    // 1. Pre-populate maps from existing Supabase data
    const { data: existingBrands } = await supabase.from('brands').select('id, name, slug');
    existingBrands?.forEach(b => {
        brandMap.set(b.name.toLowerCase().trim(), b.id);
        brandMap.set(b.slug.toLowerCase().trim(), b.id);
        brandMap.set(b.id.toLowerCase().trim(), b.id);
    });

    const { data: existingCats } = await supabase.from('categories').select('id, name, slug');
    existingCats?.forEach(c => {
        categoryMap.set(c.name.toLowerCase().trim(), c.id);
        categoryMap.set(c.slug.toLowerCase().trim(), c.id);
        categoryMap.set(c.id.toLowerCase().trim(), c.id);
    });

    const products = await mongoose.connection.db.collection('products').find().toArray();
    if (products.length === 0) { console.log('   ⏭️  No products to migrate'); return; }

    const chunkSize = 50;
    for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const rows = [];

        for (const p of chunk) {
            const brandId = await getOrCreateBrand(p.brand);
            const catId = await getOrCreateCategory(p.category);
            const subcatId = p.subcategory ? await getOrCreateCategory(p.subcategory) : null;

            rows.push({
                id: p._id.toString(),
                name: p.name,
                sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                brand: brandId || 'other',
                category: catId || 'other',
                subcategory: subcatId,
                price: parseFloat(p.price) || 0,
                image: p.image || null,
                gallery: Array.isArray(p.gallery) ? p.gallery : [],
                documents: Array.isArray(p.documents) ? p.documents : [],
                description: p.description || null,
                specs: typeof p.specs === 'object' ? p.specs : {},
                compatibility: Array.isArray(p.compatibility) ? p.compatibility : [],
                in_stock: p.inStock !== false,
                stock: parseInt(p.stock) || 0,
                rating: parseFloat(p.rating) || 0,
                reviews: parseInt(p.reviews) || 0,
                oem_code: p.oemCode || null,
                featured: !!p.featured,
                created_at: p.createdAt || new Date().toISOString(),
                updated_at: p.updatedAt || new Date().toISOString(),
            });
        }

        const { error } = await supabase.from('products').upsert(rows);
        if (error) {
            console.error('❌ Supabase Error Details:', JSON.stringify(error, null, 2));
            throw new Error(`Products chunk ${i}: ${error.message}`);
        }
        console.log(`   ✅ Migrated products ${i + 1}-${Math.min(i + chunkSize, products.length)} of ${products.length}`);
    }
}

async function migrateUsers() {
    console.log('📦 Phase 3: Users (with nested data)...');

    // 1. Pre-populate userIdMap from existing Supabase users to handle restarts
    const { data: existingUsers } = await supabase.from('users').select('id, email');
    existingUsers?.forEach(u => {
        // We'll map by email during the loop if the map doesn't have the Mongo ID yet
    });

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
            total_spent: parseFloat(u.totalSpent) || 0,
            total_orders: parseInt(u.totalOrders) || 0,
            segment: u.segment || 'new',
            preferred_categories: u.preferredCategories || [],
            preferred_brands: u.preferredBrands || [],
            reset_password_token: u.resetPasswordToken || null,
            reset_password_expires: u.resetPasswordExpires || null,
            created_at: u.createdAt || new Date().toISOString(),
            updated_at: u.updatedAt || new Date().toISOString(),
        };

        const { data, error } = await supabase.from('users').upsert(row, { onConflict: 'email' }).select('id').single();

        if (error) {
            console.warn(`   ⚠️  User ${u.email}: ${error.message}`);
            // If user exists but upsert failed (e.g. some other constraint), try to get ID anyway
            const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).single();
            if (existing) {
                userIdMap.set(u._id.toString(), existing.id);
            }
            continue;
        }

        userIdMap.set(u._id.toString(), data.id);

        // Migrate addresses
        if (u.addresses && u.addresses.length > 0) {
            const addrs = u.addresses.map(a => ({
                user_id: data.id,
                name: a.name || 'Default',
                full_name: a.fullName || null,
                address: a.address || '',
                city: a.city || '',
                state: a.state || '',
                zip_code: a.zipCode || '',
                country: a.country || 'Saudi Arabia',
                phone: a.phone || '',
                is_default: a.isDefault || false,
            }));
            const { error: addrErr } = await supabase.from('user_addresses').upsert(addrs, { onConflict: 'user_id, name' });
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
        fs.writeFileSync(
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