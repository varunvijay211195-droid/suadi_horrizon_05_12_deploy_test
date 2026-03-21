import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple auth middleware replacement
async function getAuthFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { authorized: false, user: null };
  }
  return { authorized: true, user: { _id: 'system' } };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const { productId, productName, productImage } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const recentlyViewedData = {
      user_id: auth.user?._id || 'anonymous',
      product_id: productId,
      product_name: productName,
      product_image: productImage,
      viewed_at: new Date().toISOString(),
    };

    const { data: recentlyViewed, error } = await supabase
      .from('recently_viewed_products')
      .insert(recentlyViewedData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save recently viewed product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, recentlyViewed });
  } catch (error) {
    console.error('Error adding recently viewed product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const { data: recentlyViewed, error } = await supabase
      .from('recently_viewed_products')
      .select('*')
      .eq('user_id', auth.user?._id || 'anonymous')
      .order('viewed_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch recently viewed products' }, { status: 500 });
    }

    return NextResponse.json(recentlyViewed || []);
  } catch (error) {
    console.error('Error retrieving recently viewed products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
