import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/auth/middleware';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/verify',
  '/auth/',
  '/api/auth/',
  '/privacy',
  '/terms',
  '/m/',
  '/api/v1/public',
  '/api/v1/webhooks',
  '/api/inngest',
];

const PROTECTED_PREFIXES = ['/dashboard', '/menu', '/qr', '/orders', '/analytics', '/settings', '/branches', '/onboarding'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
