import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BRANDS = [
    { name: 'ANC', slug: 'anc', description: 'ANC Heavy Equipment Parts', isFeatured: true, isActive: true },
    { name: 'BW', slug: 'bw', description: 'BW Parts', isFeatured: false, isActive: true },
    { name: 'FA', slug: 'fa', description: 'FA Parts', isFeatured: false, isActive: true },
    { name: 'Generic', slug: 'generic', description: 'Generic Parts', isFeatured: false, isActive: true },
    { name: 'CAT', slug: 'cat', description: 'Caterpillar Parts', isFeatured: true, isActive: true },
    { name: 'BOB', slug: 'bob', description: 'BOB Parts', isFeatured: false, isActive: true },
];

const CATEGORIES = [
    { name: 'Transmission Parts', slug: 'transmission-parts', displayOrder: 1, isActive: true },
    { name: 'Electrical Parts', slug: 'electrical-parts', displayOrder: 2, isActive: true },
    { name: 'Engine Parts', slug: 'engine-parts', displayOrder: 3, isActive: true },
    { name: 'Cooling System Parts', slug: 'cooling-system-parts', displayOrder: 4, isActive: true },
    { name: 'Hydraulic Parts', slug: 'hydraulic-parts', displayOrder: 5, isActive: true },
    { name: 'Turbocharger Parts', slug: 'turbocharger-parts', displayOrder: 6, isActive: true },
    { name: 'Spare Parts', slug: 'spare-parts', displayOrder: 7, isActive: true },
    { name: 'Heavy Parts', slug: 'heavy-parts', displayOrder: 8, isActive: true },
    { name: 'Body Parts', slug: 'body-parts', displayOrder: 9, isActive: true },
    { name: 'Filter Parts', slug: 'filter-parts', displayOrder: 10, isActive: true },
];

export async function GET() {
    try {
        const supabase = createClient();

        const brandResults = [];
        for (const brand of BRANDS) {
            const { error } = await supabase
                .from('brands')
                .upsert(brand, { onConflict: 'slug' });

            if (error) {
                throw error;
            }

            brandResults.push(brand.name);
        }

        const catResults = [];
        for (const cat of CATEGORIES) {
            const { error } = await supabase
                .from('categories')
                .upsert(cat, { onConflict: 'slug' });

            if (error) {
                throw error;
            }

            catResults.push(cat.name);
        }

        return NextResponse.json({
            success: true,
            seeded: {
                brands: brandResults,
                categories: catResults,
            }
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 });
    }
}
