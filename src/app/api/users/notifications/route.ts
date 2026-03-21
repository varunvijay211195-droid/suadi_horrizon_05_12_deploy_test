import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/middleware';

// GET /api/users/notifications - Get notification preferences
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const { data: dbUser, error } = await supabase
            .from('users')
            .select('notification_preferences')
            .eq('id', user.sub)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(dbUser.notification_preferences || {
            orderUpdates: true,
            promotionalEmails: false,
            smsNotifications: true,
            pushNotifications: true,
            newsletter: false,
            newProducts: true,
            priceAlerts: true
        });
    } catch (error: unknown) {
        console.error('Error fetching notification preferences:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notification preferences' },
            { status: 500 }
        );
    }
}

// PUT /api/users/notifications - Update notification preferences
export async function PUT(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const body = await request.json();
        const {
            orderUpdates,
            promotionalEmails,
            smsNotifications,
            pushNotifications,
            newsletter,
            newProducts,
            priceAlerts
        } = body;

        // Get current preferences
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('notification_preferences')
            .eq('id', user.sub)
            .single();

        if (fetchError) {
            console.error('Error fetching user:', fetchError);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const currentPrefs = currentUser.notification_preferences || {};

        // Update notification preferences
        const updatedPreferences = {
            orderUpdates: orderUpdates !== undefined ? orderUpdates : currentPrefs.orderUpdates ?? true,
            promotionalEmails: promotionalEmails !== undefined ? promotionalEmails : currentPrefs.promotionalEmails ?? false,
            smsNotifications: smsNotifications !== undefined ? smsNotifications : currentPrefs.smsNotifications ?? true,
            pushNotifications: pushNotifications !== undefined ? pushNotifications : currentPrefs.pushNotifications ?? true,
            newsletter: newsletter !== undefined ? newsletter : currentPrefs.newsletter ?? false,
            newProducts: newProducts !== undefined ? newProducts : currentPrefs.newProducts ?? true,
            priceAlerts: priceAlerts !== undefined ? priceAlerts : currentPrefs.priceAlerts ?? true
        };

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ notification_preferences: updatedPreferences })
            .eq('id', user.sub)
            .select('notification_preferences')
            .single();

        if (updateError) {
            console.error('Error updating notification preferences:', updateError);
            return NextResponse.json(
                { error: 'Failed to update notification preferences' },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedUser.notification_preferences);
    } catch (error: unknown) {
        console.error('Error updating notification preferences:', error);
        return NextResponse.json(
            { error: 'Failed to update notification preferences' },
            { status: 500 }
        );
    }
}
