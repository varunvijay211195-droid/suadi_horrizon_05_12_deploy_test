import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: settings, error } = await supabase
            .from('site_settings')
            .select('*');

        if (error) throw error;

        // Convert to key-value map
        const settingsMap: Record<string, any> = {};
        (settings || []).forEach((s: any) => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json({ settings: settingsMap });
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST /api/admin/settings - Save settings (upsert by key)
export async function POST(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await request.json();
        const { section, data } = body;

        if (!section || !data) {
            return NextResponse.json({ error: 'Missing section or data' }, { status: 400 });
        }

        // Upsert the settings section
        const { error } = await supabase
            .from('site_settings')
            .upsert({ 
                key: section, 
                value: data, 
                updated_at: new Date().toISOString() 
            }, { 
                onConflict: 'key' 
            });

        if (error) throw error;

        return NextResponse.json({ success: true, message: `${section} settings saved` });
    } catch (error: any) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
