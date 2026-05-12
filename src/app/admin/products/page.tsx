"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Filter,
    Download,
    Eye,
    X,
    Upload,
    Image as ImageIcon,
    Box,
    Tag,
    DollarSign,
    Package,
    Layers,
    Save,
    AlertCircle,
    Check,
    Copy,
    ChevronDown,
    MoreHorizontal,
    ExternalLink
} from 'lucide-react';
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';

interface Entity {
    _id: string;
    name: string;
    slug?: string;
}

interface Product {
    _id: string;
    name: string;
    sku: string;
    brand: string | Entity;
    category: string | Entity;
    subcategory?: string;
    price: number;
    image?: string | { url: string; public_id: string };
    description?: string;
    stock: number;
    inStock: boolean;
    isActive: boolean;
}

function AdminProductsPageInner() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 10;

    const [brands, setBrands] = useState<Entity[]>([]);
    const [categories, setCategories] = useState<Entity[]>([]);
    const [loadingEntities, setLoadingEntities] = useState(false);

    // Product form state
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        sku: '',
        brand: '',
        category: '',
        subcategory: '',
        price: 0,
        stock: 0,
        description: '',
        image: '',
        imagePublicId: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [brandFilter, setBrandFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const searchParams = useSearchParams();

    useEffect(() => {
        loadProducts();
        loadEntities();
    }, []);

    const loadEntities = async () => {
        try {
            setLoadingEntities(true);
            const [brandsRes, catsRes] = await Promise.all([
                fetch('/api/brands'),
                fetch('/api/categories')
            ]);

            if (brandsRes.ok) {
                const data = await brandsRes.json();
                // brands API returns a string[], map to Entity shape
                const rawBrands: unknown[] = data.brands || [];
                if (rawBrands.length > 0 && typeof rawBrands[0] === 'string') {
                    setBrands((rawBrands as string[]).map(b => ({ _id: b, name: b })));
                } else {
                    setBrands(rawBrands as Entity[]);
                }
            }

            if (catsRes.ok) {
                const data = await catsRes.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Failed to load companies/categories:', err);
        } finally {
            setLoadingEntities(false);
        }
    };

    // Auto-open add form when ?add=1 is in the URL
    useEffect(() => {
        if (!loading && searchParams.get('add') === '1') {
            openAddForm();
        }
    }, [loading, searchParams]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch('/api/products?limit=1000', { headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to load products');
            }
            const data = await response.json();
            setProducts(data.products || []);
        } catch (err: any) {
            console.error('Failed to load products:', err);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            toast.success('Product deleted successfully');
            loadProducts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete product');
        }
    };

    const openAddForm = () => {
        setEditingProduct(null);
        setFormData({
            _id: `PROD-${Date.now()}`,
            name: '',
            sku: '',
            brand: '',
            category: '',
            subcategory: '',
            price: 0,
            stock: 0,
            description: '',
            image: '',
            imagePublicId: '',
        });
        setShowProductForm(true);
    };

    const openEditForm = (product: Product) => {
        setEditingProduct(product);

        // Handle relational IDs if they are objects
        const brandId = typeof product.brand === 'object' ? product.brand._id : (product.brand || '');
        const categoryId = typeof product.category === 'object' ? product.category._id : (product.category || '');
        const imageUrl = typeof product.image === 'object' ? product.image.url : (product.image || '');

        setFormData({
            _id: product._id,
            name: product.name || '',
            sku: product.sku || '',
            brand: brandId,
            category: categoryId,
            subcategory: product.subcategory || '',
            price: product.price || 0,
            stock: product.stock || 0,
            description: product.description || '',
            image: imageUrl,
            imagePublicId: typeof product.image === 'object' ? product.image.public_id : '',
        });
        setShowProductForm(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, image: previewUrl }));

        // Upload to server
        setIsUploadingImage(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    image: data.url || previewUrl,
                    imagePublicId: data.public_id || ''
                }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Server upload failed, using preview URL');
            }
        } catch (err) {
            toast.error('Upload error, using local preview');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!formData.image) return;

        // If there's a public ID, try to delete from Cloudinary
        if (formData.imagePublicId) {
            try {
                await fetch('/api/upload/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ public_id: formData.imagePublicId }),
                });
            } catch (err) {
                console.warn('Failed to delete image from Cloudinary:', err);
            }
        }

        setFormData(prev => ({ ...prev, image: '', imagePublicId: '' }));
        toast.success('Image removed');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const url = editingProduct
                ? `/api/products/${editingProduct._id}`
                : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';

            // Clean data for API
            const submissionData = {
                ...formData,
                image: formData.image ? {
                    url: formData.image,
                    public_id: formData.imagePublicId
                } : undefined,
                inStock: formData.stock > 0
            };

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save product');
            }

            toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
            setShowProductForm(false);
            loadProducts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const brandObj = product.brand && typeof product.brand === 'object' ? product.brand : null;
        const catObj = product.category && typeof product.category === 'object' ? product.category : null;
        const brandName = brandObj?.name || product.brand || '';
        const catName = catObj?.name || product.category || '';
        const brandId = brandObj?._id || product.brand || '';
        const catId = catObj?._id || product.category || '';

        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(brandName).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBrand = brandFilter === 'all' || String(brandId) === String(brandFilter) || String(brandName) === String(brandFilter);
        const matchesCategory = categoryFilter === 'all' || String(catId) === String(categoryFilter) || String(catName) === String(categoryFilter);

        let matchesTab = true;
        if (activeTab === 'in-stock') matchesTab = product.stock > 0;
        if (activeTab === 'out-of-stock') matchesTab = product.stock === 0;
        if (activeTab === 'low-stock') matchesTab = product.stock > 0 && product.stock < 10;
        if (activeTab === 'active') matchesTab = product.isActive !== false; // handle null/undefined as active

        return matchesSearch && matchesBrand && matchesCategory && matchesTab;
    });

    // Derive unique brands/categories from loaded products as fallback
    const uniqueBrands = [...new Set(products.map(p => {
        const b = p.brand;
        return b && typeof b === 'object' ? b?._id : b;
    }).filter(Boolean))];
    const uniqueCategories = [...new Set(products.map(p => {
        const c = p.category;
        return c && typeof c === 'object' ? c?._id : c;
    }).filter(Boolean))];

    // Use our loaded entities for filters if available, else fallback to product-derived
    const filterBrands = brands.length > 0 ? brands : uniqueBrands.map(b => ({ _id: b, name: b }));
    const filterCategories = categories.length > 0 ? categories : uniqueCategories.map(c => ({ _id: c, name: c }));

    const toggleProductStatus = async (product: Product) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/products/${product._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...product, inStock: !product.inStock }) // Using inStock as isActive proxy for now
            });
            if (res.ok) {
                toast.success('Status updated');
                loadProducts();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * productsPerPage,
        currentPage * productsPerPage
    );

    return (
        <AdminLayout
            title="Products"
            description="Manage and update your product catalog"
            onRefresh={loadProducts}
            onExport={() => {
                const headers = ['ID', 'Name', 'SKU', 'Brand', 'Category', 'Price', 'Stock'];
                const rows = filteredProducts.map(p => [
                    p._id, p.name, p.sku, p.brand, p.category, p.price, p.stock
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Export completed');
            }}
        >
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                    className={`glass rounded-3xl p-6 border transition-all cursor-pointer hover:scale-[1.02] ${activeTab === 'all' ? 'border-gold bg-gold/5' : 'border-white/5 bg-white/[0.02]'}`}
                    onClick={() => setActiveTab('all')}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${activeTab === 'all' ? 'bg-gold/20 border-gold' : 'bg-gold/10 border-gold/20'}`}>
                            <Box className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Products</p>
                            <h4 className="text-2xl font-black text-white font-display">{products.length}</h4>
                        </div>
                    </div>
                </div>
                <div
                    className={`glass rounded-3xl p-6 border transition-all cursor-pointer hover:scale-[1.02] ${activeTab === 'in-stock' ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/[0.02]'}`}
                    onClick={() => setActiveTab('in-stock')}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${activeTab === 'in-stock' ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <Package className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">In Stock</p>
                            <h4 className="text-2xl font-black text-white font-display">
                                {products.filter(p => p.stock > 0).length}
                            </h4>
                        </div>
                    </div>
                </div>
                <div
                    className={`glass rounded-3xl p-6 border transition-all cursor-pointer hover:scale-[1.02] ${activeTab === 'low-stock' ? 'border-red-500 bg-red-500/5' : 'border-white/5 bg-white/[0.02]'}`}
                    onClick={() => setActiveTab('low-stock')}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${activeTab === 'low-stock' ? 'bg-red-500/20 border-red-500' : 'bg-red-500/10 border-red-500/20'}`}>
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Low Stock</p>
                            <h4 className="text-2xl font-black text-white font-display">
                                {products.filter(p => p.stock > 0 && p.stock < 10).length}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/[0.03] border border-white/5 p-1 rounded-2xl inline-flex">
                        <TabsList className="bg-transparent h-10 gap-2">
                            <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-navy px-6 text-[10px] font-black uppercase tracking-widest">All</TabsTrigger>
                            <TabsTrigger value="active" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-6 text-[10px] font-black uppercase tracking-widest">Live</TabsTrigger>
                            <TabsTrigger value="out-of-stock" className="rounded-xl data-[state=active]:bg-red-500 data-[state=active]:text-white px-6 text-[10px] font-black uppercase tracking-widest">Out of Stock</TabsTrigger>
                            <TabsTrigger value="low-stock" className="rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white px-6 text-[10px] font-black uppercase tracking-widest">Low Stock</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 px-6 border-white/5 bg-white/[0.03] text-white/60 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                    <Tag className="h-3.5 w-3.5 mr-2" />
                                    Brand: {brandFilter === 'all' ? 'All' : brandFilter}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-900 border-white/10 text-white min-w-[200px] rounded-xl">
                                <DropdownMenuItem onClick={() => setBrandFilter('all')} className="hover:bg-white/5 cursor-pointer text-xs font-bold uppercase tracking-widest p-3">All Brands</DropdownMenuItem>
                                {filterBrands.map(brand => (
                                    brand && <DropdownMenuItem key={brand._id} onClick={() => setBrandFilter(brand._id)} className="hover:bg-white/5 cursor-pointer text-xs font-bold uppercase tracking-widest p-3">{brand.name}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 px-6 border-white/5 bg-white/[0.03] text-white/60 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                    <Layers className="h-3.5 w-3.5 mr-2" />
                                    Category: {categoryFilter === 'all' ? 'All' : categoryFilter}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-900 border-white/10 text-white min-w-[200px] rounded-xl">
                                <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="hover:bg-white/5 cursor-pointer text-xs font-bold uppercase tracking-widest p-3">All Categories</DropdownMenuItem>
                                {filterCategories.map(cat => (
                                    cat && <DropdownMenuItem key={cat._id} onClick={() => setCategoryFilter(cat._id)} className="hover:bg-white/5 cursor-pointer text-xs font-bold uppercase tracking-widest p-3">{cat.name}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-gold transition-colors" />
                        <Input
                            placeholder="Search catalog by name, model or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-16 bg-white/[0.03] border-white/5 text-white rounded-[1.25rem] h-16 focus:ring-gold/20 focus:border-gold/30 transition-all font-medium text-base shadow-inner"
                        />
                    </div>
                    <div className="flex gap-3">
                        {selectedProducts.length > 0 && (
                            <Button
                                variant="destructive"
                                className="h-16 px-8 rounded-[1.25rem] font-black uppercase text-xs tracking-widest shadow-2xl animate-in fade-in slide-in-from-right-4"
                                onClick={() => {
                                    if (confirm(`Delete ${selectedProducts.length} items?`)) {
                                        // Bulk delete logic would go here
                                        toast.info(`Bulk delete of ${selectedProducts.length} items requested`);
                                    }
                                }}
                            >
                                <Trash2 className="w-5 h-5 mr-3" />
                                Delete ({selectedProducts.length})
                            </Button>
                        )}
                        <Button className="h-16 px-10 bg-gold hover:bg-white text-navy font-black rounded-[1.25rem] transition-all shadow-2xl shadow-gold/10 group" onClick={openAddForm}>
                            <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform" />
                            ADD PRODUCT
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-[2rem] border border-white/5 bg-white/[0.01] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-gold border-t-transparent rounded-full mx-auto mb-6"></div>
                        <p className="text-white/40 font-bold uppercase tracking-widest animate-pulse">Loading products...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/[0.03] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-6 text-left w-10">
                                        <Checkbox
                                            checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedProducts(paginatedProducts.map(p => p._id));
                                                } else {
                                                    setSelectedProducts([]);
                                                }
                                            }}
                                            className="border-white/20 data-[state=checked]:bg-gold data-[state=checked]:text-navy"
                                        />
                                    </th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-display min-w-[300px]">Product</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-display min-w-[150px]">SKU</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-display min-w-[140px]">Price</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-display min-w-[120px]">Stock</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-display min-w-[100px]">Status</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-display w-[120px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-8 py-6">
                                                <Checkbox
                                                    checked={selectedProducts.includes(product._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedProducts(prev => [...prev, product._id]);
                                                        } else {
                                                            setSelectedProducts(prev => prev.filter(id => id !== product._id));
                                                        }
                                                    }}
                                                    className="border-white/20 data-[state=checked]:bg-gold data-[state=checked]:text-navy"
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="w-14 h-14 rounded-xl bg-[#060B12] overflow-hidden border border-white/5 shrink-0 shadow-lg group-hover:border-gold/20 transition-colors">
                                                        {product.image ? (
                                                            <img
                                                                src={typeof product.image === 'object' ? product.image.url : product.image}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/5 font-black text-[10px]">NO_IMG</div>
                                                        )}
                                                    </div>
                                                    <div className="ml-5 flex flex-col justify-center min-w-0">
                                                        <p className="text-white font-bold font-display text-sm group-hover:text-gold transition-colors truncate">{product.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                                                                {product.brand && typeof product.brand === 'object' ? product.brand.name : (product.brand || 'No Brand')}
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                                                                {product.category && typeof product.category === 'object' ? product.category.name : (product.category || 'General')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div
                                                    className="flex items-center gap-2 group/sku cursor-pointer"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(product.sku);
                                                        toast.success('SKU copied');
                                                    }}
                                                >
                                                    <span className="text-white/40 font-mono text-xs font-medium tabular-nums group-hover/sku:text-gold transition-colors">{product.sku}</span>
                                                    <Copy className="w-3 h-3 text-white/0 group-hover/sku:text-white/20 transition-all" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-gold font-black font-display text-base tabular-nums">
                                                        SAR {product.price?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className={`text-base font-black font-mono tabular-nums ${product.stock <= 5 ? 'text-red-500' : product.stock < 15 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                        {product.stock}
                                                    </span>
                                                    <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Available</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        checked={product.inStock}
                                                        onCheckedChange={() => toggleProductStatus(product)}
                                                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/5"
                                                    />
                                                    <Badge className={`text-[8px] font-black uppercase tracking-tighter px-2 h-5 rounded-md border-none ${product.inStock ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                                                        {product.inStock ? 'LIVE' : 'HIDDEN'}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-white hover:bg-white/5" onClick={() => window.open(`/product/${product._id}`, '_blank')}>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-gold hover:bg-gold/10" onClick={() => openEditForm(product)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-10 h-10 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10"
                                                        onClick={() => handleDelete(product._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto">
                                                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                    <Box className="w-8 h-8 text-white/20" />
                                                </div>
                                                <h5 className="text-white font-bold mb-2">No Records Found</h5>
                                                <p className="text-white/30 text-sm">Your catalog is currently empty. Start by adding your first product.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-between px-2">
                <p className="text-xs text-white/20 font-bold uppercase tracking-[0.2em]">
                    Displaying <span className="text-white/60">{paginatedProducts.length}</span> of <span className="text-white/60">{filteredProducts.length}</span> Products
                </p>
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
                    >
                        PREV PAGE.
                    </Button>
                    <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </button>
                        )).slice(0, 5)}
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
                    >
                        NEXT PAGE.
                    </Button>
                </div>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-navy/80 backdrop-blur-xl" onClick={() => setShowProductForm(false)} />

                    <div className="relative z-10 w-full max-w-4xl bg-gray-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">
                                    {editingProduct ? `Product ID: ${editingProduct._id}` : 'Create a new catalog item'}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowProductForm(false)}
                                className="w-12 h-12 rounded-2xl bg-white/5 text-white/40 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Image Col */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Product Image</Label>
                                        <div className="relative group aspect-square rounded-[2rem] bg-navy border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all hover:border-gold/30">
                                            {isUploadingImage ? (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-4"></div>
                                                    <p className="text-[10px] font-black text-gold uppercase tracking-widest">Uploading...</p>
                                                </div>
                                            ) : formData.image ? (
                                                <>
                                                    <img
                                                        src={formData.image}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-navy/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="text-white font-black text-[10px] uppercase tracking-widest bg-gold/20 hover:bg-gold/40"
                                                            onClick={() => fileInputRef.current?.click()}
                                                        >
                                                            Change Image
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="text-red-400 font-black text-[10px] uppercase tracking-widest bg-red-500/20 hover:bg-red-500/40"
                                                            onClick={handleDeleteImage}
                                                        >
                                                            Delete Image
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                                        <Upload className="w-8 h-8 text-white/10" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Upload Product Image</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                                className="hidden"
                                                disabled={isUploadingImage}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            className="w-full h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold text-xs border border-white/5 disabled:opacity-50"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingImage}
                                        >
                                            {isUploadingImage ? 'UPLOADING...' : 'SELECT LOCAL FILE'}
                                        </Button>
                                    </div>

                                    <div className="p-6 bg-gold/[0.03] border border-gold/10 rounded-2xl">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-4 h-4 text-gold mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black text-gold uppercase tracking-wider mb-1">Catalog Tip</p>
                                                <p className="text-[11px] text-white/50 leading-relaxed">
                                                    Use high-quality product images (1000x1000px) to showcase details clearly to your customers.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Col */}
                                <div className="lg:col-span-8 space-y-10">
                                    {/* Section: Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] shrink-0">01 Identity</span>
                                            <div className="h-px w-full bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Product Name</Label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold"
                                                    placeholder="e.g. Caterpillar 320D Excavator Pump"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">SKU</Label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-mono font-bold"
                                                    placeholder="SHI-HYD-9921"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Brand</Label>
                                                <select
                                                    value={formData.brand}
                                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl h-12 px-4 font-bold outline-none focus:border-gold/30 appearance-none"
                                                >
                                                    <option value="" className="bg-navy">Select Brand</option>
                                                    {brands.map((brand, idx) => (
                                                        <option key={`brand-${brand._id || idx}`} value={brand.name} className="bg-navy">
                                                            {brand.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Category</Label>
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl h-12 px-4 font-bold outline-none focus:border-gold/30 appearance-none"
                                                >
                                                    <option value="" className="bg-navy">Select Category</option>
                                                    {categories.map((cat, idx) => (
                                                        <option key={`cat-${cat._id || idx}`} value={cat.name} className="bg-navy">
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Pricing & Stock */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] shrink-0">02 Pricing & Stock</span>
                                            <div className="h-px w-full bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price (SAR)</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                                                    <Input
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                        className="pl-12 bg-white/5 border-white/10 text-white rounded-xl h-12 font-black text-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Stock Level</Label>
                                                <div className="relative">
                                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                                    <Input
                                                        type="number"
                                                        value={formData.stock}
                                                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                        className="pl-12 bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Product ID (Internal)</Label>
                                                <Input
                                                    value={formData._id}
                                                    readOnly={!!editingProduct}
                                                    onChange={e => setFormData({ ...formData, _id: e.target.value })}
                                                    className="bg-white/[0.02] border-white/5 text-white/30 rounded-xl h-12 font-mono text-xs cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Description */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] shrink-0">03 Description</span>
                                            <div className="h-px w-full bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Technical Description</Label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-white/5 border-white/10 text-white rounded-2xl min-h-[120px] p-6 focus:ring-gold/20"
                                                placeholder="Provide detailed technical specifications and compatibility data..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-14 flex-1 border-white/5 bg-white/5 text-white/40 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10"
                                    onClick={() => setShowProductForm(false)}
                                >
                                    CANCEL
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-14 flex-[2] bg-gold hover:bg-white text-navy font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gold/20 flex items-center justify-center"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-navy border-t-transparent animate-spin rounded-full" />
                                            <span>SAVING...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Save className="w-5 h-5" />
                                            <span>SAVE PRODUCT</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div >
                </div >
            )
            }
        </AdminLayout >
    );
}

export default function AdminProductsPage() {
    return (
        <Suspense fallback={null}>
            <AdminProductsPageInner />
        </Suspense>
    );
}
