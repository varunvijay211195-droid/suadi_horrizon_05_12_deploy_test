import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET — Single invoice
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authResult = await verifyAdminToken(req);
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
            invoiceNumber: invoice.invoice_number,
            sourceType: invoice.source_type,
            sourceId: invoice.source_id,
            vatRate: invoice.vat_rate,
            vatAmount: invoice.vat_amount,
            totalAmount: invoice.total_amount,
            dueDate: invoice.due_date,
            paidAt: invoice.paid_at,
            createdBy: invoice.created_by,
            sentAt: invoice.sent_at,
            createdAt: invoice.created_at,
            updatedAt: invoice.updated_at,
            items: (invoice.invoice_items || []).map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                total: item.total
            }))
        };

        return NextResponse.json({ invoice: formattedInvoice });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH — Update invoice status or fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authResult = await verifyAdminToken(req);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await req.json();

        const updateData: any = {};
        if (body.status) updateData.status = body.status;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.dueDate) updateData.due_date = body.dueDate;
        if (body.status === 'paid') updateData.paid_at = new Date().toISOString();
        if (body.status === 'sent') updateData.sent_at = new Date().toISOString();

        const supabase = createClient();
        const { data: invoice, error } = await supabase
            .from('invoices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116' || error.code === '404') {
                return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ invoice });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Remove invoice
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authResult = await verifyAdminToken(req);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const supabase = createClient();
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === 'PGRST116' || error.code === '404') {
                return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ message: 'Invoice deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
