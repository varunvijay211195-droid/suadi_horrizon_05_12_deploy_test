# Supabase Migration Plan

## Overview

**MIGRATION PROGRESS UPDATE**

✅ **Phase 1 Complete**: Critical API routes migrated
✅ **Dependencies Reduced**: From 110 → 97 (13 dependencies eliminated)
✅ **Files Migrated**: 5 critical API routes converted to Supabase

📊 **Current Status**: 97 MongoDB dependencies remaining in 38 files

## Migration Categories

### 🔴 CRITICAL - API Routes (Immediate Priority)

These routes are actively called and will break without migration:

1. **HyperPay Routes** (`src/app/api/hyperpay/`)
   - `invoice-checkout/route.ts` - Uses Invoice.findById()
   - `status/route.ts` - Uses connectDB()
   - **Impact**: Payment processing will fail

2. **Notifications API** (`src/app/api/notifications/`)
   - `banners/route.ts` - Uses BannerModel
   - `recently-viewed/route.ts` - Uses RecentlyViewedProductModel
   - `stock-alerts/route.ts` - Uses StockAlertModel
   - **Impact**: Notification features broken

3. **Cookie Consent** (`src/app/api/cookie-consent/`)
   - `export/route.ts` - Uses CookieConsentRecord.find()
   - **Impact**: GDPR compliance features broken

### 🟡 HIGH - Admin Dashboard APIs

Admin functionality that needs to work for business operations:

1. **Admin APIs** (`src/app/api/admin/`)
   - All admin routes using verifyAdminToken()
   - **Impact**: Admin panel unusable

2. **Order Management** (`src/app/api/orders/`)
   - Order processing and management
   - **Impact**: E-commerce functionality broken

### 🟢 MEDIUM - Supporting Infrastructure

1. **MongoDB Models** (`src/lib/db/models/`)
   - All 17+ model files using Mongoose
   - Replace with Supabase client queries

2. **Authentication Issues**
   - JWT token validation failing
   - User session management

3. **Frontend Components**
   - Product ID references (_id → id)
   - Component data structure updates

## Migration Strategy

### Phase 1: Critical API Routes (Week 1)

**Goal**: Restore core functionality

1. **Day 1-2**: HyperPay payment routes
   - Convert Invoice.findById() to Supabase query
   - Update payment status handling

2. **Day 3**: Notifications system
   - Migrate BannerModel to Supabase
   - Migrate RecentlyViewedProductModel
   - Migrate StockAlertModel

3. **Day 4**: Cookie consent export
   - Convert CookieConsentRecord queries

### Phase 2: Admin Dashboard (Week 2)

**Goal**: Restore admin functionality

1. **Day 5-7**: Admin API routes
   - Update all admin routes to use Supabase
   - Fix authentication middleware
   - Test admin dashboard functionality

### Phase 3: Supporting Systems (Week 3)

**Goal**: Complete infrastructure migration

1. **Day 8-10**: Order management
   - Convert order processing to Supabase
   - Update order status handling

2. **Day 11-12**: Authentication fixes
   - Resolve JWT token issues
   - Update user session management

### Phase 4: Frontend Updates (Week 4)

**Goal**: Update client-side code

1. **Day 13-14**: Component updates
   - Change _id references to id
   - Update data structures

2. **Day 15**: Testing and validation
   - End-to-end testing
   - Performance validation

## Success Criteria

- ✅ All API routes return 200 status codes
- ✅ Admin dashboard fully functional
- ✅ Payment processing works
- ✅ User authentication works
- ✅ No MongoDB dependencies remain
- ✅ All frontend components updated

## Risk Mitigation

- **Database Backup**: Ensure Supabase data is backed up before migrations
- **Rollback Plan**: Keep MongoDB connection available during transition
- **Testing**: Each route tested individually before deployment
- **Monitoring**: Log errors and monitor API responses

## Tools Created

- `scripts/scan-mongodb-dependencies.js` - Identifies MongoDB usage
- `mongodb-scan-report.json` - Detailed dependency report
- Migration progress tracking in this document
