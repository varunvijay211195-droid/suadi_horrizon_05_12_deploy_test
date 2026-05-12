'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Package, ShieldCheck, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { FloatingParticles, AnimatedConnector } from "@/components/effects/SceneEffects";

interface StaticCategory {
    id: number;
    name: string;
    name_tr: string;
    slug: string;
    image: string;
    image_filename: string;
}

function CategoriesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [categories, setCategories] = useState<StaticCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/categories/static')
            .then(res => res.json())
            .then(data => setCategories(data.categories || []))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const navigateToCategory = (categoryName: string) => {
        router.push(`/products?category=${encodeURIComponent(categoryName)}`);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.name_tr.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="text-white pb-32 relative overflow-hidden min-h-screen">
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
                                <BreadcrumbLink
                                    onClick={() => router.push('/')}
                                    className="hover:text-gold cursor-pointer transition-colors text-slate-400 uppercase text-[10px] tracking-[0.2em] font-bold"
                                >
                                    HOME
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-slate-600" />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-gold uppercase text-[10px] tracking-[0.2em] font-bold underline underline-offset-4 decoration-gold/30">
                                    PARTS CATEGORIES
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </motion.div>

                {/* Hero */}
                <div className="mb-20 flex flex-col lg:flex-row gap-12 items-end justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-3xl"
                    >
                        <span className="micro-label mb-4 block">PRODUCT CATALOG — {categories.length} CATEGORIES</span>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9]" style={{ fontFamily: 'var(--font-display)' }}>
                            Parts <span className="text-gradient-gold">Category Directory.</span>
                        </h1>
                        <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-[0.15em] max-w-2xl leading-relaxed">
                            Browse all available component groups. Click any category to view the full parts catalog.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-[450px]"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gold/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50 group-hover:text-gold transition-colors z-10" />
                            <Input
                                placeholder="SEARCH CATEGORY..."
                                className="pl-14 h-16 bg-navy/80 backdrop-blur-xl border-white/10 text-white text-xs font-black tracking-[0.2em] placeholder:text-white/20 focus:border-gold/50 rounded-2xl transition-all relative z-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>

                <AnimatedConnector />

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-16">
                    <AnimatePresence mode="popLayout">
                        {isLoading
                            ? Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-52 rounded-2xl bg-white/5 animate-pulse" />
                            ))
                            : filteredCategories.map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: index * 0.02 }}
                                    className="group relative h-52 overflow-hidden rounded-2xl border border-white/10 cursor-pointer hover:border-gold/40 transition-all duration-500"
                                    onClick={() => navigateToCategory(category.name)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigateToCategory(category.name);
                                        }
                                    }}
                                >
                                    {/* Image */}
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-90"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />

                                    {/* Category ID badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className="text-[9px] font-black text-white/30 bg-black/40 px-2 py-0.5 rounded-full">
                                            #{String(category.id).padStart(2, '0')}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-sm font-bold text-white leading-tight mb-1">
                                            {category.name}
                                        </h3>
                                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold group-hover:text-gold/60 transition-colors duration-300">
                                            {category.name_tr}
                                        </p>
                                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="text-[9px] text-gold font-black uppercase tracking-widest">Browse Parts</span>
                                            <ArrowRight className="w-3 h-3 text-gold" />
                                        </div>
                                    </div>

                                    {/* Hover border glow */}
                                    <div className="absolute inset-0 border border-gold/0 group-hover:border-gold/30 rounded-2xl transition-colors duration-500" />
                                </motion.div>
                            ))
                        }
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {!isLoading && filteredCategories.length === 0 && (
                    <motion.div
                        className="text-center py-32 rounded-[3.5rem] bg-navy/40 border border-dashed border-white/10 mt-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-navy border border-white/10 mb-8">
                            <Package className="w-10 h-10 text-white/10" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">No Categories Found</h2>
                        <p className="text-white/40 uppercase text-[10px] font-black tracking-[0.25em] mb-10">No results for: "{searchQuery}"</p>
                        <Button
                            className="btn-primary h-14 px-10 rounded-xl"
                            onClick={() => setSearchQuery('')}
                        >
                            Clear Search
                        </Button>
                    </motion.div>
                )}

                {/* Support Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="mt-32 p-10 md:p-16 rounded-[4rem] bg-gradient-to-br from-gold/10 via-navy-light/40 to-navy-dark border border-gold/10 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <Quote className="w-64 h-64 text-gold rotate-12" />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 items-center justify-between relative z-10">
                        <div className="flex gap-8 items-start">
                            <div className="w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                                <ShieldCheck className="w-10 h-10 text-gold" />
                            </div>
                            <div>
                                <span className="micro-label mb-3 block">EXPERT TECHNICAL SUPPORT</span>
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                                    Can&apos;t find your <span className="text-gradient-gold">part?</span>
                                </h2>
                                <p className="text-white/40 uppercase tracking-[0.15em] text-[10px] md:text-xs font-black max-w-xl leading-relaxed">
                                    Our engineers are on standby to help identify and source any component, even if it&apos;s not listed.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <Button
                                onClick={() => router.push('/contact')}
                                className="h-16 px-10 rounded-2xl bg-gold text-navy font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_15px_30px_rgba(197,160,89,0.2)] hover:scale-105 transition-all"
                            >
                                Contact Engineering
                            </Button>
                            <a
                                href="https://wa.me/966570196677"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-16 px-10 rounded-2xl border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 transition-all flex items-center justify-center"
                            >
                                WhatsApp Expert
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
        </div>
    );
}

export default function CategoriesPageWrapper() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-gold"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gold rounded-full animate-ping" />
                    </div>
                </div>
            </div>
        }>
            <CategoriesPage />
        </React.Suspense>
    );
}
