export default function BenefitChip({ icon, label, active }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 shadow-sm">
        <span className="text-base leading-none">{icon}</span> {label}
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200/60 line-through opacity-70">
      <span className="text-base leading-none grayscale opacity-60">{icon}</span> {label}
    </span>
  );
}
