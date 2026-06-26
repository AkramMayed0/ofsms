'use client';

import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

// Gray chevron SVG, positioned at left for RTL layouts
const CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left 0.6rem center',
};

const BASE =
  'w-full border-[1.5px] border-gray-300 rounded-[0.625rem] py-2.5 pr-3.5 pl-8 text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-all duration-150 appearance-none cursor-pointer focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10 disabled:opacity-60 disabled:cursor-not-allowed';

const ERROR = '!border-red-600 !bg-red-50 focus:!ring-red-600/10';

const Select = forwardRef(function Select({ error, className, style, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={twMerge(BASE, error && ERROR, className)}
      style={{ ...CHEVRON_STYLE, ...style }}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
