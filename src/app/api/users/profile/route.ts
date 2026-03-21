import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const { data: dbUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.sub)
            .single();

        if (error || !dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            email: dbUser.email,
            name: dbUser.first_name ? `${dbUser.first_name} ${dbUser.last_name || ''}`.trim() : '',
            phone: dbUser.phone || '',
            company: dbUser.company || '',
            role: dbUser.role || 'user',
            createdAt: dbUser.created_at,
            lastLoginAt: dbUser.last_login_at,
            totalSpent: dbUser.total_spent || 0,
            totalOrders: dbUser.total_orders || 0,
            segment: dbUser.segment || 'new',
            preferredCategories: dbUser.preferred_categories || [],
            preferredBrands: dbUser.preferred_brands || [],
            purchaseHistory: dbUser.purchase_history || []
        });
    } catch (error: unknown) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const body = await request.json();
        const { name, phone, company, currentPassword, newPassword } = body;

        // Verify user exists in public.users
        const { data: dbUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.sub)
            .single();

        if (fetchError || !dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Handle password update if provided
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: 'Current password is required to set a new password' },
                    { status: 400 }
                );
            }

            // Note: Since we are in the backend and requireAuth confirms the token is valid,
            // we could theoretically just update the password. But to verify the currentPassword,
            // we need to attempt a re-login with the current password.
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: dbUser.email,
                password: currentPassword
            });

            if (signInError) {
                return NextResponse.json(
                    { error: 'Current password is incorrect' },
                    { status: 400 }
                );
            }

            // Update the password
            const { error: updatePasswordError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updatePasswordError) {
                console.error('Error updating password:', updatePasswordError);
                return NextResponse.json(
                    { error: 'Failed to update password' },
                    { status: 500 }
                );
            }
        }

        // Update public profile details
        const updateData: Record<string, unknown> = {};
        
        if (name !== undefined) {
             const nameParts = name.trim().split(' ');
             updateData.first_name = nameParts[0] || '';
             updateData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        }
        if (phone !== undefined) updateData.phone = phone;
        if (company !== undefined) updateData.company = company;

        // Only update if there are changes
        let updatedProfile = dbUser;
        if (Object.keys(updateData).length > 0) {
            const { data: updated, error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.sub)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating public user:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update profile details' },
                    { status: 500 }
                );
            }
            updatedProfile = updated;
        }

        return NextResponse.json({
            message: 'Profile updated successfully',
            email: updatedProfile.email,
            name: updatedProfile.first_name ? `${updatedProfile.first_name} ${updatedProfile.last_name || ''}`.trim() : '',
            phone: updatedProfile.phone || '',
            company: updatedProfile.company || ''
        });
    } catch (error: unknown) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
