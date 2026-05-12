import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET — List all invoices (with optional filters)
export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAdminToken(req);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const supabase = createClient();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const sourceType = searchParams.get('sourceType');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Build base query for count and data
        const applyFilters = (query: any) => {
            if (status && status !== 'all') {
                query = query.eq('status', status);
            }
            if (sourceType && sourceType !== 'all') {
                query = query.eq('source_type', sourceType);
            }
            if (search) {
                const term = `%${search}%`;
                query = query.or(
                    `invoice_number.ilike.${term},customer->>name.ilike.${term},customer->>company.ilike.${term},customer->>email.ilike.${term}`
                );
            }
            return query;
        };

        const { count, error: countError } = await applyFilters(
            supabase.from('invoices').select('id', { count: 'exact', head: true })
        );

        if (countError) {
            console.error('Error counting invoices:', countError);
            return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
        }

        const { data: invoices, error: invoicesError } = await applyFilters(
            supabase
                .from('invoices')
                .select('*, invoice_items(*)')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
        );

        if (invoicesError) {
            console.error('Error fetching invoices:', invoicesError);
            return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
        }

        const formattedInvoices = (invoices || []).map((inv: any) => ({
            ...inv,
            invoiceNumber: inv.invoice_number,
            sourceType: inv.source_type,
            sourceId: inv.source_id,
            vatRate: inv.vat_rate,
            vatAmount: inv.vat_amount,
            totalAmount: inv.total_amount,
            dueDate: inv.due_date,
            paidAt: inv.paid_at,
            createdBy: inv.created_by,
            sentAt: inv.sent_at,
            createdAt: inv.created_at,
            updatedAt: inv.updated_at,
            items: (inv.invoice_items || []).map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                total: item.total
            }))
        }));

        return NextResponse.json({
            invoices: formattedInvoices,
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create a new invoice from an order or quote
export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAdminToken(req);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const supabase = createClient();
        const body = await req.json();
        const { sourceType, sourceId, items, notes, dueDate, vatRate = 15 } = body;

        if (!sourceType || !sourceId) {
            return NextResponse.json({ error: 'sourceType and sourceId are required' }, { status: 400 });
        }

        // Get customer info from source
        let customer: any = {};
        let derivedItems: any[] | undefined = items;

        if (sourceType === 'order') {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('*, users!inner(email, profile)')
                .eq('id', sourceId)
                .single();

            if (orderError || !order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            const user = order.users;
            const shippingAddress = order.shipping_address || {};

            customer = {
                name: shippingAddress.name || user?.profile?.name || user?.email || 'Customer',
                company: shippingAddress.company || '',
                email: shippingAddress.email || user?.email || '',
                phone: shippingAddress.phone || '',
                address: [
                    shippingAddress.street1,
                    shippingAddress.street2,
                    shippingAddress.city,
                    shippingAddress.state,
                    shippingAddress.zip,
                    shippingAddress.country,
                ].filter(Boolean).join(', '),
            };

            if (!derivedItems || derivedItems.length === 0) {
                const { data: orderItems, error: orderItemsError } = await supabase
                    .from('order_items')
                    .select('*, products(*)')
                    .eq('order_id', sourceId);

                if (orderItemsError) {
                    console.error('Error fetching order items:', orderItemsError);
                } else {
                    derivedItems = orderItems.map((item: any) => ({
                        description: item.name || item.products?.name || `Product (${item.product})`,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        total: item.quantity * item.price,
                    }));
                }
            }
        } else if (sourceType === 'quote') {
            const { data: quote, error: quoteError } = await supabase
                .from('quote_requests')
                .select('*')
                .eq('id', sourceId)
                .single();

            if (quoteError || !quote) {
                return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
            }

            customer = {
                name: quote.contact_person,
                company: quote.company_name,
                email: quote.email,
                phone: quote.phone,
            };

            if (!derivedItems || derivedItems.length === 0) {
                const quotedPrice = quote.quoted_price || 0;
                derivedItems = [{
                    description: quote.items || 'Quoted Items',
                    quantity: 1,
                    unitPrice: quotedPrice,
                    total: quotedPrice,
                }];
            }
        }

        // Calculate totals
        const invoiceItems = derivedItems || [];
        const subtotal = invoiceItems.reduce(
            (sum: number, item: any) => sum + (item.total || item.quantity * item.unitPrice),
            0
        );
        const vatAmount = Math.round((subtotal * vatRate) / 100 * 100) / 100;
        const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

        // Generate invoice number manually to avoid middleware issues
        const year = new Date().getFullYear();
        const { count: existingCount, error: countError } = await supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .ilike('invoice_number', `INV-${year}-%`);

        if (countError) {
            console.error('Error counting invoices:', countError);
            return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
        }

        const invoiceNumber = `INV-${year}-${String((existingCount || 0) + 1).padStart(4, '0')}`;

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                invoice_number: invoiceNumber,
                source_type: sourceType,
                source_id: sourceId,
                customer,
                subtotal,
                vat_rate: vatRate,
                vat_amount: vatAmount,
                total_amount: totalAmount,
                currency: 'SAR',
                status: 'draft',
                notes,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                created_by: authResult.user?.id,
            })
            .select()
            .single();

        if (invoiceError || !invoice) {
            console.error('Error creating invoice:', invoiceError);
            return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
        }

        if (invoiceItems && invoiceItems.length > 0) {
            const dbItems = invoiceItems.map((item: any) => ({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.total
            }));
            const { error: itemsError } = await supabase.from('invoice_items').insert(dbItems);
            if (itemsError) {
                console.error('Error inserting invoice items:', itemsError);
            }
        }

        invoice.items = invoiceItems;

        return NextResponse.json({ invoice }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating invoice:', error);
        import('fs').then(fs => fs.writeFileSync('c:\\Users\\vv\\Desktop\\saudi_horizon_fresh\\scratch\\invoice_error.txt', error.stack || error.message || String(error)));
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
