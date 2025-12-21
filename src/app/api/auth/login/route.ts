import { NextResponse } from 'next/server';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { createSessionCookie, getTenantFromHeaders } from '@/lib/auth/server';
import type { SessionUser } from '@/lib/auth/types';
import { recordAudit } from '@/services/auditTrail';

interface LoginPayload {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginPayload;
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Credenciales incompletas' }, { status: 400 });
  }

  const { demoUser } = AUTH_CONFIG;
  const isDemoUser = email === demoUser.email && password === demoUser.password;

  if (!isDemoUser) {
    return NextResponse.json({ error: 'Credenciales no válidas' }, { status: 401 });
  }

  const tenantId = getTenantFromHeaders() || demoUser.tenantId;
  const sessionUser: SessionUser = {
    id: demoUser.id,
    email,
    name: demoUser.name,
    tenantId,
  };

  const cookie = await createSessionCookie(sessionUser);
  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  recordAudit({ action: 'login', tenantId, userId: sessionUser.id });

  return response;
}
