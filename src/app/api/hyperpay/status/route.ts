import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const resourcePath = searchParams.get('resourcePath');

        if (!resourcePath) {
            return NextResponse.json({ error: 'Missing resourcePath' }, { status: 400 });
        }

        // Build the URL: baseUrl + resourcePath
        const url = `${process.env.HYPERPAY_BASE_URL}${resourcePath}`;
        const params = new URLSearchParams();
        params.append('entityId', process.env.HYPERPAY_ENTITY_ID!);

        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();

        // HyperPay success result codes pattern
        const successPattern = /^(000\.000\.|000\.100\.1|000\.[36])/;
        const isSuccess = successPattern.test(data.result?.code || '');

        // If successful, check if it's an invoice payment and update status
        if (isSuccess && data.merchantTransactionId?.startsWith('INV-')) {
            const invoiceId = data.merchantTransactionId.replace('INV-', '');
            const { createClient } = await import('@/lib/supabase/server');
            const supabase = createClient();

            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    notes: `Paid via HyperPay. Payment ID: ${data.id}`
                })
                .eq('id', invoiceId);

            if (error) {
                console.error('Failed to update invoice status:', error);
            }
            console.log(`Invoice ${invoiceId} marked as paid.`);
        }

        return NextResponse.json({
            success: isSuccess,
            paymentId: data.id,
            amount: data.amount,
            currency: data.currency,
            brand: data.paymentBrand,
            resultCode: data.result?.code,
            resultDescription: data.result?.description,
            merchantTransactionId: data.merchantTransactionId,
            error: isSuccess ? null : (data.result?.description || 'Payment was not successful'),
        });
    } catch (error: any) {
        console.error('HyperPay status verification error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
