'use client';

import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white text-sm font-bold rounded-xl border-none cursor-pointer shadow-[0_2px_8px_rgba(27,94,140,.25)] hover:from-[#2E7EB8] hover:to-[#1B5E8C] hover:-translate-y-px active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-150 whitespace-nowrap',
  secondary:
    'inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-gray-500 dark:text-slate-300 text-sm font-semibold rounded-xl border-[1.5px] border-[#e5eaf0] dark:border-[#1E344B] cursor-pointer hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.99] transition-all duration-150',
  outline:
    'inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-[#1B5E8C] dark:text-sky-400 text-sm font-semibold rounded-xl border-[1.5px] border-[#dde5f0] dark:border-[#1E344B] cursor-pointer hover:bg-[#f0f7ff] dark:hover:bg-[#17283C] hover:border-[#1B5E8C] dark:hover:border-sky-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99] transition-all duration-150',
  ghost:
    'inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-primary dark:text-sky-400 text-sm font-medium rounded-xl border-none cursor-pointer hover:bg-primary/10 dark:hover:bg-sky-500/10 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all duration-150',
  'danger-outline':
    'inline-flex items-center gap-1.5 px-5 py-2.5 bg-white dark:bg-[#111E2E] text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border-[1.5px] border-red-300 dark:border-red-900/60 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-600 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99] transition-all duration-150',
  danger:
    'inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-br from-red-600 to-red-700 text-white text-sm font-bold rounded-xl border-none cursor-pointer shadow-[0_2px_8px_rgba(220,38,38,.3)] hover:from-red-500 hover:to-red-600 hover:-translate-y-px active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-150 whitespace-nowrap',
};

const SPINNER_VARIANT = {
  primary: 'white',
  secondary: 'primary',
  outline: 'primary',
  ghost: 'primary',
  'danger-outline': 'white',
  danger: 'white',
};

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  loadingText = 'جارٍ المعالجة…',
  className = '',
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="xs" variant={SPINNER_VARIANT[variant] ?? 'white'} />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
