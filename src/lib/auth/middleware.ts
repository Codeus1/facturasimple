import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_CONFIG } from './config';
import { verifyToken } from './token';

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(AUTH_CONFIG.cookieName)?.value;
  const payload = await verifyToken(token ?? null);
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  return null;
}

export function enforceHttps(request: NextRequest): NextResponse | null {
  const isSecure = request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:';
  if (process.env.NODE_ENV === 'production' && !isSecure) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }
  return null;
}
