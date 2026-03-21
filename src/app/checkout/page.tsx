'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, CreditCard, Truck, MapPin, FileText, Shield, Lock, ShoppingCart, ArrowRight, Box, ShieldCheck, Clock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { getCart, clearCart, CartItem } from '@/api/cart';
import { toast } from 'sonner';
import { FloatingParticles, AnimatedConnector } from "@/components/effects/SceneEffects";
import HyperPayWidget from '@/components/HyperPayWidget';

type CheckoutStep = 'information' | 'shipping' | 'payment' | 'review';

interface ShippingAddress {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

const steps: { id: CheckoutStep; title: string; icon: React.ReactNode }[] = [
    { id: 'information', title: 'YOUR INFO', icon: <MapPin className="w-5 h-5" /> },
    { id: 'shipping', title: 'SHIPPING', icon: <Truck className="w-5 h-5" /> },
    { id: 'payment', title: 'PAYMENT', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'review', title: 'REVIEW', icon: <FileText className="w-5 h-5" /> },
];

export default function CheckoutPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>('information');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Saudi Arabia',
    });

    const [shippingMethod, setShippingMethod] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);

    const [orderId, setOrderId] = useState('');

    // HyperPay state
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    const [preparingPayment, setPreparingPayment] = useState(false);

    useEffect(() => {
        const loadCart = async () => {
            setMounted(true);
            setOrderId(Math.random().toString(36).substr(2, 9).toUpperCase());
            const items = await getCart();
            if (items.length === 0 && mounted) {
                router.push('/products');
                return;
            }
            setCartItems(items);
        };
        
        loadCart();
    }, [router]);

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = shippingMethod === 'express' ? 15 : shippingMethod === 'overnight' ? 25 : 0;
    const discountAmount = subtotal * discount;
    const tax = (subtotal - discountAmount) * 0.15;
    const total = subtotal - discountAmount + shipping + tax;

    const stepIndex = steps.findIndex(s => s.id === currentStep);

    const handleNextStep = () => {
        const nextIndex = stepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id);
        }
    };

    const handlePrevStep = () => {
        const prevIndex = stepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === 'SAVE10') {
            setDiscount(0.1);
            setAppliedPromo('SAVE10');
            toast.success('Promo applied!', { description: '10% discount added to your order' });
        } else {
            toast.error('Invalid code', { description: 'The promo code entered is not recognized' });
        }
    };

    // Map payment method ID to HyperPay brands string
    const getPaymentBrand = (methodId: string): string => {
        const brandMap: Record<string, string> = {
            card: 'VISA MASTER AMEX MADA',
            applepay: 'APPLEPAY',
            stcpay: 'STC_PAY',
            tabby: 'TABBY',
            tamara: 'TAMARA',
        };
        return brandMap[methodId] || 'VISA MASTER AMEX MADA';
    };

    // Prepare HyperPay checkout when user clicks "Pay Now"
    const prepareHyperPayCheckout = async () => {
        setPreparingPayment(true);
        try {
            // Determine the primary brand for entity ID selection
            const primaryBrand = getPaymentBrand(paymentMethod).split(' ')[0];

            const response = await fetch('/api/hyperpay/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        _id: item.product_id || item.id,
                        quantity: item.quantity,
                    })),
                    shippingAddress,
                    shippingMethod,
                    paymentBrand: primaryBrand,
                }),
            });

            const data = await response.json();

            if (data.checkoutId) {
                // Save order data to sessionStorage so payment-result page can create the order
                sessionStorage.setItem('pendingOrder', JSON.stringify({
                    items: cartItems,
                    totalAmount: parseFloat(data.totalAmount),
                    shippingAddress,
                    shippingMethod,
                    paymentMethod,
                }));

                setCheckoutId(data.checkoutId);
            } else {
                toast.error('Failed to prepare payment', {
                    description: data.error || 'Please try again',
                });
            }
        } catch (error) {
            console.error('Error preparing checkout:', error);
            toast.error('Payment setup failed', {
                description: 'Please check your connection and try again',
            });
        } finally {
            setPreparingPayment(false);
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        toast.loading('Processing order...', { id: 'checkout' });

        // Save order data to sessionStorage
        sessionStorage.setItem('pendingOrder', JSON.stringify({
            items: cartItems,
            totalAmount: total,
            shippingAddress,
            shippingMethod,
            paymentMethod,
        }));

        // All payment methods go through HyperPay
        await prepareHyperPayCheckout();
        toast.dismiss('checkout');
        setLoading(false);
    };

    if (!mounted) return null;

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-16 flex-wrap gap-4 overflow-x-auto py-4">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-3 shrink-0 ${index <= stepIndex ? 'text-gold' : 'text-white/20'}`}
                    >
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${index < stepIndex
                                ? 'bg-gold text-navy shadow-[0_0_20px_rgba(197,160,89,0.4)]'
                                : index === stepIndex
                                    ? 'bg-gold/10 text-gold border-2 border-gold/50 shadow-[0_0_30px_rgba(197,160,89,0.2)]'
                                    : 'bg-white/5 text-white/20 border border-white/10'
                                }`}
                        >
                            {index < stepIndex ? <Check className="w-6 h-6 stroke-[3px]" /> : step.icon}
                            {index === stepIndex && (
                                <motion.div
                                    layoutId="active-step-glow"
                                    className="absolute -inset-2 bg-gold/10 rounded-[1.5rem] blur-xl"
                                />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Step 0{index + 1}</span>
                            <span className={`text-xs font-black uppercase tracking-[0.1em] ${index === stepIndex ? 'text-white' : ''}`}>
                                {step.title}
                            </span>
                        </div>
                    </motion.div>
                    {index < steps.length - 1 && (
                        <div className={`w-12 h-[2px] rounded-full mx-2 ${index < stepIndex ? 'bg-gold' : 'bg-white/5'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderInformationStep = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                        <div className="w-1.5 h-6 bg-gold rounded-full" />
                        Contact Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">First Name</Label>
                            <Input
                                id="firstName"
                                value={shippingAddress.firstName}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                                placeholder="e.g. Abdullah"
                                className="bg-white/5 border-white/10 text-white h-14 rounded-xl focus:border-gold/50 focus:ring-0 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Last Name</Label>
                            <Input
                                id="lastName"
                                value={shippingAddress.lastName}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                                placeholder="e.g. Al-Fahad"
                                className="bg-white/5 border-white/10 text-white h-14 rounded-xl focus:border-gold/50 focus:ring-0 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={shippingAddress.email}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                            placeholder="your@email.com"
                            className="bg-white/5 border-white/10 text-white h-14 rounded-xl focus:border-gold/50 focus:ring-0 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                        <div className="w-1.5 h-6 bg-gold rounded-full" />
                        Shipping Address
                    </h3>
                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Street Address</Label>
                        <Input
                            id="address"
                            value={shippingAddress.address}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                            placeholder="Unit/Block Number, Street Name"
                            className="bg-white/5 border-white/10 text-white h-14 rounded-xl focus:border-gold/50 focus:ring-0 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">City</Label>
                            <Input
                                id="city"
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                placeholder="Riyadh"
                                className="bg-white/5 border-white/10 text-white h-14 rounded-xl focus:border-gold/50 focus:ring-0 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Phone</Label>
                            <Input
                                id="phone"
                                value={shippingAddress.phone}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                placeholder="+966 5XX XXX XXXX"
                                className="bg-white/5 border-white/10 text-white h-14 rounded-xl focus:border-gold/50 focus:ring-0 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderShippingStep = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <h3 className="text-xl font-black text-white flex items-center gap-3 mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                <div className="w-1.5 h-6 bg-gold rounded-full" />
                Select Shipping Method
            </h3>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { id: 'standard', title: 'Standard Shipping', time: '5-7 working days', price: 0, icon: Box },
                    { id: 'express', title: 'Express Shipping', time: '2-3 working days', price: 15, icon: Truck },
                    { id: 'overnight', title: 'Next Day Delivery', time: 'Next Morning', price: 25, icon: Zap },
                ].map((method) => (
                    <div
                        key={method.id}
                        onClick={() => setShippingMethod(method.id)}
                        className={`card-premium p-8 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 relative group flex flex-col items-center text-center ${shippingMethod === method.id ? 'border-gold bg-gold/10' : 'border-white/5 hover:border-gold/30'}`}
                    >
                        <div className={`p-4 rounded-2xl mb-4 transition-colors ${shippingMethod === method.id ? 'bg-gold text-navy' : 'bg-white/5 text-white/20'}`}>
                            <method.icon className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-white mb-2">{method.title}</h4>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">{method.time}</p>
                        <div className="mt-auto">
                            <span className={`text-xl font-black ${method.price === 0 ? 'text-emerald-500' : 'text-gold'}`}>
                                {method.price === 0 ? 'FREE' : `SAR ${method.price.toFixed(2)}`}
                            </span>
                        </div>
                        <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                    </div>
                ))}
            </RadioGroup>
        </motion.div>
    );

    const renderPaymentStep = () => {
        // Payment method definitions
        const paymentMethods = [
            {
                id: 'card',
                title: 'Credit / Debit Card',
                desc: 'VISA, MasterCard, AMEX, mada',
                icon: CreditCard,
                brands: 'VISA MASTER AMEX MADA',
                color: 'gold',
                badges: ['VISA', 'MC', 'AMEX', 'mada'],
            },
            {
                id: 'applepay',
                title: 'Apple Pay',
                desc: 'Fast & secure with Face ID or Touch ID',
                icon: Shield, // Using Shield as Apple-like icon
                brands: 'APPLEPAY',
                color: 'white',
                badges: ['Apple Pay'],
                label: '',
            },
            {
                id: 'stcpay',
                title: 'STC Pay',
                desc: 'Pay with your STC Pay wallet',
                icon: Zap,
                brands: 'STC_PAY',
                color: 'purple',
                badges: ['STC Pay'],
                label: '',
            },
            {
                id: 'tabby',
                title: 'Tabby',
                desc: `Split into 4 interest-free payments of SAR ${(total / 4).toFixed(2)}`,
                icon: Clock,
                brands: 'TABBY',
                color: 'teal',
                badges: ['4 Payments'],
                label: 'PAY IN 4',
            },
            {
                id: 'tamara',
                title: 'Tamara',
                desc: `Split into 3 interest-free payments of SAR ${(total / 3).toFixed(2)}`,
                icon: ShieldCheck,
                brands: 'TAMARA',
                color: 'pink',
                badges: ['3 Payments'],
                label: 'BUY NOW, PAY LATER',
            },
        ];

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                <h3 className="text-xl font-black text-white flex items-center gap-3 mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                    <div className="w-1.5 h-6 bg-gold rounded-full" />
                    Select Payment Method
                </h3>

                {/* If HyperPay checkout is prepared, show the widget */}
                {checkoutId ? (
                    <div className="space-y-6">
                        {/* Active method indicator */}
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-gold/5 border border-gold/20">
                            <div className="p-3 rounded-xl bg-gold text-navy">
                                {(() => {
                                    const method = paymentMethods.find(m => m.id === paymentMethod);
                                    const Icon = method?.icon || CreditCard;
                                    return <Icon className="w-5 h-5" />;
                                })()}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-white uppercase tracking-wider">
                                    {paymentMethods.find(m => m.id === paymentMethod)?.title}
                                </p>
                                <p className="text-[10px] text-gold font-bold uppercase tracking-widest">
                                    Secure payment form loaded
                                </p>
                            </div>
                            <button
                                onClick={() => { setCheckoutId(null); }}
                                className="text-[10px] font-black text-white/40 hover:text-gold uppercase tracking-widest transition-colors"
                            >
                                Change
                            </button>
                        </div>

                        {/* Widget container */}
                        <div className="card-premium p-8 rounded-3xl border-white/5">
                            <HyperPayWidget
                                checkoutId={checkoutId}
                                brands={paymentMethods.find(m => m.id === paymentMethod)?.brands || 'VISA MASTER AMEX MADA'}
                                shopperResultUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/payment-result`}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Payment method cards */}
                        <div className="space-y-3">
                            {paymentMethods.map((method) => {
                                const isSelected = paymentMethod === method.id;
                                const Icon = method.icon;

                                // Color theming per method
                                const colorStyles: Record<string, { border: string; bg: string; icon: string; glow: string }> = {
                                    gold: {
                                        border: 'border-gold bg-gold/10',
                                        bg: 'bg-gold text-navy',
                                        icon: 'text-gold',
                                        glow: 'shadow-[0_0_20px_rgba(197,160,89,0.15)]',
                                    },
                                    white: {
                                        border: 'border-white/30 bg-white/5',
                                        bg: 'bg-white text-black',
                                        icon: 'text-white',
                                        glow: 'shadow-[0_0_20px_rgba(255,255,255,0.08)]',
                                    },
                                    purple: {
                                        border: 'border-purple-500/40 bg-purple-500/10',
                                        bg: 'bg-purple-500 text-white',
                                        icon: 'text-purple-400',
                                        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
                                    },
                                    teal: {
                                        border: 'border-teal-500/40 bg-teal-500/10',
                                        bg: 'bg-teal-500 text-white',
                                        icon: 'text-teal-400',
                                        glow: 'shadow-[0_0_20px_rgba(20,184,166,0.15)]',
                                    },
                                    pink: {
                                        border: 'border-pink-500/40 bg-pink-500/10',
                                        bg: 'bg-pink-500 text-white',
                                        icon: 'text-pink-400',
                                        glow: 'shadow-[0_0_20px_rgba(236,72,153,0.15)]',
                                    },
                                };
                                const colors = colorStyles[method.color] || colorStyles.gold;

                                return (
                                    <motion.div
                                        key={method.id}
                                        whileHover={{ scale: 1.005 }}
                                        whileTap={{ scale: 0.995 }}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`card-premium p-5 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-500 relative overflow-hidden group ${isSelected
                                            ? `${colors.border} ${colors.glow}`
                                            : 'border-white/5 hover:border-white/15'
                                            }`}
                                    >
                                        {/* BNPL label badge */}
                                        {method.label && (
                                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-[0.2em] ${isSelected ? colors.bg : 'bg-white/5 text-white/30'
                                                }`}>
                                                {method.label}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-5">
                                            {/* Icon */}
                                            <div className={`p-4 rounded-xl transition-all shrink-0 ${isSelected ? colors.bg : 'bg-white/5 text-white/20'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-white mb-1 uppercase tracking-wider text-sm md:text-base">
                                                    {method.title}
                                                </h4>
                                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate">
                                                    {method.desc}
                                                </p>
                                            </div>

                                            {/* Brand badges */}
                                            <div className="hidden md:flex items-center gap-2 shrink-0">
                                                {method.badges.map((badge, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`px-2.5 py-1 rounded-md text-[7px] font-black uppercase tracking-wider border ${isSelected
                                                            ? 'border-white/20 bg-white/10 text-white/70'
                                                            : 'border-white/5 bg-white/[0.02] text-white/20'
                                                            }`}
                                                    >
                                                        {badge}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Checkmark */}
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${isSelected
                                                ? colors.bg
                                                : 'border border-white/10'
                                                }`}>
                                                {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                            </div>
                                        </div>

                                        {/* Installment breakdown for BNPL methods */}
                                        {isSelected && (method.id === 'tabby' || method.id === 'tamara') && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="mt-5 pt-5 border-t border-white/5"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    {Array.from({ length: method.id === 'tabby' ? 4 : 3 }).map((_, i) => (
                                                        <div key={i} className="flex-1 text-center">
                                                            <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${i === 0 ? colors.icon : 'text-white/20'
                                                                }`}>
                                                                {i === 0 ? 'Today' : `Month ${i}`}
                                                            </div>
                                                            <div className={`py-2 px-1 rounded-lg border text-xs font-black ${i === 0
                                                                ? `${colors.border} text-white`
                                                                : 'border-white/5 bg-white/[0.02] text-white/40'
                                                                }`}>
                                                                SAR {(total / (method.id === 'tabby' ? 4 : 3)).toFixed(0)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] text-white/20 font-bold text-center mt-3 uppercase tracking-widest">
                                                    No interest · No fees · No surprises
                                                </p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Proceed button */}
                        <div className="mt-8">
                            <Button
                                onClick={prepareHyperPayCheckout}
                                disabled={preparingPayment}
                                className="w-full h-16 rounded-2xl bg-gold text-navy font-black uppercase tracking-[0.2em] text-sm shadow-[0_15px_40px_rgba(197,160,89,0.3)] group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer" />
                                {preparingPayment ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Preparing secure payment...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-5 h-5" />
                                        {paymentMethod === 'tabby'
                                            ? `Pay SAR ${(total / 4).toFixed(2)} Now`
                                            : paymentMethod === 'tamara'
                                                ? `Pay SAR ${(total / 3).toFixed(2)} Now`
                                                : `Pay SAR ${total.toFixed(2)}`
                                        }
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {/* Security info */}
                <div className="mt-10 p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-6">
                    <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20 shrink-0">
                        <Lock className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white mb-1 uppercase tracking-widest text-gradient-gold">Secure Payment</h4>
                        <p className="text-[9px] leading-relaxed text-white/30 uppercase tracking-[0.12em] font-bold">
                            All payments are processed securely by HyperPay. Card details are encrypted (256-bit SSL) and never stored on our servers. PCI DSS Level 1 certified.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderReviewStep = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="card-premium p-8 rounded-[2rem] border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-gold/5 group-hover:text-gold/10 transition-colors">
                            <MapPin className="w-24 h-24" />
                        </div>
                        <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-6">Shipping Address</h4>
                        <div className="space-y-2">
                            <p className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                            <p className="text-sm text-white/60 font-medium">{shippingAddress.address}</p>
                            <p className="text-sm text-white/60 font-medium">{shippingAddress.city}, {shippingAddress.country}</p>
                            <p className="text-sm text-white/60 font-medium pt-4">{shippingAddress.email}</p>
                        </div>
                        <Button variant="link" size="sm" onClick={() => setCurrentStep('information')} className="mt-6 p-0 text-gold hover:text-white uppercase text-[10px] font-black tracking-widest">Edit Details</Button>
                    </div>

                    <div className="card-premium p-8 rounded-[2rem] border-white/5 flex items-center justify-between">
                        <div>
                            <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-2">Shipping Method</h4>
                            <p className="text-lg font-black text-white capitalize">{shippingMethod} Shipping</p>
                        </div>
                        <Truck className="w-10 h-10 text-white/10" />
                    </div>

                    <div className="card-premium p-8 rounded-[2rem] border-white/5 flex items-center justify-between">
                        <div>
                            <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-2">Payment Method</h4>
                            <p className="text-lg font-black text-white capitalize">
                                {paymentMethod === 'card' ? 'Credit / Debit Card'
                                    : paymentMethod === 'applepay' ? 'Apple Pay'
                                        : paymentMethod === 'stcpay' ? 'STC Pay'
                                            : paymentMethod === 'tabby' ? 'Tabby — Pay in 4'
                                                : paymentMethod === 'tamara' ? 'Tamara — Pay Later'
                                                    : paymentMethod}
                            </p>
                        </div>
                        <CreditCard className="w-10 h-10 text-white/10" />
                    </div>
                </div>

                <div>
                    <div className="card-premium p-8 md:p-10 rounded-[2.5rem] bg-navy/60 border-gold/10">
                        <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4" style={{ fontFamily: 'var(--font-display)' }}>
                            <div className="w-2 h-8 bg-gold rounded-full" />
                            Order Summary
                        </h3>

                        <div className="space-y-6 max-h-60 overflow-y-auto pr-4 mb-8 custom-scrollbar">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-navy border border-white/10 rounded-lg overflow-hidden shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">{item.name}</p>
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">QTY: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-gold">SAR {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <Separator className="bg-white/5 mb-8" />

                        <div className="space-y-4 text-xs font-black uppercase tracking-widest mb-10">
                            <div className="flex justify-between items-center">
                                <span className="text-white/40">Subtotal</span>
                                <span className="text-white">SAR {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/40">Shipping</span>
                                <span className="text-white">SAR {shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/40">VAT (15%)</span>
                                <span className="text-white">SAR {tax.toFixed(2)}</span>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                                <span className="text-gold tracking-[0.4em] mb-1">TOTAL</span>
                                <span className="text-4xl text-gradient-gold" style={{ fontFamily: 'var(--font-display)' }}>
                                    SAR {total.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-18 text-xl font-black uppercase tracking-[0.2em] rounded-2xl bg-gold text-navy shadow-[0_15px_40px_rgba(197,160,89,0.3)] group relative overflow-hidden"
                            onClick={handlePlaceOrder}
                            disabled={loading}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer" />
                            {loading ? 'Processing...' : 'PLACE ORDER'}
                            {!loading && <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="text-white pb-24 relative overflow-hidden min-h-screen">
            {/* Ambient Effects */}
            <FloatingParticles />

            <div className="container-premium relative z-10 pt-8">
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
                                <BreadcrumbLink onClick={() => router.push('/cart')} className="hover:text-gold cursor-pointer transition-colors text-slate-400 uppercase text-[10px] tracking-[0.2em] font-bold">CART</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-slate-600" />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-gold uppercase text-[10px] tracking-[0.2em] font-bold underline underline-offset-4 decoration-gold/30">CHECKOUT</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </motion.div>

                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-xl"
                    >
                        <span className="micro-label mb-4 block underline decoration-gold/50 underline-offset-8">SECURE CHECKOUT</span>
                        <h1 className="text-5xl font-black mb-4 tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                            Complete Your <span className="text-gradient-gold">Order.</span>
                        </h1>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            Order ID: <span className="text-gold truncate max-w-[150px] inline-block align-bottom">{orderId || 'GENERATING...'}</span> | <span className="text-emerald-500">SECURE CONNECTION</span>
                        </p>
                    </motion.div>
                </div>

                <AnimatedConnector />

                {renderStepIndicator()}

                <div className="mt-12">
                    <AnimatePresence mode="wait">
                        {currentStep === 'information' && renderInformationStep()}
                        {currentStep === 'shipping' && renderShippingStep()}
                        {currentStep === 'payment' && renderPaymentStep()}
                        {currentStep === 'review' && renderReviewStep()}
                    </AnimatePresence>
                </div>

                <div className="flex justify-between items-center mt-16 pt-8 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handlePrevStep}
                        disabled={stepIndex === 0}
                        className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.3em] disabled:opacity-0 transition-all"
                    >
                        Back to Previous Step
                    </Button>

                    {currentStep !== 'review' && currentStep !== 'payment' && (
                        <Button
                            className="h-16 px-12 rounded-2xl bg-white/5 border border-white/10 text-white hover:border-gold/50 hover:bg-gold hover:text-navy font-black uppercase tracking-[0.2em] transition-all group"
                            onClick={handleNextStep}
                        >
                            Continue
                            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    )}
                </div>

                {/* Footer Security */}
                <div className="mt-20 flex flex-col md:flex-row justify-between items-center gap-8 py-10 border-t border-white/5">
                    <div className="flex items-center gap-8 text-[8px] font-black text-white/20 uppercase tracking-[0.4em] flex-wrap">
                        <span className="flex items-center gap-2"><Shield size={10} className="text-gold/40" /> 256-bit Encryption</span>
                        <span className="flex items-center gap-2"><Check size={10} className="text-gold/40" /> PCI DSS Certified</span>
                        <span className="flex items-center gap-2"><Zap size={10} className="text-gold/40" /> Powered by HyperPay</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['VISA', 'MC', 'AMEX', 'mada', 'Apple Pay', 'STC', 'Tabby', 'Tamara'].map(brand => (
                            <div key={brand} className="px-2 h-6 bg-white/5 rounded-sm border border-white/10 flex items-center justify-center text-[6px] font-black text-white/20">{brand}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
        </div>
    );
}
