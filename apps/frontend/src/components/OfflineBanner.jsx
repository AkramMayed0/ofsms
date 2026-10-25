'use client';

/**
 * OfflineBanner.jsx — OFSMS Offline Status & PWA Install Helper
 *
 * 1. Monitors network connection state (online/offline).
 * 2. Displays a sleek floating status banner when offline informing the user
 *    that cached reports and data remain accessible, and mutations require internet.
 * 3. Shows a success banner when back online.
 * 4. Automatically registers the Service Worker for offline asset caching.
 * 5. Captures 'beforeinstallprompt' to allow 1-click "تثبيت التطبيق على الهاتف".
 */

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Download, X } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial check
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Register Service Worker for offline PWA (production only; in dev a stale
    // worker serves old JS and hides new UI, so remove any existing one)
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('✅ OFSMS Service Worker registered:', reg.scope))
          .catch((err) => console.warn('Service Worker registration failed:', err));
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
        if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    }

    // Capture PWA install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show install banner once
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User installed the PWA app');
    }
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* ── Offline Floating Alert ─────────────────────────────────────────── */}
      {isOffline && (
        <div
          dir="rtl"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xl border border-amber-600 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
          <span>أنت في وضع عدم الاتصال (Offline) — تصفح التقارير والبيانات المحفوظة متاح</span>
        </div>
      )}

      {/* ── Reconnected Success Alert ──────────────────────────────────────── */}
      {showReconnected && (
        <div
          dir="rtl"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B5E8C] text-white font-bold text-xs shadow-xl border border-blue-400 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <Wifi className="w-4 h-4 text-white shrink-0" />
          <span>تم استعادة الاتصال بالإنترنت بنجاح</span>
        </div>
      )}

      {/* ── PWA Mobile Install Prompt Banner ────────────────────────────────── */}
      {showInstallBanner && installPrompt && (
        <div
          dir="rtl"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1B5E8C] shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">تثبيت تطبيق نماء على هاتفك</h4>
              <p className="text-[11px] text-slate-500">لتصفح أسرع وإمكانية الاستخدام دون إنترنت</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-[#1B5E8C] text-white text-xs font-bold hover:bg-[#134569] transition-colors whitespace-nowrap shadow-xs"
            >
              تثبيت
            </button>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
