'use client';
import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

export default function Modal({ open, onClose, children, className }) {
  useEffect(() => {
    if (!open || !onClose) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] p-4 animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className={twMerge(
          'bg-white rounded-2xl w-full max-w-[420px] shadow-2xl animate-[scaleIn_0.15s_ease]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
