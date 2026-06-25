import { NextResponse } from 'next/server';

// Middleware is a no-op: auth is handled client-side via Zustand + API 401s.
// Cross-domain deployment (Vercel + Render) means the httpOnly cookie is on
// the Render domain and is never visible to the Vercel edge runtime.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
