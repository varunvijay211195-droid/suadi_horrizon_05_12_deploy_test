"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/home/premium/HeroSection";
import { BrandStripSection } from "@/components/home/premium/BrandStripSection";
import { FeaturesGridSection } from "@/components/home/premium/FeaturesGridSection";
import { CategoriesSection } from "@/components/home/premium/CategoriesSection";
import { PartsIntelligenceConsole } from "@/components/home/premium/PartsIntelligenceConsole";
import { SplitStorySection } from "@/components/home/premium/SplitStorySection";
import { TestimonialsSection } from "@/components/home/premium/TestimonialsSection";
import { HomeCTASection } from "@/components/home/premium/HomeCTASection";
import { FeaturedArticlesSection } from "@/components/home/premium/FeaturedArticlesSection";
import { FAQSection } from "@/components/home/premium/FAQSection";
import { StatsSection } from "@/components/home/premium/StatsSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import { PromoBannerStrip } from "@/components/home/PromoBannerStrip";

import { AnimatedConnector, FloatingParticles } from "@/components/effects/SceneEffects";

// Map section IDs to their components
const sectionComponents: Record<string, React.ComponentType> = {
    hero: HeroSection,
    brands: BrandStripSection,
    stats: StatsSection,
    features: FeaturesGridSection,
    categories: CategoriesSection,
    featured_products: FeaturedProducts,
    parts_console: PartsIntelligenceConsole,
    story: SplitStorySection,
    testimonials: TestimonialsSection,
    cta: HomeCTASection,
    articles: FeaturedArticlesSection,
    faq: FAQSection,
};

interface SectionConfig {
    section_id: string;
    label: string;
    visible: boolean;
    sort_order: number;
}

export default function Home() {
    const [visibleSections, setVisibleSections] = useState<SectionConfig[] | null>(null);

    useEffect(() => {
        fetch('/api/admin/homepage')
            .then(res => res.ok ? res.json() : null)
            .then(config => {
                if (config?.sections?.length > 0) {
                    setVisibleSections(
                        config.sections
                            .filter((s: SectionConfig) => s.visible)
                            .sort((a: SectionConfig, b: SectionConfig) => a.sort_order - b.sort_order)
                    );
                }
            })
            .catch(() => {
                // Fallback: show all sections in default order
                setVisibleSections(null);
            });
    }, []);

    // While loading or on error, show all sections (default behavior)
    const sectionsToRender = visibleSections
        ? visibleSections.map(s => s.section_id)
        : Object.keys(sectionComponents);

    return (
        <div className="flex min-h-screen flex-col bg-navy relative">
            {/* Ambient Background Particles */}
            <FloatingParticles />

            {sectionsToRender.map((sectionId, index) => {
                const Component = sectionComponents[sectionId];
                if (!Component) return null;
                return (
                    <div key={sectionId}>
                        {index > 0 && <AnimatedConnector />}
                        <Component />
                        {/* Promo banners appear directly after the hero */}
                        {sectionId === 'hero' && <PromoBannerStrip />}
                    </div>
                );
            })}

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
        </div>
    );
}
