import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDFServer } from '@/lib/invoices/generatePDFServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — Download invoice as PDF (Public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = createClient();

        // Find invoice - no auth required for public view if they have the ID
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('id', id)
            .single();

        if (error || !invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const items = (invoice.invoice_items || []).map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            total: item.total
        }));

        const pdfBuffer = await generateInvoicePDFServer({
            invoiceNumber: invoice.invoice_number,
            date: new Date(invoice.created_at).toLocaleDateString('en-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            dueDate: invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString('en-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })
                : undefined,
            customer: invoice.customer,
            items: items,
            subtotal: invoice.subtotal,
            vatRate: invoice.vat_rate,
            vatAmount: invoice.vat_amount,
            totalAmount: invoice.total_amount,
            currency: invoice.currency,
            notes: invoice.notes,
            status: invoice.status,
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });
    } catch (error: unknown) {
        console.error('Public PDF error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
