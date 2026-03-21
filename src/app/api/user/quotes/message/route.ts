import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/middleware';

// POST /api/user/quotes/message — user sends a reply
export async function POST(request: NextRequest) {
    try {
        const payload = await verifyAuth(request);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.sub;
        const { quoteId, text } = await request.json();

        if (!quoteId || !text) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const supabase = createClient();

        // Find the quote and verify ownership
        const { data: quote, error: fetchError } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (fetchError || !quote) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (quote.user_id && quote.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Append to messages array
        const messages = Array.isArray(quote.messages) ? quote.messages : [];
        const newMessage = {
            sender: 'user',
            text,
            createdAt: new Date().toISOString()
        };

        const { data: updated, error: updateError } = await supabase
            .from('quote_requests')
            .update({
                messages: [...messages, newMessage]
            })
            .eq('id', quoteId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error sending quote message:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
