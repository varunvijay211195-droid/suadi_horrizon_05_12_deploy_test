import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();

        // Simple query to validate the Supabase connection
        const { error } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .limit(1);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            status: 'ok',
            message: 'Server is running',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Database connection failed',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
