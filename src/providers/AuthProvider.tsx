'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SessionPayload } from '@/lib/auth/types';

interface AuthContextValue {
  session: SessionPayload | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchSession(): Promise<SessionPayload | null> {
  try {
    const response = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.session ?? null;
  } catch (error) {
    console.error('Failed to fetch session', error);
    return null;
  }
}

export function AuthProvider({ children, initialSession }: { children: React.ReactNode; initialSession?: SessionPayload | null }) {
  const [session, setSession] = useState<SessionPayload | null>(initialSession ?? null);
  const [loading, setLoading] = useState(!initialSession);

  const refresh = useCallback(async () => {
    setLoading(true);
    const nextSession = await fetchSession();
    setSession(nextSession);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
  }, []);

  useEffect(() => {
    if (initialSession) return;
    refresh();
  }, [initialSession, refresh]);

  const value = useMemo<AuthContextValue>(() => ({ session, loading, refresh, signOut }), [loading, refresh, session, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
