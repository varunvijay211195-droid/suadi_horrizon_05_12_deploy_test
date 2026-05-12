'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        
        setLoading(true);
        setError('');

        try {
            await login(email, password);

            toast.success('Signed in successfully', {
                description: 'Welcome back to Saudi Horizon',
            });
            
            // Redirect will happen, but we don't setLoading(false) yet to avoid flicker
            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.message || 'Incorrect email or password. Please try again.';
            setError(errorMessage);
            toast.error('Sign in failed', {
                description: errorMessage,
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden font-display">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-64 animate-pulse" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full relative z-10 px-6"
            >
                <div className="glass-premium p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-50" />

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 mb-6 relative group-hover:border-gold/30 transition-all duration-500">
                            <Shield className="w-10 h-10 text-gold drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                            <div className="absolute -inset-2 bg-gold/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Sign In</h2>
                        <p className="text-sm text-white/40 font-medium">Welcome back — enter your details below</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                                >
                                    <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-xs font-bold text-red-200">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Email Address</label>
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-gold transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none focus:border-gold/50 focus:bg-white/[0.06] transition-all"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Password</label>
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-gold transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none focus:border-gold/50 focus:bg-white/[0.06] transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <label className="flex items-center gap-2 cursor-pointer group/check">
                                <div className="w-4 h-4 rounded border border-white/10 bg-white/5 flex items-center justify-center group-hover/check:border-gold transition-colors relative">
                                    <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="w-2 h-2 rounded-sm bg-gold opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover/check:text-white transition-colors">Remember me</span>
                            </label>
                            <Link href="/forgot-password" className="text-[10px] font-bold text-gold/60 uppercase tracking-widest hover:text-gold transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full group relative flex items-center justify-center gap-3 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all overflow-hidden ${loading
                                ? 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed'
                                : 'bg-gold text-navy border border-gold shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:shadow-[0_0_50px_rgba(255,215,0,0.3)] hover:-translate-y-1 active:translate-y-0'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-3">
                                {loading ? 'Signing in...' : 'Sign In'}
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </div>
                            {!loading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-sm text-white/30 font-medium">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-gold hover:text-gold/80 font-bold transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
