import { twMerge } from 'tailwind-merge';

export default function StatPill({ label, count, color, className }) {
  return (
    <div className={twMerge('inline-flex flex-col items-center gap-0.5 px-4 py-2.5 bg-white border-[1.5px] border-gray-200 rounded-xl min-w-[80px] shadow-sm', className)}>
      <span className="text-[1.35rem] font-extrabold leading-none" style={{ color }}>
        {count}
      </span>
      <span className="text-[0.72rem] font-semibold text-gray-500 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
