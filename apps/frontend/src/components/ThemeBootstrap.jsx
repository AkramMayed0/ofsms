'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export default function ThemeBootstrap() {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return null;
}
