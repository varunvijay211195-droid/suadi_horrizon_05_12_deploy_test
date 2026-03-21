'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, MessageCircle, Shield, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getProductById, getRelatedProducts, Product } from '@/api/products';
import { addToCart } from '@/api/cart';
import { toast } from 'sonner';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ProductCard } from '@/components/ProductCard';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>('');

    useEffect(() => {
        const loadProduct = async () => {
            setIsLoading(true);
            try {
                const res = await getProductById(productId);
                setProduct(res);
                setActiveImage(
                    typeof res.image === 'object'
                        ? res.image?.url || ''
                        : res.image || ''
                );

                // Load related products
                try {
                    const related = await getRelatedProducts(productId);
                    setRelatedProducts(related);
                } catch (err) {
                    console.log('No related products found');
                }
            } catch (error) {
                console.error('Failed to load product:', error);
                toast.error('Failed to load product');
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            loadProduct();
        }
    }, [productId]);

    const handleAddToCart = () => {
        if (!product) return;

        addToCart({
            id: product.id,
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: typeof product.image === 'object' ? (product.image?.url || '') : (product.image || ''),
            sku: product.sku,
            type: 'product',
        });

        toast.success(`${product.name} added to cart`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="container-premium text-center">
                    <h1 className="text-2xl text-white mb-4">Product not found</h1>
                    <Button onClick={() => router.push('/products')}>
                        Back to Products
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white py-8">
            <div className="container-premium">
                {/* Breadcrumb */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => router.push('/')}>Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => router.push('/products')}>Products</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{product.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6 text-gray-300 hover:text-white"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Product Images */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Main Image */}
                        <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-4">
                            <img
                                src={
                                    activeImage ||
                                    (typeof product.image === 'object'
                                        ? product.image?.url || ''
                                        : product.image || '')
                                }
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Thumbnail Images */}
                        {(product.gallery?.length || 0) > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {([product.image, ...(product.gallery || [])] as Array<string | { url?: string }>)
                                    .filter(Boolean)
                                    .map((img, index) => {
                                        const url = typeof img === 'object' ? img.url || '' : img;

                                        return (
                                            <button
                                                key={index}
                                                className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === url ? 'border-yellow-500' : 'border-transparent'
                                                    }`}
                                                onClick={() => setActiveImage(url)}
                                            >
                                                <img src={url} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        );
                                    })}
                            </div>
                        )}
                    </motion.div>

                    {/* Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Brand Badge */}
                        {product.brand && (
                            <span className="inline-block bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-medium">
                                {product.brand}
                            </span>
                        )}

                        {/* Title */}
                        <h1 className="text-3xl font-bold">{product.name}</h1>

                        {/* SKU */}
                        <p className="text-gray-400">SKU: {product.sku}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`text-lg ${i < (product.rating || 0) ? 'text-yellow-500' : 'text-gray-600'
                                            }`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-gray-400">({product.reviews || 0} reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-yellow-500">
                                ${product.price.toLocaleString()}
                            </span>
                            {product.original_price && (
                                <span className="text-xl text-gray-500 line-through">
                                    ${product.original_price?.toLocaleString()}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-300">{product.description}</p>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="text-gray-300">Quantity:</span>
                            <div className="flex items-center border border-gray-700 rounded-lg">
                                <button
                                    className="px-3 py-2 hover:bg-gray-800"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    -
                                </button>
                                <span className="px-4 py-2">{quantity}</span>
                                <button
                                    className="px-3 py-2 hover:bg-gray-800"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                            </Button>
                            <a
                                href={`https://wa.me/?text=I'm interested in ${encodeURIComponent(product.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Chat on WhatsApp
                            </a>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Shield className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm">2 Year Warranty</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Truck className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm">Free Shipping</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <RefreshCw className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm">30-Day Returns</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <MessageCircle className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm">24/7 Support</span>
                            </div>
                        </div>

                        {/* Specifications */}
                        <Separator className="bg-gray-700" />

                        <Tabs defaultValue="specs" className="w-full">
                            <TabsList className="bg-gray-800">
                                <TabsTrigger value="specs">Specifications</TabsTrigger>
                                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                            </TabsList>
                            <TabsContent value="specs" className="mt-4">
                                <div className="space-y-2">
                                    {product.specs &&
                                        Object.entries(product.specs || {}).map(([key, value]) => (
                                            <div key={key} className="flex justify-between py-2 border-b border-gray-800">
                                                <span className="text-gray-400">{key}</span>
                                                <span className="font-medium">{String(value)}</span>
                                            </div>
                                        ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="shipping" className="mt-4">
                                <div className="text-gray-300 space-y-2">
                                    <p>• Free shipping on orders over $500</p>
                                    <p>• Standard delivery: 5-7 business days</p>
                                    <p>• Express delivery: 2-3 business days</p>
                                    <p>• International shipping available</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct, index) => (
                                <ProductCard
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                    onAddToCart={(p) => {
                                        addToCart({
                                            id: p.id,
                                            product_id: p.id,
                                            name: p.name,
                                            price: p.price,
                                            quantity: 1,
                                            image: typeof p.image === 'object' ? (p.image?.url || '') : (p.image || ''),
                                            sku: p.sku,
                                            type: 'product',
                                        });
                                        toast.success(`${p.name} added to cart`);
                                    }}
                                    onQuickInquiry={() => { }}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
