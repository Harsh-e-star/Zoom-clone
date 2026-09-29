'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserProfileUpdateDto } from '@/types/auth';
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  getMe,
  LoginParams,
  SignupParams,
} from '@/lib/api/auth';
import { updateUserProfile as apiUpdateProfile } from '@/lib/api/users';
import { getStoredToken } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  signup: (params: SignupParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (profile: UserProfileUpdateDto) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that unauthenticated users can access
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/join'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await getMe();
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('meetspace_user', JSON.stringify(userData));
      }
    } catch {
      // Token expired or invalid
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      const token = getStoredToken();
      if (token) {
        try {
          const cached = localStorage.getItem('meetspace_user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch {
              // ignore parse error
            }
          }
          const fresh = await getMe();
          setUser(fresh);
        } catch {
          // Token invalid, clear it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('meetspace_token');
            localStorage.removeItem('meetspace_user');
          }
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  // Route protection redirect effect
  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

    if (!user && !isPublic) {
      // Unauthenticated user trying to access protected route -> redirect to /login
      router.replace('/login');
    } else if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
      // Authenticated user on auth pages -> redirect to home
      router.replace('/');
    }
  }, [user, isLoading, pathname, router]);

  const handleLogin = async (params: LoginParams) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(params);
      setUser(res.user);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (params: SignupParams) => {
    setIsLoading(true);
    try {
      const res = await apiSignup(params);
      setUser(res.user);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (profile: UserProfileUpdateDto) => {
    const updated = await apiUpdateProfile(profile);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        refreshUser,
        updateUser: handleUpdateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
