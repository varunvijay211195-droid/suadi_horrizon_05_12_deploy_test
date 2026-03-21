# Saudi Horizon - Supabase Integration Guide

## Overview

This guide provides complete information for integrating Supabase into the Saudi Horizon Next.js application, replacing the current MongoDB/Mongoose setup.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Supabase Setup](#supabase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Client Files](#client-files)
5. [Data Migration](#data-migration)
6. [API Refactoring](#api-refactoring)
7. [Schema Documentation](#schema-documentation)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Project Structure

### New Files Created
```
src/lib/supabase/
├── client.ts          # Browser client
└── server.ts          # Server client

scripts/
└── migrate-to-supabase.js  # Data migration script

Documentation/
├── SUPABASE_MIGRATION_GUIDE.md
├── SUPABASE_MIGRATION_STATUS.md
└── SUPABASE_INTEGRATION_GUIDE.md
```

### Dependencies Added
```json
{
  "@supabase/supabase-js": "^2.x.x"
}
```

## Supabase Setup

### 1. Create Supabase Project
1. Go to https://supabase.com/dashboard/new
2. Create organization if needed
3. Create project:
   - **Name**: `saudi-horizon`
   - **Database Password**: Save securely
   - **Region**: Central EU Frankfurt (or Middle East if available)
   - **Plan**: Free tier

### 2. Get API Keys
Navigate to **Project Settings → API** to get:
- **Project URL**: `https://xxxxxxxxxx.supabase.co`
- **Anon Key**: Public key for browser client
- **Service Role Key**: Secret key for server operations

## Environment Configuration

Add to `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Keep existing MongoDB URL temporarily for migration
DATABASE_URL=mongodb://localhost:27017/saudi_horizon
```

## Client Files

### Browser Client (`src/lib/supabase/client.ts`)
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
```

### Server Client (`src/lib/supabase/server.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'

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

## Data Migration

### Migration Script Usage
```bash
node scripts/migrate-to-supabase.js
```

### Migration Process
1. **Phase 1**: Independent tables (brands, categories)
2. **Phase 2**: Products (depends on brands/categories)
3. **Phase 3**: Users (with nested data)
4. **Phase 4**: Invoices
5. **Phase 5**: Quote Requests
6. **Phase 6**: Simple collections (notifications, banners, etc.)

### Data Mapping
- **MongoDB ObjectId** → **Supabase UUID**
- **camelCase fields** → **snake_case fields**
- **Embedded arrays** → **Separate tables with foreign keys**

## API Refactoring

### Before (Mongoose)
```typescript
import { connectDB } from '@/lib/db/mongodb';
import Product from '@/lib/db/models/Product';

export async function GET() {
    await connectDB();
    const products = await Product.find({ inStock: true });
    return NextResponse.json(products);
}
```

### After (Supabase)
```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true);
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
```

### Query Mapping
| Mongoose | Supabase |
|----------|----------|
| `Model.find()` | `supabase.from('table').select('*')` |
| `Model.findById(id)` | `supabase.from('table').select('*').eq('id', id).single()` |
| `Model.create(body)` | `supabase.from('table').insert(body).select().single()` |
| `Model.findByIdAndUpdate(id, update)` | `supabase.from('table').update(update).eq('id', id).select().single()` |
| `.populate('brand')` | `.select('*, brands(*), categories(*)')` |

## Schema Documentation

### 26 PostgreSQL Tables

#### Core Tables
1. **brands** - Equipment brands
2. **categories** - Product categories (with hierarchy)
3. **products** - Product catalog
4. **users** - User accounts
5. **orders** - Order management
6. **invoices** - Invoice generation
7. **quote_requests** - Quote management

#### Supporting Tables
8. **user_addresses** - User shipping addresses
9. **user_payment_methods** - Payment methods
10. **user_purchase_history** - Purchase tracking
11. **order_items** - Order line items
12. **invoice_items** - Invoice line items
13. **quote_messages** - Quote communication
14. **notifications** - User notifications
15. **banners** - Homepage banners
16. **news** - News articles
17. **homepage_config** - Homepage configuration
18. **homepage_sections** - Section visibility
19. **homepage_testimonials** - Customer testimonials
20. **promotions** - Discount codes
21. **cookie_settings** - Cookie preferences
22. **cookie_consent_records** - Consent tracking
23. **complaints** - Customer complaints
24. **service_requests** - Service requests
25. **chat_messages** - Chat functionality
26. **product_views** - Analytics tracking

### Key Features
- **Foreign Key Relationships**: Proper referential integrity
- **Indexes**: Performance optimization on frequently queried fields
- **Triggers**: Automatic `updated_at` timestamp updates
- **JSONB Fields**: Flexible data storage for complex objects
- **TTL Cleanup**: Automatic cleanup of old records via pg_cron

## Testing

### Post-Migration Verification
- [ ] Public pages load (homepage, products, categories)
- [ ] User authentication (login/register)
- [ ] Admin dashboard functionality
- [ ] Product CRUD operations
- [ ] Invoice generation
- [ ] Quote request management
- [ ] Notification system
- [ ] Homepage configuration
- [ ] Search functionality
- [ ] Image upload (Cloudinary integration)

### Test Commands
```bash
# Test migration script
node scripts/migrate-to-supabase.js

# Test API endpoints
npm run dev

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
```bash
# Check if .env.local exists and has correct values
cat .env.local

# Verify Supabase keys are valid
# Test with simple script:
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); console.log('Connected:', !!supabase);"
```

#### 2. Migration Script Errors
```bash
# Check MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.DATABASE_URL).then(() => console.log('MongoDB connected')).catch(console.error);"

# Check Supabase connection
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('brands').select('*').then(console.log).catch(console.error);"
```

#### 3. API Route Errors
- Ensure all field names use snake_case
- Check foreign key relationships
- Verify service role key has proper permissions

#### 4. Performance Issues
- Verify indexes are created on frequently queried fields
- Check for N+1 query problems in joins
- Consider using `.select('id, name')` instead of `'*'` for better performance

### Debug Commands
```bash
# Check Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('brands').select('count(*)').then(console.log).catch(console.error);
"

# Check data migration results
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
['brands', 'categories', 'products', 'users'].forEach(async table => {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  console.log(\`\${table}: \${count}\`);
});
"
```

## Next Steps

1. **Setup Supabase Project** - Create project and get API keys
2. **Configure Environment** - Add Supabase variables to `.env.local`
3. **Run SQL Schema** - Execute schema script in Supabase SQL Editor
4. **Execute Migration** - Run data migration script
5. **Refactor APIs** - Convert 70+ API routes from Mongoose to Supabase
6. **Test Application** - Verify all functionality works correctly
7. **Remove Dependencies** - Uninstall Mongoose and remove old files

## Estimated Timeline

- Supabase setup and configuration: 30 minutes
- SQL schema execution: 15 minutes
- Data migration: 15 minutes
- API route refactoring: 3-4 hours
- Testing and cleanup: 1 hour

**Total: 4.5-5.5 hours**

## Support

For additional help:
- Supabase Documentation: https://supabase.com/docs
- Next.js Supabase Integration: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- Migration Guide: See `SUPABASE_MIGRATION_GUIDE.md` for detailed steps