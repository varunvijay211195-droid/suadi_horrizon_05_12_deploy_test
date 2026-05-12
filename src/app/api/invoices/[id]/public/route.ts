import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createClient();

        if (!id) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
        }

        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('id', id)
            .single();

        if (error || !invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Return a sanitized version of the invoice for public view
        return NextResponse.json({
            ...invoice,
            _id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            vatRate: invoice.vat_rate,
            vatAmount: invoice.vat_amount,
            totalAmount: invoice.total_amount,
            dueDate: invoice.due_date,
            paidAt: invoice.paid_at,
            createdAt: invoice.created_at,
            items: (invoice.invoice_items || []).map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                total: item.total
            }))
        });

    } catch (error: unknown) {
        console.error('Public invoice fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
