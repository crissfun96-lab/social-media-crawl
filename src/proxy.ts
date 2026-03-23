import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/api/bot/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('smc_session')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = verifySessionToken(token);
  if (!session) {
    const response = pathname.startsWith('/api/')
      ? Response.json({ success: false, error: 'Authentication required' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    // Clear invalid cookie on redirect responses
    if (response instanceof NextResponse) {
      response.cookies.delete('smc_session');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
