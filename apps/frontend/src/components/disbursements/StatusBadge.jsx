import { STATUS_MAP } from './_constants';

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}25` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}
