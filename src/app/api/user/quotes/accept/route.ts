import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/middleware';

// POST /api/user/quotes/accept  — user accepts a responded quote
export async function POST(request: NextRequest) {
    try {
        const payload = await verifyAuth(request);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.sub;
        const { quoteId } = await request.json();

        if (!quoteId) {
            return NextResponse.json({ error: 'quoteId is required' }, { status: 400 });
        }

        const supabase = createClient();

        // Find the quote and verify ownership
        const { data: quote, error: fetchError } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (fetchError || !quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (quote.user_id && quote.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (quote.status !== 'responded') {
            return NextResponse.json({ error: 'Quote is not in a responded state' }, { status: 400 });
        }

        if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
            return NextResponse.json({ error: 'Quote has expired' }, { status: 400 });
        }

        const { data: updated, error: updateError } = await supabase
            .from('quote_requests')
            .update({ 
                status: 'accepted', 
                accepted_at: new Date().toISOString() 
            })
            .eq('id', quoteId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ quote: updated });
    } catch (error: any) {
        console.error('Error accepting quote:', error);
        return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 });
    }
}

// DELETE /api/user/quotes/decline
export async function DELETE(request: NextRequest) {
    try {
        const payload = await verifyAuth(request);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.sub;
        const { quoteId } = await request.json();

        if (!quoteId) {
            return NextResponse.json({ error: 'quoteId is required' }, { status: 400 });
        }

        const supabase = createClient();

        const { data: quote, error: fetchError } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (fetchError || !quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (quote.user_id && quote.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: updated, error: updateError } = await supabase
            .from('quote_requests')
            .update({ status: 'cancelled' })
            .eq('id', quoteId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ quote: updated });
    } catch (error: any) {
        console.error('Error declining quote:', error);
        return NextResponse.json({ error: 'Failed to decline quote' }, { status: 500 });
    }
}
