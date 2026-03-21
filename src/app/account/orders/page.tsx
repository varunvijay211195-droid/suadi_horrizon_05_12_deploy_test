'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User, Package, MapPin, Bell,
    Heart, Undo2, ChevronRight, Clock, CheckCircle,
    FileText, Truck, Search, ShoppingBag, Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, Order } from '@/api/user';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    processing: <FileText className="w-4 h-4" />,
    shipped: <Truck className="w-4 h-4" />,
    delivered: <CheckCircle className="w-4 h-4" />,
    cancelled: <Package className="w-4 h-4" />,
};

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated, user, isInitialized } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.push('/login?redirect=/account/orders');
        }
    }, [isAuthenticated, isInitialized, router]);

    // Fetch orders from API
    useEffect(() => {
        const fetchOrders = async () => {
            if (isAuthenticated) {
                try {
                    const data = await getOrders();
                    setOrders(data);
                } catch (error) {
                    console.error('Error fetching orders:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchOrders();
    }, [isAuthenticated]);

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!isInitialized || !isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-navy text-white py-8 relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <Breadcrumb className="mb-8">
                    <BreadcrumbList className="text-slate-400">
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => router.push('/')} className="hover:text-gold transition-colors">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-slate-600" />
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => router.push('/account')} className="hover:text-gold transition-colors">Account</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-slate-600" />
                        <BreadcrumbPage className="text-gold font-medium">Orders</BreadcrumbPage>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="glass border-white/5">
                            <CardHeader className="pb-4">
                                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-gold" />
                                </div>
                                <CardTitle className="text-center text-white font-display">{user?.name || 'Customer'}</CardTitle>
                                <p className="text-sm text-slate-400 text-center">{user?.email || 'customer@example.com'}</p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account')}>
                                    <User className="w-4 h-4 mr-2" />
                                    Overview
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-gold bg-white/5" onClick={() => router.push('/account/orders')}>
                                    <Package className="w-4 h-4 mr-2" />
                                    Orders
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/wishlist')}>
                                    <Heart className="w-4 h-4 mr-2" />
                                    Wishlist
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/returns')}>
                                    <Undo2 className="w-4 h-4 mr-2" />
                                    Returns
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/addresses')}>
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Addresses
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/settings')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-gold hover:bg-white/5" onClick={() => router.push('/account/notifications')}>
                                    <Bell className="w-4 h-4 mr-2" />
                                    Notifications
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h1 className="text-3xl font-bold font-display text-white">Order History</h1>
                                <p className="text-slate-400">{orders.length} total orders</p>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search by order ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-navy border-white/10 text-white">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order: Order) => (
                                        <Card key={order._id} className="glass border-white/5 hover:border-gold/30 transition-all overflow-hidden group">
                                            <CardContent className="p-0">
                                                <div className="p-6">
                                                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Order</span>
                                                                <h3 className="font-bold text-lg text-white group-hover:text-gold transition-colors cursor-pointer" onClick={() => router.push(`/account/orders/${order._id}`)}>
                                                                    #{order._id.slice(-8).toUpperCase()}
                                                                </h3>
                                                            </div>
                                                            <p className="text-sm text-slate-500">Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                                        </div>
                                                        <div className="flex flex-col sm:items-end gap-2">
                                                            <Badge className={`${statusColors[order.status]} border-none px-3 py-1 flex items-center gap-1.5`}>
                                                                <div className="w-3.5 h-3.5 flex items-center justify-center">
                                                                    {statusIcons[order.status]}
                                                                </div>
                                                                <span className="capitalize">{order.status}</span>
                                                            </Badge>
                                                            <p className="font-bold text-xl text-gold">SAR {order.totalAmount.toFixed(2)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6">
                                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                                            <ShoppingBag className="w-4 h-4 text-slate-500" />
                                                            <span>{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                                            <MapPin className="w-4 h-4 text-slate-500" />
                                                            <span>Shipping to Riyadh, SA</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-slate-400 hover:text-gold bg-white/5"
                                                            onClick={() => router.push(`/account/orders/${order._id}`)}
                                                        >
                                                            View Details
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-slate-400 hover:text-gold bg-white/5"
                                                            onClick={() => router.push(`/account/orders/${order._id}`)}
                                                        >
                                                            Track Shipment
                                                        </Button>
                                                        {order.status === 'delivered' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 ml-auto"
                                                            >
                                                                Buy Again
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card className="glass border-white/5 py-16">
                                        <div className="text-center space-y-4">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 mb-4">
                                                <Package className="w-10 h-10 text-gold" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white">No orders found</h2>
                                            <p className="text-slate-400 max-w-sm mx-auto">
                                                {searchQuery || statusFilter !== 'all'
                                                    ? 'Try adjusting your search or filters to find what you are looking for.'
                                                    : 'You haven\'t placed any orders yet. Start shopping to see them here!'}
                                            </p>
                                            <Button onClick={() => router.push('/products')} className="bg-gold text-navy hover:bg-yellow">
                                                Browse Catalog
                                            </Button>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
