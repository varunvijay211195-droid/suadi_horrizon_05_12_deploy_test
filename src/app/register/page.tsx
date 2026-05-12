'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Lock, Mail, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            await register(formData.email, formData.password, formData.name, formData.phone);
            
            // Note: register in AuthContext handles upsert and token sync
            // If it succeeded, we check if we're authenticated (auto-confirm)
            // or if we need to show the success message (confirm email)
            
            // We'll wait a bit for AuthContext to update its state
            setTimeout(() => {
                const session = localStorage.getItem('accessToken');
                if (session) {
                    toast.success('Account created!', { description: 'Welcome to Saudi Horizon.' });
                    router.push('/');
                } else {
                    setSuccess(true);
                    toast.success('Check your email!', { description: 'We sent a confirmation link to verify your account.' });
                }
            }, 1000);
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { id: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith', icon: User },
        { id: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', icon: Mail },
        { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+966 5X XXX XXXX (optional)', icon: Phone },
        { id: 'password', label: 'Password', type: 'password', placeholder: 'At least 8 characters', icon: Lock },
        { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat your password', icon: Lock },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden font-display py-12">
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
                            <UserPlus className="w-10 h-10 text-gold drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                            <div className="absolute -inset-2 bg-gold/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            {success ? 'Check Your Email' : 'Create Account'}
                        </h2>
                        <p className="text-sm text-white/40 font-medium">
                            {success ? `We sent a confirmation link to ${formData.email}` : 'Fill in your details to get started'}
                        </p>
                    </div>

                    {!success ? (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-xs font-bold text-red-200">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {fields.map(({ id, label, type, placeholder, icon: Icon }) => (
                                <div key={id} className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">{label}</label>
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-gold transition-colors">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <input
                                            id={id}
                                            name={id}
                                            type={type}
                                            required={id !== 'phone'}
                                            className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none focus:border-gold/50 focus:bg-white/[0.06] transition-all placeholder:text-white/20"
                                            placeholder={placeholder}
                                            value={formData[id as keyof typeof formData]}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full group relative flex items-center justify-center gap-3 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all overflow-hidden mt-2 ${loading
                                    ? 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed'
                                    : 'bg-gold text-navy border border-gold shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:shadow-[0_0_50px_rgba(255,215,0,0.3)] hover:-translate-y-1 active:translate-y-0'
                                    }`}
                            >
                                <div className="relative z-10 flex items-center gap-3">
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                </div>
                                {!loading && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                                <Mail className="w-10 h-10 text-gold" />
                            </div>
                            <p className="text-sm text-white/50">
                                Click the link in the email to activate your account, then sign in.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-gold font-bold text-sm hover:text-gold/80 transition-colors"
                            >
                                Go to Sign In <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-sm text-white/30 font-medium">
                            Already have an account?{' '}
                            <Link href="/login" className="text-gold hover:text-gold/80 font-bold transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
