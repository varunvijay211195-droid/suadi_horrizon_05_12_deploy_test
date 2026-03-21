"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Cookie, Save, RefreshCw, BarChart3, Download, Trash2, Shield, Eye, Database, Target } from 'lucide-react';

interface CookieConsentSettings {
    enabled: boolean;
    necessaryOnly: boolean;
    analytics: boolean;
    marketing: boolean;
    position: string;
    expiration: number;
}

interface CookieStatistics {
    totalConsents: number;
    analyticsOptIns: number;
    marketingOptIns: number;
    acceptanceRate: number;
}

export default function AdminCookieConsentPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [settings, setSettings] = useState<CookieConsentSettings>({
        enabled: true,
        necessaryOnly: false,
        analytics: true,
        marketing: false,
        position: 'bottom',
        expiration: 365
    });
    const [statistics, setStatistics] = useState<CookieStatistics>({
        totalConsents: 0,
        analyticsOptIns: 0,
        marketingOptIns: 0,
        acceptanceRate: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const getHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/cookie-consent', {
                headers: getHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    setSettings(prev => ({
                        ...prev,
                        ...data.settings
                    }));
                }
                if (data.statistics) {
                    setStatistics(data.statistics);
                }
            }
        } catch (error) {
            console.error('Error loading cookie consent data:', error);
            toast.error('Failed to load cookie consent data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/cookie-consent', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast.success('Cookie consent settings saved to database');
                loadData();
            } else {
                toast.error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/cookie-consent/export', {
                headers: getHeaders()
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cookie-consent-audit-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success('Audit log exported successfully');
            } else {
                toast.error('Failed to export audit log');
            }
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Error exporting audit log');
        } finally {
            setExporting(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('This will permanently delete all consent records from the database. This action cannot be undone. Are you sure?')) {
            return;
        }
        setResetting(true);
        try {
            const response = await fetch('/api/cookie-consent', {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (response.ok) {
                toast.success('All consent records have been purged');
                loadData();
            } else {
                toast.error('Failed to reset records');
            }
        } catch (error) {
            console.error('Error resetting:', error);
            toast.error('Error resetting records');
        } finally {
            setResetting(false);
        }
    };

    const categoryCards = [
        {
            key: 'enabled',
            title: 'Cookie Consent Banner',
            description: 'Display the consent banner to new visitors',
            icon: Cookie,
            required: false,
        },
        {
            key: 'necessaryOnly',
            title: 'Strict Mode',
            description: 'Only allow essential cookies by default',
            icon: Shield,
            required: false,
        },
        {
            key: 'analytics',
            title: 'Analytics Tracking',
            description: 'Enable anonymous visitor behavior tracking',
            icon: Database,
            required: false,
        },
        {
            key: 'marketing',
            title: 'Marketing Pixels',
            description: 'Enable retargeting and conversion tracking',
            icon: Target,
            required: false,
        },
    ];

    return (
        <AdminLayout title="Cookie Consent" description="Privacy compliance & consent audit management">
            <div className="space-y-6">
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${settings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm text-white font-medium">
                            Consent Banner: {settings.enabled ? 'Active' : 'Inactive'}
                        </span>
                        <Badge className="bg-gold/20 text-gold border-0 text-xs">
                            MongoDB Persistent
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleExport}
                            disabled={exporting || statistics.totalConsents === 0}
                            variant="outline"
                            size="sm"
                            className="border-gold/30 text-gold hover:bg-gold/10"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {exporting ? 'Exporting...' : 'Export Audit Log'}
                        </Button>
                        <Button
                            onClick={loadData}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Settings Card */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Cookie className="h-5 w-5 text-gold" />
                                Cookie Categories
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Toggle which cookie categories are available on your site
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {categoryCards.map((cat) => (
                                <div key={cat.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-gold/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                                            <cat.icon className="w-4 h-4 text-gold" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">{cat.title}</p>
                                            <p className="text-xs text-slate-500">{cat.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, [cat.key]: !((settings as any)[cat.key]) })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${((settings as any)[cat.key])
                                            ? 'bg-gold'
                                            : 'bg-white/10'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${((settings as any)[cat.key]) ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}

                            <div className="pt-4 flex gap-2">
                                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gold hover:bg-gold/90 text-navy font-bold">
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? 'Saving...' : 'Save to Database'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics Card */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-gold" />
                                    Consent Analytics
                                </span>
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Live consent statistics from your MongoDB records
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-black text-white">{statistics.totalConsents}</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Total Consents</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-black text-gold">{statistics.acceptanceRate}%</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Acceptance Rate</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-black text-emerald-400">{statistics.analyticsOptIns}</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Analytics Opt-ins</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-black text-purple-400">{statistics.marketingOptIns}</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Marketing Opt-ins</p>
                                </div>
                            </div>

                            {/* Acceptance Rate Bar */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-400">Overall Acceptance</span>
                                    <span className="text-sm font-bold text-white">{statistics.acceptanceRate}%</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-gold/50 to-gold h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.max(2, statistics.acceptanceRate)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="border-t border-white/5 pt-6">
                                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gold" />
                                    Banner Preview
                                </h4>
                                <div className="bg-navy/80 border border-white/10 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Cookie className="w-4 h-4 text-gold" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium mb-1">We value your privacy</p>
                                            <p className="text-slate-500 text-xs mb-2">
                                                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                <Button size="sm" className="bg-gold hover:bg-gold/90 text-navy text-xs h-7 font-bold">
                                                    Accept All
                                                </Button>
                                                <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-7">
                                                    Reject
                                                </Button>
                                                <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-7">
                                                    Customize
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 text-center mt-2">
                                    Live preview of the cookie banner displayed on your site
                                </p>
                            </div>

                            {/* Danger Zone */}
                            <div className="border-t border-red-500/20 pt-4">
                                <h4 className="text-red-400 font-medium text-sm mb-3">Danger Zone</h4>
                                <Button
                                    onClick={handleReset}
                                    disabled={resetting || statistics.totalConsents === 0}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {resetting ? 'Purging...' : `Purge All Records (${statistics.totalConsents})`}
                                </Button>
                                <p className="text-xs text-slate-600 mt-2">
                                    This will permanently delete all consent records from MongoDB. Export first for compliance.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <div className="flex flex-wrap gap-3 justify-center pt-4">
                    <a href="/cookie-policy" target="_blank" className="text-gold hover:text-gold/80 text-sm underline underline-offset-4">
                        View Cookie Policy Page →
                    </a>
                    <span className="text-slate-700">|</span>
                    <a href="/" target="_blank" className="text-gold hover:text-gold/80 text-sm underline underline-offset-4">
                        View Live Site →
                    </a>
                </div>
            </div>
        </AdminLayout>
    );
}
