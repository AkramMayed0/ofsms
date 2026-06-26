'use client';

import { Search, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const BASE =
  'w-full border-[1.5px] border-gray-200 rounded-[0.625rem] py-2.5 pr-9 pl-8 text-[0.875rem] text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10 placeholder:text-gray-400';

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
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 flex pointer-events-none">
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
          className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-400 cursor-pointer p-0.5 hover:text-gray-600"
          onClick={onClear}
          aria-label="مسح البحث"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
