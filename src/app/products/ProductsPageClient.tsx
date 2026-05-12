'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Grid3x3, List, Loader2, SlidersHorizontal, Settings, Search, X, ChevronLeft, ChevronRight, Package, Quote, Zap, Battery, Cpu, Gauge, Wrench, ArrowRight, HelpCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { getProducts, Product } from '@/api/products';
import { getCategories, Category } from '@/api/categories';
import { ProductCard } from '@/components/ProductCard';
import { ProductTableRow } from '@/components/ProductTableRow';
import { FilterSidebar, FilterState } from '@/components/FilterSidebar';
import { RightSidebar } from '@/components/products/RightSidebar';
import { QuickInquiryDialog } from '@/components/QuickInquiryDialog';
import { ShimmerGrid } from '@/components/ui/shimmer';
import { addToCart } from '@/api/cart';
import { toast } from 'sonner';
import { getSafeImageUrl } from '@/lib/utils';
import { ConfiguratorModal } from '@/components/configurator';
import { ComparisonBar, ComparisonModal } from '@/components/comparison';
import { useComparison } from '@/contexts/ComparisonContext';
import { Equipment } from '@/lib/equipment';
import equipmentDatabase from '../../../equipment-database.json';

gsap.registerPlugin(ScrollTrigger);

// Maps short URL slugs → exact Supabase category names
// Also maps real category names from anc_categories.json to themselves (pass-through)
const categoryIdToName: Record<string, string> = {
    // Legacy short-form slugs
    'engine': 'Engine Parts',
    'hydraulics': 'Hydraulic Parts',
    'electrical': 'Electrical Group',
    'transmission': 'Transmission Parts',
    'undercarriage': 'Undercarriage Parts',
    'attachments': 'Bucket & Attachment Group',
    'cooling': 'Radiator & Oil Cooler Group',
    'spare': 'Other',
    // Real category slugs (generated from name_en in anc_categories.json)
    'heavy-casting-group': 'Heavy Casting Group',
    'motor-parts': 'Engine Parts',
    'radiator-oil-cooler-group': 'Radiator & Oil Cooler Group',
    'caterpillar-group': 'Caterpillar Group',
    'zf-hidromek-group': 'ZF Hidromek Group',
    'carraro-parts-group': 'Carraro Parts Group',
    'axle-group': 'Axle Group',
    'brake-pad-group': 'Brake Pad Group',
    'gasket-groups': 'Gasket Groups',
    'steel-bushing-group': 'Steel Bushing Group',
    'bearing-group': 'Bearing Group',
    'gear-group': 'Gear Group',
    'electrical-group': 'Electrical Group',
    'shock-absorber-group': 'Shock Absorber Group',
    'filter-group': 'Filter Group',
    'belt-group': 'Belt Group',
    'turbochargers': 'Turbochargers',
    'shim-washer-group': 'Shim Washer Group',
    'arm-groups': 'Arm Groups',
    'button-switch-group': 'Button / Switch Group',
    'glass-group': 'Glass Group',
    'lamp-group': 'Lamp Group',
    'sensor-switch-group': 'Sensor / Switch Group',
    'pin-group': 'Pin Group',
    'other': 'Other',
    'piston-group': 'Piston Group',
    'piston-seals': 'Piston Seals',
    'labels-stickers': 'Labels / Stickers',
    'pump-groups': 'Pump Groups',
    'bronze-bushing-group': 'Bronze Bushing Group',
    'piston-ring-groups': 'Piston Ring Groups',
    'bolt-group': 'Bolt Group',
    'fan-blade-group': 'Fan Blade Group',
    'exhaust-group': 'Exhaust Group',
    'mount-block-group': 'Mount / Block Group',
    'hose-group': 'Hose Group',
    'universal-joint-group': 'Universal Joint Group',
    'oil-seals': 'Oil Seals',
    'split-bushings': 'Split Bushings',
    'plastic-group': 'Plastic Group',
    'shaft-group': 'Shaft Group',
    'rim-wheel-group': 'Rim / Wheel Group',
    'cover-cap-group': 'Cover / Cap Group',
    'bucket-tooth-group': 'Bucket Tooth Group',
    'bucket-attachment-group': 'Bucket & Attachment Group',
    'throttle-cable-group': 'Throttle Cable Group',
};

