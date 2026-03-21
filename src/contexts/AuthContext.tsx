"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister, getAuthConfig } from "@/api/auth";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";

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
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setAuthData: (accessToken: string, refreshToken: string, userData: User, redirectUrl?: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
    const [authStrategy, setAuthStrategy] = useState<AuthStrategy | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Initialize auth state from localStorage on client side
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem("accessToken");
            const userData = localStorage.getItem("userData");
            setIsAuthenticated(!!accessToken);
            setUser(userData ? JSON.parse(userData) : null);
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        const fetchAuthConfig = async () => {
            try {
                const config = await getAuthConfig();
                setAuthConfig(config);
                setAuthStrategy(config.strategy);
            } catch (error) {
                console.error('Failed to fetch auth config:', error);
                setAuthStrategy('email');
            }
        };
        fetchAuthConfig();
    }, []);

    const setAuthData = (accessToken: string, refreshToken: string, userData: User, redirectUrl: string = '/') => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("userData", JSON.stringify(userData));
        }
        setUser(userData);
        setIsAuthenticated(true);
        router.push(redirectUrl);
    };

    const resetAuth = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userData");
        }
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await apiLogin(email, password);
            const { accessToken, refreshToken, ...userData } = response;
            setAuthData(accessToken, refreshToken, userData);
        } catch (error) {
            resetAuth();
            throw error;
        }
    };

    const register = async (email: string, password: string) => {
        try {
            const response = await apiRegister(email, password);
            const { accessToken, refreshToken, ...userData } = response;
            setAuthData(accessToken, refreshToken, userData);
        } catch (error) {
            resetAuth();
            throw error;
        }
    };

    const loginWithOAuth = (provider = 'default') => {
        if (!authConfig?.oauth) {
            throw new Error('OAuth not configured');
        }

        const oauthProvider = authConfig.oauth[provider];
        if (!oauthProvider) {
            throw new Error(`OAuth provider '${provider}' not configured`);
        }

        const { authorizeUrl, clientId, scope } = oauthProvider;
        const redirectUri = `${window.location.origin}/login`;
        const state = `${provider}:${Math.random().toString(36).substring(7)}`;

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope,
            state: state
        });

        if (provider === 'google') {
            params.set('access_type', 'offline');
            params.set('prompt', 'consent');
        }

        window.location.href = `${authorizeUrl}?${params.toString()}`;
    };

    const logout = () => {
        resetAuth();
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            authStrategy,
            authConfig,
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
        user: user ? { 
            ...user, 
            token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '' 
        } : null,
        isAuthenticated
    };
}
