'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/api/products';
import { ShoppingCart, Eye } from 'lucide-react';
import { getSafeImageUrl } from '@/lib/utils';

interface ProductTableRowProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onQuickInquiry: (product: Product) => void;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
    product,
    onAddToCart,
    onQuickInquiry,
}) => {
    const router = useRouter();

    return (
        <div className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-white/5 border border-white/5 transition-all group">
            {/* Image */}
            <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                <img
                    src={getSafeImageUrl(product.image) || '/images/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3
                            className="font-bold text-lg text-white hover:text-gold cursor-pointer truncate font-display transition-colors"
                            onClick={() => router.push(`/products/${product.id}`)}
                        >
                            {product.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-white/10 text-slate-400 bg-white/5">
                                {product.brand}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-white/10 text-slate-400 bg-white/5">
                                {product.category}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
                    <span>SKU: {product.sku}</span>
                    {product.oemCode && <span className="text-gold">OEM: {product.oemCode}</span>}
                </div>
                <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {product.description}
                </p>
            </div>

            {/* Price & Stock */}
            <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-2xl font-bold text-white font-display">
                    ${product.price.toLocaleString()}
                </div>
                <div className="mt-1">
                    {product.stock > 0 ? (
                        <Badge className={product.stock > 10 ? 'bg-green-500' : 'bg-yellow-500'}>
                            {product.stock > 10 ? 'In Stock' : 'Low Stock'} ({product.stock})
                        </Badge>
                    ) : (
                        <Badge className="bg-red-500">Out of Stock</Badge>
                    )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-slate-400 sm:justify-end">
                    <span className="text-gold">⭐ {product.rating}</span>
                    <span>({product.reviews})</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <Button
                    size="sm"
                    variant="outline"
                    className="glass border-white/10 hover:bg-white/10 hover:text-white transition-all text-slate-300"
                    onClick={() => router.push(`/products/${product.id}`)}
                >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                </Button>
                <Button
                    size="sm"
                    className="btn-gold text-navy font-bold hover:scale-105 transition-transform"
                    onClick={() => onAddToCart(product)}
                >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add
                </Button>
            </div>
        </div>
    );
};
