const fmt = (n) =>
  n != null && n !== '' ? Number(n).toLocaleString('ar-YE') : '—';

export default function StatsBar({ orphans }) {
  const totalMonthly = orphans.reduce((s, o) => s + Number(o.total_monthly_value || 0), 0);
  const enrolled = orphans.filter((o) => o.school_enrolled).length;
  const withTransport = orphans.filter((o) => o.transport_included).length;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-100">
      <div className="flex-1 min-w-[120px] p-5 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors">
        <span className="text-3xl font-black text-slate-800 tracking-tight">{orphans.length}</span>
        <span className="text-sm font-semibold text-slate-500">إجمالي الموهوبين</span>
      </div>
      <div className="flex-1 min-w-[120px] p-5 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors">
        <span className="text-3xl font-black text-amber-500 tracking-tight">{fmt(totalMonthly)}</span>
        <span className="text-sm font-semibold text-slate-500">إجمالي الصرف (ر.ي)</span>
      </div>
      <div className="flex-1 min-w-[120px] p-5 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors">
        <span className="text-3xl font-black text-blue-600 tracking-tight">{enrolled}</span>
        <span className="text-sm font-semibold text-slate-500">مدارس أهلية</span>
      </div>
      <div className="flex-1 min-w-[120px] p-5 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors">
        <span className="text-3xl font-black text-emerald-600 tracking-tight">{withTransport}</span>
        <span className="text-sm font-semibold text-slate-500">مواصلات</span>
      </div>
    </div>
  );
}
