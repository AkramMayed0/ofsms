import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { School, Shirt, Briefcase, Bus, AlertCircle } from 'lucide-react';

const fmt = (n) =>
  n != null && n !== '' ? Number(n).toLocaleString('ar-YE') : '—';

export default function BenefitsDrawer({ orphan, onClose, onSaved }) {
  const [form, setForm] = useState({
    extraMonthlyAmount: orphan?.extra_monthly_amount ?? 0,
    schoolName: orphan?.school_name ?? '',
    schoolEnrolled: orphan?.school_enrolled ?? false,
    uniformIncluded: orphan?.uniform_included ?? false,
    bagIncluded: orphan?.bag_included ?? false,
    transportIncluded: orphan?.transport_included ?? false,
    personalAllowance: orphan?.personal_allowance ?? 0,
    notes: orphan?.config_notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orphan) return;
    setForm({
      extraMonthlyAmount: orphan.extra_monthly_amount ?? 0,
      schoolName: orphan.school_name ?? '',
      schoolEnrolled: orphan.school_enrolled ?? false,
      uniformIncluded: orphan.uniform_included ?? false,
      bagIncluded: orphan.bag_included ?? false,
      transportIncluded: orphan.transport_included ?? false,
      personalAllowance: orphan.personal_allowance ?? 0,
      notes: orphan.config_notes ?? '',
    });
    setError('');
  }, [orphan?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/orphans/${orphan.id}/gifted/config`, {
        extraMonthlyAmount: Number(form.extraMonthlyAmount) || 0,
        schoolName: form.schoolName || null,
        schoolEnrolled: form.schoolEnrolled,
        uniformIncluded: form.uniformIncluded,
        bagIncluded: form.bagIncluded,
        transportIncluded: form.transportIncluded,
        personalAllowance: Number(form.personalAllowance) || 0,
        notes: form.notes || null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الحفظ. يرجى المحاولة مجدداً');
    } finally {
      setSaving(false);
    }
  };

  if (!orphan) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 w-full max-w-[440px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" dir="rtl">
        
        {/* Drawer header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">تعديل مزايا اليتيم الموهوب</p>
            <h2 className="text-xl font-black text-slate-800">{orphan.full_name}</h2>
          </div>
          <button 
            className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            onClick={onClose} 
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* Extra monthly amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">المبلغ الإضافي الشهري (ر.ي)</label>
            <input
              type="number"
              min="0"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-left"
              dir="ltr"
              value={form.extraMonthlyAmount}
              onChange={(e) => set('extraMonthlyAmount', e.target.value)}
            />
            <p className="text-xs text-slate-500 font-medium">يُضاف إلى مبلغ الكفالة الأساسي</p>
          </div>

          {/* Personal allowance */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">المصروف الشخصي الشهري (ر.ي)</label>
            <input
              type="number"
              min="0"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-left"
              dir="ltr"
              value={form.personalAllowance}
              onChange={(e) => set('personalAllowance', e.target.value)}
            />
          </div>

          {/* School enrollment */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">الالتزامات التعليمية</p>

            <label className="flex items-center justify-between gap-4 cursor-pointer group">
              <div className="flex items-center gap-3">
                <School className="w-6 h-6 text-blue-500 drop-shadow-sm group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm font-bold text-slate-800">مسجّل في مدرسة أهلية</span>
                  <span className="block text-xs text-slate-500 font-medium">يشترط التسجيل للحصول على الكفالة المحسّنة</span>
                </div>
              </div>
              <div
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out shrink-0 ${form.schoolEnrolled ? 'bg-blue-600' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={form.schoolEnrolled}
                tabIndex={0}
                onClick={() => set('schoolEnrolled', !form.schoolEnrolled)}
                onKeyDown={(e) => e.key === 'Enter' && set('schoolEnrolled', !form.schoolEnrolled)}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${form.schoolEnrolled ? 'right-6' : 'right-1'}`} />
              </div>
            </label>

            {form.schoolEnrolled && (
              <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-slate-700">اسم المدرسة</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  placeholder="مثال: مدرسة النور الأهلية"
                  value={form.schoolName}
                  onChange={(e) => set('schoolName', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* In-kind benefits */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">المزايا العينية</p>

            {[
              { key: 'uniformIncluded',   icon: <Shirt className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />, label: 'زي مدرسي',  sub: 'يتم توفير الزي في بداية العام' },
              { key: 'bagIncluded',       icon: <Briefcase className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />, label: 'حقيبة مدرسية', sub: 'حقيبة في بداية العام الدراسي' },
              { key: 'transportIncluded', icon: <Bus className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />, label: 'مواصلات',   sub: 'تأمين وسيلة نقل للمدرسة' },
            ].map(({ key, icon, label, sub }) => (
              <label key={key} className="flex items-center justify-between gap-4 cursor-pointer group">
                <div className="flex items-center gap-3">
                  {icon}
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{label}</span>
                    <span className="block text-xs text-slate-500 font-medium">{sub}</span>
                  </div>
                </div>
                <div
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out shrink-0 ${form[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  role="switch"
                  aria-checked={form[key]}
                  tabIndex={0}
                  onClick={() => set(key, !form[key])}
                  onKeyDown={(e) => e.key === 'Enter' && set(key, !form[key])}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${form[key] ? 'right-6' : 'right-1'}`} />
                </div>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">ملاحظات إضافية <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
            <textarea
              className="w-full min-h-[100px] resize-y border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              placeholder="أي تفاصيل إضافية خاصة بهذا اليتيم…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {/* Monthly total preview */}
          <div className="flex items-center justify-between bg-gradient-to-br from-blue-50 to-emerald-50 border border-emerald-100 rounded-2xl p-5 mt-2">
            <span className="text-sm font-bold text-slate-700">الإجمالي الشهري المتوقع</span>
            <span className="text-xl font-black text-emerald-700 drop-shadow-sm">
              {fmt(
                Number(orphan.base_monthly_amount || 0) +
                Number(form.extraMonthlyAmount || 0) +
                Number(form.personalAllowance || 0)
              )}{' '}
              <span className="text-xs font-bold text-emerald-600/70">ر.ي</span>
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
          <button 
            className="flex-1 py-3 px-4 bg-white border-2 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
            onClick={onClose} 
            disabled={saving}
          >
            إلغاء
          </button>
          <button 
            className="flex-[2] py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>جارٍ الحفظ…</span>
              </div>
            ) : (
              'حفظ المزايا'
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
