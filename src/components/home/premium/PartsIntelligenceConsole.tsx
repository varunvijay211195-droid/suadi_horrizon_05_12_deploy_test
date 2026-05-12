"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Settings, Cpu, Zap, ShieldCheck, Hash, Package, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface StaticCategory {
    id: number;
    name: string;
    name_tr: string;
    slug: string;
}

export function PartsIntelligenceConsole() {
    const { t } = useTranslation();
    const router = useRouter();

    const [partSearch, setPartSearch] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [categories, setCategories] = useState<StaticCategory[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [isLoadingBrands, setIsLoadingBrands] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load real categories from anc_categories.json
        fetch('/api/categories/static')
            .then(res => res.json())
            .then(data => setCategories(data.categories || []))
            .catch(console.error);

        // Load real brands from Supabase
        fetch('/api/brands')
            .then(res => res.json())
            .then(data => setBrands(data.brands || []))
            .catch(console.error)
            .finally(() => setIsLoadingBrands(false));
    }, []);

    // Build the search URL with only the params that are set
    const buildSearchUrl = () => {
        const params = new URLSearchParams();
        if (partSearch.trim()) params.set('search', partSearch.trim());
        if (selectedBrand) params.set('brand', selectedBrand);
        if (selectedCategory) params.set('category', selectedCategory);
        const qs = params.toString();
        return `/products${qs ? `?${qs}` : ''}`;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') router.push(buildSearchUrl());
    };

    const isReady = partSearch.trim() || selectedBrand || selectedCategory;

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-navy">
            {/* Background decal */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 blur-[150px] rounded-full opacity-40" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full opacity-40" />
                <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="console-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#console-grid)" />
                </svg>
            </div>

            <div className="container-premium relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 items-center">

                    {/* Left: Copy */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                <Cpu className="w-3 h-3" />
                                {t('home.console.label')}
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-display leading-[1.1]">
                                {t('home.console.title_prefix')}
                                <span className="text-gold italic">{t('home.console.title_accent')}</span>
                                {t('home.console.title_suffix')}
                            </h2>
                            <p className="text-lg text-white/50 mb-10 leading-relaxed max-w-lg">
                                {t('home.console.subtitle')}
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-gold">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{t('home.console.filter_label')}</span>
                                    </div>
                                    <p className="text-sm text-white/30">{t('home.console.filter_desc')}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-gold">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{t('home.console.oem_label')}</span>
                                    </div>
                                    <p className="text-sm text-white/30">{t('home.console.oem_desc')}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Interactive Console */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
                                        {t('home.console.system_status')}
                                    </span>
                                </div>
                                <Settings className="w-4 h-4 text-white/20 animate-spin-slow" />
                            </div>

                            <div className="space-y-6">
                                {/* Step 1: Part Search — the most powerful filter */}
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3 flex items-center justify-center gap-2">
                                        <Hash className="w-3 h-3 text-gold/50" />
                                        01 — PART NUMBER OR KEYWORD
                                    </label>
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-gold transition-colors" />
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={partSearch}
                                            onChange={e => setPartSearch(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. radiator hose, 6D102 piston, 4P-7693..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-all font-medium"
                                        />
                                        {partSearch && (
                                            <button
                                                onClick={() => setPartSearch('')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors text-lg leading-none"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Brand + Category */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    {/* Manufacturer */}
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3 flex items-center justify-center gap-2">
                                            <Package className="w-3 h-3 text-gold/50" />
                                            02 — {t('home.console.step2_label')}
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedBrand}
                                                onChange={e => setSelectedBrand(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none cursor-pointer font-medium"
                                                disabled={isLoadingBrands}
                                            >
                                                <option value="" className="bg-[#0a0d1a]">
                                                    {isLoadingBrands ? 'Loading brands...' : t('home.console.all_brands')}
                                                </option>
                                                {brands.map(brand => (
                                                    <option key={brand} value={brand} className="bg-[#0a0d1a]">{brand}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Component Type */}
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3 flex items-center justify-center gap-2">
                                            <Zap className="w-3 h-3 text-gold/50" />
                                            03 — {t('home.console.step3_label')}
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedCategory}
                                                onChange={e => setSelectedCategory(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none cursor-pointer font-medium"
                                            >
                                                <option value="" className="bg-[#0a0d1a]">{t('home.console.all_components')}</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.name} className="bg-[#0a0d1a]">
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Search CTA */}
                                <Link
                                    href={buildSearchUrl()}
                                    className={`w-full group relative flex items-center justify-center gap-3 py-5 font-black rounded-2xl transition-all duration-300 text-sm uppercase tracking-widest ${
                                        isReady
                                            ? 'bg-gradient-to-r from-gold to-[#D4AF37] text-navy shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98]'
                                            : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60'
                                    }`}
                                >
                                    <Search className="w-5 h-5" />
                                    {t('home.console.search_btn')}
                                    {isReady && (
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                    )}
                                </Link>
                            </div>

                            {/* Footer Stats */}
                            <div className="mt-6 flex justify-between items-center text-[9px] font-mono text-white/20 tracking-[0.2em]">
                                <span>{t('home.console.db_status')}</span>
                                <span>
                                    {brands.length > 0
                                        ? `${brands.length} BRANDS · ${categories.length} CATEGORIES`
                                        : t('home.console.latency')}
                                </span>
                                <span>{t('home.console.ver_mod')}</span>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
