/**
 * middleware.js — OFSMS Route Guard
 *
 * Runs on every request (edge runtime).
 * Protected paths: everything EXCEPT /login and /api/*
 *
 * Strategy: the access token lives in memory (Zustand), not a cookie,
 * so the middleware can only check the httpOnly refreshToken cookie as
 * a signal that the user has an active session.
 *
 * If refreshToken cookie is absent on a protected route → redirect to /login.
 * The actual token validation still happens server-side in each API call.
 */

import { NextResponse } from 'next/server';

/** Routes that never require authentication */
const PUBLIC_PATHS = ['/login'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Check for refresh token cookie as session signal
  const hasSession = request.cookies.has('refreshToken');

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the intended destination so we can redirect after login (future)
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
