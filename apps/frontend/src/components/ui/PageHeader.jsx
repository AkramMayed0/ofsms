'use client';
import { twMerge } from 'tailwind-merge';

export default function PageHeader({ title, subtitle, action, className, subtitleClassName }) {
  return (
    <div className={twMerge('flex items-start justify-between gap-4 flex-wrap', className)}>
      <div>
        <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] dark:text-slate-100 m-0 mb-1">{title}</h1>
        {subtitle && (
          <p className={twMerge('text-[0.85rem] text-[#6b7a8d] dark:text-slate-400 m-0', subtitleClassName)}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
