import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Retrieve cookie consent settings and statistics
export async function GET() {
    try {
        const supabase = createClient();

        // Get settings (or create default if not exists)
        let { data: settings, error: settingsError } = await supabase
            .from('cookie_settings')
            .select('*')
            .single();

        if (settingsError && settingsError.code === 'PGRST116') {
            // No settings found, create default
            const { data: newSettings, error: insertError } = await supabase
                .from('cookie_settings')
                .insert({
                    enabled: true,
                    necessary_only: false,
                    analytics: true,
                    marketing: false,
                    position: 'bottom',
                    expiration: 365,
                    last_updated: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating default settings:', insertError);
            } else {
                settings = newSettings;
            }
        } else if (settingsError) {
            console.error('Error fetching settings:', settingsError);
        }

        // Calculate statistics from the database
        const { count: totalConsents, error: _totalError } = await supabase
            .from('cookie_consent_records')
            .select('*', { count: 'exact', head: true });

        if (_totalError) console.error('Error counting total consents:', _totalError);

        const { count: analyticsOptIns, error: _analyticsError } = await supabase
            .from('cookie_consent_records')
            .select('*', { count: 'exact', head: true })
            .eq('categories->analytics', true);

        if (_analyticsError) console.error('Error counting analytics opt-ins:', _analyticsError);

        const { count: marketingOptIns, error: _marketingError } = await supabase
            .from('cookie_consent_records')
            .select('*', { count: 'exact', head: true })
            .eq('categories->marketing', true);
            
        if (_marketingError) console.error('Error counting marketing opt-ins:', _marketingError);

        const optInCount = (analyticsOptIns || 0) + (marketingOptIns || 0);
        const acceptanceRate = (totalConsents || 0) > 0
            ? Math.round((optInCount / (totalConsents || 0)) * 100)
            : 0;

        return NextResponse.json({
            settings,
            statistics: {
                totalConsents: totalConsents || 0,
                analyticsOptIns: analyticsOptIns || 0,
                marketingOptIns: marketingOptIns || 0,
                acceptanceRate,
            }
        });
    } catch (error) {
        console.error('Error getting cookie consent data:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve data' },
            { status: 500 }
        );
    }
}

// POST - Update cookie consent settings (admin)
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();

        const { data: settings, error } = await supabase
            .from('cookie_settings')
            .upsert({
                ...body,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving cookie consent settings:', error);
            return NextResponse.json(
                { error: 'Failed to save settings' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error saving cookie consent settings:', error);
        return NextResponse.json(
            { error: 'Failed to save settings' },
            { status: 500 }
        );
    }
}

// PUT - Record a new consent (from frontend)
export async function PUT(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();

        const { data: record, error } = await supabase
            .from('cookie_consent_records')
            .insert({
                consent_id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                categories: {
                    necessary: body.necessary ?? true,
                    analytics: body.analytics ?? false,
                    marketing: body.marketing ?? false,
                    preferences: body.preferences ?? false,
                },
                user_agent: request.headers.get('user-agent') || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error recording consent:', error);
            return NextResponse.json(
                { error: 'Failed to record consent' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            record
        });
    } catch (error) {
        console.error('Error recording consent:', error);
        return NextResponse.json(
            { error: 'Failed to record consent' },
            { status: 500 }
        );
    }
}

// DELETE - Reset all consent data (admin)
export async function DELETE() {
    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('cookie_consent_records')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

        if (error) {
            console.error('Error resetting consent data:', error);
            return NextResponse.json(
                { error: 'Failed to reset data' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'All consent records have been reset'
        });
    } catch (error) {
        console.error('Error resetting consent data:', error);
        return NextResponse.json(
            { error: 'Failed to reset data' },
            { status: 500 }
        );
    }
}
