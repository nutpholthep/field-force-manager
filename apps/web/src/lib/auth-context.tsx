'use client';

import type { User } from '@ffm/shared';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { http } from './api';
import { tokenStorage } from './token-storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  user: User;
  tokens: { access_token: string; refresh_token: string; expires_in: number };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadMe = useCallback(async () => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const { data } = await http.get<User>('/auth/me');
      setState({ user: data, isLoading: false, isAuthenticated: true });
    } catch {
      tokenStorage.clear();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await http.post<AuthResponse>('/auth/login', { email, password });
      tokenStorage.set(data.tokens.access_token, data.tokens.refresh_token);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(() => {
    http.post('/auth/logout').catch(() => undefined);
    tokenStorage.clear();
    setState({ user: null, isLoading: false, isAuthenticated: false });
    router.push('/login');
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refresh: loadMe }),
    [state, login, logout, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
