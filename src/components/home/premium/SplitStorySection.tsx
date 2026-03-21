"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

function Counter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
    const [count, setCount] = useState(inView ? 0 : value);

    useEffect(() => {
        if (!inView || count === value) return;

        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [inView, value, count]);

    return (
        <span className="text-3xl md:text-4xl font-bold text-gradient-gold block mb-1">
            {count}{suffix}
        </span>
    );
}

export function SplitStorySection() {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

    return (
        <section ref={containerRef} className="py-20 md:py-28 lg:py-32 relative overflow-hidden">
            <div className="container-premium">
                <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col lg:flex-row relative">

                    {/* Left - Image with Parallax */}
                    <div className="w-full lg:w-[42%] relative h-[400px] lg:h-auto overflow-hidden">
                        <motion.div
                            className="absolute inset-0"
                            style={{ y }}
                        >
                            <div
                                className="absolute inset-x-0 -inset-y-20 bg-cover bg-center"
                                style={{
                                    backgroundImage: "url('/images/home/excellence.png')",
                                }}
                            />
                        </motion.div>

                        {/* Shaded Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent hidden lg:block" />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent lg:hidden" />

                        {/* Gold Accent Line (Vertical Divider) */}
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent hidden lg:block" />
                    </div>

                    {/* Right - Content */}
                    <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-20 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="max-w-xl">
                            {/* Micro Label */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="flex items-center gap-3 mb-6"
                            >
                                <div className="w-8 h-px bg-gold/50" />
                                <span className="micro-label uppercase">{t('home.story.label')}</span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h2
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="heading-md mb-8"
                            >
                                {t('home.story.title_prefix')}<span className="text-gradient-gold">{t('home.story.title_accent')}</span>{t('home.story.title_suffix')}
                            </motion.h2>

                            {/* Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="space-y-6 mb-12"
                            >
                                <p className="text-body-lg text-white/70 leading-relaxed">
                                    {t('home.story.p1')}
                                </p>
                                <p className="text-body-lg text-white/70 leading-relaxed">
                                    {t('home.story.p2')}
                                </p>
                            </motion.div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-6 md:gap-10 py-10 border-y border-white/5 mb-10">
                                <div className="text-center lg:text-left rtl:lg:text-right">
                                    <Counter value={500} suffix="+" inView={isInView} />
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('home.story.stat1_label')}</div>
                                </div>
                                <div className="text-center lg:text-left rtl:lg:text-right">
                                    <Counter value={24} suffix="/7" inView={isInView} />
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('home.story.stat2_label')}</div>
                                </div>
                                <div className="text-center lg:text-left rtl:lg:text-right">
                                    <Counter value={98} suffix="%" inView={isInView} />
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('home.story.stat3_label')}</div>
                                </div>
                            </div>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            >
                                <Link href="/about" className="btn-primary inline-flex items-center gap-2">
                                    {t('home.story.cta')}
                                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


