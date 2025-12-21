'use client';

import { useMemo } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';

export function useAuth() {
  const { session, loading, refresh, signOut } = useAuthContext();
  const tenantId = session?.tenantId ?? 'public';
  const userId = session?.id ?? 'anonymous';

  return useMemo(
    () => ({
      session,
      loading,
      tenantId,
      userId,
      refresh,
      signOut,
      isAuthenticated: !!session,
    }),
    [loading, refresh, session, signOut, tenantId, userId]
  );
}
