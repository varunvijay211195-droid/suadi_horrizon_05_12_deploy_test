import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();

        // Simple query to warm up the connection
        const { error } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .limit(1);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            status: 'ok',
            message: 'Database connection warmed up'
        });
    } catch (error) {
        console.error('Database warmup failed:', error);
        return NextResponse.json(
            { status: 'error', message: 'Database warmup failed' },
            { status: 500 }
        );
    }
}
