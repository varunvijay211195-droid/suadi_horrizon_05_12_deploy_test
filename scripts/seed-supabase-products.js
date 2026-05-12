const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    const productsPath = path.join(__dirname, '..', 'products', 'anc_products_detailed.json');
    if (!fs.existsSync(productsPath)) {
        console.error("Products data not found!");
        return;
    }
    
    const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    
    console.log(`Loaded ${productsRaw.length} products. Cleaning existing database...`);
    
    // To clear table effectively without hitting memory limits, use neq id = 000
    const { error: delError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) {
        console.error("Error clearing existing products:", delError);
        return;
    }
    
    console.log("Existing products cleared. Preparing data...");
    
    // UPSERT BRAND
    console.log("Inserting Brand: Anac Makina...");
    await supabase.from('brands').upsert({ id: 'Anac Makina', name: 'Anac Makina', slug: 'anac-makina' }, { onConflict: 'id' });
    
    // UPSERT CATEGORIES
    const uniqueCategories = [...new Set(productsRaw.map(p => p.category_name))];
    console.log(`Inserting ${uniqueCategories.length} Categories...`);
    for (const cat of uniqueCategories) {
        // Generating a slug from category name
        const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        // Append anac- prefix to prevent slug conflicts with existing categories
        const uniqueSlug = `anac-${slug}`;
        const { error } = await supabase.from('categories').upsert({ id: cat, name: cat, slug: uniqueSlug }, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting category ${cat}:`, error);
        }
    }
    
    const mapped = productsRaw.map(p => {
        // Fallback for empty weight
        let specs = p.features || {};
        
        return {
            id: crypto.randomUUID(),
            name: p.name,
            sku: p.ref_no || `ANC-${crypto.randomBytes(3).toString('hex')}`,
            brand: "Anac Makina",
            category: p.category_name,
            subcategory: null,
            price: 0,
            image: { url: `/${p.local_image}`, alt: p.name }, // This matches the path structure
            gallery: [],
            documents: [],
            description: `Reference Number: ${p.ref_no}\nWeight: ${specs['AĞIRLIK'] || 'N/A'}\nDimensions: ${specs['KUTU ÖLÇÜSÜ'] || 'N/A'}\n\nProducts are aftermarket parts guaranteed by ANAÇ.`,
            specs: specs,
            compatibility: p.cross_references ? p.cross_references.map(cr => `Old: ${cr.old_number} -> New: ${cr.new_number}`) : [],
            in_stock: true,
            stock: 100,
            rating: 5,
            reviews: 0,
            oem_code: p.ref_no || null,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    });
    
    console.log("Inserting products in chunks of 500...");
    for (let i = 0; i < mapped.length; i += 500) {
        const chunk = mapped.slice(i, i + 500);
        const { error: insError } = await supabase.from('products').insert(chunk);
        if (insError) {
            console.error(`Error inserting chunk ${i} - ${i+500}:`, insError);
        } else {
            console.log(`Inserted chunk ${i} - ${i+chunk.length}`);
        }
    }
    
    console.log("Seeding complete!");
}

seed().catch(console.error);
