'use client';

/**
 * page.jsx
 * Route:  /quran-reports  (Agent sees own reports, Supervisor sees all pending)
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, CheckCircle2, BookOpen, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

// ── Constants ──────────────────────────────────────────────────────────────────

const API = {
  QURAN_REPORTS: '/quran-reports',
  ORPHANS: '/orphans?status=under_sponsorship',
  APPROVE: (id) => `/quran-reports/${id}/approve`,
  REJECT: (id) => `/quran-reports/${id}/reject`,
};

const MONTHS_AR = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];



const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25));
};

// ── Shared UI Components ───────────────────────────────────────────────────────

// ── ApproveModal ───────────────────────────────────────────────────────────────

function ApproveModal({ report, onConfirm, onClose }) {
  const belowThreshold = report.threshold != null && report.juz_memorized < report.threshold;

  return (
    <>
      <div className="fixed inset-0 bg-black/45 z-[100] animate-[fadeIn_0.2s]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[94vw] bg-white rounded-2xl z-[101] shadow-2xl font-sans animate-[slideUp_0.2s_ease]" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-[0.97rem] font-extrabold text-[#0d3d5c] m-0">تأكيد الاعتماد</h2>
          <button className="flex items-center p-1 rounded-md text-gray-400 hover:text-gray-700 transition-colors" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-6">
          {belowThreshold ? (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertCircle size={22} className="text-amber-500 shrink-0" />
              <p className="m-0 text-[0.88rem] text-amber-800 leading-relaxed">
                حفظ اليتيم <strong>{report.orphan_name}</strong> مقدار{' '}
                <strong>{report.juz_memorized} جزء</strong> والحد المطلوب{' '}
                <strong>{report.threshold} جزء</strong>.
                <br />هل تريد الاعتماد رغم أنه أقل من الحد؟
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-300 rounded-xl p-4">
              <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
              <p className="m-0 text-[0.88rem] text-emerald-800 leading-relaxed">
                سيتم اعتماد تقرير <strong>{report.orphan_name}</strong> لشهر{' '}
                <strong>{MONTHS_AR[report.month]} {report.year}</strong>.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-gray-100">
          <button className="inline-flex items-center py-2 px-5 bg-transparent text-gray-500 font-semibold text-[0.85rem] border-[1.5px] border-gray-200 rounded-xl transition-colors hover:border-gray-400 hover:text-gray-700" onClick={onClose}>إلغاء</button>
          <button className="inline-flex items-center gap-1.5 py-2 px-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-[0.88rem] rounded-xl shadow-[0_2px_8px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-px hover:from-emerald-400 hover:to-emerald-500" onClick={onConfirm}>
            <CheckCircle2 size={15} /> اعتماد
          </button>
        </div>
      </div>
    </>
  );
}

// ── RejectModal ────────────────────────────────────────────────────────────────

function RejectModal({ report, onConfirm, onClose }) {
  const [notes, setNotes] = useState('');

  return (
    <>
      <div className="fixed inset-0 bg-black/45 z-[100] animate-[fadeIn_0.2s]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[94vw] bg-white rounded-2xl z-[101] shadow-2xl font-sans animate-[slideUp_0.2s_ease]" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-[0.97rem] font-extrabold text-[#0d3d5c] m-0">رفض التقرير</h2>
          <button className="flex items-center p-1 rounded-md text-gray-400 hover:text-gray-700 transition-colors" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 p-6">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle size={22} className="text-red-500 shrink-0" />
            <p className="m-0 text-[0.88rem] text-red-800 leading-relaxed">
              سيتم رفض تقرير <strong>{report.orphan_name}</strong> لشهر{' '}
              <strong>{MONTHS_AR[report.month]} {report.year}</strong>.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-gray-700">
              سبب الرفض <span className="text-gray-400 font-normal text-[0.78rem]">(اختياري)</span>
            </label>
            <Textarea
              className="rounded-xl min-h-[80px] py-2.5 px-2.5 text-[0.85rem] focus:border-red-500 focus:ring-red-500/10"
              rows={3}
              placeholder="اكتب سبب الرفض ليتمكن المندوب من الاطلاع عليه…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-gray-100">
          <button className="inline-flex items-center py-2 px-5 bg-transparent text-gray-500 font-semibold text-[0.85rem] border-[1.5px] border-gray-200 rounded-xl transition-colors hover:border-gray-400 hover:text-gray-700" onClick={onClose}>إلغاء</button>
          <button className="inline-flex items-center gap-1.5 py-2 px-5 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-[0.88rem] rounded-xl shadow-[0_2px_8px_rgba(239,68,68,0.3)] transition-all hover:-translate-y-px hover:from-red-400 hover:to-red-500" onClick={() => onConfirm(notes)}>
            <X size={15} /> رفض التقرير
          </button>
        </div>
      </div>
    </>
  );
}

// ── SubmitReportModal ──────────────────────────────────────────────────────────

function SubmitReportModal({ orphans, onClose, onSubmitted }) {
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const [juz, setJuz] = useState(0.5);

  const now = new Date();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      orphanId: '',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
  });

  const selectedOrphanId = watch('orphanId');
  const selectedOrphan = orphans.find(o => o.id === selectedOrphanId);
  const age = selectedOrphan ? calcAge(selectedOrphan.date_of_birth) : null;

  // Suggested target based on age
  const suggestedJuz = age == null ? null
    : age < 7 ? 0.5
      : age < 10 ? 1
        : age < 13 ? 1.5
          : 2;

  const onSubmit = async (data) => {
    setSaving(true);
    setApiErr('');
    try {
      await api.post(API.QURAN_REPORTS, {
        orphanId: data.orphanId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        juzMemorized: juz,
      });
      onSubmitted();
      onClose();
    } catch (err) {
      setApiErr(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'حدث خطأ. يرجى المحاولة مجدداً'
      );
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[50] animate-[fadeIn_0.2s]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-2xl z-[51] shadow-2xl font-sans animate-[slideUp_0.2s_ease]" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-[1]">
          <h2 className="text-[1rem] font-extrabold text-[#0d3d5c] m-0">رفع تقرير حفظ القرآن</h2>
          <button className="flex items-center p-1 rounded-md text-gray-400 hover:text-gray-700 transition-colors" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6">
          {apiErr && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[0.85rem] text-red-700 flex items-center gap-2"><AlertTriangle size={18} /> {apiErr}</div>}

          {/* Orphan select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-gray-700">اليتيم <span className="text-red-600">*</span></label>
            <Select
              className="rounded-xl p-2.5 pl-7"
              error={errors.orphanId?.message}
              {...register('orphanId', { required: 'يرجى اختيار اليتيم' })}
            >
              <option value="">اختر اليتيم…</option>
              {orphans.map(o => (
                <option key={o.id} value={o.id}>{o.full_name}</option>
              ))}
            </Select>
            {errors.orphanId && <p className="text-[0.77rem] text-red-600 m-0">{errors.orphanId.message}</p>}
            {selectedOrphan && (
              <p className="text-[0.72rem] text-gray-400 m-0 mt-1">
                {selectedOrphan.governorate_ar} · العمر: {age} سنة
                {suggestedJuz && ` · الحصة المقترحة: ${suggestedJuz} جزء`}
              </p>
            )}
          </div>

          {/* Month / Year row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.82rem] font-semibold text-gray-700">الشهر <span className="text-red-600">*</span></label>
              <Select className="rounded-xl p-2.5 pl-7" {...register('month')}>
                {MONTHS_AR.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.82rem] font-semibold text-gray-700">السنة <span className="text-red-600">*</span></label>
              <Select className="rounded-xl p-2.5 pl-7" {...register('year')}>
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Juz memorized stepper */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-gray-700">
              عدد الأجزاء المحفوظة <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-4 bg-gray-50 border-[1.5px] border-gray-200 rounded-xl p-2.5 w-fit">
              <button type="button" className="w-8 h-8 rounded-full border-[1.5px] border-gray-300 bg-white text-[1.1rem] font-bold text-gray-700 flex items-center justify-center cursor-pointer transition-colors hover:not(:disabled):border-[#1B5E8C] hover:not(:disabled):text-[#1B5E8C] disabled:opacity-35 disabled:cursor-not-allowed"
                onClick={() => setJuz(Math.max(0, parseFloat((juz - 0.5).toFixed(1))))}
                disabled={juz <= 0}
              >−</button>
              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-[1.8rem] font-extrabold text-[#0d3d5c] leading-none font-sans">{juz}</span>
                <span className="text-[0.72rem] text-gray-400 font-semibold">جزء</span>
              </div>
              <button type="button" className="w-8 h-8 rounded-full border-[1.5px] border-gray-300 bg-white text-[1.1rem] font-bold text-gray-700 flex items-center justify-center cursor-pointer transition-colors hover:not(:disabled):border-[#1B5E8C] hover:not(:disabled):text-[#1B5E8C] disabled:opacity-35 disabled:cursor-not-allowed"
                onClick={() => setJuz(Math.min(30, parseFloat((juz + 0.5).toFixed(1))))}
                disabled={juz >= 30}
              >+</button>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {[0.5, 1, 1.5, 2, 3].map(v => (
                <button
                  key={v} type="button"
                  className={`py-1 px-2.5 border-[1.5px] rounded-full text-[0.75rem] font-semibold font-sans cursor-pointer transition-colors ${juz === v ? 'border-[#1B5E8C] bg-[#1B5E8C] text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-[#1B5E8C] hover:text-[#1B5E8C]'}`}
                  onClick={() => setJuz(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            {suggestedJuz && juz < suggestedJuz && (
              <p className="text-[0.75rem] text-amber-500 font-semibold m-0 mt-1 flex items-center gap-1.5">
                <AlertTriangle size={14} /> الحصة المقترحة لهذه الفئة العمرية هي {suggestedJuz} جزء
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-2">
            <Button variant="outline" type="button" onClick={onClose}>إلغاء</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'جارٍ الرفع…' : 'رفع التقرير'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function QuranReportsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [reports, setReports] = useState([]);
  const [orphans, setOrphans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [acting, setActing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchReports = useCallback(() => {
    setLoading(true);
    api.get(API.QURAN_REPORTS)
      .then(({ data }) => setReports(data.reports || []))
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Agents need their orphans list for the submit modal
  useEffect(() => {
    if (role === 'agent') {
      api.get(API.ORPHANS)
        .then(({ data }) => setOrphans(data.orphans || []))
        .catch(() => { });
    }
  }, [role]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActing(true);
    try {
      await api.patch(API.APPROVE(approveTarget.id));
      setApproveTarget(null);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الاعتماد');
    } finally { setActing(false); }
  };

  const handleReject = async (notes) => {
    if (!rejectTarget) return;
    setActing(true);
    try {
      await api.patch(API.REJECT(rejectTarget.id), { notes });
      setRejectTarget(null);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الرفض');
    } finally { setActing(false); }
  };

  const counts = reports.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filterStatus === 'all'
    ? reports
    : reports.filter(r => r.status === filterStatus);

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto pb-16 font-sans flex flex-col gap-5" dir="rtl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] m-0 mb-1">تقارير حفظ القرآن</h1>
            <p className="text-[0.85rem] text-gray-500 m-0">
              {loading ? 'جارٍ التحميل…' : `${reports.length} تقرير · ${counts.pending || 0} قيد المراجعة`}
            </p>
          </div>
          {role === 'agent' && (
            <Button variant="primary" onClick={() => setShowSubmit(true)}>
              + رفع تقرير جديد
            </Button>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[0.85rem] text-red-700 flex items-center gap-2"><AlertTriangle size={18} /> {error}</div>}

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { label: 'إجمالي التقارير', value: reports.length, color: 'text-[#1B5E8C]', bg: 'bg-blue-50', border: 'border-blue-200' },
            { label: 'قيد المراجعة', value: counts.pending || 0, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
            { label: 'معتمدة', value: counts.approved || 0, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'مرفوضة', value: counts.rejected || 0, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`border-[1.5px] rounded-2xl p-4 flex flex-col items-end gap-1 ${bg} ${border}`}>
              <span className={`text-[1.9rem] font-extrabold leading-none font-sans ${color}`}>{value}</span>
              <span className="text-[0.75rem] font-semibold text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'الكل', count: reports.length, activeClass: 'border-[#1B5E8C] bg-[#1B5E8C] text-white' },
            { key: 'pending', label: 'قيد المراجعة', count: counts.pending || 0, activeClass: 'border-amber-500 bg-amber-500 text-white' },
            { key: 'approved', label: 'المعتمدة', count: counts.approved || 0, activeClass: 'border-emerald-500 bg-emerald-500 text-white' },
            { key: 'rejected', label: 'المرفوضة', count: counts.rejected || 0, activeClass: 'border-red-500 bg-red-500 text-white' },
          ].map(({ key, label, count, activeClass }) => {
            const isActive = filterStatus === key;
            return (
              <button
                key={key}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 border-[1.5px] rounded-full text-[0.78rem] font-semibold cursor-pointer font-sans transition-colors ${isActive ? activeClass : 'border-gray-200 bg-white text-gray-500 hover:border-[#1B5E8C] hover:text-[#1B5E8C]'}`}
                onClick={() => setFilterStatus(key)}
              >
                {label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[0.7rem] font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-[1.5px] border-gray-200">
                    {['اسم اليتيم', 'المحافظة', 'الشهر / السنة', 'الأجزاء', 'الحالة', 'تاريخ الرفع'].map(h => (
                      <th key={h} className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%] shrink-0" />
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="w-[60%] h-3 rounded bg-gradient-to-r from-gray-100 to-gray-200 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%]" />
                            <div className="w-[40%] h-2.5 rounded bg-gradient-to-r from-gray-100 to-gray-200 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%]" />
                          </div>
                        </div>
                      </td>
                      {[80, 90, 80, 70, 80].map((w, j) => (
                        <td key={j} className="py-3.5 px-4">
                          <div className="h-3 rounded bg-gradient-to-r from-gray-100 to-gray-200 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%]" style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={
              <div className="w-16 h-16 rounded-full bg-blue-50 border-[1.5px] border-blue-200 flex items-center justify-center mb-1">
                <BookOpen size={32} className="text-[#1B5E8C]" />
              </div>
            }
            heading={filterStatus !== 'all' ? 'لا توجد تقارير بهذه الحالة' : 'لا توجد تقارير حفظ بعد'}
            description={filterStatus !== 'all'
              ? 'جرّب تغيير فلتر الحالة لعرض تقارير أخرى'
              : 'ستظهر التقارير هنا بمجرد رفعها من المندوبين'}
            action={role === 'agent' && filterStatus === 'all' && (
              <div className="mt-3">
                <Button variant="primary" onClick={() => setShowSubmit(true)}>
                  <BookOpen size={16} /> رفع أول تقرير
                </Button>
              </div>
            )}
            card
            className="min-h-[300px] border-gray-200 p-10 gap-2.5"
          />
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(27,94,140,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-[1.5px] border-gray-200">
                    <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide">اسم اليتيم</th>
                    <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide hidden md:table-cell">المحافظة</th>
                    <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide">الشهر / السنة</th>
                    <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide">الأجزاء المحفوظة</th>
                    <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide">الحالة</th>
                    <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide hidden md:table-cell">تاريخ الرفع</th>
                    {(role === 'supervisor' || role === 'gm') && <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide">المندوب</th>}
                    {(role === 'supervisor' || role === 'gm') && <th className="py-3 px-4 text-right text-[0.72rem] font-bold text-gray-500 whitespace-nowrap tracking-wide">إجراء</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 transition-colors hover:bg-blue-50/50 last:border-b-0">
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border-[1.5px] border-blue-200 flex items-center justify-center shrink-0">
                            <BookOpen size={16} className="text-[#1B5E8C]" />
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <div className="font-bold text-gray-800 text-[0.875rem] leading-tight">{r.orphan_name}</div>
                            {r.supervisor_notes && r.status === 'rejected' && (
                              <div className="inline-flex items-center gap-1 mt-0.5 bg-red-50 border border-red-200 rounded-md py-0.5 px-1.5 text-[0.7rem] font-semibold text-red-600">
                                <X size={10} /> {r.supervisor_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle text-gray-500 text-[0.83rem] hidden md:table-cell">{r.governorate_ar || '—'}</td>
                      <td className="py-3.5 px-4 align-middle text-gray-500 text-[0.83rem] whitespace-nowrap">{MONTHS_AR[r.month]} {r.year}</td>
                      <td className="py-3.5 px-4 align-middle">
                        {(() => {
                          const meets = r.threshold != null && r.juz_memorized >= r.threshold;
                          const colorClass = r.threshold == null ? 'text-gray-500 border-gray-200 bg-gray-50' : meets ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-600 border-red-200 bg-red-50';
                          return (
                            <span className={`inline-flex items-center py-1 px-2.5 border rounded-full text-[0.8rem] font-bold font-sans ${colorClass}`}>
                              {r.juz_memorized} / {r.threshold ?? '—'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4 align-middle"><StatusBadge status={r.status} /></td>
                      <td className="py-3.5 px-4 align-middle text-gray-500 text-[0.83rem] hidden md:table-cell whitespace-nowrap">{formatDate(r.submitted_at)}</td>
                      {(role === 'supervisor' || role === 'gm') && (
                        <td className="py-3.5 px-4 align-middle text-gray-500 text-[0.83rem]">{r.agent_name || '—'}</td>
                      )}
                      {(role === 'supervisor' || role === 'gm') && (
                        <td className="py-3.5 px-4 align-middle">
                          {r.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button
                                className="inline-flex items-center gap-1 py-1 px-2 border-[1.5px] border-emerald-300 bg-emerald-50 text-emerald-600 rounded-lg text-[0.75rem] font-bold cursor-pointer font-sans transition-colors whitespace-nowrap hover:not(:disabled):bg-emerald-100 hover:not(:disabled):border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setApproveTarget(r)}
                                disabled={acting}
                              ><CheckCircle2 size={14} /> اعتماد</button>
                              <button
                                className="inline-flex items-center gap-1 py-1 px-2 border-[1.5px] border-red-300 bg-red-50 text-red-600 rounded-lg text-[0.75rem] font-bold cursor-pointer font-sans transition-colors whitespace-nowrap hover:not(:disabled):bg-red-100 hover:not(:disabled):border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setRejectTarget(r)}
                                disabled={acting}
                              ><X size={14} /> رفض</button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showSubmit && (
        <SubmitReportModal
          orphans={orphans}
          onClose={() => setShowSubmit(false)}
          onSubmitted={fetchReports}
        />
      )}
      {approveTarget && (
        <ApproveModal
          report={approveTarget}
          onConfirm={handleApprove}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal
          report={rejectTarget}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </AppShell>
  );
}
