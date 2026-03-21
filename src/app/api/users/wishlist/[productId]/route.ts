import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/middleware';

// DELETE /api/users/wishlist/[productId] - Remove a product from wishlist
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const supabase = createClient();
        const user = await requireAuth(request);

        const { productId } = await params;

        const { data: dbUser, error: fetchError } = await supabase
            .from('users')
            .select('wishlist')
            .eq('id', user.sub)
            .single();

        if (fetchError || !dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        let currentWishlist = dbUser.wishlist || [];

        if (currentWishlist.includes(productId)) {
            currentWishlist = currentWishlist.filter((id: string) => id !== productId);
            
            const { error: updateError } = await supabase
                .from('users')
                .update({ wishlist: currentWishlist })
                .eq('id', user.sub);
                
            if (updateError) {
                console.error('Error updating wishlist:', updateError);
                return NextResponse.json(
                    { error: 'Failed to remove from wishlist' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(currentWishlist);
    } catch (error: unknown) {
        console.error('Error removing from wishlist:', error);
        return NextResponse.json(
            { error: 'Failed to remove from wishlist' },
            { status: 500 }
        );
    }
}
