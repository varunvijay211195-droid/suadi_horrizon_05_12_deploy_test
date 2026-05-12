require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const cats = JSON.parse(fs.readFileSync('products/anc_categories.json', 'utf8'));
    
    for (const cat of cats) {
        if (!cat.local_image) continue;
        
        const catName = cat.name_en;
        
        // Find category id by name
        const { data: dbCat } = await supabase.from('categories').select('id, slug').eq('name', catName).single();
        if (dbCat) {
            // Update image
            const imageJson = { url: `/${cat.local_image}`, alt: catName };
            const { error } = await supabase.from('categories').update({ image: imageJson }).eq('id', dbCat.id);
            if (error) console.error(`Failed to update ${catName}:`, error);
            else console.log(`Updated image for ${catName}`);
        }
    }
}
run().catch(console.error);
