"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    FileText,
    Search,
    Download,
    Send,
    Eye,
    MoreHorizontal,
    Plus,
    Filter,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Receipt,
    RefreshCw,
    Trash2,
    Building2,
    Mail,
    ExternalLink,
    Copy,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
    _id: string;
    invoiceNumber: string;
    sourceType: "order" | "quote";
    sourceId: string;
    customer: {
        name: string;
        company?: string;
        email: string;
        phone?: string;
        address?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    currency: string;
    status: string;
    dueDate?: string;
    paidAt?: string;
    notes?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
    draft: { label: "Draft", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", Icon: FileText },
    sent: { label: "Sent", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", Icon: Send },
    paid: { label: "Paid", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", Icon: CheckCircle2 },
    overdue: { label: "Overdue", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", Icon: AlertTriangle },
    cancelled: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", Icon: XCircle },
};

const SOURCE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    order: { label: "Order", color: "text-purple-300", bg: "bg-purple-500/10" },
    quote: { label: "Quote", color: "text-cyan-300", bg: "bg-cyan-500/10" },
};

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({ total: 0, draft: 0, sent: 0, paid: 0, overdue: 0, revenue: 0 });

    const getHeaders = (): HeadersInit => {
        const token = localStorage.getItem("accessToken");
        return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (sourceFilter !== "all") params.set("sourceType", sourceFilter);
            if (searchTerm) params.set("search", searchTerm);

            const res = await fetch(`/api/admin/invoices?${params.toString()}`, { headers: getHeaders() });
            if (!res.ok) throw new Error("Failed to fetch invoices");

            const data = await res.json();
            setInvoices(data.invoices || []);

            // Calculate stats
            const all = data.invoices || [];
            setStats({
                total: all.length,
                draft: all.filter((i: Invoice) => i.status === "draft").length,
                sent: all.filter((i: Invoice) => i.status === "sent").length,
                paid: all.filter((i: Invoice) => i.status === "paid").length,
                overdue: all.filter((i: Invoice) => i.status === "overdue").length,
                revenue: all.filter((i: Invoice) => i.status === "paid").reduce((s: number, i: Invoice) => s + i.totalAmount, 0),
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter, sourceFilter]);

    const handleSearch = () => fetchInvoices();

    const handleDownloadPDF = async (invoice: Invoice) => {
        setDownloadingId(invoice._id);
        try {
            const token = localStorage.getItem("accessToken");
            // Direct browser download — the server sets Content-Disposition: attachment
            window.open(`/api/admin/invoices/${invoice._id}/pdf?token=${token}`, '_blank');
            toast.success(`Downloaded ${invoice.invoiceNumber}`);
        } catch (error) {
            console.error('PDF Download Error:', error);
            toast.error("Failed to download PDF");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleSendEmail = async (invoice: Invoice) => {
        setSendingId(invoice._id);
        try {
            const res = await fetch(`/api/admin/invoices/${invoice._id}/send`, {
                method: "POST",
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error("Failed to send");

            const data = await res.json();
            toast.success(data.message || `Invoice sent to ${invoice.customer.email}`);
            fetchInvoices();
        } catch (error) {
            toast.error("Failed to send invoice email");
        } finally {
            setSendingId(null);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/invoices/${id}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update");
            toast.success(`Invoice marked as ${status}`);
            fetchInvoices();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        try {
            const res = await fetch(`/api/admin/invoices/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Invoice deleted");
            fetchInvoices();
        } catch (error) {
            toast.error("Failed to delete invoice");
        }
    };

    const viewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setDetailOpen(true);
    };

    const statCards = [
        { label: "Total Invoices", value: stats.total, icon: Receipt, color: "text-white", bg: "bg-white/[0.03]" },
        { label: "Drafts", value: stats.draft, icon: FileText, color: "text-slate-400", bg: "bg-slate-500/5" },
        { label: "Sent", value: stats.sent, icon: Send, color: "text-blue-400", bg: "bg-blue-500/5" },
        { label: "Paid", value: stats.paid, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5" },
        { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/5" },
        { label: "Revenue", value: `SAR ${stats.revenue.toLocaleString("en-SA", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-gold", bg: "bg-gold/5" },
    ];

    return (
        <AdminLayout
            title="Invoice Management"
            description="Generate, track, and send professional invoices"
            onRefresh={fetchInvoices}
        >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${card.bg} border border-white/[0.05] rounded-2xl p-5 hover:border-white/10 transition-all`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{card.label}</span>
                        </div>
                        <p className={`text-xl font-bold ${card.color} tracking-tight`}>
                            {typeof card.value === "number" ? card.value : card.value}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-11 bg-white/[0.03] border-white/[0.06] rounded-xl h-11 text-sm text-white placeholder:text-slate-500"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-xl h-11 px-4 text-sm text-slate-300 cursor-pointer focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Source filter */}
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-xl h-11 px-4 text-sm text-slate-300 cursor-pointer focus:outline-none"
                    >
                        <option value="all">All Sources</option>
                        <option value="order">Orders</option>
                        <option value="quote">Quotes</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-gold animate-spin" />
                        <span className="ml-3 text-sm text-slate-400">Loading invoices...</span>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="py-20 text-center">
                        <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold">No invoices found</p>
                        <p className="text-slate-500 text-sm mt-1">Generate invoices from the Orders or Quotes page</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/[0.05] hover:bg-transparent">
                                <TableHead className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] pl-6">Invoice</TableHead>
                                <TableHead className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Customer</TableHead>
                                <TableHead className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Source</TableHead>
                                <TableHead className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Amount</TableHead>
                                <TableHead className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Status</TableHead>
                                <TableHead className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Date</TableHead>
                                <TableHead className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {invoices.map((inv, index) => {
                                    const statusConf = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                                    const sourceConf = SOURCE_BADGE[inv.sourceType] || SOURCE_BADGE.order;
                                    return (
                                        <motion.tr
                                            key={inv._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                                                        <Receipt className="w-4 h-4 text-gold" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{inv.invoiceNumber}</p>
                                                        <p className="text-[10px] text-slate-500">
                                                            {inv.items?.length || 0} item{inv.items?.length !== 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{inv.customer.name}</p>
                                                    {inv.customer.company && (
                                                        <p className="text-[11px] text-slate-500">{inv.customer.company}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${sourceConf.bg} ${sourceConf.color} border-transparent text-[10px] font-bold`}>
                                                    {sourceConf.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm font-bold text-gold">
                                                        {inv.currency} {(inv.totalAmount || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        VAT: {inv.currency} {(inv.vatAmount || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${statusConf.bg} ${statusConf.color} ${statusConf.border} border text-[10px] font-bold`}>
                                                    <statusConf.Icon className="w-3 h-3 mr-1" />
                                                    {statusConf.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(inv.createdAt).toLocaleDateString("en-SA")}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => viewInvoice(inv)}
                                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDownloadPDF(inv)}
                                                        disabled={downloadingId === inv._id}
                                                        className="h-8 w-8 text-slate-400 hover:text-gold hover:bg-gold/5"
                                                        title="Download PDF"
                                                    >
                                                        {downloadingId === inv._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleSendEmail(inv)}
                                                        disabled={sendingId === inv._id}
                                                        className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/5"
                                                        title="Send via Email"
                                                    >
                                                        {sendingId === inv._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-[#0A1017] border-white/10 text-white w-48">
                                                            {inv.status !== "paid" && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(inv._id, "paid")} className="hover:bg-white/5 focus:bg-white/5 text-emerald-400">
                                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                    Mark as Paid
                                                                </DropdownMenuItem>
                                                            )}
                                                            {inv.status === "draft" && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(inv._id, "sent")} className="hover:bg-white/5 focus:bg-white/5 text-blue-400">
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                    Mark as Sent
                                                                </DropdownMenuItem>
                                                            )}
                                                            {inv.status === "sent" && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(inv._id, "overdue")} className="hover:bg-white/5 focus:bg-white/5 text-red-400">
                                                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                                                    Mark as Overdue
                                                                </DropdownMenuItem>
                                                            )}
                                                            {inv.status !== "cancelled" && (
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(inv._id, "cancelled")} className="hover:bg-white/5 focus:bg-white/5 text-gray-400">
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    Cancel
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleDelete(inv._id)} className="hover:bg-white/5 focus:bg-white/5 text-red-400">
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Invoice Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="bg-[#0A1017] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-3">
                            <Receipt className="w-5 h-5 text-gold" />
                            {selectedInvoice?.invoiceNumber}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Invoice details and management options for {selectedInvoice?.invoiceNumber}.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-6 mt-4">
                            {/* Status & Meta */}
                            <div className="flex items-center gap-4 flex-wrap">
                                {(() => {
                                    const sc = STATUS_CONFIG[selectedInvoice.status] || STATUS_CONFIG.draft;
                                    return (
                                        <Badge className={`${sc.bg} ${sc.color} ${sc.border} border text-xs font-bold`}>
                                            <sc.Icon className="w-3 h-3 mr-1" />
                                            {sc.label}
                                        </Badge>
                                    );
                                })()}
                                <span className="text-xs text-slate-500">
                                    Created: {new Date(selectedInvoice.createdAt).toLocaleDateString("en-SA")}
                                </span>
                                {selectedInvoice.sentAt && (
                                    <span className="text-xs text-blue-400">
                                        Sent: {new Date(selectedInvoice.sentAt).toLocaleDateString("en-SA")}
                                    </span>
                                )}
                                {selectedInvoice.paidAt && (
                                    <span className="text-xs text-emerald-400">
                                        Paid: {new Date(selectedInvoice.paidAt).toLocaleDateString("en-SA")}
                                    </span>
                                )}
                            </div>

                            {/* Customer Info */}
                            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5">
                                <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.15em] mb-3">Customer</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-white font-semibold">{selectedInvoice.customer.name}</p>
                                        {selectedInvoice.customer.company && (
                                            <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                                                <Building2 className="w-3 h-3" />
                                                {selectedInvoice.customer.company}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-xs flex items-center gap-1 justify-end">
                                            <Mail className="w-3 h-3" />
                                            {selectedInvoice.customer.email}
                                        </p>
                                        {selectedInvoice.customer.phone && (
                                            <p className="text-slate-400 text-xs mt-1">{selectedInvoice.customer.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-white/[0.05]">
                                    <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.15em]">Line Items</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/[0.05]">
                                            <th className="px-5 py-2 text-left text-[10px] font-black text-white/30 uppercase">Description</th>
                                            <th className="px-5 py-2 text-center text-[10px] font-black text-white/30 uppercase">Qty</th>
                                            <th className="px-5 py-2 text-right text-[10px] font-black text-white/30 uppercase">Unit Price</th>
                                            <th className="px-5 py-2 text-right text-[10px] font-black text-white/30 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedInvoice.items || []).map((item, i) => (
                                            <tr key={i} className="border-b border-white/[0.02]">
                                                <td className="px-5 py-3 text-white">{item.description}</td>
                                                <td className="px-5 py-3 text-center text-slate-300">{item.quantity}</td>
                                                <td className="px-5 py-3 text-right text-slate-300">
                                                    {selectedInvoice.currency} {(item.unitPrice || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-3 text-right font-semibold text-white">
                                                    {selectedInvoice.currency} {(item.total || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5">
                                <div className="space-y-2 text-right">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Subtotal</span>
                                        <span className="text-white">
                                            {selectedInvoice.currency} {(selectedInvoice.subtotal || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">VAT ({selectedInvoice.vatRate}%)</span>
                                        <span className="text-white">
                                            {selectedInvoice.currency} {(selectedInvoice.vatAmount || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="border-t border-gold/30 pt-3 mt-3 flex justify-between text-lg">
                                        <span className="text-gold font-bold">Total Amount</span>
                                        <span className="text-gold font-bold">
                                            {selectedInvoice.currency} {(selectedInvoice.totalAmount || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedInvoice.notes && (
                                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5">
                                    <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.15em] mb-2">Notes</h3>
                                    <p className="text-sm text-slate-300">{selectedInvoice.notes}</p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <Button
                                    onClick={() => window.open(`/invoice/${selectedInvoice._id}`, '_blank')}
                                    className="bg-white/10 hover:bg-white/20 text-white font-bold"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Invoice
                                </Button>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/invoice/${selectedInvoice._id}`);
                                        toast.success('Invoice link copied!');
                                    }}
                                    variant="outline"
                                    className="border-white/10 text-slate-300 hover:bg-white/5"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Link
                                </Button>
                                <Button
                                    onClick={() => handleDownloadPDF(selectedInvoice)}
                                    disabled={downloadingId === selectedInvoice._id}
                                    className="bg-gold hover:bg-gold/90 text-navy font-bold"
                                >
                                    {downloadingId === selectedInvoice._id ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                    )}
                                    Download PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleSendEmail(selectedInvoice)}
                                    disabled={sendingId === selectedInvoice._id}
                                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                >
                                    {sendingId === selectedInvoice._id ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Send to Customer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
