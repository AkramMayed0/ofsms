'use client';
import { twMerge } from 'tailwind-merge';

export default function DetailDrawer({ open, onClose, children, className }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/35 z-40 animate-fadeIn" onClick={onClose} />
      <aside
        className={twMerge(
          'fixed top-0 left-0 w-[420px] max-w-[95vw] h-screen bg-white z-50 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.12)] animate-slideInLeft',
          className
        )}
        dir="rtl"
      >
        {children}
      </aside>
    </>
  );
}
