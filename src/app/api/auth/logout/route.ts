import { NextResponse } from 'next/server';
import { destroySessionCookie, getSessionFromRequest } from '@/lib/auth/server';
import { recordAudit } from '@/services/auditTrail';

export async function POST() {
  const session = await getSessionFromRequest();
  const cookie = destroySessionCookie();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  if (session) {
    recordAudit({ action: 'logout', tenantId: session.tenantId, userId: session.id });
  }

  return response;
}
