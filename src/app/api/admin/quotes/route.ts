import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('quote_requests')
            .select('*', { count: 'exact' });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: quotes, count: total, error: fetchError } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (fetchError) throw fetchError;

        return NextResponse.json({
            quotes: (quotes || []).map(q => ({
                ...q,
                _id: q.id,
                createdAt: q.created_at,
                updatedAt: q.updated_at,
                companyName: q.company_name,
                contactPerson: q.contact_person,
                quotedPrice: q.quoted_price,
                validUntil: q.valid_until,
                adminResponse: q.admin_response
            })),
            total,
            page,
            totalPages: Math.ceil((total || 0) / limit)
        });
    } catch (error: any) {
        console.error('Error fetching quotes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quote requests' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await request.json();
        const { id, status, adminResponse, quotedPrice, validUntil } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: 'ID and status are required' },
                { status: 400 }
            );
        }

        // Fetch current quote to update messages array
        const { data: quote, error: getError } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (getError || !quote) {
            return NextResponse.json(
                { error: 'Quote request not found' },
                { status: 404 }
            );
        }

        const messages = Array.isArray(quote.messages) ? [...quote.messages] : [];
        if (adminResponse) {
            messages.push({
                sender: 'admin',
                text: adminResponse,
                createdAt: new Date().toISOString()
            });
        }

        const updateData: any = {
            status,
            messages,
            admin_response: adminResponse || quote.admin_response,
            updated_at: new Date().toISOString()
        };

        if (quotedPrice !== undefined) updateData.quoted_price = quotedPrice;
        if (validUntil) {
            updateData.valid_until = new Date(validUntil).toISOString();
        } else if (validUntil === '') {
            updateData.valid_until = null;
        }

        const { data: updatedQuote, error: updateError } = await supabase
            .from('quote_requests')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({
            ...updatedQuote,
            _id: updatedQuote.id,
            createdAt: updatedQuote.created_at,
            updatedAt: updatedQuote.updated_at,
            companyName: updatedQuote.company_name,
            contactPerson: updatedQuote.contact_person,
            quotedPrice: updatedQuote.quoted_price,
            validUntil: updatedQuote.valid_until,
            adminResponse: updatedQuote.admin_response
        });
    } catch (error: any) {
        console.error('Error updating quote:', error);
        return NextResponse.json(
            { error: 'Failed to update quote request' },
            { status: 500 }
        );
    }
}
