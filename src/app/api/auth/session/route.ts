import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/server';

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, session });
}
