'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, MessageCircle, Shield, Truck, RefreshCw, Info, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getProductById, getRelatedProducts, Product } from '@/api/products';
import { addToCart } from '@/api/cart';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ProductCard } from '@/components/ProductCard';

const specTranslations: Record<string, string> = {
    'MALZEME': 'Material',
    'AĞIRLIK': 'Weight',
    'KUTU ÖLÇÜSÜ': 'Dimensions',
    'KUTU İÇERİĞİ': 'Box Content',
    'OEM': 'OEM Number',
    'REFERANS NO': 'Reference Number',
};

const turkishTechnicalTerms: Record<string, string> = {
    'RADYATÖR': 'RADIATOR',
    'ÜST': 'UPPER',
    'ALT': 'LOWER',
    'HORTUM': 'HOSE',
    'BÖLMELİ': 'SECTION',
    'MODEL': 'MODEL',
    'MOTOR': 'ENGINE',
    'YAĞ': 'OIL',
    'HAVA': 'AIR',
    'FİLTRE': 'FILTER',
    'CONTA': 'GASKET',
    'KAPAK': 'COVER',
    'KAYIŞ': 'BELT',
    'GERGİ': 'TENSIONER',
    'POMPA': 'PUMP',
    'SU': 'WATER',
    'YAKIT': 'FUEL',
    'ENJEKTÖR': 'INJECTOR',
    'TURBO': 'TURBO',
    'KOMPLE': 'COMPLETE',
    'TAKIM': 'SET',
    'ÖN': 'FRONT',
    'ARKA': 'REAR',
    'SAĞ': 'RIGHT',
    'SOL': 'LEFT',
    'TOZ': 'DUST',
    'EMİŞ': 'INTAKE',
    'LASTİĞİ': 'RUBBER',
    'FREN': 'BRAKE',
    'DİSKİ': 'DISK',
    'BALATASI': 'PAD',
    'AMORTİSÖR': 'SHOCK ABSORBER',
    'RADYATOR': 'RADIATOR',
    'KAYISI': 'BELT',
    'CONTASI': 'GASKET',
    'MÜŞÜRÜ': 'SENSOR',
    'HORTUMU': 'HOSE',
    'CİVATASI': 'BOLT',
    'SOMUNU': 'NUT',
    'PUL': 'WASHER',
    'KEÇE': 'SEAL',
    'RULMAN': 'BEARING',
    'KAYIS': 'BELT',
    'EMIS': 'INTAKE',
    'LASTIGI': 'RUBBER',
    'MUSURU': 'SENSOR',
    'CIVATASI': 'BOLT',
    'UST': 'UPPER',
    'BOLMELI': 'SECTION'
};

