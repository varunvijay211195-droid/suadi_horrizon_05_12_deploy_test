'use client';

import React from 'react';
import { ShoppingCart, Star, TrendingDown, TrendingUp, CheckCircle, XCircle, Award } from 'lucide-react';
import { IProduct } from '@/types/product';
import { ComparisonHighlight } from '@/lib/comparison';
import Image from 'next/image';

interface ComparisonTableProps {
    products: IProduct[];
    highlights: ComparisonHighlight[];
    highlightDifferences?: boolean;
}

export default function ComparisonTable({
    products,
    highlights,
    highlightDifferences = false
}: ComparisonTableProps) {

    const isHighlighted = (productId: string, type: ComparisonHighlight['type']) => {
        return highlights.some(h => h.productId === productId && h.type === type);
    };

    const getValueDifference = (key: string, value: any, allValues: any[]) => {
        if (!highlightDifferences) return false;
        const uniqueValues = [...new Set(allValues)];
        return uniqueValues.length > 1;
    };

    return (
        <div className="min-w-full">
            <table className="w-full">
                <thead className="sticky top-0 z-10 bg-navy border-b border-white/20">
                    <tr>
                        <th className="sticky left-0 z-20 bg-navy px-6 py-4 text-left text-sm font-semibold text-white/70 min-w-[200px]">
                            Feature
                        </th>
                        {products.map((product) => (
                            <th key={product.id} className="px-6 py-4 min-w-[250px]">
                                <div className="text-center">
                                    {/* Product Image */}
                                    <div className="relative w-24 h-24 mx-auto mb-3 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                        {product.image ? (
                                            <Image
                                                src={
                                                    typeof product.image === 'object'
                                                        ? product.image.url
                                                        : product.image
                                                }
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/30">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Name */}
                                    <div className="text-sm font-semibold text-white mb-1 line-clamp-2">
                                        {product.name}
                                    </div>

                                    {/* SKU */}
                                    <div className="text-xs text-white/50 font-mono">
                                        {product.sku}
                                    </div>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                    {/* Price Row */}
                    <tr className="hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-10 bg-navy px-6 py-4 text-sm font-medium text-white/70">
                            Price
                        </td>
                        {products.map((product) => (
                            <td key={product.id} className="px-6 py-4 text-center">
                                <div className="relative inline-block">
                                    <div className={`text-2xl font-bold ${isHighlighted(product.id, 'lowest_price')
                                            ? 'text-yellow'
                                            : 'text-white'
                                        }`}>
                                        ${product.price.toFixed(2)}
                                    </div>
                                    {isHighlighted(product.id, 'lowest_price') && (
                                        <div className="absolute -top-2 -right-8">
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow/20 border border-yellow rounded-full">
                                                <TrendingDown className="w-3 h-3 text-yellow" />
                                                <span className="text-xs font-medium text-yellow">Best</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Brand Row */}
                    <tr className="hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-10 bg-navy px-6 py-4 text-sm font-medium text-white/70">
                            Brand
                        </td>
                        {products.map((product) => (
                            <td key={product._id} className="px-6 py-4 text-center">
                                <div className={`text-sm font-medium ${getValueDifference('brand', product.brand, products.map(p => p.brand))
                                        ? 'text-white'
                                        : 'text-white/70'
                                    }`}>
                                    {product.brand}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Category Row */}
                    <tr className="hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-10 bg-navy px-6 py-4 text-sm font-medium text-white/70">
                            Category
                        </td>
                        {products.map((product) => (
                            <td key={product.id} className="px-6 py-4 text-center">
                                <div className={`text-sm ${getValueDifference('category', product.category, products.map(p => p.category))
                                        ? 'text-white'
                                        : 'text-white/70'
                                    }`}>
                                    {product.category}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Availability Row */}
                    <tr className="hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-10 bg-navy px-6 py-4 text-sm font-medium text-white/70">
                            Availability
                        </td>
                        {products.map((product) => (
                            <td key={product.id} className="px-6 py-4">
                                <div className="flex flex-col items-center gap-2">
                                    {product.inStock ? (
                                        <>
                                            <div className="flex items-center gap-2 text-green-400">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-sm font-medium">In Stock</span>
                                            </div>
                                            <div className="text-xs text-white/60">{product.stock} units</div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-400">
                                            <XCircle className="w-4 h-4" />
                                            <span className="text-sm font-medium">Out of Stock</span>
                                        </div>
                                    )}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Rating Row */}
                    <tr className="hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-10 bg-navy px-6 py-4 text-sm font-medium text-white/70">
                            Rating
                        </td>
                        {products.map((product) => (
                            <td key={product.id} className="px-6 py-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Star className={`w-4 h-4 ${isHighlighted(product.id, 'highest_rating')
                                                ? 'fill-yellow text-yellow'
                                                : 'fill-white/20 text-white/20'
                                            }`} />
                                        <span className={`text-sm font-medium ${isHighlighted(product.id, 'highest_rating')
                                                ? 'text-yellow'
                                                : 'text-white'
                                            }`}>
                                            {product.rating?.toFixed(1) || 'N/A'}
                                        </span>
                                    </div>
                                    {product.reviews !== undefined && (
                                        <div className="text-xs text-white/60">
                                            {product.reviews} {product.reviews === 1 ? 'review' : 'reviews'}
                                        </div>
                                    )}
                                    {isHighlighted(product.id, 'highest_rating') && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow/20 border border-yellow rounded-full">
                                            <Award className="w-3 h-3 text-yellow" />
                                            <span className="text-xs font-medium text-yellow">Top Rated</span>
                                        </div>
                                    )}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* OEM Code Row */}
                    <tr className="hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-10 bg-navy px-6 py-4 text-sm font-medium text-white/70">
                            OEM Code
                        </td>
                        {products.map((product) => (
                            <td key={product.id} className="px-6 py-4 text-center">
                                <div className="text-sm font-mono text-white/70">
                                    {product.oemCode || 'N/A'}
                                </div>
                            </td>
                        ))}
                    </tr>

                    {/* Compatibility Row */}
                    {products.some(p => p.compatibility && p.compatibility.length > 0) && (
                        <tr className="hover:bg-white/5 transition-colors">
                            <td className="sticky left-0 z-10 bg-navy px-6 py-4 text-sm font-medium text-white/70">
                                Compatibility
                            </td>
                            {products.map((product) => (
                                <td key={product.id} className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {product.compatibility && product.compatibility.length > 0 ? (
                                            product.compatibility.slice(0, 3).map((comp, idx) => (
                                                <div key={idx} className="text-xs text-white/70 font-mono">
                                                    {comp}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-white/40">Not specified</div>
                                        )}
                                        {product.compatibility && product.compatibility.length > 3 && (
                                            <div className="text-xs text-white/40">
                                                +{product.compatibility.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    )}

                    {/* Action Row */}
                    <tr className="bg-white/5">
                        <td className="sticky left-0 z-10 bg-navy/50 px-6 py-4"></td>
                        {products.map((product) => (
                            <td key={product.id} className="px-6 py-4">
                                <button
                                    className="w-full px-4 py-3 bg-yellow text-navy font-semibold rounded-lg hover:bg-yellow/90 transition-all hover:scale-105 flex items-center justify-center gap-2"
                                    disabled={!product.inStock}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
