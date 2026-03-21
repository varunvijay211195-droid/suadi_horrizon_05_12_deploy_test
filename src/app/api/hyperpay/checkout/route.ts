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
            // VISA, MASTER, AMEX, MADA, APPLEPAY, STC_PAY all use the default entity ID
            return process.env.HYPERPAY_ENTITY_ID!;
    }
}

export async function POST(request: NextRequest) {
    const supabase = createClient();

    try {
        const { items, shippingAddress, shippingMethod, paymentBrand } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
        }

        // Calculate total from DB (server-side price validation)
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const { data: dbProduct, error: productError } = await supabase
                .from('products')
                .select('id, name, price')
                .eq('id', item._id)
                .single();

            if (productError || !dbProduct) {
                return NextResponse.json({ error: `Product ${item._id} not found` }, { status: 404 });
            }

            subtotal += dbProduct.price * item.quantity;
            orderItems.push({
                productId: item._id,
                name: dbProduct.name,
                price: dbProduct.price,
                quantity: item.quantity,
            });
        }

        // Add shipping cost
        const shippingCost = shippingMethod === 'express' ? 15 : shippingMethod === 'overnight' ? 25 : 0;

        // Add 15% VAT
        const tax = subtotal * 0.15;
        const totalAmount = (subtotal + shippingCost + tax).toFixed(2);

        // Determine which entity ID to use based on payment brand
        const entityId = getEntityId(paymentBrand || 'VISA');

        // Prepare HyperPay checkout (server-to-server)
        const params = new URLSearchParams();
        params.append('entityId', entityId);
        params.append('amount', totalAmount);
        params.append('currency', 'SAR');
        params.append('paymentType', 'DB'); // Debit = immediate charge

        // Customer info (optional but recommended)
        if (shippingAddress?.email) {
            params.append('customer.email', shippingAddress.email);
        }
        if (shippingAddress?.firstName) {
            params.append('customer.givenName', shippingAddress.firstName);
        }
        if (shippingAddress?.lastName) {
            params.append('customer.surname', shippingAddress.lastName);
        }
        if (shippingAddress?.phone) {
            params.append('customer.phone', shippingAddress.phone);
        }

        // Billing address
        if (shippingAddress?.address) {
            params.append('billing.street1', shippingAddress.address);
        }
        if (shippingAddress?.city) {
            params.append('billing.city', shippingAddress.city);
        }
        if (shippingAddress?.country) {
            params.append('billing.country', shippingAddress.country === 'Saudi Arabia' ? 'SA' : shippingAddress.country);
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
                totalAmount,
                orderItems,
            });
        } else {
            console.error('HyperPay checkout preparation error:', data);
            return NextResponse.json(
                { error: data.result?.description || 'Failed to prepare payment' },
                { status: 500 }
            );
        }
    } catch (error: unknown) {
        console.error('HyperPay checkout error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
