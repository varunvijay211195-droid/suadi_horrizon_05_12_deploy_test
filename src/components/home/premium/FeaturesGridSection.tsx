'use client';

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Shield, Clock, Users, Truck, Wrench, Settings } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function FeaturesGridSection() {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    const features = [
        {
            icon: Shield,
            title: t('home.features.oem_title'),
            description: t('home.features.oem_desc'),
            href: "/about",
        },
        {
            icon: Clock,
            title: t('home.features.delivery_title'),
            description: t('home.features.delivery_desc'),
            href: "/shipping",
        },
        {
            icon: Users,
            title: t('home.features.support_title'),
            description: t('home.features.support_desc'),
            href: "/contact",
        },
        {
            icon: Wrench,
            title: t('home.features.install_title'),
            description: t('home.features.install_desc'),
            href: "/installation",
        },
        {
            icon: Truck,
            title: t('home.features.logistics_title'),
            description: t('home.features.logistics_desc'),
            href: "/shipping",
        },
        {
            icon: Settings,
            title: t('home.features.qa_title'),
            description: t('home.features.qa_desc'),
            href: "/warranty",
        },
    ];

    return (
        <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden">
            <div className="container-premium">
                <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-12 md:p-20 lg:p-24 relative overflow-hidden mx-auto w-full">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gold/5 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        {/* Section Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center justify-center text-center gap-6 mb-20 relative z-10 w-full"
                        >
                            <div className="max-w-3xl flex flex-col items-center">
                                <span className="micro-label mb-6 block text-center tracking-[0.3em] uppercase">{t('home.features.label')}</span>
                                <h2 className="heading-md mb-8 text-center">{t('home.features.title')}</h2>
                                <p className="text-body-lg text-white/60 leading-relaxed text-center">
                                    {t('home.features.subtitle')}
                                </p>
                                <div className="w-16 h-px bg-gold/50 mt-8 mx-auto" />
                            </div>
                        </motion.div>

                        {/* Features Grid */}
                        <div ref={containerRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group"
                                >
                                    <div className="glass-premium rounded-3xl p-10 h-full border border-white/5 hover:border-gold/20 transition-all duration-500 relative flex flex-col items-center text-center">
                                        {/* Icon */}
                                        <div className="w-14 h-14 rounded-2xl bg-gold/5 flex items-center justify-center mb-8 border border-white/5 group-hover:bg-gold/10 transition-colors">
                                            <feature.icon className="w-6 h-6 text-gold/80" />
                                        </div>
 
                                        {/* Content */}
                                        <h4 className="mb-4 text-xl font-bold tracking-tight text-white group-hover:text-gold transition-colors text-center">
                                            {feature.title}
                                        </h4>
                                        <p className="text-sm text-white/50 mb-8 leading-relaxed font-medium text-center">
                                            {feature.description}
                                        </p>
 
                                        {/* Learn More Link */}
                                        <Link
                                            href={feature.href}
                                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 hover:text-gold transition-colors justify-center"
                                        >
                                            {t('home.features.learn_more')}
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
