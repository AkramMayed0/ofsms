'use client';

import { twMerge } from 'tailwind-merge';

const BASE = 'flex flex-col items-center justify-center gap-3 text-center';
const CARD = 'bg-white dark:bg-[#111E2E] border border-[#e5eaf0] dark:border-[#1E344B] rounded-2xl p-8';

export default function EmptyState({ icon, heading, description, action, card, className }) {
  return (
    <div className={twMerge(BASE, card && CARD, className)}>
      {icon}
      {heading && <h3 className="text-base font-bold text-gray-700 dark:text-slate-200 m-0">{heading}</h3>}
      {description && <p className="text-sm text-gray-400 dark:text-slate-400 m-0">{description}</p>}
      {action}
    </div>
  );
}
