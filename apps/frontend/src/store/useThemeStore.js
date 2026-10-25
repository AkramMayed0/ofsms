import { create } from 'zustand';

/**
 * useThemeStore.js — Manages Dark / Light mode across the entire app
 *
 * Persists selection in localStorage ('ofsms_theme').
 * Toggles the 'dark' CSS class on document.documentElement.
 */
export const useThemeStore = create((set, get) => ({
  theme: 'light',

  initTheme: () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('ofsms_theme');
      const initial = saved === 'dark' ? 'dark' : 'light';
      
      if (initial === 'dark') {
        document.documentElement.classList.add('dark');
        document.body?.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body?.classList.remove('dark');
      }
      set({ theme: initial });
    } catch (_err) {
      set({ theme: 'light' });
    }
  },

  toggleTheme: () => {
    if (typeof window === 'undefined') return;
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const next = isCurrentlyDark ? 'light' : 'dark';
    try {
      localStorage.setItem('ofsms_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.body?.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body?.classList.remove('dark');
      }
    } catch (_err) {}
    set({ theme: next });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ofsms_theme', theme);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body?.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body?.classList.remove('dark');
        }
      } catch (_err) {}
    }
    set({ theme });
  },
}));
