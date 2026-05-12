import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDFServer } from '@/lib/invoices/generatePDFServer';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — Download invoice as PDF
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Support token in query string for direct browser downloads (window.open)
        const url = new URL(req.url);
        const queryToken = url.searchParams.get('token');
        let authResult;
        if (queryToken) {
            // Temporarily add token to header for verifyAdminToken
            const headers = new Headers(req.headers);
            headers.set('Authorization', `Bearer ${queryToken}`);
            const modifiedReq = new NextRequest(req.url, { headers });
            authResult = await verifyAdminToken(modifiedReq);
        } else {
            authResult = await verifyAdminToken(req);
        }
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const supabase = createClient();
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116' || error.code === '404') {
                return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            }
            throw error;
        }

        const formattedInvoice = {
            ...invoice,
            items: (invoice.invoice_items || []).map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                total: item.total
            }))
        };

        const pdfBuffer = await generateInvoicePDFServer({
            invoiceNumber: formattedInvoice.invoice_number || formattedInvoice.invoiceNumber,
            date: new Date(formattedInvoice.created_at || formattedInvoice.createdAt).toLocaleDateString('en-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            dueDate: formattedInvoice.due_date || formattedInvoice.dueDate
                ? new Date(formattedInvoice.due_date || formattedInvoice.dueDate).toLocaleDateString('en-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : undefined,
            customer: formattedInvoice.customer,
            items: formattedInvoice.items,
            subtotal: formattedInvoice.subtotal,
            vatRate: invoice.vat_rate || invoice.vatRate,
            vatAmount: invoice.vat_amount || invoice.vatAmount,
            totalAmount: invoice.total_amount || invoice.totalAmount,
            currency: invoice.currency,
            notes: invoice.notes,
            status: invoice.status,
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${invoice.invoice_number || invoice.invoiceNumber}.pdf"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });

    } catch (error: any) {
        console.error('CRITICAL PDF ERROR:', error);
        if (error.stack) console.error(error.stack);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
