"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, X, Loader2, Image as ImageIcon, Link, Calendar, Eye, EyeOff, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Banner {
    _id: string;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    ctaText: string;
    position: string;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
}

interface BannerForm {
    title: string;
    subtitle: string;
    image: string;
    link: string;
    ctaText: string;
    position: string;
    startDate: string;
    endDate: string;
}

const defaultForm: BannerForm = { title: '', subtitle: '', image: '', link: '', ctaText: 'Shop Now', position: 'hero', startDate: '', endDate: '' };

export default function AdminBannersPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [formData, setFormData] = useState<BannerForm>(defaultForm);

    const getHeaders = (): HeadersInit => {
        if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('accessToken');
        return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    };

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/banners', { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setBanners(data.banners || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBanners(); }, []);

    const openAdd = () => { setEditingBanner(null); setFormData(defaultForm); setShowModal(true); };
    const openEdit = (b: Banner) => {
        setEditingBanner(b);
        setFormData({
            title: b.title,
            subtitle: b.subtitle,
            image: b.image,
            link: b.link,
            ctaText: b.ctaText,
            position: b.position,
            startDate: b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : '',
            endDate: b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) { toast.error('Banner title required'); return; }
        setSubmitting(true);
        try {
            const method = editingBanner ? 'PATCH' : 'POST';
            const url = editingBanner ? `/api/admin/banners/${editingBanner._id}` : '/api/admin/banners';
            const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(formData) });
            if (!res.ok) throw new Error();
            toast.success(editingBanner ? 'Banner updated' : 'Banner created');
            setShowModal(false);
            fetchBanners();
        } catch { toast.error('Operation failed'); } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently remove this banner?')) return;
        try {
            const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) throw new Error();
            toast.success('Banner removed');
            setBanners(prev => prev.filter(b => b._id !== id));
        } catch { toast.error('Removal failed'); }
    };

    const handleToggle = async (banner: Banner) => {
        try {
            const res = await fetch(`/api/admin/banners/${banner._id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ isActive: !banner.isActive }) });
            if (!res.ok) throw new Error();
            toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
            setBanners(prev => prev.map(b => b._id === banner._id ? { ...b, isActive: !b.isActive } : b));
        } catch { toast.error('Toggle failed'); }
    };

    const positionColors: Record<string, string> = {
        hero: 'text-gold bg-gold/10 border-gold/20',
        sidebar: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        popup: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        category: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    };

    const inputCls = "w-full bg-white/[0.03] border border-white/10 text-white placeholder-white/20 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-gold/50 focus:bg-white/[0.06] transition-all";

    const activeCount = banners.filter(b => b.isActive).length;

    return (
        <AdminLayout title="Banner Management" description="Manage promotional banners and advertisements" onRefresh={fetchBanners}>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-[#0A1017] border border-white/[0.03] rounded-2xl">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 border-4 border-gold/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                        <Layers className="absolute inset-0 m-auto w-8 h-8 text-gold animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Loading banners...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{activeCount} Active</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-white/20" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{banners.length - activeCount} Draft</span>
                            </div>
                        </div>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-8 py-4 bg-gold hover:bg-gold/90 text-navy rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-gold/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add Banner
                        </button>
                    </div>

                    {/* Banner Grid */}
                    {banners.length === 0 ? (
                        <div className="bg-[#0A1017] border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <Layers className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No Banners Found</p>
                            <button onClick={openAdd} className="px-8 py-3 bg-gold/10 hover:bg-gold/20 text-gold rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gold/20 transition-all">
                                Add First Banner
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {banners.map((banner, idx) => (
                                <motion.div
                                    key={banner._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.06 }}
                                    className={`group bg-[#0A1017] border rounded-2xl overflow-hidden transition-all hover:border-white/10 ${banner.isActive ? 'border-white/[0.06] hover:border-gold/20' : 'border-white/[0.03] opacity-60'}`}
                                >
                                    {/* Image Preview */}
                                    <div className="relative h-44 bg-white/5 overflow-hidden">
                                        {banner.image ? (
                                            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                <ImageIcon className="w-8 h-8 text-white/10" />
                                                <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">No image available</span>
                                            </div>
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        {/* Badges */}
                                        <div className="absolute top-4 left-4 flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${positionColors[banner.position] || 'text-white/40 bg-white/5 border-white/10'}`}>
                                                {banner.position}
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${banner.isActive ? 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${banner.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                                                {banner.isActive ? 'Live' : 'Draft'}
                                            </div>
                                        </div>
                                        {/* CTA Preview */}
                                        {banner.ctaText && (
                                            <div className="absolute bottom-4 left-4">
                                                <span className="bg-gold text-navy px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                                                    {banner.ctaText}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h4 className="text-white font-black text-base uppercase tracking-tight font-display line-clamp-1">{banner.title || 'Untitled'}</h4>
                                            {banner.subtitle && <p className="text-white/30 text-[11px] font-bold mt-1 line-clamp-2 uppercase tracking-widest">{banner.subtitle}</p>}
                                        </div>

                                        {(banner.startDate || banner.endDate) && (
                                            <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                                <Calendar className="w-3 h-3" />
                                                {banner.startDate && <span>{new Date(banner.startDate).toLocaleDateString()}</span>}
                                                {banner.startDate && banner.endDate && <span>→</span>}
                                                {banner.endDate && <span>{new Date(banner.endDate).toLocaleDateString()}</span>}
                                            </div>
                                        )}

                                        {banner.link && (
                                            <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest truncate">
                                                <Link className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{banner.link}</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => handleToggle(banner)}
                                                className={`flex items-center gap-2 flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${banner.isActive ? 'bg-white/5 border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400' : 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20'}`}
                                            >
                                                {banner.isActive ? <EyeOff className="w-3 h-3 mx-auto" /> : <Eye className="w-3 h-3 mx-auto" />}
                                                {banner.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => openEdit(banner)}
                                                className="flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 hover:bg-gold/10 hover:border-gold/20 hover:text-gold transition-all"
                                            >
                                                <Edit2 className="w-3 h-3 mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(banner._id)}
                                                className="flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3 mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0D1620] border border-white/[0.06] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h3>
                                        <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-1">Banner settings</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all">
                                        <X className="w-4 h-4 text-white/40" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Banner Title *</label>
                                            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputCls} placeholder="e.g. Summer Sale Campaign" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">CTA Label</label>
                                            <input value={formData.ctaText} onChange={e => setFormData({ ...formData, ctaText: e.target.value })} className={inputCls} placeholder="Shop Now" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Subtitle</label>
                                        <textarea value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className={`${inputCls} resize-none`} rows={2} placeholder="Supporting message..." />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Image URL</label>
                                        <input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className={inputCls} placeholder="https://..." />
                                        {formData.image && (
                                            <div className="mt-2 h-32 rounded-2xl overflow-hidden border border-white/10">
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Link URL</label>
                                            <input value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className={inputCls} placeholder="/products or https://..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Banner Position</label>
                                            <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-gold/50 transition-all">
                                                <option value="hero">Hero</option>
                                                <option value="sidebar">Sidebar</option>
                                                <option value="popup">Popup</option>
                                                <option value="category">Category</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Start Date</label>
                                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className={inputCls} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">End Date</label>
                                            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className={inputCls} />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-4 bg-gold hover:bg-gold/90 text-navy rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg shadow-gold/20 flex items-center justify-center gap-2">
                                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Plus className="w-4 h-4" />{editingBanner ? 'Save Changes' : 'Create Banner'}</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
