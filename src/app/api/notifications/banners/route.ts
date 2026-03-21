import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple auth middleware replacement
async function getAuthFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { authorized: false, user: null };
  }
  // For now, just check if header exists
  return { authorized: true, user: { _id: 'system' } };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const { position, targetUser } = Object.fromEntries(request.nextUrl.searchParams);

    const now = new Date().toISOString();

    let query = supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now);

    if (position) {
      query = query.eq('position', position);
    }

    // For targetUser filtering, we'll handle it in JavaScript since Supabase doesn't have $or easily
    const { data: banners, error } = await query.order('display_order', { ascending: true }).order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }

    // Filter by target audience if specified
    let filteredBanners = banners || [];
    if (targetUser) {
      filteredBanners = filteredBanners.filter(banner =>
        banner.target_audience === 'all' || banner.target_audience === targetUser
      );
    }

    return NextResponse.json(filteredBanners);
  } catch (error) {
    console.error('Error retrieving banners:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const bannerData = await request.json();

    if (!bannerData.title || !bannerData.content || !bannerData.startDate || !bannerData.endDate) {
      return NextResponse.json({ error: 'Title, content, start date, and end date are required' }, { status: 400 });
    }

    const bannerRow = {
      title: bannerData.title,
      content: bannerData.content,
      image_url: bannerData.imageUrl,
      link_url: bannerData.linkUrl,
      position: bannerData.position,
      display_order: bannerData.displayOrder || 0,
      start_date: bannerData.startDate,
      end_date: bannerData.endDate,
      is_active: bannerData.isActive !== false,
      target_audience: bannerData.targetAudience,
      target_user_ids: bannerData.targetUserIds,
      created_by: auth.user?._id || 'system',
    };

    const { data: banner, error } = await supabase
      .from('banners')
      .insert(bannerRow)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
    }

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const id = request.nextUrl.searchParams.get('id');
    const bannerData = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    const updateData = {
      title: bannerData.title,
      content: bannerData.content,
      image_url: bannerData.imageUrl,
      link_url: bannerData.linkUrl,
      position: bannerData.position,
      display_order: bannerData.displayOrder,
      start_date: bannerData.startDate,
      end_date: bannerData.endDate,
      is_active: bannerData.isActive,
      target_audience: bannerData.targetAudience,
      target_user_ids: bannerData.targetUserIds,
      updated_at: new Date().toISOString(),
    };

    const { data: banner, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
    }

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
