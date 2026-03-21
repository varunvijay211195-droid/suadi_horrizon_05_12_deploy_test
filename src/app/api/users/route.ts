import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        await requireAuth(request); // Optional: check if requester is admin?

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role');

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' });

        // Apply filters
        if (role && role !== 'all') {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(
                `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
            );
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // Sort by created_at descending
        query = query.order('created_at', { ascending: false });

        const { data: users, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ message: error.message }, { status: 500 });
        }

        // Format to match old Mongoose response
        const formattedUsers = (users || []).map(user => ({
            _id: user.id,
            id: user.id,
            email: user.email,
            role: user.role,
            profile: {
                 name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                 phone: user.phone || '',
                 company: user.company || ''
            },
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at,
            totalSpent: user.total_spent || 0,
            totalOrders: user.total_orders || 0,
            segment: user.segment || 'new'
        }));

        return NextResponse.json({
            users: formattedUsers,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { message: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // We use the service role key to create a user directly bypassing standard email verification if needed
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        if (!supabaseServiceKey) {
             console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
             return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const body = await request.json();
        const { name, email, password, role } = body;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields: name, email, password' },
                { status: 400 }
            );
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: role || 'user'
            }
        });

        if (authError) {
            console.error('Supabase auth error:', authError);
            if (authError.message.includes('already exists')) {
                return NextResponse.json(
                    { message: 'User with this email already exists' },
                    { status: 400 }
                );
            }
            return NextResponse.json({ message: authError.message }, { status: 500 });
        }

        if (!authData.user) {
            return NextResponse.json({ message: 'Failed to create user in Auth' }, { status: 500 });
        }

        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Create user profile in public.users
        const { data: userRecord, error: dbError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: authData.user.id,
                email: authData.user.email,
                first_name: firstName,
                last_name: lastName,
                role: (role as 'user' | 'admin') || 'user',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dbError) {
             console.error('Supabase DB error:', dbError);
             // Note: in a real robust system, we might delete the auth user if this fails, or use a trigger
             return NextResponse.json({ message: dbError.message }, { status: 500 });
        }

        // Return formatted user
        const userResponse = {
            _id: userRecord.id,
            id: userRecord.id,
            email: userRecord.email,
            role: userRecord.role,
            profile: {
                name: `${userRecord.first_name || ''} ${userRecord.last_name || ''}`.trim()
            },
            createdAt: userRecord.created_at
        };

        return NextResponse.json(userResponse, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { message: 'Failed to create user' },
            { status: 500 }
        );
    }
}
