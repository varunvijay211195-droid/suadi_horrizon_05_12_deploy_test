# Supabase Migration: Next Phases Roadmap

This document outlines the steps to be taken after the initial data migration is complete.

## Phase 4: API & Client Refactoring ✅ PARTIALLY COMPLETE

The application needs to switch from Mongoose/MongoDB to the Supabase client.

### 4.1 Client Initialization ✅ COMPLETE

- **Action:** Update `src/lib/supabase/client.ts` (public/browser) and `server.ts` (service role for admin/restricted).
- **Goal:** Centralized access to the Supabase instance.
- **Status:** ✅ Both client files created and configured

### 4.2 Route Refactoring ✅ SUBSTANTIALLY COMPLETE

- **Action:** Systematically replace Mongo queries in `/api/...` routes.
- **Pattern Change:**
  - `Product.find({})` → `supabase.from('products').select('*')`
  - `User.findById(id)` → `supabase.from('users').select('*').eq('id', id).single()`
- **Progress:** ✅ 23 routes converted (products, categories, brands, orders, invoices, users, hyperpay/checkout, quotes, user-addresses, banners, news, notifications, cookie-consent, homepage-config, cart, product-views)
- **Remaining:** Complex admin routes (admin/stats, admin/inventory, admin/analytics) require major refactoring due to Supabase aggregation limitations vs MongoDB. These routes contain complex analytics queries that would need redesign for Supabase.

### 4.3 Enhanced Cart Implementation ✅ COMPLETE

- **Action:** Implement persistent cart storage for authenticated users
- **Implementation:**
  - ✅ Created `cart_items` table schema with RLS policies
  - ✅ Updated cart API routes (GET, POST, PUT, DELETE)
  - ✅ Updated cart utilities for Supabase integration
  - ✅ Added cart persistence across devices for logged-in users
- **Next:** Test cart functionality and migrate localStorage carts to database

---

## Phase 5: Security & Row Level Security (RLS) 🔄 IN PROGRESS

PostgreSQL's RLS is more granular than MongoDB's application-level security.

### 5.1 Default Access ✅ COMPLETE

- **Action:** Disable all access by default for every table.
- **Goal:** "Deny all" security posture.
- **Status:** ✅ RLS enabled on all tables including new cart_items table

### 5.2 Specific Policies ✅ COMPLETE

- **Public Tables:** `products`, `categories`, `brands` (Read access for all).
- **User Protected:** `user_addresses`, `orders`, `cart_items` (Read/Write if `user_id == auth.uid()`).
- **Admin Only:** `admin_settings`, `audit_logs`.

---

## Phase 6: Storage Migration & Cleanup ⏳ PENDING

Migrate images/files from current storage or continue using Cloudinary if preferred.

---

## Phase 7: Verification & Optimization ⏳ PENDING

- **Action:** Run Playwright/Cypress tests across the entire site.
- **Action:** Implement Server-Side rendering (SSR) using Supabase's fetching logic for performance.
