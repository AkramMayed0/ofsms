'use client';

import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

const BASE =
  'w-full border-[1.5px] border-gray-300 rounded-[0.625rem] py-2.5 px-3.5 text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed';

const ERROR = '!border-red-600 !bg-red-50 focus:!ring-red-600/10';

const Input = forwardRef(function Input({ error, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={twMerge(BASE, error && ERROR, className)}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  );
});

export { default as Textarea } from './Textarea';

export default Input;
