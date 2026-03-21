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

    const { productId, email } = await request.json();

    if (!productId || !email) {
      return NextResponse.json({ error: 'Product ID and email are required' }, { status: 400 });
    }

    // Check if alert already exists
    const { data: existingAlert } = await supabase
      .from('stock_alerts')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', auth.user?._id || 'anonymous')
      .single();

    if (existingAlert) {
      return NextResponse.json({ error: 'Alert already exists for this product' }, { status: 400 });
    }

    const stockAlertData = {
      product_id: productId,
      user_id: auth.user?._id || 'anonymous',
      email,
      created_at: new Date().toISOString(),
    };

    const { data: stockAlert, error } = await supabase
      .from('stock_alerts')
      .insert(stockAlertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create stock alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, stockAlert });
  } catch (error) {
    console.error('Error creating stock alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('stock_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete stock alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stock alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await getAuthFromRequest(request);

    const { data: stockAlerts, error } = await supabase
      .from('stock_alerts')
      .select('*')
      .eq('user_id', auth.user?._id || 'anonymous')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch stock alerts' }, { status: 500 });
    }

    return NextResponse.json(stockAlerts || []);
  } catch (error) {
    console.error('Error retrieving stock alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
