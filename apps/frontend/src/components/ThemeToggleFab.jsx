'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

/** Floating theme toggle for public pages that have no AppShell. */
export default function ThemeToggleFab({ className = 'fixed bottom-4 left-4' }) {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const dark = mounted && theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="تبديل مظهر النظام"
      title={dark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
      className={`${className} z-50 p-3 rounded-full bg-white dark:bg-[#17283C] border border-gray-200 dark:border-[#1E344B] shadow-lg text-gray-600 dark:text-slate-200 cursor-pointer`}
    >
      {dark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-[#1B5E8C]" />}
    </button>
  );
}
