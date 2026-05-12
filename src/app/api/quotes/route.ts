import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyQuoteRequest } from '@/lib/notifications/adminNotifications';
import { sendQuoteConfirmationEmail } from '@/lib/notifications/userNotifications';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();

        const { companyName, contactPerson, phone, email, projectType, items, quantities, timeline, notes } = body;

        // Try to get userId from token if present
        let userId: string | undefined;
        try {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const payload = verifyAccessToken(token);
                userId = payload.sub;
                console.log('Quote Request: Authenticated user found:', userId);
            } else {
                console.log('Quote Request: No Bearer token found in header');
            }
        } catch (error: unknown) {
            console.error('Quote Request: Token verification failed:', error);
            // Token invalid or missing, continue as guest
        }

        if (!companyName || !contactPerson || !phone || !email || !items) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data: quoteRequest, error } = await supabase
            .from('quote_requests')
            .insert({
                user_id: userId,
                company_name: companyName,
                contact_person: contactPerson,
                phone,
                email,
                project_type: projectType,
                items,
                quantities,
                timeline,
                notes,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating quote request:', error);
            return NextResponse.json(
                { error: 'Failed to create quote request' },
                { status: 500 }
            );
        }

        // Trigger admin notification in background (non-blocking)
        notifyQuoteRequest(companyName, contactPerson, { email, phone, items })
            .catch(err => console.error('Background admin notification failed:', err));

        // Trigger user confirmation email in background (non-blocking)
        sendQuoteConfirmationEmail(email, contactPerson, quoteRequest.id, companyName)
            .catch(err => console.error('Background user notification failed:', err));

        return NextResponse.json(
            { message: 'Quote request submitted successfully', id: quoteRequest.id },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Error submitting quote request:', error);
        return NextResponse.json(
            { error: 'Failed to submit quote request' },
            { status: 500 }
        );
    }
}
