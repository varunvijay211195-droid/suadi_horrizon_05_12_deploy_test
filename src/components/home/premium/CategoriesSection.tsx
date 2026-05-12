"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface StaticCategory {
    id: number;
    name: string;
    name_tr: string;
    slug: string;
    image: string;
    image_filename: string;
}

// The 6 most important categories to feature on the homepage (by id from anc_categories.json)
const FEATURED_IDS = [2, 15, 9, 13, 36, 29]; // Engine, Filter, Gasket, Electrical, Hose, Pump

export function CategoriesSection() {
    const { t } = useTranslation();
    const router = useRouter();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    const [categories, setCategories] = useState<StaticCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/categories/static')
            .then(res => res.json())
            .then(data => {
                const all: StaticCategory[] = data.categories || [];
                // Filter to the 6 featured categories, preserving order
                const featured = FEATURED_IDS
                    .map(id => all.find(c => c.id === id))
                    .filter((c): c is StaticCategory => Boolean(c));
                setCategories(featured);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const navigateToCategory = (categoryName: string) => {
        router.push(`/products?category=${encodeURIComponent(categoryName)}`);
    };

    return (
        <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden">
            <div className="container-premium">
                <div className="bg-white/5 rounded-[2rem] border border-white/5 p-8 md:p-12 lg:p-16 relative overflow-hidden">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center justify-center text-center gap-6 mb-16 relative z-10 w-full"
                    >
                        <div className="max-w-3xl flex flex-col items-center">
                            <span className="micro-label mb-4 block text-center">{t('home.categories.label')}</span>
                            <h2 className="heading-md mb-8 text-center">{t('home.categories.title')}</h2>
                            <Link
                                href="/categories"
                                className="btn-secondary whitespace-nowrap"
                            >
                                {t('home.categories.view_all')}
                                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Grid */}
                    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        {isLoading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[440px] rounded-3xl bg-white/5 animate-pulse" />
                            ))
                            : categories.map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="group relative h-[440px] overflow-hidden rounded-3xl border border-white/10 cursor-pointer"
                                    onClick={() => navigateToCategory(category.name)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigateToCategory(category.name);
                                        }
                                    }}
                                    aria-label={`View ${category.name} category`}
                                >
                                    {/* Image */}
                                    <div className="absolute inset-0">
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            onError={(e) => {
                                                // Fallback if local image missing
                                                (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                                    </div>

                                    {/* Content */}
                                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                        <div className="space-y-3 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                                {category.name}
                                            </h3>
                                            <p className="text-white/50 text-sm uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                {category.name_tr}
                                            </p>

                                            <div className="pt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigateToCategory(category.name); }}
                                                    className="inline-flex items-center gap-3 px-7 py-3.5 bg-gold text-navy rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors group/btn"
                                                >
                                                    {t('home.categories.explore')}
                                                    <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 border border-white/5 group-hover:border-gold/30 rounded-3xl transition-colors duration-500" />
                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </section>
    );
}
