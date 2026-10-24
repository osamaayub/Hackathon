'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const session = await api.getSession().catch(() => null);
    setUser(session?.user ?? null);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    await api.signIn({ email, password });
    await refresh();
  }

  async function signUp(email: string, password: string, name?: string) {
    await api.signUp({ email, password, name });
    await refresh();
  }

  async function signOut() {
    await api.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
