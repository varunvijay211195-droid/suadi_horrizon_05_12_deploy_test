import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/middleware';

// PUT /api/users/addresses/[id] - Update an address
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);
        const { id } = await params;

        const body = await request.json();
        const { name, fullName, address, city, state, zipCode, country, phone, isDefault } = body;

        // Verify the address belongs to the user
        const { data: existingAddress, error: fetchError } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.sub)
            .single();

        if (fetchError || !existingAddress) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        // If setting as default, unset other defaults first
        if (isDefault) {
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', user.sub);
        }

        // Update address
        const { data: updatedAddress, error: updateError } = await supabase
            .from('user_addresses')
            .update({
                name: name || existingAddress.name,
                full_name: fullName || existingAddress.full_name,
                address: address || existingAddress.address,
                city: city || existingAddress.city,
                state: state || existingAddress.state,
                zip_code: zipCode || existingAddress.zip_code,
                country: country || existingAddress.country,
                phone: phone || existingAddress.phone,
                is_default: isDefault !== undefined ? isDefault : existingAddress.is_default
            })
            .eq('id', id)
            .eq('user_id', user.sub)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating address:', updateError);
            return NextResponse.json(
                { error: 'Failed to update address' },
                { status: 500 }
            );
        }

        const formattedAddress = {
            _id: updatedAddress.id,
            id: updatedAddress.id,
            name: updatedAddress.name,
            fullName: updatedAddress.full_name,
            address: updatedAddress.address,
            city: updatedAddress.city,
            state: updatedAddress.state,
            zipCode: updatedAddress.zip_code,
            country: updatedAddress.country,
            phone: updatedAddress.phone,
            isDefault: updatedAddress.is_default,
            createdAt: updatedAddress.created_at,
            updatedAt: updatedAddress.updated_at
        };

        return NextResponse.json(formattedAddress);
    } catch (error: unknown) {
        console.error('Error updating address:', error);
        return NextResponse.json(
            { error: 'Failed to update address' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/addresses/[id] - Delete an address
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);
        const { id } = await params;

        // Verify the address belongs to the user and gets its details
        const { data: addressToDelete, error: fetchError } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.sub)
            .single();

        if (fetchError || !addressToDelete) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        // Delete address
        const { error: deleteError } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', id)
            .eq('user_id', user.sub);

        if (deleteError) {
            console.error('Error deleting address:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete address' },
                { status: 500 }
            );
        }

        // If deleted address was default, set first remaining as default
        if (addressToDelete.is_default) {
            const { data: remainingAddresses, error: remainingError } = await supabase
                .from('user_addresses')
                .select('id')
                .eq('user_id', user.sub)
                .order('created_at', { ascending: false })
                .limit(1);

            if (!remainingError && remainingAddresses && remainingAddresses.length > 0) {
                await supabase
                    .from('user_addresses')
                    .update({ is_default: true })
                    .eq('id', remainingAddresses[0].id)
                    .eq('user_id', user.sub);
            }
        }

        return NextResponse.json({ message: 'Address deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting address:', error);
        return NextResponse.json(
            { error: 'Failed to delete address' },
            { status: 500 }
        );
    }
}
