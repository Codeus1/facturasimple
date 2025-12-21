import { NextResponse, type NextRequest } from 'next/server';
import { enforceHttps, requireAuth } from '@/lib/auth/middleware';

const PROTECTED_PATHS = ['/', '/dashboard', '/clients', '/invoices'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(base => pathname === base || pathname.startsWith(`${base}/`));
}

export default async function middleware(request: NextRequest) {
  const httpsRedirect = enforceHttps(request);
  if (httpsRedirect) return httpsRedirect;

  if (isProtectedPath(request.nextUrl.pathname)) {
    const authRedirect = await requireAuth(request);
    if (authRedirect) return authRedirect;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard', '/clients/:path*', '/invoices/:path*'],
};
