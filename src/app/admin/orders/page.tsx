"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
    Search,
    Download,
    Eye,
    Truck,
    X,
    Package,
    XCircle,
    Calendar,
    DollarSign,
    Clock,
    User,
    ShieldCheck,
    RefreshCw,
    Flag,
    AlertTriangle,
    Loader2,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
    _id: string;
    user?: { email: string; name?: string };
    items: Array<{ name: string; quantity: number; price: number; productId?: string }>;
    totalAmount: number;
    status: string;
    shippingAddress?: any;
    adminNote?: string;
    createdAt: string;
}

// Status config: color, icon, label
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
    pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', Icon: Clock },
    processing: { label: 'Processing', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', Icon: Loader2 },
    shipped: { label: 'Shipped', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', Icon: Truck },
    delivered: { label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: ShieldCheck },
    cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', Icon: XCircle },
    refunded: { label: 'Refunded', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', Icon: RotateCcw },
    flagged: { label: 'Flagged', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', Icon: Flag },
};

// Fulfillment flow: what comes next
const NEXT_STATUS: Record<string, string> = {
    pending: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
};

export default function AdminOrdersPage() {
    const { isInitialized } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const [mounted, setMounted] = useState(false);

    // Refund/flag modal state
    const [actionModal, setActionModal] = useState<{ type: 'refund' | 'flag'; orderId: string } | null>(null);
    const [actionNote, setActionNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { if (isInitialized) loadOrders(); }, [isInitialized]);

    const getHeaders = (): HeadersInit => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch('/api/orders?admin=true', { headers });
            if (!response.ok) throw new Error('Failed to load orders');
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (err: any) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 })
            .format(amount).replace('SAR', 'SAR ');

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const updateOrderStatus = async (orderId: string, newStatus: string, note?: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: newStatus, ...(note ? { note } : {}) })
            });
            if (!response.ok) throw new Error('Failed to update status');
            toast.success(`Order marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
            loadOrders();
            if (viewOrder?._id === orderId) {
                setViewOrder(prev => prev ? { ...prev, status: newStatus, adminNote: note || prev.adminNote } : null);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update status');
        }
    };

    const handleActionSubmit = async () => {
        if (!actionModal) return;
        setActionLoading(true);
        const newStatus = actionModal.type === 'refund' ? 'refunded' : 'flagged';
        await updateOrderStatus(actionModal.orderId, newStatus, actionNote);
        setActionLoading(false);
        setActionModal(null);
        setActionNote('');
    };

    const exportOrders = () => {
        if (filteredOrders.length === 0) { toast.error('No orders to export'); return; }
        const headers = ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'];
        const rows = filteredOrders.map(o => [
            o._id, o.user?.email || 'Guest', o.items?.length || 0,
            o.totalAmount || 0, o.status, new Date(o.createdAt).toISOString()
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Orders exported');
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // KPI cards to show (primary statuses)
    const kpiStatuses = ['pending', 'processing', 'shipped', 'delivered'];

    return (
        <AdminLayout title="Order Management" description="Manage and track customer orders" onRefresh={loadOrders}>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpiStatuses.map((status, index) => {
                    const count = orders.filter(o => o.status === status).length;
                    const cfg = STATUS_CONFIG[status];
                    const Icon = cfg.Icon;
                    const isActive = statusFilter === status;
                    return (
                        <motion.div
                            key={status}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            onClick={() => setStatusFilter(isActive ? 'all' : status)}
                            className={`bg-[#0A1017] border rounded-2xl p-5 cursor-pointer transition-all hover:border-white/[0.08] ${isActive ? `${cfg.border} ${cfg.bg}` : 'border-white/[0.03]'}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-xl border ${isActive ? `${cfg.bg} ${cfg.border}` : 'bg-white/[0.03] border-white/[0.05]'}`}>
                                    <Icon className={`w-4 h-4 ${isActive ? cfg.color : 'text-white/20'} ${status === 'processing' && count > 0 ? 'animate-spin' : ''}`} style={status === 'processing' && count > 0 ? { animationDuration: '2s' } : {}} />
                                </div>
                                {isActive && <div className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')} animate-pulse`} />}
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{cfg.label}</p>
                            <p className={`text-2xl font-bold ${isActive ? cfg.color : 'text-white'}`}>{count}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-gold transition-colors" />
                    <Input
                        placeholder="Search by order ID or customer email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 bg-white/[0.03] border-white/[0.04] text-white rounded-xl h-12 focus:border-gold/30 transition-all text-sm"
                    />
                </div>
                <div className="flex gap-3 items-center">
                    {/* Status filter pills */}
                    {['flagged', 'refunded', 'cancelled'].map(s => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                                className={`h-12 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${statusFilter === s ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white/[0.03] border-white/[0.04] text-slate-500 hover:text-white'}`}
                            >
                                {cfg.label}
                            </button>
                        );
                    })}
                    <Button
                        variant="ghost"
                        className="h-12 px-5 border border-white/[0.04] bg-white/[0.03] text-slate-500 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        onClick={exportOrders}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0A1017] border border-white/[0.03] rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="relative w-12 h-12 mx-auto mb-6">
                            <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                            <div className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">Loading orders...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.04]">
                                    {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h, i) => (
                                        <th key={h} className={`px-6 py-5 text-[9px] font-bold text-slate-600 uppercase tracking-widest ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                    const Icon = cfg.Icon;
                                    const nextStatus = NEXT_STATUS[order.status];
                                    const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;
                                    return (
                                        <tr key={order._id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1 h-5 rounded-full ${cfg.color.replace('text-', 'bg-')} opacity-60`} />
                                                    <span className="text-white font-mono text-xs font-bold">#{order._id.slice(-8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-white/20" />
                                                    </div>
                                                    <span className="text-slate-400 text-xs font-medium">{order.user?.email || 'Guest'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs text-slate-500 font-semibold">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-gold">{mounted ? formatCurrency(order.totalAmount || 0) : '---'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                                                    <Icon className={`w-3 h-3 ${cfg.color} ${order.status === 'processing' ? 'animate-spin' : ''}`} style={order.status === 'processing' ? { animationDuration: '2s' } : {}} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs text-slate-600">{formatDate(order.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-600 hover:text-white hover:bg-white/5" onClick={() => setViewOrder(order)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {nextCfg && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order._id, nextStatus)}
                                                            title={`Mark as ${nextCfg.label}`}
                                                            className={`h-8 px-3 rounded-lg ${nextCfg.bg} ${nextCfg.border} border ${nextCfg.color} text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all hover:opacity-80`}
                                                        >
                                                            <ChevronRight className="w-3 h-3" />
                                                            {nextCfg.label}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto mb-4">
                                                <Package className="w-6 h-6 text-white/10" />
                                            </div>
                                            <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">No orders found</p>
                                            <p className="text-slate-700 text-xs mt-1">Try adjusting your search or filters</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {viewOrder && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                        onClick={() => setViewOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0D1620] border border-white/[0.06] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/[0.05] flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-white">Order Details</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">#{viewOrder._id.slice(-8).toUpperCase()} · {formatDate(viewOrder.createdAt)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Status badge */}
                                    {(() => {
                                        const cfg = STATUS_CONFIG[viewOrder.status] || STATUS_CONFIG.pending;
                                        const Icon = cfg.Icon;
                                        return (
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                                                <Icon className={`w-3 h-3 ${cfg.color}`} />
                                                <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                                            </div>
                                        );
                                    })()}
                                    <Button variant="ghost" size="icon" onClick={() => setViewOrder(null)} className="w-8 h-8 rounded-lg bg-white/[0.03] text-slate-600 hover:text-white">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Summary row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Customer</p>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-600" />
                                            <span className="text-sm text-slate-300 font-medium">{viewOrder.user?.email || 'Guest'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Order Total</p>
                                        <p className="text-xl font-bold text-gold">{formatCurrency(viewOrder.totalAmount || 0)}</p>
                                    </div>
                                </div>

                                {/* Status pipeline */}
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4">Fulfillment Pipeline</p>
                                    <div className="flex items-center gap-2">
                                        {['pending', 'processing', 'shipped', 'delivered'].map((s, idx, arr) => {
                                            const cfg = STATUS_CONFIG[s];
                                            const Icon = cfg.Icon;
                                            const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                                            const currentIdx = statusOrder.indexOf(viewOrder.status);
                                            const thisIdx = statusOrder.indexOf(s);
                                            const isDone = thisIdx < currentIdx;
                                            const isCurrent = thisIdx === currentIdx;
                                            return (
                                                <div key={s} className="flex items-center gap-2 flex-1">
                                                    <div className={`flex flex-col items-center gap-1 flex-1 ${isCurrent ? cfg.color : isDone ? 'text-white/40' : 'text-white/10'}`}>
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isCurrent ? `${cfg.bg} ${cfg.border}` : isDone ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5'}`}>
                                                            <Icon className={`w-4 h-4 ${isCurrent ? cfg.color : isDone ? 'text-white/40' : 'text-white/10'}`} />
                                                        </div>
                                                        <span className={`text-[8px] font-bold uppercase tracking-wider ${isCurrent ? cfg.color : isDone ? 'text-white/30' : 'text-white/10'}`}>{cfg.label}</span>
                                                    </div>
                                                    {idx < arr.length - 1 && (
                                                        <div className={`h-px flex-1 mb-4 ${isDone ? 'bg-white/20' : 'bg-white/5'}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3">Order Items</p>
                                    <div className="space-y-2">
                                        {viewOrder.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                                                        <Package className="w-4 h-4 text-white/20" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-medium">{item.name || 'Product'}</p>
                                                        <p className="text-[10px] text-slate-600">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-white">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping */}
                                {viewOrder.shippingAddress && (
                                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Shipping Address</p>
                                        <div className="flex items-start gap-3">
                                            <Truck className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                {typeof viewOrder.shippingAddress === 'string'
                                                    ? viewOrder.shippingAddress
                                                    : [
                                                        viewOrder.shippingAddress.fullName,
                                                        viewOrder.shippingAddress.address,
                                                        viewOrder.shippingAddress.city,
                                                        viewOrder.shippingAddress.country
                                                    ].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Admin note if exists */}
                                {viewOrder.adminNote && (
                                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                                        <p className="text-[9px] font-bold text-orange-400/70 uppercase tracking-widest mb-1">Admin Note</p>
                                        <p className="text-sm text-orange-200/70">{viewOrder.adminNote}</p>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="pt-2 border-t border-white/[0.04]">
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3">Actions</p>
                                    <div className="flex flex-wrap gap-3">
                                        {/* Advance fulfillment */}
                                        {NEXT_STATUS[viewOrder.status] && (
                                            <Button
                                                className="h-10 px-5 bg-gold hover:bg-white text-navy font-bold rounded-xl text-xs uppercase tracking-widest gap-2"
                                                onClick={() => updateOrderStatus(viewOrder._id, NEXT_STATUS[viewOrder.status])}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                                Mark as {STATUS_CONFIG[NEXT_STATUS[viewOrder.status]]?.label}
                                            </Button>
                                        )}

                                        {/* Refund — only for delivered */}
                                        {viewOrder.status === 'delivered' && (
                                            <Button
                                                variant="outline"
                                                className="h-10 px-5 bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 font-bold rounded-xl text-xs uppercase tracking-widest gap-2"
                                                onClick={() => setActionModal({ type: 'refund', orderId: viewOrder._id })}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Issue Refund
                                            </Button>
                                        )}

                                        {/* Flag — for any active order */}
                                        {!['cancelled', 'refunded', 'flagged', 'delivered'].includes(viewOrder.status) && (
                                            <Button
                                                variant="outline"
                                                className="h-10 px-5 bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold rounded-xl text-xs uppercase tracking-widest gap-2"
                                                onClick={() => setActionModal({ type: 'flag', orderId: viewOrder._id })}
                                            >
                                                <Flag className="w-4 h-4" />
                                                Flag for Review
                                            </Button>
                                        )}

                                        {/* Cancel */}
                                        {!['delivered', 'cancelled', 'refunded'].includes(viewOrder.status) && (
                                            <Button
                                                variant="outline"
                                                className="h-10 px-5 bg-white/[0.02] border-white/[0.06] text-slate-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 font-bold rounded-xl text-xs uppercase tracking-widest gap-2 transition-all"
                                                onClick={() => updateOrderStatus(viewOrder._id, 'cancelled')}
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancel Order
                                            </Button>
                                        )}

                                        {/* Generate Invoice */}
                                        <Button
                                            variant="outline"
                                            className="h-10 px-5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-xl text-xs uppercase tracking-widest gap-2"
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('accessToken');
                                                    const res = await fetch('/api/admin/invoices', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                        body: JSON.stringify({
                                                            sourceType: 'order',
                                                            sourceId: viewOrder._id,
                                                        }),
                                                    });
                                                    if (!res.ok) throw new Error('Failed to create invoice');
                                                    const data = await res.json();
                                                    const invoiceId = data.invoice.id || data.invoice._id;
                                                    const invoiceNumber = data.invoice.invoice_number || data.invoice.invoiceNumber;
                                                    toast.success(`Invoice ${invoiceNumber} created!`);

                                                    // Download the PDF (Database-driven professional layout)
                                                    try {
                                                        window.open(`/api/admin/invoices/${invoiceId}/pdf?token=${token}`, '_blank');
                                                    } catch (pdfErr) {
                                                        console.error('Initial PDF Gen Error:', pdfErr);
                                                    }
                                                } catch (err) {
                                                    toast.error('Failed to generate invoice');
                                                }
                                            }}
                                        >
                                            <Download className="w-4 h-4" />
                                            Generate Invoice
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Refund / Flag confirmation modal */}
            <AnimatePresence>
                {actionModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                        onClick={() => !actionLoading && setActionModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="bg-[#0D1620] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center border ${actionModal.type === 'refund' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                {actionModal.type === 'refund'
                                    ? <RotateCcw className="w-6 h-6 text-orange-400" />
                                    : <Flag className="w-6 h-6 text-rose-400" />}
                            </div>
                            <h4 className="text-center text-base font-bold text-white mb-1">
                                {actionModal.type === 'refund' ? 'Issue Refund' : 'Flag for Review'}
                            </h4>
                            <p className="text-center text-xs text-slate-500 mb-5">
                                {actionModal.type === 'refund'
                                    ? 'This will mark the order as refunded. Add a reason below.'
                                    : 'This will flag the order for manual review. Add a note below.'}
                            </p>
                            <textarea
                                value={actionNote}
                                onChange={e => setActionNote(e.target.value)}
                                placeholder={actionModal.type === 'refund' ? 'Reason for refund (e.g. damaged item, customer request)...' : 'Note for review (e.g. suspicious activity, payment issue)...'}
                                rows={3}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-white/[0.12] resize-none"
                            />
                            <div className="flex gap-3 mt-4">
                                <Button
                                    variant="ghost"
                                    className="flex-1 h-10 rounded-xl border border-white/[0.05] text-slate-500 hover:text-white text-xs font-bold"
                                    onClick={() => !actionLoading && setActionModal(null)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={`flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-widest ${actionModal.type === 'refund' ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-rose-500 hover:bg-rose-400 text-white'}`}
                                    onClick={handleActionSubmit}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : actionModal.type === 'refund' ? 'Confirm Refund' : 'Flag Order'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
