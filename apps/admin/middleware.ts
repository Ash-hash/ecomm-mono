import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export function middleware(
  request: NextRequest,
) {
  const token =
    request.cookies.get(
      'sa_access_token',
    )?.value;

  const pathname =
    request.nextUrl.pathname;

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tenants') ||
    pathname.startsWith('/settings');

  if (isProtected && !token) {
    return NextResponse.redirect(
      new URL('/login', request.url),
    );
  }

  if (pathname === '/login' && token) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tenants/:path*',
    '/settings/:path*',
    '/login',
  ],
};