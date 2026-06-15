import BenefitChip from './BenefitChip';
import { Star, Handshake, School, Shirt, Briefcase, Bus, Banknote, Pencil } from 'lucide-react';

const calcAge = (dob) => {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const fmt = (n) =>
  n != null && n !== '' ? Number(n).toLocaleString('ar-YE') : '—';

export default function OrphanCard({ orphan, onEdit, onRevoke }) {
  const age = calcAge(orphan.date_of_birth);
  const baseAmount = orphan.base_monthly_amount ?? 0;
  const extra = orphan.extra_monthly_amount ?? 0;
  const allowance = orphan.personal_allowance ?? 0;
  const total = Number(baseAmount) + Number(extra) + Number(allowance);

  return (
    <div className="group relative bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Top Gradient Border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 opacity-90 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xl font-black shadow-inner">
          {orphan.full_name?.charAt(0) || '؟'}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-lg font-bold text-slate-800 truncate mb-1" title={orphan.full_name}>
            {orphan.full_name}
          </h3>
          <p className="text-sm font-medium text-slate-500 mb-1.5">
            {age} سنة · {orphan.governorate_ar || '—'}
          </p>
          {orphan.sponsor_name && (
            <p className="text-xs font-semibold text-blue-600 truncate bg-blue-50 inline-flex items-center gap-1.5 px-2 py-1 rounded-md mt-0.5">
              <Handshake className="w-3.5 h-3.5" /> {orphan.sponsor_name}
            </p>
          )}
        </div>
        <Star className="w-7 h-7 text-amber-500 fill-amber-500 drop-shadow-sm shrink-0" title="يتيم موهوب" />
      </div>

      {/* Monthly value */}
      <div className="flex items-center gap-4 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-slate-500">المبلغ الأساسي</span>
          <span className="text-base font-bold text-slate-700">{fmt(baseAmount)} <span className="text-xs font-medium text-slate-400">ر.ي</span></span>
        </div>
        <div className="w-px h-10 bg-slate-200" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-slate-500">إجمالي شهري</span>
          <span className="text-lg font-black text-emerald-600">{fmt(total)} <span className="text-xs font-medium text-emerald-500/70">ر.ي</span></span>
        </div>
      </div>

      {/* Benefits chips */}
      <div className="flex flex-wrap gap-2">
        <BenefitChip icon={<School className="w-4 h-4" />} label="مدرسة أهلية" active={orphan.school_enrolled} />
        <BenefitChip icon={<Shirt className="w-4 h-4" />} label="زي مدرسي" active={orphan.uniform_included} />
        <BenefitChip icon={<Briefcase className="w-4 h-4" />} label="حقيبة" active={orphan.bag_included} />
        <BenefitChip icon={<Bus className="w-4 h-4" />} label="مواصلات" active={orphan.transport_included} />
        {allowance > 0 && (
          <BenefitChip icon={<Banknote className="w-4 h-4" />} label={`${fmt(allowance)} ر.ي مصروف`} active />
        )}
      </div>

      {/* School name & Notes */}
      <div className="flex flex-col gap-2 mt-auto">
        {orphan.school_name && (
          <p className="text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
            <School className="w-5 h-5 text-slate-400" /> {orphan.school_name}
          </p>
        )}
        {orphan.config_notes && (
          <p className="text-xs text-slate-500 italic px-1 line-clamp-2" title={orphan.config_notes}>
            "{orphan.config_notes}"
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <button
          className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          onClick={() => onEdit(orphan)}
        >
          <Pencil className="w-4 h-4" /> تعديل المزايا
        </button>
        <button
          className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-sm font-bold rounded-xl transition-all active:scale-[0.98]"
          onClick={() => onRevoke(orphan)}
          title="إلغاء الموهوب"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
