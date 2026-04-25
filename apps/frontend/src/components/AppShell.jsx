'use client';

/**
 * AppShell.jsx — Main layout wrapper for authenticated pages
 *
 * Renders: RTL sidebar + top bar + main content area
 * Role-aware: nav items shown based on user.role
 * Usage: wrap any authenticated page with <AppShell>{children}</AppShell>
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';

// ── Nav items per role ────────────────────────────────────────────────────────
const NAV_ITEMS = {
  gm: [
    { label: 'لوحة التحكم',     href: '/dashboard',          icon: '📊' },
    { label: 'الأيتام',          href: '/orphans',             icon: '👦' },
    { label: 'الأسر',            href: '/families',            icon: '👨‍👩‍👧' },
    { label: 'الكفلاء',          href: '/sponsors',            icon: '🤝' },
    { label: 'قائمة التسويق',    href: '/marketing-pool',   icon: '📣' }, 
    { label: 'الأيتام الموهوبون', href: '/gifted',             icon: '🌟' },
    { label: 'تحليلات المحافظات', href: '/governorates',       icon: '🗺️' },
    { label: 'إدارة المستخدمين', href: '/users',               icon: '👥' },
    { label: 'الإعلانات',        href: '/announcements',       icon: '📢' },
    { label: 'التقارير',         href: '/reports',             icon: '📄' },
  ],
  supervisor: [
    { label: 'لوحة التحكم', href: '/dashboard/supervisor', icon: '📊' },    
    { label: 'طلبات التسجيل',   href: '/registrations',       icon: '📋' },
    { label: 'تقارير الحفظ',    href: '/quran-reports',       icon: '📖' },
    { label: 'كشف الصرف',       href: '/disbursements',       icon: '💰' },
    { label: 'التقارير',         href: '/reports',             icon: '📄' },
  ],
  agent: [
    { label: 'لوحة التحكم',     href: '/dashboard',           icon: '📊' },
    { label: 'أيتامي',           href: '/my-orphans',          icon: '👦' },
    { label: 'تسجيل يتيم',      href: '/orphans/new',         icon: '➕' },
    { label: 'تسجيل أسرة',      href: '/families/new',        icon: '➕' },
    { label: 'رفع تقرير الحفظ', href: '/quran-reports/new',   icon: '📖' },
  ],
  finance: [
    { label: 'لوحة التحكم',     href: '/dashboard',           icon: '📊' },
    { label: 'كشف الصرف',       href: '/disbursements',       icon: '💰' },
    { label: 'سجل الإصدارات',   href: '/disbursements/history', icon: '🗂️' },
    { label: 'التقارير',         href: '/reports',             icon: '📄' },
  ],
};

// ── Role labels in Arabic ────────────────────────────────────────────────────
const ROLE_LABELS = {
  gm:         'المدير العام',
  supervisor: 'مشرف الأيتام',
  agent:      'مندوب',
  finance:    'القسم المالي',
  sponsor:    'كافل',
};

// ── AppShell component ────────────────────────────────────────────────────────
export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, clearAuth } = useAuthStore();

  const navItems = NAV_ITEMS[user?.role] || [];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore errors — clear auth regardless
    }
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50" dir="rtl">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 right-0 h-full z-30 bg-white border-l border-gray-200
          flex flex-col transition-all duration-300 shadow-card
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Logo / toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          {sidebarOpen && (
            <span className="text-primary font-bold text-base leading-tight">
              نظام إدارة<br />الأيتام والأسر
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            aria-label="تبديل القائمة"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                  }
                `}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-100 p-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role]}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-danger hover:underline flex-shrink-0"
              >
                خروج
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center text-danger hover:bg-red-50 p-2 rounded-lg transition"
              title="تسجيل الخروج"
            >
              🚪
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <main
        className={`
          flex-1 flex flex-col min-h-screen transition-all duration-300
          ${sidebarOpen ? 'mr-64' : 'mr-16'}
        `}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-bold text-gray-800">
            {navItems.find((i) => i.href === pathname)?.label || 'نظام إدارة الأيتام والأسر'}
          </h1>
          <div className="flex items-center gap-3">
            {/* Notification bell placeholder */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
              🔔
            </button>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ar-YE', { dateStyle: 'medium' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
