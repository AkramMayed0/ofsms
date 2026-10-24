'use client';

export default function StatCard({ icon, label, value, sub, color = '#1B5E8C', onClick, urgent }) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-[1.1rem] p-[1.3rem_1.3rem_1.1rem] flex flex-col gap-[0.35rem] overflow-hidden transition-all duration-150 bg-white dark:bg-[#111E2E] border border-[#edf0f5] dark:border-[#1E344B] shadow-[0_2px_8px_rgba(27,94,140,0.06)] dark:shadow-none hover:shadow-[0_8px_24px_rgba(27,94,140,0.13)] hover:-translate-y-0.5"
      style={{
        borderColor: urgent ? color : undefined,
        boxShadow: urgent ? `0 0 0 3px ${color}20` : undefined,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: "'Cairo','Tajawal',sans-serif",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div
          className="w-[46px] h-[46px] rounded-[0.875rem] flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <div
          className="text-[2rem] font-extrabold leading-none"
          style={{ fontFamily: "'Cairo',sans-serif", color }}
        >
          {value ?? '—'}
        </div>
      </div>
      <div className="text-[0.82rem] font-semibold text-gray-700 dark:text-slate-200">{label}</div>
      {sub && <div className="text-[0.71rem] text-gray-400 dark:text-slate-400">{sub}</div>}
      <div
        className="absolute bottom-0 right-0 left-0 h-[3px] rounded-b-[1.1rem]"
        style={{ background: color }}
      />
    </div>
  );
}
