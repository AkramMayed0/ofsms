const STATUS_MAP = {
  under_review:      { label: 'قيد المراجعة',  color: '#f59e0b', bg: '#fffbeb' },
  under_marketing:   { label: 'تحت التسويق',   color: '#3b82f6', bg: '#eff6ff' },
  under_sponsorship: { label: 'تحت الكفالة',   color: '#10b981', bg: '#ecfdf5' },
  rejected:          { label: 'مرفوض',          color: '#ef4444', bg: '#fef2f2' },
  inactive:          { label: 'غير نشط',        color: '#9ca3af', bg: '#f9fafb' },
};

export { STATUS_MAP };

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.inactive;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}25` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}