import { FloatingParticles, AnimatedConnector } from "@/components/effects/SceneEffects";

export default function ProductsPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('relevance');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        brands: [],
        categories: [],
        priceRange: [0, 5000],
        search: '',
    });
    const [inquiryDialog, setInquiryDialog] = useState({
        open: false,
        productName: '',
        productId: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const gridRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true });

    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 50;

    const [searchInput, setSearchInput] = useState(filters.search);
    const [isSearching, setIsSearching] = useState(false);

    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const { comparisonProducts } = useComparison();
    const [configuratorOpen, setConfiguratorOpen] = useState(false);
    const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    // Keyboard shortcuts for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsSearchFocused(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    const loadCategories = async () => {
        try {
            const res = await getCategories();
            setAllCategories(res.categories || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            console.log('[DEBUG] Loading products with filters:', filters);
            const res = await getProducts({
                category: filters.categories.length > 0 ? filters.categories[0] : undefined,
                brand: filters.brands.length > 0 ? filters.brands[0] : undefined,
                search: filters.search || undefined,
                priceMin: filters.priceRange[0],
                priceMax: filters.priceRange[1],
                page: currentPage,
                limit: productsPerPage
            });
            
            console.log('[DEBUG] Products loaded:', res.products?.length, 'total:', res.total);
            setProducts(res.products || []);
            setTotalCount(res.total || 0);
        } catch (error) {
            console.error('[DEBUG] Failed to load products:', error);
            toast.error('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [filters.categories, filters.brands, filters.search, filters.priceRange, currentPage, sortBy]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        const category = searchParams.get('category');
        const brand = searchParams.get('brand');
        const search = searchParams.get('search');
        const price = searchParams.get('price');
        const sort = searchParams.get('sort');

        const mappedCategory = category ? (categoryIdToName[category] || category) : '';

        let brandList = brand ? brand.split(',') : [];

        let priceRange: [number, number] = [0, 5000];
        if (price) {
            const [min, max] = price.split('-').map(Number);
            if (!isNaN(min) && !isNaN(max)) {
                priceRange = [min, max];
            }
        }

        if (sort && sort !== 'relevance') {
            setSortBy(sort);
        }

        setFilters(prev => {
            const newFilters = {
                ...prev,
                categories: mappedCategory ? [mappedCategory] : prev.categories,
                brands: brandList.length > 0 ? brandList : prev.brands,
                search: search || prev.search,
                priceRange: priceRange[0] > 0 || priceRange[1] < 5000 ? priceRange : prev.priceRange,
            };

            const filtersChanged = JSON.stringify(newFilters) !== JSON.stringify(prev);
            return filtersChanged ? newFilters : prev;
        });

        if (search && search !== searchInput) {
            setSearchInput(search);
        }
    }, [searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                setFilters(prev => ({ ...prev, search: searchInput }));
            }
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput, filters.search]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
        setIsSearching(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filters.brands, filters.categories, filters.priceRange, filters.search, sortBy]);

    useEffect(() => {
        const params = new URLSearchParams();

        if (filters.categories.length > 0) {
            const categoryToId: Record<string, string> = {};
            Object.entries(categoryIdToName).forEach(([id, name]) => {
                categoryToId[name] = id;
            });
            const categoryId = categoryToId[filters.categories[0]] || filters.categories[0];
            params.set('category', categoryId);
        }

        if (filters.brands.length > 0) {
            params.set('brand', filters.brands.join(','));
        }

        if (filters.search) {
            params.set('search', filters.search);
        }

        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) {
            params.set('price', `${filters.priceRange[0]}-${filters.priceRange[1]}`);
        }

        if (sortBy !== 'relevance') {
            params.set('sort', sortBy);
        }

        const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        const currentUrl = window.location.pathname + window.location.search;
        if (newUrl !== currentUrl) {
            window.history.replaceState({}, '', newUrl);
        }
    }, [filters, sortBy]);

    const processedProducts = useMemo(() => {
        let result = [...products];

        // Search filter (client-side backup)
        if (filters.search) {
            const query = filters.search.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.sku.toLowerCase().includes(query) ||
                p.brand.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (filters.categories.length > 0) {
            result = result.filter(p => filters.categories.includes(p.category));
        }

        // Brand filter
        if (filters.brands.length > 0) {
            result = result.filter(p => filters.brands.includes(p.brand));
        }

        // Price range filter
        result = result.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);

        return result;
    }, [products, filters]);

    const paginatedProducts = useMemo(() => {
        return processedProducts;
    }, [processedProducts]);

    const totalPages = Math.ceil(totalCount / productsPerPage);

    useEffect(() => {
        setFilteredProducts(processedProducts);
    }, [processedProducts]);

    const gsapInitialized = useRef(false);
    const prevProductCount = useRef(0);

    useEffect(() => {
        if (isLoading || paginatedProducts.length === 0 || prefersReducedMotion) return;
        if (!gridRef.current) return;
        if (gsapInitialized.current && prevProductCount.current === paginatedProducts.length) return;

        gsapInitialized.current = true;
        prevProductCount.current = paginatedProducts.length;
        const cards = gridRef.current.querySelectorAll<HTMLElement>('.product-card-animated');

        const ctx = gsap.context(() => {
            gsap.fromTo(
                cards,
                {
                    opacity: 0,
                    y: 30,
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: gridRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        }, gridRef);

        return () => {
            ctx.revert();
        };
    }, [paginatedProducts, isLoading, prefersReducedMotion]);

    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: getSafeImageUrl(product.image) || '',
            sku: product.sku,
            type: 'product',
        });

        toast.success(`${product.name} has been added to your cart`);
    };

    const handleQuickInquiry = (product: Product) => {
        setInquiryDialog({
            open: true,
            productName: product.name,
            productId: product.id,
        });
    };

    const handleClearFilters = () => {
        setFilters({
            brands: [],
            categories: [],
            priceRange: [0, 5000],
            search: '',
        });
        setSearchInput('');
        setMobileFilterOpen(false);
    };

    const removeFilter = (type: 'brand' | 'category', value: string) => {
        if (type === 'brand') {
            setFilters({ ...filters, brands: filters.brands.filter(b => b !== value) });
        } else {
            setFilters({ ...filters, categories: filters.categories.filter(c => c !== value) });
        }
    };

    const hasActiveFilters = filters.brands.length > 0 || filters.categories.length > 0 || filters.search;

    const getCategoryStyles = (catName: string) => {
        const name = catName.toLowerCase();
        if (name.includes('engine')) return { icon: Zap, color: 'text-orange-500' };
        if (name.includes('hydraulic')) return { icon: Battery, color: 'text-cyan-500' };
        if (name.includes('elect')) return { icon: Cpu, color: 'text-amber-500' };
        if (name.includes('transm')) return { icon: Gauge, color: 'text-purple-500' };
        if (name.includes('under') || name.includes('axle')) return { icon: Wrench, color: 'text-emerald-500' };
        if (name.includes('attach') || name.includes('bucket')) return { icon: Package, color: 'text-slate-400' };
        if (name.includes('pump')) return { icon: Zap, color: 'text-blue-500' };
        if (name.includes('filter')) return { icon: Battery, color: 'text-red-500' };
        if (name.includes('gear') || name.includes('shaft')) return { icon: Gauge, color: 'text-indigo-500' };
        return { icon: Package, color: 'text-gold' };
    };

    const displayCategories = useMemo(() => {
        return allCategories.slice(0, 15).map(cat => ({
            ...cat,
            ...getCategoryStyles(cat.name)
        }));
    }, [allCategories]);

    return (
        <div className="text-white pb-24 relative min-h-screen" ref={containerRef}>
            <FloatingParticles />

            {/* Extended Sidebar Lines */}
            <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block overflow-hidden">
                <div className="container-premium h-full relative">
                    <div className="absolute left-[332px] top-0 bottom-0 w-px bg-white/[0.02]" />
                    <div className="absolute right-[332px] top-0 bottom-0 w-px bg-white/[0.02] hidden xl:block" />
                </div>
            </div>

            <div className="container-premium relative z-10">
                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <Breadcrumb>
                        <BreadcrumbList className="flex-nowrap">
                            <BreadcrumbItem>
                                <BreadcrumbLink onClick={() => router.push('/')} className="hover:text-gold cursor-pointer transition-colors text-slate-400 text-xs md:text-sm font-bold truncate max-w-[80px] md:max-w-none">
                                    HOME
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-slate-600" />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-gold text-xs md:text-sm font-bold truncate max-w-[100px] md:max-w-none">PARTS CATALOG</BreadcrumbPage>
                            </BreadcrumbItem>
                            {filters.categories.length > 0 && (
                                <>
                                    <BreadcrumbSeparator className="text-slate-600" />
                                    <BreadcrumbItem className="max-w-[120px] md:max-w-none overflow-hidden">
                                        <BreadcrumbPage className="text-white/60 text-xs md:text-sm font-bold truncate">
                                            {filters.categories[0]}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </motion.div>

                {/* Page Header */}
                <div className="mb-12 md:mb-20 flex flex-col lg:flex-row gap-6 md:gap-8 items-start justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 min-w-0"
                    >
                        <span className="micro-label mb-3 md:mb-4 block text-[10px]">OEM CERTIFIED</span>
                        <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                            Industrial <span className="text-gradient-gold">Parts catalog.</span>
                        </h1>
                        <p className="text-white/40 text-xs md:text-sm font-bold uppercase tracking-[0.2em]">
                            {isLoading ? (
                                <>Loading products...</>
                            ) : (
                                <>
                                    Displaying <span className="text-gold">{processedProducts.length}</span> high-performance components
                                </>
                            )}
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-auto"
                    >
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50 group-focus-within:text-gold transition-colors" />
                            <Input
                                type="text"
                                placeholder="Search by Part Name, Number, or OEM SKU..."
                                value={searchInput}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                onChange={handleSearchChange}
                                className="pl-12 pr-12 bg-white/5 border-white/10 text-white h-14 md:h-16 rounded-2xl focus:border-gold/50 focus:ring-0 placeholder:text-white/10 transition-all text-base md:text-lg font-medium shadow-[0_0_50px_rgba(0,0,0,0.2)] group-hover:bg-white/[0.07]"
                            />

                            <AnimatePresence mode="wait">
                                {isSearchFocused && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 right-0 mt-4 bg-navy/95 border border-white/10 rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,0.9)] z-[100] overflow-hidden backdrop-blur-3xl border-t-gold/20 mr-4 ml-4"
                                    >
                                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">SEARCH SYSTEM v2.0 // INSTANT RESULTS</span>
                                        </div>

                                        <div className="max-h-[440px] overflow-y-auto scrollbar-hide">
                                            {searchInput.length > 0 ? (
                                                processedProducts.length > 0 ? (
                                                    <div className="py-2">
                                                        {processedProducts.slice(0, 5).map((p) => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    router.push(`/products/${p.id}`);
                                                                    setIsSearchFocused(false);
                                                                }}
                                                                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 border-b border-white/[0.03] transition-all text-left"
                                                            >
                                                                <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                                                                    <img src={getSafeImageUrl(p.image) || '/images/placeholder.svg'} alt={p.name} className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-sm font-bold text-white">{p.name}</h4>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-10 text-center text-white/30">No components located</div>
                                                )
                                            ) : (
                                                <div className="p-8">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-6 block">CATEGORIES</span>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {displayCategories.slice(0, 4).map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                onClick={() => {
                                                                    setFilters(prev => ({ ...prev, categories: [cat.name] }));
                                                                    setIsSearchFocused(false);
                                                                }}
                                                                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] hover:bg-gold/10 transition-colors"
                                                            >
                                                                <cat.icon className="w-5 h-5 text-white/30" />
                                                                <span className="text-xs font-bold text-white">{cat.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 mb-10 md:mb-12" />
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 relative">
                    {/* Mobile Filter Button */}
                    <div className="lg:hidden mb-6">
                        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                            <SheetTrigger asChild>
                                <Button className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase text-xs">
                                    <SlidersHorizontal className="w-4 h-4 mr-3 text-gold" /> Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[85vw] bg-navy border-white/5 text-white">
                                <SheetTitle className="sr-only">Product Filters</SheetTitle>
                                <SheetDescription className="sr-only">Filter products by category, brand, and more.</SheetDescription>
                                <FilterSidebar filters={filters} onFilterChange={setFilters} />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Left Sidebar - Polished Version */}
                    <aside className="hidden lg:block w-[320px] flex-shrink-0">
                        <div className="sticky top-32 space-y-10">
                            {/* Filter Parts Card */}
                            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 relative group overflow-hidden">
                                <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                    <SlidersHorizontal className="w-40 h-40 text-white rotate-12" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <SlidersHorizontal className="w-5 h-5 text-gold" />
                                        </div>
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] font-mono">
                                            Control Panel
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-black text-white mb-6 tracking-tight uppercase">Filter Parts</h3>
                                    
                                    <FilterSidebar 
                                        filters={filters} 
                                        onFilterChange={setFilters} 
                                    />
                                </div>
                            </div>

                            {/* Integrated Right Sidebar Components */}
                            <RightSidebar />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 md:mb-10 flex flex-wrap gap-2 md:gap-3 items-center py-3 md:py-4 border-b border-white/5"
                            >
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Filtered by:</span>
                                {filters.search && (
                                    <span className="bg-white/5 border border-white/10 text-gold px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                        Search: {filters.search}
                                        <button onClick={() => { setSearchInput(''); setFilters(prev => ({ ...prev, search: '' })); }} className="hover:text-white transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                )}
                                {filters.brands.map(brand => (
                                    <span key={brand} className="bg-white/5 border border-white/10 text-gold px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                        {brand}
                                        <button onClick={() => removeFilter('brand', brand)} className="hover:text-white transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                                {filters.categories.map(cat => (
                                    <span key={cat} className="bg-white/5 border border-white/10 text-gold px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                        {cat}
                                        <button onClick={() => removeFilter('category', cat)} className="hover:text-white transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                                <button
                                    onClick={handleClearFilters}
                                    className="text-[10px] font-black text-red-400 hover:text-red-300 ml-auto uppercase tracking-widest underline underline-offset-4"
                                >
                                    Reset all
                                </button>
                            </motion.div>
                        )}

                        {/* Controls - Condensed on mobile */}
                        <div className="flex flex-col sm:flex-row gap-6 md:gap-10 items-start sm:items-center justify-between mb-12 md:mb-16">
                            <div className="flex gap-4 md:gap-8 w-full sm:w-auto">
                                {/* View Mode Toggle */}
                                <div className="bg-white/5 border border-white/5 p-1 rounded-xl flex gap-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 md:p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold text-navy shadow-[0_0_15px_rgba(197,160,89,0.3)]' : 'text-white/40 hover:text-white'}`}
                                        title="Grid view"
                                    >
                                        <Grid3x3 className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 md:p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold text-navy shadow-[0_0_15px_rgba(197,160,89,0.3)]' : 'text-white/40 hover:text-white'}`}
                                        title="List view"
                                    >
                                        <List className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>

                                {/* Part Configurator Button */}
                                <Button
                                    onClick={() => setConfiguratorOpen(true)}
                                    className="h-10 md:h-[52px] px-4 md:px-6 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-gold/30 transition-all group font-bold text-xs md:text-base"
                                >
                                    <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 group-hover:rotate-90 transition-transform duration-500" />
                                    <span className="hidden sm:inline">Part Configurator</span>
                                    <span className="sm:hidden">Configurator</span>
                                </Button>

                                {/* Help Button - Floating on mobile */}
                                <Button
                                    onClick={() => setHelpOpen(!helpOpen)}
                                    className="lg:hidden h-10 w-10 p-0 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-gold hover:text-navy transition-all"
                                    title="Help"
                                >
                                    <HelpCircle className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="w-full sm:w-64">
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="h-10 md:h-[52px] bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:ring-0 focus:border-gold/50 text-xs md:text-base">
                                        <span className="text-white/40 mr-2 text-[10px] uppercase tracking-widest">Sort:</span>
                                        <SelectValue placeholder="System Default" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-navy border-white/10 text-white">
                                        <SelectItem value="relevance">RELEVANCE</SelectItem>
                                        <SelectItem value="price-low">PRICE: LOW TO HIGH</SelectItem>
                                        <SelectItem value="price-high">PRICE: HIGH TO LOW</SelectItem>
                                        <SelectItem value="newest">LATEST ARRIVALS</SelectItem>
                                        <SelectItem value="rating">HIGHEST RATING</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Mobile Help Panel */}
                        <AnimatePresence>
                            {helpOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="lg:hidden mb-6 p-6 rounded-2xl bg-gold/5 border border-gold/20"
                                >
                                    <div className="flex items-start gap-4">
                                        <MessageCircle className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="text-sm font-bold text-gold mb-2">Need Help?</h4>
                                            <p className="text-xs text-white/60 mb-4">
                                                Our technical engineers are available 24/7 to help you identify the right parts.
                                            </p>
                                            <a
                                                href="https://wa.me/966570196677"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-gold transition-colors"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Chat on WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Loading State */}
                        {isLoading ? (
                            <ShimmerGrid count={6} />
                        ) : (
                            <>
                                {paginatedProducts.length > 0 ? (
                                    viewMode === 'grid' ? (
                                        <div
                                            ref={gridRef}
                                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4 md:gap-5"
                                        >
                                            {paginatedProducts.map((product, index) => (
                                                <div key={product.id} className="product-card-animated">
                                                    <ProductCard
                                                        product={product}
                                                        onAddToCart={handleAddToCart}
                                                        onQuickInquiry={handleQuickInquiry}
                                                        index={index}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div
                                            className="space-y-6"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            {paginatedProducts.map((product) => (
                                                <ProductTableRow
                                                    key={product.id}
                                                    product={product}
                                                    onAddToCart={handleAddToCart}
                                                    onQuickInquiry={handleQuickInquiry}
                                                />
                                            ))}
                                        </motion.div>
                                    )
                                ) : (
                                    <motion.div
                                        className="text-center py-20 md:py-32 rounded-2xl md:rounded-[3rem] bg-white/5 border border-dashed border-white/10"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-navy border border-white/5 mb-6 md:mb-8 shadow-2xl relative">
                                            <Package className="w-10 h-10 md:w-10 md:h-10 text-white/20" />
                                            <div className="absolute inset-0 bg-gold/5 blur-2xl rounded-full" />
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black text-white mb-4 tracking-tight">No Parts Found</h3>
                                        <p className="text-white/40 max-w-sm mx-auto mb-8 leading-relaxed text-xs md:text-sm uppercase tracking-wider font-bold">
                                            No components found matching your criteria. Try adjusting your filters.
                                        </p>
                                        <Button
                                            className="btn-primary h-12 md:h-14 px-8 md:px-10 rounded-xl"
                                            onClick={handleClearFilters}
                                        >
                                            Clear Filters
                                        </Button>
                                    </motion.div>
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-12 md:mt-20 py-8 md:py-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                                            SYSTEM LOG: PAGE {currentPage} OF {totalPages} | RECORDS: {processedProducts.length}
                                        </span>

                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="h-10 w-10 md:h-12 md:w-12 rounded-xl p-0 bg-white/5 border-white/10 text-white hover:bg-gold hover:text-navy disabled:opacity-20"
                                            >
                                                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                                            </Button>

                                            <div className="flex items-center gap-1 md:gap-2">
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum: number;
                                                    if (totalPages <= 5) pageNum = i + 1;
                                                    else if (currentPage <= 3) pageNum = i + 1;
                                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                    else pageNum = currentPage - 2 + i;

                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            onClick={() => setCurrentPage(pageNum)}
                                                            className={`h-10 min-w-[40px] md:h-12 md:min-w-[48px] rounded-xl font-black text-xs transition-all ${currentPage === pageNum ? 'bg-gold text-navy shadow-[0_0_20px_rgba(197,160,89,0.3)]' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}
                                                        >
                                                            {pageNum.toString().padStart(2, '0')}
                                                        </Button>
                                                    );
                                                })}
                                            </div>

                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="h-10 w-10 md:h-12 md:w-12 rounded-xl p-0 bg-white/5 border-white/10 text-white hover:bg-gold hover:text-navy disabled:opacity-20"
                                            >
                                                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
            </div>

            <ComparisonBar products={products} onCompare={() => setComparisonModalOpen(true)} />
            <ComparisonModal products={products.filter(p => comparisonProducts.includes(p.id))} isOpen={comparisonModalOpen} onClose={() => setComparisonModalOpen(false)} />
            <ConfiguratorModal isOpen={configuratorOpen} onClose={() => setConfiguratorOpen(false)} onEquipmentSelect={setSelectedEquipment} selectedEquipment={selectedEquipment} equipmentData={equipmentDatabase} />
            <QuickInquiryDialog open={inquiryDialog.open} onOpenChange={(open) => setInquiryDialog({ ...inquiryDialog, open })} productName={inquiryDialog.productName} productId={inquiryDialog.productId} />

            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
        </div>
    );
}
