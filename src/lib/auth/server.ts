import { cookies, headers } from 'next/headers';
import { AUTH_CONFIG } from './config';
import { createToken, verifyToken } from './token';
import type { SessionUser, SessionPayload } from './types';

export async function getSessionFromRequest(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_CONFIG.cookieName)?.value;
  return verifyToken(token ?? null);
}

export async function createSessionCookie(
  user: SessionUser
): Promise<{ name: string; value: string; options: Record<string, unknown> }> {
  const token = await createToken(user);
  return {
    name: AUTH_CONFIG.cookieName,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: AUTH_CONFIG.tokenTTL,
    },
  };
}

export function destroySessionCookie(): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: AUTH_CONFIG.cookieName,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    },
  };
}

export function getTenantFromHeaders(): string {
  const tenantHeader = headers().get('x-tenant-id');
  return tenantHeader ?? AUTH_CONFIG.defaultTenant;
}

export async function ensureSession(): Promise<SessionPayload> {
  const session = await getSessionFromRequest();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
