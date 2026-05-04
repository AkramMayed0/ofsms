'use client';

/**
 * Root page — redirect based on auth state.
 *
 * IMPORTANT: After a page refresh, accessToken is null for ~200ms
 * while AuthBootstrap silently calls /auth/refresh.
 * During that time we must NOT redirect to /login.
 *
 * Strategy:
 *  - If authenticated (token in memory) → go to correct dashboard by role
 *  - If not authenticated but user exists in sessionStorage → wait (AuthBootstrap is working)
 *  - If neither → go to /login
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';

// Maps each role to its home dashboard route
const ROLE_DASHBOARD = {
  gm:         '/dashboard',
  supervisor: '/dashboard/supervisor',
  agent:      '/dashboard',
  finance:    '/dashboard',
};

export default function HomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user        = useAuthStore((s) => s.user);

  useEffect(() => {
    if (accessToken && user) {
      // Fully authenticated — go to role-specific dashboard
      const dest = ROLE_DASHBOARD[user.role] || '/dashboard';
      router.replace(dest);
    } else if (!accessToken && !user) {
      // No session at all → login
      router.replace('/login');
    }
    // If user exists but no token → AuthBootstrap is mid-refresh, wait
  }, [accessToken, user, router]);

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gray-50"
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">جارٍ التحميل…</p>
      </div>
    </main>
  );
}
