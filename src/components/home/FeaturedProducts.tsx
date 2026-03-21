'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getSafeImageUrl } from '@/lib/utils';

interface Product {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string | { url?: string; public_id?: string };
    category: string;
    rating?: number;
    reviews?: number;
    isNew?: boolean;
    discount?: number;
    description?: string;
}

export default function FeaturedProducts() {
    const { t, i18n } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedProducts();
    }, []);

    const fetchFeaturedProducts = async () => {
        try {
            // First try to load admin-configured featured products
            const configRes = await fetch('/api/admin/homepage');
            if (configRes.ok) {
                const config = await configRes.json();
                if (config.featuredProductIds && config.featuredProductIds.length > 0) {
                    // Fetch all products and filter by the configured IDs
                    const limit = config.featuredProductsCount || 8;
                    const response = await fetch('/api/products?limit=500');
                    if (response.ok) {
                        const data = await response.json();
                        const allProds = data.products || [];
                        // Preserve admin-configured order
                        const ordered = config.featuredProductIds
                            .map((id: string) => allProds.find((p: Product) => p._id === id))
                            .filter(Boolean)
                            .slice(0, limit);
                        if (ordered.length > 0) {
                            setProducts(ordered);
                            setLoading(false);
                            return;
                        }
                    }
                }
            }

            // Fallback: fetch latest products
            const response = await fetch('/api/products?limit=8');
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching featured products:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-24 bg-navy">
                <div className="container-premium px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="glass rounded-[2rem] border border-white/5 p-4 animate-pulse">
                                <div className="w-full aspect-square bg-white/5 rounded-2xl mb-6"></div>
                                <div className="h-4 bg-white/5 rounded-full mb-3 w-1/3"></div>
                                <div className="h-6 bg-white/5 rounded-full mb-4 w-3/4"></div>
                                <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
                                    <div className="h-6 bg-white/5 rounded-full w-1/4"></div>
                                    <div className="h-10 bg-white/5 rounded-xl w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-24 bg-navy relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="container-premium relative z-10 px-4">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-block py-1.5 px-4 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            {t('home.products.label')}
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 font-display tracking-tight">
                            {t('home.products.title_prefix')}<span className="text-gold">{t('home.products.title_accent')}</span>
                        </h2>
                        <p className="text-lg text-white/50 max-w-2xl mx-auto font-medium leading-relaxed">
                            {t('home.products.subtitle')}
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product, index) => {
                        const imageUrl = getSafeImageUrl(product.image);
                        return (
                            <motion.div
                                key={`${product._id}-${index}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group"
                            >
                                <div className="glass-premium h-full flex flex-col rounded-[2rem] border border-white/5 hover:border-gold/30 transition-all duration-500 overflow-hidden relative">
                                    <Link href={`/products/${product._id}`} className="absolute inset-0 z-10" />

                                    {/* Image Container */}
                                    <div className="relative aspect-square p-2">
                                        <div className="w-full h-full rounded-2xl overflow-hidden bg-navy/40 border border-white/5 relative">
                                            {imageUrl ? (
                                                <Image
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <span className="text-white/20 font-bold tracking-tighter text-4xl">SHI</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>

                                        {/* Labels */}
                                        <div className={`absolute top-4 ${i18n.language === 'ar' ? 'right-4' : 'left-4'} flex flex-col gap-2 pointer-events-none`}>
                                            {product.isNew && (
                                                <span className="px-3 py-1 bg-gold text-navy text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl shadow-gold/20">
                                                    {t('home.products.new_badge')}
                                                </span>
                                            )}
                                            {product.discount && (
                                                <span className="px-3 py-1 bg-white text-navy text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl shadow-black/20">
                                                    -{product.discount}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">
                                                {product.category || t('home.products.fallback_category')}
                                            </span>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>

                                        <h4 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-gold transition-colors duration-300 font-display">
                                            {product.name}
                                        </h4>

                                        <p className="text-white/40 text-sm line-clamp-2 mb-4 leading-relaxed font-medium">
                                            {product.description || t('home.products.fallback_description')}
                                        </p>

                                        {/* Ratings - Mocked if not present */}
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`w-3 h-3 ${i < (product.rating || 5)
                                                            ? 'text-gold fill-current'
                                                            : 'text-white/20'
                                                            }`}
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                ({product.reviews || Math.floor(Math.random() * 50) + 10})
                                            </span>
                                        </div>

                                        {/* Action Area */}
                                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-0.5">{t('home.products.price_starting')}</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-white font-display">
                                                        {i18n.language === 'ar' ? 'ر.س' : 'SAR'} {product.price.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold group-hover:text-navy transition-all duration-300">
                                                <svg className={`w-5 h-5 transform ${i18n.language === 'ar' ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={i18n.language === 'ar' ? "M10 19l-7-7 7-7" : "M14 5l7 7-7 7"} />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* View All CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-4 px-10 py-5 bg-gold text-navy font-black rounded-2xl hover:bg-white transition-all duration-300 shadow-2xl shadow-gold/20 hover:scale-105 active:scale-95 group"
                    >
                        {t('home.products.explore_catalog')}
                        <svg className={`w-5 h-5 transition-transform ${i18n.language === 'ar' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
