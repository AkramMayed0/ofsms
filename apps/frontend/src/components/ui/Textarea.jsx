'use client';

import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

const BASE =
  'w-full border-[1.5px] border-gray-300 dark:border-[#1E344B] rounded-[0.625rem] py-2.5 px-3.5 text-[0.88rem] font-sans text-gray-800 dark:text-slate-100 bg-gray-50 dark:bg-[#17283C] outline-none transition-all duration-150 focus:border-[#1B5E8C] dark:focus:border-primary-400 focus:bg-white dark:focus:bg-[#111E2E] focus:ring-[3px] focus:ring-[#1B5E8C]/10 placeholder:text-gray-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed resize-y';
const ERROR = '!border-red-600 !bg-red-50 dark:!bg-red-950/30 focus:!ring-red-600/10';

const Textarea = forwardRef(function Textarea({ error, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={twMerge(BASE, error && ERROR, className)}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  );
});

export default Textarea;
