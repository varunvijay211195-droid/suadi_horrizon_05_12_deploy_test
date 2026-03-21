"use client";

import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategories, Category } from "@/api/categories";

export function FooterSection() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [email, setEmail] = useState(""); // Re-added email state

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data.categories);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        // Add subscription logic here
        console.log("Subscribed:", email); // Using email state
        alert("Thanks for subscribing!");
        setEmail(""); // Clear email after subscribing
    };

    return (
        <footer className="bg-navy border-t border-white/5 pt-32 pb-12 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="block mb-8">
                            <span className="text-2xl font-bold font-display text-white tracking-tight">
                                SAUDI <span className="text-gold">HORIZON</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Premier supplier of heavy machinery parts and industrial equipment across the Kingdom of Saudi Arabia.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Linkedin, Instagram, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white hover:border-gold transition-colors group">
                                    <Icon size={18} className="group-hover:scale-110 transition-transform" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold font-display mb-8">Quick Links</h4>
                        <ul className="space-y-4">
                            {['About', 'Products', 'Categories', 'Contact'].map((item) => (
                                <li key={item}>
                                    <Link href={`/${item.toLowerCase()}`} className="text-slate-400 hover:text-gold transition-colors inline-flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gold/50 group-hover:bg-gold transition-colors"></span>
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="text-white font-bold font-display mb-8">Product Categories</h4>
                        <ul className="space-y-4">
                            {categories.slice(0, 5).map((category) => (
                                <li key={category.id}>
                                    <Link href={`/products?category=${category.name.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-gold transition-colors inline-flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-gold transition-colors"></span>
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                            {categories.length === 0 && (
                                <li className="text-slate-600 italic">Loading categories...</li>
                            )}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-white font-bold font-display mb-8">Stay Updated</h4>
                        <p className="text-slate-400 mb-6 text-sm">
                            Subscribe to our newsletter for the latest stock updates and industry news.
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email} // Added value prop
                                    onChange={(e) => setEmail(e.target.value)} // Added onChange handler
                                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-gold focus:bg-white/10 text-white placeholder:text-slate-500 transition-colors"
                                    required // Added required attribute
                                />
                            </div>
                            <button type="submit" className="btn-gold w-full h-12 flex items-center justify-center gap-2 text-sm font-bold tracking-widest hover:brightness-110">
                                SUBSCRIBE <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Saudi Horizon. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="#" className="hover:text-white transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
