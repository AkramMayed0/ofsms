/**
 * middleware.js — OFSMS Route Guard
 *
 * Runs on every request (edge runtime).
 * Protected paths: everything EXCEPT /login, /sponsor/portal, and /api/*
 *
 * Strategy: the access token lives in memory (Zustand), not a cookie,
 * so the middleware can only check the httpOnly refreshToken cookie as
 * a signal that the user has an active session.
 *
 * If refreshToken cookie is absent on a protected route → redirect to /login.
 * Sponsors visiting /sponsor/portal are allowed through without a session.
 */

import { NextResponse } from 'next/server';

/** Routes that never require authentication */
const PUBLIC_PATHS = ['/login', '/sponsor/portal'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths, Next.js internals, and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api') ||
    /\.(png|jpg|jpeg|svg|ico|webp|gif|css|js|woff2?|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check for refresh token cookie as session signal
  const hasSession = request.cookies.has('refreshToken');

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
