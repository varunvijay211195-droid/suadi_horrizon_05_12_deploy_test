'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingCart, ArrowRight, Minus, Plus, Package, ShieldCheck, Truck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { getCart, removeFromCart, updateCartItem, clearCart, CartItem } from '@/api/cart';
import { toast } from 'sonner';
import { FloatingParticles, AnimatedConnector } from "@/components/effects/SceneEffects";

import { useSearchParams } from 'next/navigation';

function CartContent() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [mounted, setMounted] = useState(false);

    const searchParams = useSearchParams();
    const isSuccess = searchParams.get('success') === 'true';

    useEffect(() => {
        const loadCart = async () => {
            setMounted(true);
            try {
                const items = await getCart();
                setCartItems(items);
            } catch (error) {
                console.error('Failed to load cart:', error);
                setCartItems([]);
            }
        };

        loadCart();

        if (isSuccess) {
            const clearAndNotify = async () => {
                toast.success('Order Placed Successfully!', {
                    description: 'Your order has been confirmed. You will receive a confirmation email shortly.',
                });
                await clearCart();
                setCartItems([]);
                // Clean up the URL
                window.history.replaceState({}, '', '/cart');
            };
            clearAndNotify();
        }
    }, [isSuccess]);

    const handleRemoveItem = async (itemId: string) => {
        try {
            await removeFromCart(itemId);
            const updatedItems = await getCart();
            setCartItems(updatedItems);
            toast.success('Item Removed', {
                description: 'Item has been removed from your cart',
            });
        } catch (error) {
            console.error('Failed to remove item:', error);
            toast.error('Failed to remove item');
        }
    };

    const handleUpdateQuantity = async (itemId: string, quantity: number) => {
        if (quantity > 0) {
            try {
                await updateCartItem(itemId, quantity);
                const updatedItems = await getCart();
                setCartItems(updatedItems);
            } catch (error) {
                console.error('Failed to update quantity:', error);
                toast.error('Failed to update quantity');
            }
        }
    };

    const handleClearCart = () => {
        clearCart();
        setCartItems([]);
        toast.success('Cart Cleared', {
            description: 'All items have been removed from your cart',
        });
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.15; // Adjusted to 15% (common in some regions)
    const total = subtotal + tax;

    if (!mounted) return null;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="text-white pb-24 relative overflow-hidden min-h-[80vh]">
            {/* Ambient Background */}
            <FloatingParticles />

            <div className="container-premium relative z-10">
                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink onClick={() => router.push('/')} className="hover:text-gold cursor-pointer transition-colors text-slate-400 uppercase text-[10px] tracking-[0.2em] font-bold">HOME</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-slate-600" />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-gold uppercase text-[10px] tracking-[0.2em] font-bold underline underline-offset-4 decoration-gold/30">SHOPPING CART</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </motion.div>

                {/* Page Header */}
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-xl"
                    >
                        <span className="micro-label mb-4 block">YOUR CART</span>
                        <h1 className="text-5xl font-black mb-4 tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                            Review your <span className="text-gradient-gold">Cart.</span>
                        </h1>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-[0.2em]">
                            Total Items: <span className="text-gold">{cartItems.length}</span> | Status: <span className="text-emerald-500">READY FOR ORDER</span>
                        </p>
                    </motion.div>
                </div>

                <AnimatedConnector />

                {cartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                        {/* Cart Items List */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="lg:col-span-2 space-y-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.product_id}
                                        layout
                                        variants={itemVariants}
                                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                        className="card-premium group rounded-[2rem] border-white/5 bg-navy/40 backdrop-blur-md overflow-hidden"
                                    >
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                                            {/* Product Image */}
                                            <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
                                                <div className="absolute inset-0 bg-gold/5 blur-2xl group-hover:bg-gold/10 transition-all" />
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="relative z-10 w-full h-full object-cover rounded-2xl border border-white/10 shadow-2xl"
                                                />
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                                    <div>
                                                        <h3
                                                            className="text-xl md:text-2xl font-black text-white hover:text-gold cursor-pointer transition-colors mb-2"
                                                            onClick={() => router.push(`/products/${item.product_id}`)}
                                                            style={{ fontFamily: 'var(--font-display)' }}
                                                        >
                                                            {item.name}
                                                        </h3>
                                                        <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                                                SKU: {item.sku}
                                                            </span>
                                                            <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                                                                In Stock
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right w-full md:w-auto">
                                                        <p className="text-2xl font-black text-gold">SAR {item.price.toLocaleString()}</p>
                                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Unit Price</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                                                            className="h-10 w-10 rounded-xl text-white/40 hover:text-gold hover:bg-gold/10"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-12 text-center font-black text-lg text-white">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                                                            className="h-10 w-10 rounded-xl text-white/40 hover:text-gold hover:bg-gold/10"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Actions */}
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleRemoveItem(item.product_id)}
                                                        className="text-[10px] font-black text-red-400/60 hover:text-red-400 uppercase tracking-[0.2em] hover:bg-red-500/5 group"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                                        Remove Item
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <motion.div variants={itemVariants} className="flex justify-start">
                                <Button
                                    variant="ghost"
                                    onClick={handleClearCart}
                                    className="text-[10px] font-black text-white/20 hover:text-red-400/80 uppercase tracking-[0.3em] group"
                                >
                                    <Trash2 className="w-4 h-4 mr-2 group-hover:shake" />
                                    Clear Cart
                                </Button>
                            </motion.div>
                        </motion.div>

                        {/* Order Summary Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <div className="sticky top-32">
                                <Card className="card-premium rounded-[2.5rem] bg-navy/40 backdrop-blur-xl border-gold/10 overflow-hidden">
                                    <CardContent className="p-8 md:p-10">
                                        <h2 className="text-2xl font-black mb-8 text-white tracking-tight flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                                            <div className="w-2 h-8 bg-gold rounded-full" />
                                            Order Summary
                                        </h2>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">Total Items</span>
                                                <span className="text-lg font-black text-white">{cartItems.reduce((a, b) => a + b.quantity, 0)} Units</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">Shipping</span>
                                                <span className="text-lg font-black text-white">Calculated at checkout</span>
                                            </div>
                                            <div className="h-px bg-white/5" />
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Subtotal</span>
                                                <span className="text-lg font-black text-white">SAR {subtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">VAT (15%)</span>
                                                    <span className="text-[8px] text-white/20 uppercase tracking-widest mt-1">Region Standard</span>
                                                </div>
                                                <span className="text-lg font-black text-white">SAR {tax.toLocaleString()}</span>
                                            </div>

                                            <div className="pt-8 border-t border-white/10 mt-8">
                                                <div className="flex justify-between items-end mb-8 text-3xl font-black text-white">
                                                    <span className="text-[11px] font-black text-gold uppercase tracking-[0.4em] mb-2 block">GRAND TOTAL</span>
                                                    <span className="text-gradient-gold" style={{ fontFamily: 'var(--font-display)' }}>
                                                        SAR {total.toLocaleString()}
                                                    </span>
                                                </div>

                                                <Button
                                                    className="w-full h-18 text-lg font-black uppercase tracking-[0.2em] rounded-2xl bg-gold hover:bg-gold/90 text-navy shadow-[0_15px_40px_rgba(197,160,89,0.3)] group relative overflow-hidden"
                                                    onClick={() => router.push('/checkout')}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer" />
                                                    PROCEED TO CHECKOUT
                                                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                </Button>



                                                <Button
                                                    variant="outline"
                                                    className="w-full mt-6 h-14 rounded-2xl border-white/10 text-white/40 hover:text-gold hover:border-gold/30 hover:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px]"
                                                    onClick={() => router.push('/products')}
                                                >
                                                    <ShoppingCart className="mr-3 w-4 h-4" />
                                                    Continue Shopping
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Trust Badges */}
                                        <div className="mt-10 grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck className="w-5 h-5 text-gold/40" />
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">SECURE PAYMENT</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Truck className="w-5 h-5 text-gold/40" />
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">FAST SHIPPING</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* Empty Cart State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-20 py-32 rounded-[4rem] bg-navy/40 border border-dashed border-white/10 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gold/5 blur-3xl opacity-20" />
                        <div className="relative z-10 max-w-md mx-auto px-6">
                            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-navy border border-white/10 mb-10 shadow-2xl relative group">
                                <div className="absolute inset-0 bg-gold/5 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                                <Package className="w-12 h-12 text-white/20 group-hover:text-gold/40 transition-colors" />
                            </div>
                            <span className="micro-label mb-6 block">YOUR CART IS EMPTY</span>
                            <h2 className="text-4xl font-black mb-6 text-white tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                                Your cart is <span className="text-white/20">Empty.</span>
                            </h2>
                            <p className="text-white/40 mb-12 leading-relaxed uppercase text-[10px] tracking-[0.25em] font-bold">
                                You haven't added any items yet. Browse our catalog to find quality spare parts for your equipment.
                            </p>
                            <Button
                                onClick={() => router.push('/products')}
                                className="h-16 px-12 rounded-2xl bg-gold text-navy font-black uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(197,160,89,0.3)] hover:scale-105 transition-transform"
                            >
                                <ShoppingCart className="mr-3 w-5 h-5" />
                                BROWSE PRODUCTS
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Technical Support Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-32 p-12 rounded-[3.5rem] bg-navy-light/30 border border-white/5 relative overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                        <div className="flex gap-8 items-start">
                            <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                                <Clock className="w-8 h-8 text-gold" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Expert Technical Support</h3>
                                <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-black">24/7 Priority assistance for orders & shipping</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" className="h-14 px-8 rounded-xl border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px]">Technical Documentation</Button>
                            <Button className="h-14 px-8 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px]">Request Assistance</Button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
        </div>
    );
}

export default function CartPage() {
    return (
        <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <CartContent />
        </Suspense>
    );
}

