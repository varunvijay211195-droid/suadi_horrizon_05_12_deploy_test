"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    FileText,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    Mail,
    Phone,
    Building2,
    Calendar,
    ArrowRight,
    Loader2,
    Users,
    Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminQuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [responseMessage, setResponseMessage] = useState("");
    const [quotedPrice, setQuotedPrice] = useState<string>("");
    const [validUntil, setValidUntil] = useState<string>("");

    useEffect(() => {
        if (selectedQuote) {
            setResponseMessage(selectedQuote.adminResponse || "");
            setQuotedPrice(selectedQuote.quotedPrice?.toString() || "");
            if (selectedQuote.validUntil) {
                const date = new Date(selectedQuote.validUntil);
                setValidUntil(date.toISOString().split('T')[0]);
            } else {
                setValidUntil("");
            }
        } else {
            setResponseMessage("");
            setQuotedPrice("");
            setValidUntil("");
        }
    }, [selectedQuote]);

    useEffect(() => {
        fetchQuotes();
    }, [statusFilter]);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/quotes?status=${statusFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuotes(data.quotes || []);
            }
        } catch (error) {
            toast.error("Failed to fetch quote requests");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string, adminResponse?: string, price?: string, validity?: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/quotes', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id,
                    status,
                    adminResponse,
                    quotedPrice: price ? parseFloat(price) : undefined,
                    validUntil: validity || undefined
                })
            });

            if (res.ok) {
                const updatedQuote = await res.json();
                toast.success(`Quote marked as ${status}`);
                setQuotes(prev => prev.map(q => q._id === id ? updatedQuote : q));
                if (selectedQuote?._id === id) {
                    setSelectedQuote(updatedQuote);
                }
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredQuotes = quotes.filter(quote =>
        quote.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">Pending</Badge>;
            case 'reviewed': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1">Reviewed</Badge>;
            case 'responded': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">Responded</Badge>;
            case 'accepted': return <Badge className="bg-gold/10 text-gold border-gold/20 px-3 py-1 font-black">Accepted</Badge>;
            case 'cancelled': return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1">Cancelled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <AdminLayout
            title="Quote Requests"
            description="Manage B2B bulk quote inquiries and business leads"
            onRefresh={fetchQuotes}
        >
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Requests', value: quotes.length, icon: FileText, color: 'text-gold' },
                        { label: 'Pending', value: quotes.filter(q => q.status === 'pending').length, icon: Clock, color: 'text-amber-500' },
                        { label: 'Reviewed', value: quotes.filter(q => q.status === 'reviewed').length, icon: CheckCircle2, color: 'text-blue-500' },
                        { label: 'Conversion Rate', value: '12%', icon: ArrowRight, color: 'text-emerald-500' },
                    ].map((stat, i) => (
                        <Card key={i} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
                    ))}
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0A1017] border border-white/[0.03] p-4 rounded-2xl">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search company, person, or email..."
                            className="pl-11 bg-white/[0.03] border-white/5 text-white h-12 rounded-2xl focus:ring-gold/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl border border-white/5">
                        {['all', 'pending', 'reviewed', 'responded', 'accepted'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-[#0A1017] border border-white/[0.03] rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white/[0.01]">
                            <TableRow className="border-white/[0.05] hover:bg-transparent">
                                <TableHead className="text-slate-500 font-bold py-6 pl-8">Company & Contact</TableHead>
                                <TableHead className="text-slate-500 font-bold">Project Type</TableHead>
                                <TableHead className="text-slate-500 font-bold">Requested Items</TableHead>
                                <TableHead className="text-slate-500 font-bold text-center">Status</TableHead>
                                <TableHead className="text-slate-500 font-bold">Date</TableHead>
                                <TableHead className="text-slate-500 font-bold text-right pr-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <Loader2 className="w-8 h-8 animate-spin text-gold" />
                                                <p className="text-xs font-black uppercase tracking-widest">Scanning Database...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredQuotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <FileText className="w-12 h-12" />
                                                <p className="text-sm font-bold">No quote requests found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredQuotes.map((quote) => (
                                        <motion.tr
                                            key={quote._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="border-white/[0.03] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                            onClick={() => {
                                                setSelectedQuote(quote);
                                                setDetailDialogOpen(true);
                                            }}
                                        >
                                            <TableCell className="py-6 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gold/5 border border-gold/10 flex items-center justify-center text-gold font-bold text-xs">
                                                        {quote.companyName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-gold transition-colors">{quote.companyName}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{quote.contactPerson}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-white/10 text-slate-400 font-medium lowercase">
                                                    {quote.projectType || 'Standard'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{quote.items}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(quote.status)}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-slate-500 font-medium">{new Date(quote.createdAt).toLocaleDateString()}</p>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/5">
                                                            <MoreHorizontal className="w-5 h-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#0A1017] border-white/10 text-slate-300 rounded-2xl w-48 p-2">
                                                        <DropdownMenuItem onClick={() => { setSelectedQuote(quote); setDetailDialogOpen(true); }} className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer py-2.5">
                                                            <Eye className="w-4 h-4 mr-3" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(quote._id, 'reviewed')} className="rounded-xl focus:bg-blue-500/10 focus:text-blue-400 cursor-pointer py-2.5">
                                                            <CheckCircle2 className="w-4 h-4 mr-3" /> Mark Reviewed
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(quote._id, 'responded')} className="rounded-xl focus:bg-emerald-500/10 focus:text-emerald-400 cursor-pointer py-2.5">
                                                            <CheckCircle2 className="w-4 h-4 mr-3" /> Mark Responded
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-white/5 my-1" />
                                                        <DropdownMenuItem onClick={() => updateStatus(quote._id, 'cancelled')} className="rounded-xl focus:bg-red-500/10 focus:text-red-400 cursor-pointer py-2.5">
                                                            <XCircle className="w-4 h-4 mr-3" /> Cancel/Decline
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>

                {/* Detail Dialog */}
                <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                    <DialogContent className="bg-[#0A1017] border-white/10 text-white max-w-2xl rounded-[2.5rem] p-0 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                        <DialogHeader className="p-8 border-b border-white/[0.05] bg-white/[0.01]">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl font-bold tracking-tight">Quote Details</DialogTitle>
                                    <DialogDescription className="text-slate-500">Submitted on {selectedQuote && new Date(selectedQuote.createdAt).toLocaleString()}</DialogDescription>
                                </div>
                                {selectedQuote && getStatusBadge(selectedQuote.status)}
                            </div>
                        </DialogHeader>

                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">Company Information</h4>
                                    <div className="space-y-3 bg-white/[0.02] p-5 rounded-3xl border border-white/[0.05]">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm font-bold">{selectedQuote?.companyName}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm text-slate-300">{selectedQuote?.contactPerson}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Filter className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm text-slate-400 capitalize">{selectedQuote?.projectType || 'General Business'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">Contact Details</h4>
                                    <div className="space-y-3 bg-white/[0.02] p-5 rounded-3xl border border-white/[0.05]">
                                        <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors cursor-pointer">
                                            <Mail className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm font-medium">{selectedQuote?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors cursor-pointer">
                                            <Phone className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm font-medium">{selectedQuote?.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            <span className="text-[10px] font-black uppercase text-slate-600">Timeline: {selectedQuote?.timeline || 'Not Specified'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">Items Requested</h4>
                                <div className="bg-navy p-6 rounded-3xl border border-gold/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Box className="w-16 h-16" />
                                    </div>
                                    <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                                        {selectedQuote?.items}
                                    </p>
                                    {selectedQuote?.quantities && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Quantities Notes</p>
                                            <p className="text-xs text-slate-400">{selectedQuote.quantities}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedQuote?.messages && selectedQuote.messages.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">Conversation Thread</h4>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto px-2 custom-scrollbar border-l border-white/5 ml-1">
                                        {selectedQuote.messages.map((msg: any, mIdx: number) => (
                                            <div
                                                key={mIdx}
                                                className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${msg.sender === 'admin' ? 'text-gold' : 'text-blue-400'}`}>
                                                        {msg.sender === 'admin' ? 'Sales Team' : 'Customer'}
                                                    </span>
                                                </div>
                                                <div className={`max-w-[90%] p-4 rounded-3xl text-xs leading-relaxed ${msg.sender === 'admin'
                                                    ? 'bg-gold/10 border border-gold/20 text-white rounded-tr-none'
                                                    : 'bg-white/[0.03] border border-white/10 text-slate-300 rounded-tl-none'
                                                    }`}>
                                                    <p>{msg.text}</p>
                                                    <span className="text-[8px] opacity-30 mt-2 block font-medium">
                                                        {new Date(msg.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedQuote?.notes && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">Initial Request Notes</h4>
                                    <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05]">
                                        <p className="text-xs text-slate-400 leading-relaxed">{selectedQuote.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Admin Response Section */}
                            <div className="space-y-6 border-t border-white/[0.05] pt-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gold opacity-60">Prepare Quote Response</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1">Quoted Price (SAR)</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="bg-white/[0.03] border-white/10 rounded-2xl h-12 focus:ring-gold/20"
                                            value={quotedPrice}
                                            onChange={(e) => setQuotedPrice(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1">Valid Until</label>
                                        <Input
                                            type="date"
                                            className="bg-white/[0.03] border-white/10 rounded-2xl h-12 focus:ring-gold/20"
                                            value={validUntil}
                                            onChange={(e) => setValidUntil(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1">Message for Customer</label>
                                    <Textarea
                                        placeholder="Enter pricing details, valid products, or a message for the customer..."
                                        className="bg-white/[0.03] border-white/10 rounded-3xl min-h-[120px] focus:ring-gold/20 text-sm p-6"
                                        value={responseMessage}
                                        onChange={(e) => setResponseMessage(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={() => updateStatus(selectedQuote?._id, 'reviewed')}
                                    className="flex-1 bg-white/[0.03] border border-white/10 hover:bg-white/10 text-white rounded-2xl h-14 font-bold"
                                >
                                    Mark Reviewed
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!selectedQuote || !quotedPrice) {
                                            toast.error('Set a quoted price first');
                                            return;
                                        }
                                        try {
                                            const token = localStorage.getItem('accessToken');
                                            const res = await fetch('/api/admin/invoices', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                body: JSON.stringify({
                                                    sourceType: 'quote',
                                                    sourceId: selectedQuote._id,
                                                    items: [{
                                                        description: selectedQuote.items || 'Quoted Items',
                                                        quantity: 1,
                                                        unitPrice: parseFloat(quotedPrice),
                                                        total: parseFloat(quotedPrice),
                                                    }],
                                                    notes: responseMessage || undefined,
                                                }),
                                            });
                                            if (!res.ok) throw new Error('Failed to create invoice');
                                            const data = await res.json();
                                            const invoiceId = data.invoice.id || data.invoice._id;
                                            const invoiceNumber = data.invoice.invoice_number || data.invoice.invoiceNumber;
                                            toast.success(`Invoice ${invoiceNumber} created!`);

                                            // Copy link to clipboard
                                            const link = `${window.location.origin}/invoice/${invoiceId}`;
                                            navigator.clipboard.writeText(link);
                                            toast.info('Payment link copied to clipboard');

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
                                    disabled={!quotedPrice}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    Generate Invoice
                                </Button>
                                {selectedQuote?.invoiceId && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const link = `${window.location.origin}/invoice/${selectedQuote.invoiceId}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success('Payment link copied to clipboard');
                                        }}
                                        className="bg-white/5 border-white/10 text-white h-14 px-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-gold hover:text-navy transition-all"
                                    >
                                        Copy Link
                                    </Button>
                                )}
                                <Button
                                    onClick={() => updateStatus(selectedQuote?._id, 'responded', responseMessage, quotedPrice, validUntil)}
                                    disabled={!responseMessage && !quotedPrice}
                                    className="flex-1 bg-gold hover:bg-gold/90 text-navy rounded-2xl h-14 font-black uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    Send Response
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}

function Card({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-[#0A1017] border border-white/[0.03] p-5 rounded-2xl relative overflow-hidden group hover:border-white/[0.08] transition-all">
            <div className={`p-2 rounded-xl bg-white/[0.03] w-fit mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{label}</p>
        </div>
    );
}
