import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const now = new Date().toISOString();

        const supabase = createClient();

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('reset_password_token', hashedToken)
            .gt('reset_password_expires', now)
            .single();

        if (!user || userError) {
            return NextResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                reset_password_token: null,
                reset_password_expires: null
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}