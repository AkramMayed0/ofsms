'use client';

/**
 * AppShell.jsx — Main layout wrapper for authenticated pages
 *
 * Mobile  (<768px): sidebar is hidden by default. A ☰ button in the top bar
 *                   opens it as a full-width drawer with a dark backdrop.
 * Desktop (≥768px): sidebar is fixed on the right. Content shifts left.
 *                   A toggle button collapses it to icons only.
 *
 * Usage: wrap any authenticated page with <AppShell>{children}</AppShell>
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, Users, Home, Tag, Handshake, Star,
  Map, UserCog, BookOpen, FileText, ClipboardList,
  Plus, DollarSign, Archive, LogOut, ChevronRight, ChevronLeft, Menu, X, Megaphone,
} from 'lucide-react';

// ── Nav items per role ────────────────────────────────────────────────────────
const NAV_ITEMS = {
  gm: [
    {
      group: 'الرئيسية',
      items: [
        { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'الأيتام والأسر',
      items: [
        { label: 'الأيتام',            href: '/orphans',         icon: Users },
        { label: 'الأسر',              href: '/families',        icon: Home },
        { label: 'أيتامي',             href: '/my-orphans',      icon: Users },
        { label: 'الأيتام الموهوبون',  href: '/orphans/gifted',  icon: Star },
        { label: 'مجمع التسويق',      href: '/marketing-pool',  icon: Tag },
        { label: 'تسجيل يتيم',        href: '/orphans/new',     icon: Plus },
        { label: 'تسجيل أسرة',        href: '/families/new',    icon: Plus },
      ],
    },
    {
      group: 'الكفلاء والتسجيل',
      items: [
        { label: 'الكفلاء',         href: '/sponsors',       icon: Handshake },
        { label: 'طلبات التسجيل',   href: '/registrations',  icon: ClipboardList },
      ],
    },
    {
      group: 'القرآن الكريم',
      items: [
        { label: 'إعدادات الحفظ',       href: '/quran-thresholds',  icon: BookOpen },
        { label: 'مراجعة تقارير الحفظ', href: '/quran-reports',     icon: ClipboardList },
        { label: 'رفع تقرير الحفظ',     href: '/quran-reports/new', icon: BookOpen },
      ],
    },
    {
      group: 'المالية',
      items: [
        { label: 'كشف الصرف',     href: '/disbursements',         icon: DollarSign },
        { label: 'سجل الإصدارات', href: '/disbursements/history', icon: Archive },
      ],
    },
    {
      group: 'التقارير والتواصل',
      items: [
        { label: 'تحليلات المحافظات', href: '/governorates',  icon: Map },
        { label: 'التقارير',           href: '/reports',       icon: FileText },
        { label: 'الإعلانات',          href: '/announcements', icon: Megaphone },
      ],
    },
    {
      group: 'النظام',
      items: [
        { label: 'إدارة المستخدمين', href: '/users', icon: UserCog },
      ],
    },
  ],
  supervisor: [
    {
      group: 'الرئيسية',
      items: [
        { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'الإدارة',
      items: [
        { label: 'طلبات التسجيل', href: '/registrations', icon: ClipboardList },
      ],
    },
    {
      group: 'القرآن والحفظ',
      items: [
        { label: 'تقارير الحفظ', href: '/quran-reports', icon: BookOpen },
      ],
    },
    {
      group: 'المالية',
      items: [
        { label: 'كشف الصرف', href: '/disbursements/', icon: DollarSign },
      ],
    },
    {
      group: 'التقارير والتواصل',
      items: [
        { label: 'التقارير',  href: '/reports',       icon: FileText },
        { label: 'الإعلانات', href: '/announcements', icon: Megaphone },
      ],
    },
  ],
  agent: [
    {
      group: 'الرئيسية',
      items: [
        { label: 'لوحة التحكم', href: '/dashboard',  icon: LayoutDashboard },
        { label: 'أيتامي',      href: '/my-orphans', icon: Users },
      ],
    },
    {
      group: 'التسجيل',
      items: [
        { label: 'تسجيل يتيم', href: '/orphans/new',  icon: Plus },
        { label: 'تسجيل أسرة', href: '/families/new', icon: Plus },
      ],
    },
    {
      group: 'القرآن الكريم',
      items: [
        { label: 'رفع تقرير الحفظ', href: '/quran-reports/new', icon: BookOpen },
      ],
    },
    {
      group: 'التواصل',
      items: [
        { label: 'الإعلانات', href: '/announcements', icon: Megaphone },
      ],
    },
  ],
  finance: [
    {
      group: 'الرئيسية',
      items: [
        { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'المالية',
      items: [
        { label: 'كشف الصرف',     href: '/disbursements',         icon: DollarSign },
        { label: 'سجل الإصدارات', href: '/disbursements/history', icon: Archive },
      ],
    },
    {
      group: 'التقارير والتواصل',
      items: [
        { label: 'التقارير',  href: '/reports',       icon: FileText },
        { label: 'الإعلانات', href: '/announcements', icon: Megaphone },
      ],
    },
  ],
};

const ROLE_LABELS = {
  gm:         'المدير العام',
  supervisor: 'مشرف الأيتام',
  agent:      'مندوب',
  finance:    'القسم المالي',
  sponsor:    'كافل',
};

const flatItems = (groups) => groups.flatMap((g) => g.items);

const PUBLIC_PREFIXES = ['/login', '/sponsor/login', '/sponsor/portal'];
const ROLE_EXTRA_PATHS = {
  gm: ['/ads', '/receipts/supervisor'],
  supervisor: ['/receipts/supervisor'],
  agent: ['/receipts/batch'],
};

const roleCanAccessPath = (role, pathname) => {
  if (!role || PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  const allowedItems = flatItems(NAV_ITEMS[role] || []);
  const allowedPaths = [
    ...allowedItems.map((item) => item.href),
    ...(ROLE_EXTRA_PATHS[role] || []),
  ];

  return allowedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

// ── AppShell ──────────────────────────────────────────────────────────────────
export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed]   = useState(false); // desktop sidebar collapsed

  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  const navGroups = NAV_ITEMS[user?.role] || [];
  const navItems  = flatItems(navGroups);
  const canAccessCurrentPath = roleCanAccessPath(user?.role, pathname);

  // Close mobile drawer whenever the route changes
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!roleCanAccessPath(user.role, pathname)) {
      router.replace('/dashboard');
    }
  }, [pathname, router, user]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/login');
  };

  // Desktop sidebar width
  const desktopSidebarW = collapsed ? 'md:w-16' : 'md:w-64';
  const desktopMainMr   = collapsed ? 'md:mr-16' : 'md:mr-64';

  if (!user || !canAccessCurrentPath) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ══ MOBILE DRAWER ═══════════════════════════════════════════════════ */}

      {/* Backdrop — only visible when drawer is open, only on mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-72 z-50 bg-white border-l border-gray-200
          flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
          md:hidden
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          <span className="text-primary font-bold text-base leading-tight">
            نظام إدارة<br />الأيتام والأسر
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.group}>
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                        isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role]}</p>
            </div>
            <button onClick={handleLogout} className="text-xs text-danger hover:underline flex-shrink-0">
              خروج
            </button>
          </div>
        </div>
      </aside>

      {/* ══ DESKTOP SIDEBAR ═════════════════════════════════════════════════ */}
      <aside
        className={`
          hidden md:flex fixed top-0 right-0 h-full z-30 bg-white border-l border-gray-200
          flex-col shadow-sm transition-all duration-300
          ${desktopSidebarW}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          {!collapsed && (
            <span className="text-primary font-bold text-base leading-tight">
              نظام إدارة<br />الأيتام والأسر
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none">
                  {group.group}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                        isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-100 p-4">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role]}</p>
              </div>
              <button onClick={handleLogout} className="text-xs text-danger hover:underline flex-shrink-0">
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

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <main className={`flex flex-col min-h-screen transition-all duration-300 mr-0 ${desktopMainMr}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              onClick={() => setDrawerOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base font-bold text-gray-800">
              {navItems.find((i) => i.href === pathname)?.label || 'نظام إدارة الأيتام والأسر'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('ar-YE', { dateStyle: 'medium' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </main>

    </div>
  );
}
