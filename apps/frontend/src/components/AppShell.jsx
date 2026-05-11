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
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, Users, Home, Tag, Handshake, Star,
  Map, UserCog, BookOpen, FileText, ClipboardList,
  Plus, DollarSign, Archive, LogOut, ChevronRight, ChevronLeft,
} from 'lucide-react';

// ── Nav items per role ────────────────────────────────────────────────────────
const NAV_ITEMS = {
  gm: [
    { label: 'لوحة التحكم',      href: '/dashboard',        icon: LayoutDashboard },
    { label: 'الأيتام',           href: '/orphans',           icon: Users },
    { label: 'الأسر',             href: '/families',          icon: Home },
    { label: 'مجمع التسويق',     href: '/marketing-pool',    icon: Tag },
    { label: 'الكفلاء',           href: '/sponsors',          icon: Handshake },
    { label: 'الأيتام الموهوبون', href: '/orphans/gifted',    icon: Star },
    { label: 'تحليلات المحافظات', href: '/governorates',      icon: Map },
    { label: 'إدارة المستخدمين', href: '/users',              icon: UserCog },
    { label: 'إعدادات الحفظ',    href: '/quran-thresholds',  icon: BookOpen },
    { label: 'التقارير',          href: '/reports',           icon: FileText },
  ],
  supervisor: [
    { label: 'لوحة التحكم',    href: '/dashboard',      icon: LayoutDashboard },
    { label: 'طلبات التسجيل',  href: '/registrations',  icon: ClipboardList },
    { label: 'تقارير الحفظ',   href: '/quran-reports',  icon: BookOpen },
    { label: 'كشف الصرف',      href: '/disbursements/', icon: DollarSign },
    { label: 'التقارير',        href: '/reports',        icon: FileText },
  ],
  agent: [
    { label: 'لوحة التحكم',     href: '/dashboard',         icon: LayoutDashboard },
    { label: 'أيتامي',           href: '/my-orphans',        icon: Users },
    { label: 'تسجيل يتيم',      href: '/orphans/new',       icon: Plus },
    { label: 'تسجيل أسرة',      href: '/families/new',      icon: Plus },
    { label: 'رفع تقرير الحفظ', href: '/quran-reports/new', icon: BookOpen },
  ],
  finance: [
    { label: 'لوحة التحكم',   href: '/dashboard',             icon: LayoutDashboard },
    { label: 'كشف الصرف',     href: '/disbursements',         icon: DollarSign },
    { label: 'سجل الإصدارات', href: '/disbursements/history', icon: Archive },
    { label: 'التقارير',       href: '/reports',               icon: FileText },
  ],
};

// ── Role labels in Arabic ─────────────────────────────────────────────────────
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
            {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
                <item.icon size={18} className="flex-shrink-0" />
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
              <LogOut size={18} />
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
            {/* ── Real notification bell ── */}
            <NotificationBell />

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