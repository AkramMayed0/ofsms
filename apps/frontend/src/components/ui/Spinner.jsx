'use client';

import React from 'react';

export default function Spinner({ size = 'sm', variant = 'white', className = '' }) {
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-3.5 h-3.5 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-4',
    xl: 'w-9 h-9 border-[3px]'
  }[size] || 'w-4 h-4 border-2';

  const variantClasses = {
    white: 'border-white/40 border-t-white',
    whiteMuted: 'border-white/35 border-t-white',
    primary: 'border-slate-200 border-t-[#1B5E8C]',
    emerald: 'border-slate-200 border-t-emerald-500',
    emeraldDark: 'border-emerald-300 border-t-emerald-800',
    primaryMuted: 'border-primary border-t-transparent'
  }[variant] || 'border-white/40 border-t-white';

  return (
    <span
      className={`inline-block animate-spin rounded-full shrink-0 ${sizeClasses} ${variantClasses} ${className}`}
      role="status"
      aria-hidden="true"
    />
  );
}