const translateTitle = (title: string, language: string) => {
    if (language !== 'en') return title;
    
    let translated = title;
    
    // Sort terms by length descending to avoid partial replacements
    const sortedTerms = Object.entries(turkishTechnicalTerms).sort((a, b) => b[0].length - a[0].length);
    
    sortedTerms.forEach(([tr, en]) => {
        // Use word boundaries to avoid replacing parts of words (e.g., 'UST' inside 'DUST')
        // We use a regex that looks for start of string, whitespace, or punctuation before/after
        const regex = new RegExp(`(^|\\s|\\(|\\-|\\/)${tr}($|\\s|\\)|\\-|\\/)`, 'gi');
        translated = translated.replace(regex, (match, p1, p2) => `${p1}${en}${p2}`);
    });
    
    return translated;
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
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

    // Parse description to remove redundant fields already shown in UI
    const cleanDescription = product.description
        ? product.description
            .replace(/Reference Number:.*?\n/g, '')
            .replace(/Weight:.*?\n/g, '')
            .replace(/Dimensions:.*?\n/g, '')
            .replace(/Reference Number:.*?$/g, '')
            .replace(/Weight:.*?$/g, '')
            .replace(/Dimensions:.*?$/g, '')
            .replace(/Products are aftermarket parts guaranteed by ANAÇ\./gi, '')
            .replace(/ANAÇ\./gi, '')
            .replace(/\n\n/g, '\n')
            .trim()
        : 'Premium quality technical part.';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white py-12">
            <div className="container-premium">
                {/* Breadcrumb */}
                <Breadcrumb className="mb-8">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink className="text-gray-400 hover:text-yellow-500 uppercase tracking-widest text-[10px] font-bold" onClick={() => router.push('/')}>{t('nav.home')}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-gray-600" />
                        <BreadcrumbItem>
                            <BreadcrumbLink className="text-gray-400 hover:text-yellow-500 uppercase tracking-widest text-[10px] font-bold" onClick={() => router.push('/products')}>{t('nav.spare_parts')}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-gray-600" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-yellow-500 font-bold uppercase tracking-widest text-[10px]">{product.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-8 text-gray-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-[0.2em] text-[10px] font-black"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('product_detail.back_to_catalog')}
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Product Images */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Main Image */}
                        <div className="aspect-square bg-[#111] rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex items-center justify-center p-8 group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img
                                src={
                                    activeImage ||
                                    (typeof product.image === 'object'
                                        ? product.image?.url || ''
                                        : product.image || '')
                                }
                                alt={product.name}
                                className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>

                        {/* Thumbnail Images */}
                        {(product.gallery?.length || 0) > 0 && (
                            <div className="grid grid-cols-5 gap-3">
                                {([product.image, ...(product.gallery || [])] as Array<string | { url?: string }>)
                                    .filter(Boolean)
                                    .map((img, index) => {
                                        const url = typeof img === 'object' ? img.url || '' : img;

                                        return (
                                            <button
                                                key={index}
                                                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === url
                                                    ? 'border-yellow-500 ring-4 ring-yellow-500/10'
                                                    : 'border-white/5 hover:border-white/20 bg-[#111]'
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col h-full"
                    >
                        <div className="mb-6 flex flex-wrap gap-3">
                            <span className="bg-yellow-500/10 text-yellow-500 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                                {product.brand || 'Anac Makina'}
                            </span>
                            {product.category && (
                                <span className="bg-white/5 text-gray-400 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border border-white/5">
                                    {product.category}
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-black mb-6 tracking-tighter leading-[1.1] text-gradient-gold">
                            {translateTitle(product.name, t('common.language_code') === 'ar' ? 'ar' : 'en')}
                        </h1>

                        <div className="flex items-center gap-6 mb-10">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{t('product_detail.system_id')}:</span>
                                <span className="text-white font-mono text-sm bg-white/5 px-3 py-1 rounded-lg border border-white/5">{product.sku}</span>
                            </div>
                            {product.oem_code && (
                                <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{t('product_detail.oem_ref')}:</span>
                                    <span className="text-white font-mono text-sm bg-white/5 px-3 py-1 rounded-lg border border-white/5">{product.oem_code}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 lg:p-10 mb-10 shadow-2xl relative overflow-hidden group">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-500/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-500 via-yellow-500/50 to-transparent opacity-50" />

                            <div className="relative z-10">
                                <div className="mb-2 text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                    {t('product_detail.valuation_label')} <Info className="w-3 h-3 text-yellow-500/50" />
                                </div>

                                <div className="flex items-end gap-3 mb-8">
                                    <span className="text-5xl lg:text-6xl font-black text-white tracking-tighter">
                                        <span className="text-yellow-500">$</span>{product.price.toLocaleString()}
                                    </span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-xl text-gray-600 line-through mb-2">
                                            ${product.originalPrice.toLocaleString()}
                                        </span>
                                    )}
                                    {product.price === 0 && (
                                        <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-2 ml-2 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20">
                                            {t('product_detail.request_quote')}
                                        </span>
                                    )}
                                </div>

                                <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-8" />

                                <p className="text-gray-400 leading-relaxed text-lg mb-4 italic font-medium">
                                    "{cleanDescription}"
                                </p>

                                <div className="text-yellow-500/80 text-[11px] font-bold uppercase tracking-wider mb-10 flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {t('product_detail.aftermarket_guarantee')}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-5">
                                    <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5 w-full sm:w-auto h-14">
                                        <button
                                            className="w-12 h-full flex items-center justify-center text-xl text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        >
                                            -
                                        </button>
                                        <span className="w-14 text-center font-black text-lg">{quantity}</span>
                                        <button
                                            className="w-12 h-full flex items-center justify-center text-xl text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                            onClick={() => setQuantity(quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <Button
                                        className="flex-1 h-14 bg-yellow-500 hover:bg-yellow-400 text-navy font-black text-sm tracking-[0.2em] rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_10px_30px_rgba(234,179,8,0.2)] uppercase"
                                        onClick={handleAddToCart}
                                    >
                                        <ShoppingCart className="w-5 h-5 mr-3" />
                                        {t('product_detail.add_to_cart')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 mb-10">
                            <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/5 flex items-center gap-5 group hover:bg-white/[0.07] transition-all duration-500">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500/20 group-hover:scale-110 transition-all duration-500 shadow-inner">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{t('product_detail.warranty_label')}</div>
                                    <div className="text-sm font-bold text-white/80">{t('product_detail.warranty_value')}</div>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/5 flex items-center gap-5 group hover:bg-white/[0.07] transition-all duration-500">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-500 shadow-inner">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{t('product_detail.delivery_label')}</div>
                                    <div className="text-sm font-bold text-white/80">{t('product_detail.delivery_value')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-6">
                            <a
                                href={`https://wa.me/966570196677?text=Hello, I'm interested in ${encodeURIComponent(product.name)} (SKU: ${product.sku})`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-20 bg-[#25D366]/5 border border-[#25D366]/20 hover:bg-[#25D366]/10 text-[#25D366] px-8 rounded-[2rem] flex items-center justify-between gap-3 font-black text-sm tracking-[0.2em] uppercase transition-all group shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#25D366]/20 rounded-full flex items-center justify-center animate-pulse">
                                        <MessageCircle className="w-6 h-6 fill-[#25D366]" />
                                    </div>
                                    <span>{t('product_detail.whatsapp_support')}</span>
                                </div>
                                <ArrowLeft className="w-5 h-5 rotate-180 transition-transform group-hover:translate-x-2" />
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs Section */}
                <div className="mt-32">
                    <Tabs defaultValue="specs" className="w-full">
                        <TabsList className="bg-[#111] p-1.5 border border-white/5 rounded-[2rem] h-16 flex items-stretch max-w-2xl mx-auto shadow-2xl">
                            <TabsTrigger
                                value="specs"
                                className="flex-1 rounded-[1.5rem] data-[state=active]:bg-yellow-500 data-[state=active]:text-navy data-[state=active]:shadow-xl text-gray-500 font-black tracking-widest uppercase text-[10px] transition-all gap-2"
                            >
                                <Info className="w-4 h-4" /> {t('product_detail.technical_specs')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="cross"
                                className="flex-1 rounded-[1.5rem] data-[state=active]:bg-yellow-500 data-[state=active]:text-navy data-[state=active]:shadow-xl text-gray-500 font-black tracking-widest uppercase text-[10px] transition-all gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> {t('product_detail.cross_reference')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="shipping"
                                className="flex-1 rounded-[1.5rem] data-[state=active]:bg-yellow-500 data-[state=active]:text-navy data-[state=active]:shadow-xl text-gray-500 font-black tracking-widest uppercase text-[10px] transition-all gap-2"
                            >
                                <Truck className="w-4 h-4" /> {t('product_detail.logistics_info')}
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-12 bg-[#111] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                            
                            <TabsContent value="specs" className="m-0 focus-visible:ring-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-white/5">
                                    <div className="p-10 lg:p-16">
                                        <h3 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase">
                                            <div className="w-2 h-8 bg-yellow-500 rounded-full" />
                                            {t('product_detail.primary_specs')}
                                        </h3>
                                        <div className="space-y-2">
                                            {product.specs && Object.entries(product.specs).filter(([_, v]) => v && String(v).trim() !== '').length > 0 ? (
                                                Object.entries(product.specs)
                                                    .filter(([_, v]) => v && String(v).trim() !== '')
                                                    .map(([key, value]) => (
                                                        <div key={key} className="flex flex-col py-5 border-b border-white/[0.03] last:border-0 group hover:bg-white/[0.02] -mx-4 px-4 rounded-xl transition-colors">
                                                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-yellow-500 transition-colors">
                                                                {specTranslations[key.toUpperCase()] || key}
                                                            </span>
                                                            <span className="text-xl font-bold text-white/90">
                                                                {String(value)}
                                                            </span>
                                                        </div>
                                                    ))
                                            ) : (
                                                <div className="text-gray-600 py-10 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                                                    <Info className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                                    <p className="text-xs font-black uppercase tracking-widest italic">{t('product_detail.technical_specs_pending') || 'Technical parameters pending verification'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-10 lg:p-16 bg-white/[0.01]">
                                        <h3 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase">
                                            <div className="w-2 h-8 bg-yellow-500 rounded-full" />
                                            {t('product_detail.system_id')}
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="bg-white/[0.03] rounded-3xl p-8 border border-white/5 group hover:border-yellow-500/20 transition-all duration-500">
                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-3">{t('product_detail.system_id')}</div>
                                                <div className="text-3xl font-mono text-yellow-500 tracking-tighter font-black">{product.sku}</div>
                                            </div>
                                            {product.oem_code && (
                                                <div className="bg-white/[0.03] rounded-3xl p-8 border border-white/5 group hover:border-yellow-500/20 transition-all duration-500">
                                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-3">OEM Master Reference</div>
                                                    <div className="text-3xl font-mono text-white tracking-tighter font-black">{product.oem_code}</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-16 space-y-6">
                                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                                <CheckCircle2 className="w-6 h-6 text-yellow-500 mt-0.5 shrink-0" />
                                                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                    Independently tested for extreme durability in heavy-duty industrial environments. Complies with international ISO manufacturing standards.
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                                <CheckCircle2 className="w-6 h-6 text-yellow-500 mt-0.5 shrink-0" />
                                                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                    Full traceability available for every batch. Digital technical documentation can be requested via our engineering support line.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="cross" className="m-0 p-10 lg:p-16 focus-visible:ring-0">
                                <div className="max-w-4xl">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-2 h-8 bg-yellow-500 rounded-full" />
                                        <h3 className="text-2xl font-black uppercase tracking-tighter">{t('product_detail.interchangeability')}</h3>
                                    </div>
                                    
                                    <p className="text-gray-400 mb-10 leading-relaxed text-lg font-medium">
                                        {t('product_detail.interchangeability_desc')}
                                    </p>

                                    {product.compatibility && product.compatibility.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {product.compatibility.map((code, idx) => (
                                                <div key={idx} className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl p-5 text-center font-mono text-gray-300 transition-all cursor-default group hover:border-yellow-500/30">
                                                    <span className="text-yellow-500/50 text-[10px] block mb-1 group-hover:text-yellow-500 transition-colors">REF</span>
                                                    <span className="font-bold">{code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white/[0.02] rounded-[2.5rem] p-16 text-center border border-dashed border-white/10">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Info className="w-10 h-10 text-gray-600" />
                                            </div>
                                            <div className="text-gray-400 font-bold uppercase tracking-widest mb-2">Internal Component</div>
                                            <p className="text-gray-500 italic max-w-md mx-auto">No external cross-reference data available for this proprietary part.</p>
                                            <Button variant="link" className="text-yellow-500 mt-6 font-black uppercase tracking-widest text-xs">Request Engineering Manual</Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="shipping" className="m-0 p-10 lg:p-16 focus-visible:ring-0 bg-white/[0.01]">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="space-y-6 group">
                                        <div className="w-16 h-16 bg-yellow-500/10 rounded-[1.5rem] flex items-center justify-center text-yellow-500 mb-8 group-hover:bg-yellow-500 group-hover:text-navy transition-all duration-500 shadow-xl">
                                            <Truck className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Logistics Network</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                            We operate a sophisticated logistics chain from our regional hubs directly to your facility. Priority express shipping is available for critical emergency maintenance requirements.
                                        </p>
                                    </div>
                                    <div className="space-y-6 group">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center text-blue-500 mb-8 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-xl">
                                            <Shield className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Secure Handling</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                            Every technical component is vacuum-packed in industrial-grade moisture-sealed protective layers to ensure zero-defect arrival regardless of transit duration.
                                        </p>
                                    </div>
                                    <div className="space-y-6 group">
                                        <div className="w-16 h-16 bg-purple-500/10 rounded-[1.5rem] flex items-center justify-center text-purple-500 mb-8 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-xl">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Certification</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                            All international shipments include full customs documentation, certified certificates of origin, and comprehensive technical material safety data sheets (MSDS).
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-16 bg-black/40 rounded-[2.5rem] p-10 flex flex-wrap items-center justify-between gap-8 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/50 via-yellow-500 to-yellow-500/50 opacity-30" />
                                    
                                    <div className="flex gap-16 flex-wrap">
                                        <div>
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Standard Protocol</div>
                                            <div className="text-2xl font-black tracking-tighter">5-7 Business Days</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Express Network</div>
                                            <div className="text-2xl font-black tracking-tighter text-yellow-500">48-72 Hours</div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 px-8 py-5 rounded-2xl border border-white/10 flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 relative" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Global Status</div>
                                            <div className="text-sm font-black text-emerald-500 uppercase tracking-widest">Immediate Dispatch</div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-40">
                        <div className="flex items-end justify-between mb-16 px-4">
                            <div className="relative">
                                <div className="absolute -top-10 left-0 text-yellow-500/10 text-8xl font-black select-none pointer-events-none uppercase tracking-tighter">
                                    Related
                                </div>
                                <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase relative z-10">
                                    {t('product_detail.similar_components').split(' ')[0]} <span className="text-yellow-500">{t('product_detail.similar_components').split(' ')[1]}</span>
                                </h2>
                                <p className="text-gray-500 mt-2 font-medium tracking-wide">{t('product_detail.similar_subtitle', { category: product.category })}</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-navy font-black uppercase tracking-widest text-[10px] px-8 h-12 rounded-xl transition-all"
                                onClick={() => router.push('/products')}
                            >
                                {t('product_detail.back_to_catalog')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
