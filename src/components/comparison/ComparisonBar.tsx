'use client';

import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useComparison } from '@/contexts/ComparisonContext';
import { IProduct } from '@/types/product';

interface ComparisonBarProps {
    products: IProduct[];
    onCompare: () => void;
}

export default function ComparisonBar({ products, onCompare }: ComparisonBarProps) {
    const { comparisonProducts, removeProduct, clearAll, count } = useComparison();

    // Get the actual product objects for selected IDs
    const selectedProducts = products.filter(p => comparisonProducts.includes(p.id));

    if (count === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
            <div className="bg-navy/95 backdrop-blur-lg border-t border-white/20 shadow-2xl">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Selected Products */}
                        <div className="flex-1 flex items-center gap-3 overflow-x-auto">
                            <div className="flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-yellow/20 border-2 border-yellow rounded-full flex items-center justify-center">
                                        <span className="text-yellow font-bold">{count}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">
                                            {count} {count === 1 ? 'Product' : 'Products'} Selected
                                        </div>
                                        <div className="text-xs text-white/60">
                                            {6 - count} more available
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Pills */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                {selectedProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg group hover:bg-white/15 transition-colors"
                                    >
                                        <div className="text-sm text-white truncate max-w-[150px]">
                                            {product.name}
                                        </div>
                                        <button
                                            onClick={() => removeProduct(product.id)}
                                            className="text-white/50 hover:text-white transition-colors"
                                            aria-label={`Remove ${product.name}`}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <button
                                onClick={clearAll}
                                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={onCompare}
                                disabled={count < 2}
                                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${count >= 2
                                        ? 'bg-yellow text-navy hover:bg-yellow/90 hover:scale-105'
                                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                                    }`}
                            >
                                Compare Now
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
