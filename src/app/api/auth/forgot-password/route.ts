import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/notifications/userNotifications';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const supabase = createClient();

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, profile, oauth_provider')
            .eq('email', email)
            .single();

        // For security, don't reveal if a user exists or not
        if (!user || userError || user.oauth_provider) {
            return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set expiry (1 hour)
        const expiresAt = new Date(Date.now() + 3600000).toISOString();

        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_password_token: hashedToken,
                reset_password_expires: expiresAt
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        const resetLink = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        await sendPasswordResetEmail(user.email, resetLink, user.profile?.name || 'User');

        return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}