import { twMerge } from 'tailwind-merge';

export default function StatPill({ label, count, color, className }) {
  return (
    <div className={twMerge('inline-flex flex-col items-center gap-0.5 px-4 py-2.5 bg-white dark:bg-[#111E2E] border-[1.5px] border-gray-200 dark:border-[#1E344B] rounded-xl min-w-[80px] shadow-sm transition-colors', className)}>
      <span className="text-[1.35rem] font-extrabold leading-none" style={{ color }}>
        {count}
      </span>
      <span className="text-[0.72rem] font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
