"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, Star } from "lucide-react";
import Link from "next/link";
import { getProducts, Product } from "@/api/products";
import { addToCart } from "@/api/cart";
import { toast } from "sonner";

export function ProductsSection() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch products and ensure we always have visible products
                const data = await getProducts({ limit: 12 });
                console.log('Fetched products:', data.products.length);

                // Use all products if no rating filter matches
                const visibleProducts = data.products.slice(0, 8);
                console.log('Displaying products:', visibleProducts.length);
                setProducts(visibleProducts);
            } catch (error) {
                console.error("Failed to fetch products", error);
                // Fallback to empty array to prevent issues
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / 4));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? Math.ceil(products.length / 4) - 1 : prev - 1
        );
    };

    const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = product.id;

        addToCart({
            id: productId,
            product_id: productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image?.url ?? '/placeholder-product.jpg',
            sku: product.sku || `SKU-${productId.slice(0, 5)}`,
            type: 'product'
        });
        toast.success(`${product.name} added to cart!`);
    };

    return (
        <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden bg-navy">
            {/* Background Excellence Visual */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                <img
                    src="/images/home/excellence.png"
                    alt=""
                    className="w-full h-full object-cover grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/80 to-[var(--color-bg-primary)]" />
            </div>

            <div className="container-premium relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
                >
                    <div className="max-w-2xl">
                        <span className="micro-label mb-4 block text-[var(--color-accent)]">FEATURED PRODUCTS</span>
                        <h2 className="heading-md text-white">Top-Rated Industrial Components</h2>
                        <p className="text-white/60 mt-2 text-lg">Discover our highest-rated products trusted by professionals worldwide</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={prevSlide}
                            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                        >
                            ←
                        </button>
                        <button
                            onClick={nextSlide}
                            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                        >
                            →
                        </button>
                    </div>
                </motion.div>

                {/* Products Display */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        <span className="ml-3 text-white">Loading featured products...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-2xl font-bold text-white mb-4">No Products Available</h3>
                        <p className="text-white/60 mb-6">Products will appear here shortly</p>
                        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-navy font-bold rounded-lg">
                            Browse All Products
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div ref={containerRef} className="relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-[var(--color-accent)]/50 transition-all duration-300"
                                >
                                    <Link href={`/products/${product.id}`} className="block">
                                        {/* Image */}
                                        <div className="aspect-square relative overflow-hidden bg-navy/20">
                                            <img
                                                src={product.image?.url ?? '/placeholder-product.jpg'}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            {/* Badges */}
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className="px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-xs font-bold uppercase tracking-wider rounded-full">
                                                    Featured
                                                </span>
                                            </div>
                                            
                                            {/* Quick Add */}
                                            <button
                                                onClick={(e) => handleQuickAdd(e, product)}
                                                className="absolute bottom-4 right-4 z-20 w-11 h-11 bg-[var(--color-accent)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:scale-110 active:scale-90"
                                                title="Add to Cart"
                                            >
                                                <Plus className="w-5 h-5 text-[var(--color-bg-primary)]" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="text-xs text-[var(--color-accent)] uppercase tracking-wider mb-2 font-semibold">
                                                {product.brand || "OEM"}
                                            </div>
                                            <h4 className="text-lg mb-3 line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors font-semibold text-white">
                                                {product.name}
                                            </h4>
                                            <div className="mt-auto pt-4 flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-white">
                                                        ${product.price}
                                                    </span>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[var(--color-accent)] transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* View All Products CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center mt-12"
                >
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-accent)] text-navy font-bold rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors shadow-lg shadow-[var(--color-accent)]/20"
                    >
                        Explore All Products
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
