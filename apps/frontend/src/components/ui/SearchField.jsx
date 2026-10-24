'use client';

import { Search, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const BASE =
  'w-full border-[1.5px] border-gray-200 dark:border-[#1E344B] rounded-[0.625rem] py-2.5 pr-9 pl-8 text-[0.875rem] text-gray-800 dark:text-slate-100 bg-gray-50 dark:bg-[#17283C] outline-none transition-all duration-150 focus:border-[#1B5E8C] dark:focus:border-primary-400 focus:bg-white dark:focus:bg-[#111E2E] focus:ring-[3px] focus:ring-[#1B5E8C]/10 placeholder:text-gray-400 dark:placeholder:text-slate-500';

export default function SearchField({
  value,
  onChange,
  onClear,
  placeholder,
  className,
  inputClassName,
  ...inputProps
}) {
  return (
    <div className={twMerge('relative', className)}>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 flex pointer-events-none">
        <Search size={16} />
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={twMerge(BASE, inputClassName)}
        {...inputProps}
      />
      {onClear && value && (
        <button
          type="button"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-400 dark:text-slate-400 cursor-pointer p-0.5 hover:text-gray-600 dark:hover:text-slate-200"
          onClick={onClear}
          aria-label="مسح البحث"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
