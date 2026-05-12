import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart, Eye, CheckCircle2, Circle, Star, ArrowRight, Package, Truck, FileText, Heart, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Product } from '@/api/products';
import { useComparison } from '@/contexts/ComparisonContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { getSafeImageUrl } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickInquiry: (product: Product) => void;
  index?: number;
  selectedEquipment?: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickInquiry,
  index = 0,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  // Comparison functionality
  const { comparisonProducts, addProduct, removeProduct, isFull } = useComparison();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isInComparison = comparisonProducts.includes(product.id);
  const inWishlist = isInWishlist(product.id);
  const canAddToComparison = !isFull || isInComparison;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative h-full"
    >
      <Card className="h-full border border-white/[0.08] bg-navy-light/30 backdrop-blur-md hover:border-gold/30 hover:bg-navy-light/50 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl">
        {/* Image Container with Actions */}
        <div className="relative aspect-[16/10] overflow-hidden bg-white/5 border-b border-white/[0.05]">
          <motion.img
            src={getSafeImageUrl(product.image) || '/images/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
            whileHover={{ scale: 1.1 }}
          />

          {/* Progress Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent opacity-80" />

          {/* Floating Actions (Wishlist/Compare) */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
            <button
              onClick={(e) => {
                e.stopPropagation();
                inWishlist ? removeFromWishlist(product.id) : addToWishlist(product.id);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${inWishlist ? 'bg-red-500 border-red-500 text-white' : 'bg-black/40 border-white/20 text-white hover:text-red-400'
                }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                isInComparison ? removeProduct(product.id) : addProduct(product.id);
              }}
              disabled={!canAddToComparison}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${isInComparison ? 'bg-gold border-gold text-navy' : 'bg-black/40 border-white/20 text-white hover:text-gold'
                }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isInComparison ? '' : 'opacity-40'}`} />
            </button>
          </div>

          {/* Quick Stats Badge */}
          <div className="absolute top-4 left-4">
            {product.inStock ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AVAILABLE
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md">
                BACKORDER
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <CardContent className="flex-1 p-4 space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-gold/60 uppercase tracking-[0.2em] font-mono">
                {product.brand} // {product.sku}
              </span>
              <h3 className="text-base font-black text-white leading-tight tracking-tight group-hover:text-gradient-gold transition-all duration-300 line-clamp-2">
                {product.name}
              </h3>
            </div>
            <div className="text-right">
              <span className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5">MSRP</span>
              <span className="text-lg font-black text-white leading-none tracking-tighter">
                ${product.price.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-xs text-white/40 leading-relaxed font-medium line-clamp-2 italic">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.05]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              </div>
              <div>
                <span className="block text-[8px] font-black text-white/20 tracking-widest uppercase">Rating</span>
                <span className="text-xs font-bold text-white">{product.rating ? Number(product.rating).toFixed(1) : '0.0'} / 5.0</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-gold" />
              </div>
              <div>
                <span className="block text-[8px] font-black text-white/20 tracking-widest uppercase">Shipping</span>
                <span className="text-xs font-bold text-white">Express</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Action Board */}
        <div className="p-4 pt-0 flex bg-navy-light/10 border-t border-white/[0.03]">
          <div className="flex-1 flex gap-2">
            <Button
              className="flex-1 bg-gold hover:bg-gold-light text-navy font-black tracking-widest uppercase text-[9px] h-10 rounded-xl shadow-[0_4px_20px_rgba(197,160,89,0.2)] hover:shadow-[0_8px_30px_rgba(197,160,89,0.4)] transition-all duration-300"
              onClick={() => onAddToCart(product)}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-2" />
              {t('product_detail.add_to_cart')}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-11 h-11 p-0 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-gold/50"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="w-11 h-11 p-0 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-gold/50"
                onClick={() => onQuickInquiry(product)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

