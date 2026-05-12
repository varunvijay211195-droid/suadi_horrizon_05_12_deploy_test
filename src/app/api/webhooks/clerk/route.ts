import { NextResponse } from 'next/server';

// This webhook endpoint was previously used for Clerk auth events.
// With the migration to Supabase Auth, user creation/update is handled
// directly by Supabase triggers and the AuthContext.
// This route is kept as a placeholder and returns 200.

export async function POST() {
    return NextResponse.json({ message: 'Webhook endpoint deprecated — using Supabase Auth' }, { status: 200 });
}
