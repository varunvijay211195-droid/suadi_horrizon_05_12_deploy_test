import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/banners - Get banners with filtering
export async function GET(request: NextRequest) {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const active = searchParams.get('active');
        const position = searchParams.get('position');

        const supabase = createClient();
        let query = supabase.from('banners').select('*');

        if (active !== null) {
            query = query.eq('is_active', active === 'true');
        }
        if (position) {
            query = query.eq('position', position);
        }

        const { data: banners, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching banners:', error);
            return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
        }

        return NextResponse.json({ banners: banners || [] });
    } catch (error: unknown) {
        console.error('Error fetching banners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch banners' },
            { status: 500 }
        );
    }
}

// POST /api/admin/banners - Create new banner
export async function POST(request: NextRequest) {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const body = await request.json();
        const { title, subtitle, image, link, ctaText, position, isActive, startDate, endDate } = body;

        if (!title || !position) {
            return NextResponse.json(
                { error: 'title and position are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        const { data: newBanner, error } = await supabase
            .from('banners')
            .insert({
                title,
                subtitle: subtitle || '',
                image: image || '',
                link: link || '',
                cta_text: ctaText || 'Shop Now',
                position,
                is_active: isActive !== undefined ? isActive : true,
                start_date: startDate || null,
                end_date: endDate || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating banner:', error);
            return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
        }

        return NextResponse.json(newBanner, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating banner:', error);
        return NextResponse.json(
            { error: 'Failed to create banner' },
            { status: 500 }
        );
    }
}
