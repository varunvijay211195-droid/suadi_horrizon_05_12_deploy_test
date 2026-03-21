import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/middleware';

// GET — Single invoice
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createClient();
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
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

// PATCH — Update invoice status or fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
