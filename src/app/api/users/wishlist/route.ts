import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/middleware';

// GET /api/users/wishlist - Get user's wishlist (array of product IDs)
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const { data: dbUser, error } = await supabase
            .from('users')
            .select('wishlist')
            .eq('id', user.sub)
            .single();

        if (error) {
            // Handle "No rows found" error gracefully
            if (error.code === 'PGRST116') {
                console.log(`[Wishlist API] No user record found for ${user.sub}, returning empty wishlist`);
                return NextResponse.json([]);
            }
            console.error('Wishlist fetch error:', error);
            throw error;
        }

        if (!dbUser) {
            return NextResponse.json([]);
        }

        return NextResponse.json(dbUser.wishlist || []);
    } catch (error: any) {
        console.error('Error fetching wishlist:', error);
        
        const errorMessage = error?.message || 'Unknown error';
        const stack = error?.stack || '';
        
        console.error(`[Wishlist API] Details: ${errorMessage}`, stack);

        if (errorMessage === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        return NextResponse.json(
            { error: errorMessage, stack: process.env.NODE_ENV === 'development' ? stack : undefined },
            { status: 500 }
        );
    }
}

// POST /api/users/wishlist - Add a product to wishlist
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const body = await request.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        const { data: dbUser, error: fetchError } = await supabase
            .from('users')
            .select('wishlist')
            .eq('id', user.sub)
            .single();

        if (fetchError || !dbUser) {
            console.error('Wishlist fetch error (POST):', fetchError);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Add to wishlist if not already present
        const currentWishlist = dbUser.wishlist || [];
        
        if (!currentWishlist.includes(productId)) {
            const updatedWishlist = [...currentWishlist, productId];
            
            const { error: updateError } = await supabase
                .from('users')
                .update({ wishlist: updatedWishlist })
                .eq('id', user.sub);
                
            if (updateError) {
                console.error('Error updating wishlist:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update wishlist' },
                    { status: 500 }
                );
            }
            
            return NextResponse.json(updatedWishlist);
        }

        return NextResponse.json(currentWishlist);
    } catch (error: unknown) {
        console.error('Error adding to wishlist:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
