import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface AncCategory {
    id: number;
    name_tr: string;
    name_en: string;
    category_url: string;
    source_image_url: string;
    local_image: string;
    image_filename: string;
}

export async function GET() {
    try {
        const jsonPath = path.join(process.cwd(), 'products', 'anc_categories.json');
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const categories: AncCategory[] = JSON.parse(raw);

        const formatted = categories.map((cat) => ({
            id: cat.id,
            name: cat.name_en,
            name_tr: cat.name_tr,
            slug: cat.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            // Serve from /public/category_images/
            image: `/${cat.local_image}`,
            image_filename: cat.image_filename,
        }));

        return NextResponse.json({ categories: formatted });
    } catch (err) {
        console.error('[GET /api/categories/static] Error:', err);
        return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
    }
}
