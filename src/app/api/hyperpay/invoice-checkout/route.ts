import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Map payment brands to their respective entity IDs
function getEntityId(paymentBrand: string): string {
    switch (paymentBrand) {
        case 'TABBY':
            return process.env.HYPERPAY_TABBY_ENTITY_ID || process.env.HYPERPAY_ENTITY_ID!;
        case 'TAMARA':
            return process.env.HYPERPAY_TAMARA_ENTITY_ID || process.env.HYPERPAY_ENTITY_ID!;
        default:
            return process.env.HYPERPAY_ENTITY_ID!;
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { invoiceId, paymentBrand } = await request.json();

        if (!invoiceId) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
        }

        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (error || !invoice) {
            console.error('Invoice fetch error:', error);
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.status === 'paid') {
            return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
        }

        // Determine which entity ID to use
        const entityId = getEntityId(paymentBrand || 'VISA');

        // Prepare HyperPay checkout
        const params = new URLSearchParams();
        params.append('entityId', entityId);
        params.append('amount', invoice.totalAmount.toFixed(2));
        params.append('currency', invoice.currency || 'SAR');
        params.append('paymentType', 'DB');
        params.append('merchantTransactionId', `INV-${invoice.id}`); // Identify this as an invoice payment

        // Customer info
        if (invoice.customer?.email) {
            params.append('customer.email', invoice.customer.email);
        }
        if (invoice.customer?.name) {
            const names = invoice.customer.name.split(' ');
            params.append('customer.givenName', names[0]);
            if (names.length > 1) {
                params.append('customer.surname', names.slice(1).join(' '));
            }
        }

        const response = await fetch(
            `${process.env.HYPERPAY_BASE_URL}/v1/checkouts`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            }
        );

        const data = await response.json();

        if (data.id) {
            return NextResponse.json({
                checkoutId: data.id,
                totalAmount: invoice.totalAmount,
            });
        } else {
            console.error('HyperPay invoice checkout error:', data);
            return NextResponse.json(
                { error: data.result?.description || 'Failed to prepare payment' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Invoice checkout preparation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
