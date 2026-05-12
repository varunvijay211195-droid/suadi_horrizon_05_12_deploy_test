"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthStrategy = 'email' | 'pythagora_oauth' | 'google_oauth' | 'multi_oauth';

type OAuthProvider = {
    name: string;
    authorizeUrl: string;
    clientId: string;
    scope: string;
    icon?: string;
};

type AuthConfig = {
    strategy: AuthStrategy;
    oauth?: {
        [key: string]: OAuthProvider;
    };
};

type AuthContextType = {
    isAuthenticated: boolean;
    user: User | null;
    authStrategy: AuthStrategy | null;
    authConfig: AuthConfig | null;
    isInitialized: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithOAuth: (provider?: string) => void;
    register: (email: string, password: string, name?: string, phone?: string) => Promise<void>;
    logout: () => void;
    setAuthData: (accessToken: string, refreshToken: string, userData: User, redirectUrl?: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const supabase = createClient();

    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Helper to sync tokens for legacy code compatibility
        const syncTokens = (session: any) => {
            if (session?.access_token) {
                localStorage.setItem('accessToken', session.access_token);
            } else {
                localStorage.removeItem('accessToken');
            }
            
            if (session?.refresh_token) {
                localStorage.setItem('refreshToken', session.refresh_token);
            } else {
                localStorage.removeItem('refreshToken');
            }
        };

        // Get initial session
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                syncTokens(session);
                // Fetch user profile from users table
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: userData?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
                    role: userData?.role || 'customer',
                    createdAt: userData?.created_at || session.user.created_at || new Date().toISOString(),
                    updatedAt: userData?.updated_at || new Date().toISOString(),
                    phone: userData?.phone || session.user.user_metadata?.phone || '',
                    avatar: userData?.avatar || session.user.user_metadata?.avatar_url || '',
                });
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
                syncTokens(null);
            }
            setIsInitialized(true);
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthContext] Auth event: ${event}`);
            
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                syncTokens(session);
                
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: userData?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
                    role: userData?.role || 'customer',
                    createdAt: userData?.created_at || session.user.created_at || new Date().toISOString(),
                    updatedAt: userData?.updated_at || new Date().toISOString(),
                    phone: userData?.phone || session.user.user_metadata?.phone || '',
                    avatar: userData?.avatar || session.user.user_metadata?.avatar_url || '',
                });
                setIsAuthenticated(true);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAuthenticated(false);
                syncTokens(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Login failed');
        }

        const data = await response.json();
        // After API login, we need to set the session in the Supabase client
        // The API returns tokens which we can use
        const { accessToken, refreshToken, user: userData } = data;
        
        const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        if (error) throw error;
        
        // Save token to localStorage for legacy compatibility
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        setUser(userData);
        setIsAuthenticated(true);
    };

    const register = async (email: string, password: string, name?: string, phone?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, phone },
            },
        });
        if (error) throw error;
        
        // If session is present (auto-confirmed), sync tokens
        if (data.session) {
            localStorage.setItem('accessToken', data.session.access_token);
            localStorage.setItem('refreshToken', data.session.refresh_token);
        }

        // Also create user record in users table
        if (data.user) {
            await supabase.from('users').upsert({
                id: data.user.id,
                email,
                name: name || '',
                phone: phone || '',
                role: 'customer',
                created_at: new Date().toISOString(),
            });
        }
    };

    const loginWithOAuth = (provider = 'google') => {
        supabase.auth.signInWithOAuth({
            provider: provider as any,
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const setAuthData = (accessToken: string, refreshToken: string, userData: User, redirectUrl: string = '/') => {
        // Legacy support
        setUser(userData);
        setIsAuthenticated(true);
        router.push(redirectUrl);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            authStrategy: 'email',
            authConfig: { strategy: 'email' },
            isInitialized,
            login,
            loginWithOAuth,
            register,
            logout,
            setAuthData
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Alias for useSession compatibility
export function useSession() {
    const { user, isAuthenticated } = useAuth();
    return { 
        user: user,
        isAuthenticated
    };
}
