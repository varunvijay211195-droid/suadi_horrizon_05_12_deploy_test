import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/middleware';

// GET /api/users/addresses - Get all addresses for the current user
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const { data: addresses, error } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', user.sub)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching addresses:', error);
            return NextResponse.json(
                { error: 'Failed to fetch addresses' },
                { status: 500 }
            );
        }

        const formattedAddresses = (addresses || []).map(a => ({
            _id: a.id,
            id: a.id,
            name: a.name,
            fullName: a.full_name,
            address: a.address,
            city: a.city,
            state: a.state,
            zipCode: a.zip_code,
            country: a.country,
            phone: a.phone,
            isDefault: a.is_default,
            createdAt: a.created_at,
            updatedAt: a.updated_at
        }));

        return NextResponse.json(formattedAddresses);
    } catch (error: unknown) {
        console.error('Error fetching addresses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch addresses' },
            { status: 500 }
        );
    }
}

// POST /api/users/addresses - Add a new address
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const body = await request.json();
        const { name, fullName, address, city, state, zipCode, country, phone, isDefault } = body;

        // Validate required fields
        if (!name || !fullName || !address || !city || !state || !zipCode || !country || !phone) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', user.sub);
        }

        // Check if this is the first address to make it default
        const { count } = await supabase
            .from('user_addresses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.sub);

        const { data: newAddress, error } = await supabase
            .from('user_addresses')
            .insert({
                user_id: user.sub,
                name,
                full_name: fullName,
                address,
                city,
                state,
                zip_code: zipCode,
                country,
                phone,
                is_default: isDefault || (count === 0)
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding address:', error);
            return NextResponse.json(
                { error: 'Failed to add address' },
                { status: 500 }
            );
        }

        const formattedAddress = {
            _id: newAddress.id,
            id: newAddress.id,
            name: newAddress.name,
            fullName: newAddress.full_name,
            address: newAddress.address,
            city: newAddress.city,
            state: newAddress.state,
            zipCode: newAddress.zip_code,
            country: newAddress.country,
            phone: newAddress.phone,
            isDefault: newAddress.is_default,
            createdAt: newAddress.created_at,
            updatedAt: newAddress.updated_at
        };

        return NextResponse.json(formattedAddress, { status: 201 });
    } catch (error: unknown) {
        console.error('Error adding address:', error);
        return NextResponse.json(
            { error: 'Failed to add address' },
            { status: 500 }
        );
    }
}
