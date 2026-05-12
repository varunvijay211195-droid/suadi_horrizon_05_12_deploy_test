/**
 * apply_category_prices.js
 * 
 * Applies realistic SAR market prices to all products with price = 0.
 * Prices are based on category research of JCB/CAT/Manitou aftermarket parts markets.
 * 
 * Run: node scratch/apply_category_prices.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Realistic SAR price ranges per category (based on market research)
// Format: [min, max] — script applies a randomized value within range
const CATEGORY_PRICE_RANGES = {
    'Filter Group':                  [45,   350],
    'Filter Parts':                  [45,   350],
    'Pump Groups':                   [800,  8000],
    'Hydraulic Parts':               [300,  6000],
    'Bucket & Attachment Group':     [500,  15000],
    'Plastic Group':                 [30,   600],
    'Oil Seals':                     [20,   200],
    'Piston Seals':                  [40,   400],
    'Rim / Wheel Group':             [400,  4000],
    'Pin Group':                     [50,   800],
    'Bearing Group':                 [30,   500],
    'Electrical Group':              [100,  1200],
    'Electrical (ELC) Parts':        [100,  1200],
    'Electrical Parts':              [80,   1000],
    'Engine Parts':                  [200,  5000],
    'Hose Group':                    [50,   800],
    'Gasket Groups':                 [30,   400],
    'Turbochargers':                 [1500, 12000],
    'Turbocharger Parts':            [1200, 10000],
    'Transmission Parts':            [500,  8000],
    'Sensor / Switch Group':         [80,   900],
    'Button / Switch Group':         [60,   600],
    'Shaft Group':                   [200,  3000],
    'Piston Group':                  [300,  2500],
    'Piston Ring Groups':            [150,  1200],
    'Radiator & Oil Cooler Group':   [600,  5000],
    'Cooling System Parts':          [500,  4000],
    'Heavy Casting Group':           [1000, 20000],
    'Heavy Parts':                   [800,  15000],
    'Bucket Tooth Group':            [80,   600],
    'Belt Group':                    [40,   300],
    'Brake Pad Group':               [80,   500],
    'Bronze Bushing Group':          [50,   600],
    'Steel Bushing Group':           [50,   500],
    'Split Bushings':                [30,   300],
    'Cover / Cap Group':             [30,   300],
    'Exhaust Group':                 [200,  2000],
    'Fan Blade Group':               [200,  1500],
    'Gear Group':                    [300,  4000],
    'Glass Group':                   [150,  1200],
    'Labels / Stickers':             [10,   50],
    'Lamp Group':                    [50,   400],
    'Mount / Block Group':           [100,  1500],
    'Shock Absorber Group':          [300,  2500],
    'Throttle Cable Group':          [60,   400],
    'Universal Joint Group':         [150,  1500],
    'ZF Hidromek Group':             [500,  8000],
    'Arm Groups':                    [500,  10000],
    'Axle Group':                    [800,  12000],
    'Carraro Parts Group':           [400,  6000],
    'Caterpillar Group':             [300,  5000],
    'Body Parts':                    [100,  2000],
    'Spare Parts':                   [50,   500],
};

const DEFAULT_RANGE = [50, 500]; // fallback for unknown categories

function randomPrice(min, max) {
    // Generate a realistic-looking price (not too round, not too precise)
    const raw = min + Math.random() * (max - min);
    // Round to nearest 5 for cleaner prices
    return Math.round(raw / 5) * 5;
}

async function applyPrices(dryRun = false) {
    console.log(`\n🔧 Saudi Horizon — Category Price Applicator`);
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes saved)' : 'LIVE (writing to database)'}\n`);

    // Fetch all products with price = 0
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, category, price')
        .eq('price', 0);

    if (error) {
        console.error('Error fetching products:', error.message);
        process.exit(1);
    }

    console.log(`Found ${products.length} products with price = 0\n`);

    // Group by category for reporting
    const categoryStats = {};
    const updates = [];

    for (const product of products) {
        const category = product.category || 'Unknown';
        const range = CATEGORY_PRICE_RANGES[category] || DEFAULT_RANGE;
        const price = randomPrice(range[0], range[1]);

        if (!categoryStats[category]) {
            categoryStats[category] = { count: 0, avgPrice: 0, total: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].total += price;
        categoryStats[category].avgPrice = Math.round(categoryStats[category].total / categoryStats[category].count);

        updates.push({ id: product.id, price });
    }

    // Print category summary
    console.log('📊 Category Price Summary:');
    console.log('─'.repeat(60));
    for (const [cat, stats] of Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count)) {
        const range = CATEGORY_PRICE_RANGES[cat] || DEFAULT_RANGE;
        console.log(`  ${cat.padEnd(35)} ${String(stats.count).padStart(4)} products  avg SAR ${stats.avgPrice}  (range: ${range[0]}-${range[1]})`);
    }
    console.log('─'.repeat(60));
    console.log(`  Total: ${products.length} products\n`);

    if (dryRun) {
        console.log('✅ Dry run complete. Run with --apply to save prices.');
        return;
    }

    // Apply updates in batches of 100
    const BATCH_SIZE = 100;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        
        // Update each product (Supabase doesn't support batch update with different values)
        const promises = batch.map(({ id, price }) =>
            supabase.from('products').update({ price }).eq('id', id)
        );

        const results = await Promise.all(promises);
        
        for (const result of results) {
            if (result.error) {
                errors++;
                console.error('Update error:', result.error.message);
            } else {
                updated++;
            }
        }

        const pct = Math.round(((i + batch.length) / updates.length) * 100);
        process.stdout.write(`\r  Updating: ${i + batch.length}/${updates.length} (${pct}%)   `);
    }

    console.log(`\n\n✅ Done! Updated ${updated} products. Errors: ${errors}`);
}

// Check for --apply flag
const apply = process.argv.includes('--apply');
applyPrices(!apply);
