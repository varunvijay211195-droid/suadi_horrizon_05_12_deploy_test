'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Package, MapPin, Settings, Bell, Heart,
    Undo2, Trash2, ShoppingCart, ChevronRight, ArrowRight,
    ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { getProducts, Product } from '@/api/products';
import { addToCart } from '@/api/cart';
import { toast } from 'sonner';

export default function WishlistPage() {
    const router = useRouter();
    const { isAuthenticated, user, isInitialized } = useAuth();
    const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.push('/login?redirect=/account/wishlist');
        }
    }, [isAuthenticated, isInitialized, router]);

    // Fetch products that are in wishlist
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // If the user has wishlist items in the context but hasn't fetched them yet
                const res = await getProducts({ limit: 1000 });
                setProducts(res.products.filter(p => wishlistItems.includes(p.id)));
            } catch (error) {
                console.error('Error fetching products:', error);
                toast.error('Failed to load wishlist products');
            } finally {
                setIsLoading(false);
            }
        };

        if (wishlistItems.length > 0) {
            fetchProducts();
        } else {
            setProducts([]);
            setIsLoading(false);
        }
    }, [wishlistItems]);

    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: typeof product.image === 'object' ? (product.image?.url || '') : (product.image || ''),
            sku: product.sku,
            type: 'product',
        });
        removeFromWishlist(product.id);
        toast.success(`${product.name} added to cart`);
    };

    if (!isInitialized || !isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-navy text-white py-8 relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <Breadcrumb className="mb-8">
                    <BreadcrumbList className="text-slate-400">
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => router.push('/')} className="hover:text-gold transition-colors">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-slate-600" />
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => router.push('/account')} className="hover:text-gold transition-colors">Account</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-slate-600" />
                        <BreadcrumbPage className="text-gold font-medium">Wishlist</BreadcrumbPage>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="glass border-white/5">
                            <CardHeader className="pb-4">
                                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-gold" />
                                </div>
                                <CardTitle className="text-center text-white font-display">{user?.name || 'Customer'}</CardTitle>
                                <p className="text-sm text-slate-400 text-center">{user?.email || 'customer@example.com'}</p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account')}>
                                    <User className="w-4 h-4 mr-2" />
                                    Overview
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/orders')}>
                                    <Package className="w-4 h-4 mr-2" />
                                    Orders
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-gold bg-white/5" onClick={() => router.push('/account/wishlist')}>
                                    <Heart className="w-4 h-4 mr-2" />
                                    Wishlist
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/returns')}>
                                    <Undo2 className="w-4 h-4 mr-2" />
                                    Returns
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/addresses')}>
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Addresses
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/settings')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/notifications')}>
                                    <Bell className="w-4 h-4 mr-2" />
                                    Notifications
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h1 className="text-3xl font-bold font-display text-white">My Wishlist</h1>
                                {products.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        onClick={() => {
                                            clearWishlist();
                                            toast.success('Wishlist cleared');
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear All
                                    </Button>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : products.length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <AnimatePresence mode="popLayout">
                                        {products.map((product) => (
                                            <motion.div
                                                key={product.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Card className="glass border-white/5 hover:border-gold/30 transition-all overflow-hidden group">
                                                    <CardContent className="p-0">
                                                        <div className="flex">
                                                            {/* Product Image */}
                                                            <div className="w-32 h-32 bg-white/5 relative flex-shrink-0">
                                                                <img
                                                                    src={typeof product.image === 'object' ? (product.image?.url || '/images/placeholder.svg') : (product.image || '/images/placeholder.svg')}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <button
                                                                    onClick={() => removeFromWishlist(product.id)}
                                                                    className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            {/* Product Info */}
                                                            <div className="flex-1 p-4 flex flex-col justify-between">
                                                                <div>
                                                                    <p className="text-[10px] text-gold/80 uppercase tracking-widest font-bold mb-1">
                                                                        {product.brand || 'Premium'}
                                                                    </p>
                                                                    <h3 className="font-semibold text-white line-clamp-2 text-sm group-hover:text-gold transition-colors leading-snug">
                                                                        {product.name}
                                                                    </h3>
                                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                                        SKU: {product.sku}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                                                    <div>
                                                                        <p className="text-lg font-bold text-white">
                                                                            KWD {product.price.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-white/5 hover:bg-gold hover:text-navy text-gold font-bold border-none h-8 px-3"
                                                                        onClick={() => handleAddToCart(product)}
                                                                        disabled={!product.in_stock}
                                                                    >
                                                                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                                                        Add
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Card className="glass border-white/5 py-16">
                                    <div className="text-center space-y-4">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 mb-4">
                                            <Heart className="w-10 h-10 text-gold" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Your wishlist is empty</h2>
                                        <p className="text-slate-400 max-w-sm mx-auto">
                                            Explore our premium collection and save your favorite items for later.
                                        </p>
                                        <Button
                                            className="bg-gold hover:bg-yellow text-navy font-bold px-8 mt-4"
                                            onClick={() => router.push('/products')}
                                        >
                                            Browse Catalog
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function X({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}
