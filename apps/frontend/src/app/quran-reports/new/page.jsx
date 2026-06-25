'use client';

/**
 * page.jsx
 * Route:  /quran-reports/new  (Agent only)
 * Task:   feature/ui-quran-report-submission
 *
 * Agent submits monthly Quran memorization report for one of their active orphans.
 */

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, User, CheckCircle2, Info, Check, ClipboardList, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import Button from '@/components/ui/Button';

// ── Constants ──────────────────────────────────────────────────────────────────

const API = {
  ORPHANS: '/orphans?status=under_sponsorship',
  QURAN_THRESHOLDS: '/quran-thresholds',
  QURAN_REPORTS: '/quran-reports',
};

const MONTHS_AR = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const JUZ_PRESETS = [
  { value: 0, label: 'صفر', sub: '٠ جزء' },
  { value: 0.25, label: 'ربع جزء', sub: '٠٫٢٥' },
  { value: 0.5, label: 'نصف جزء', sub: '٠٫٥' },
  { value: 1, label: 'جزء', sub: '١ كامل' },
  { value: 1.5, label: 'جزء ونصف', sub: '١٫٥' },
  { value: 2, label: 'جزءان', sub: '٢ كاملان' },
  { value: 3, label: 'ثلاثة', sub: '٣ أجزاء' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const getThresholdForAge = (age, thresholds) => {
  if (age == null || !thresholds?.length) return null;
  return thresholds.find((t) => age >= t.age_min && age <= t.age_max) || null;
};

// ── Shared UI Components ───────────────────────────────────────────────────────

function JuzQuickPick({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {JUZ_PRESETS.map(({ value: v, label, sub }) => {
        const active = parseFloat(value) === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-[2px] min-w-[72px] py-2 px-3.5 border-[1.5px] rounded-xl font-sans cursor-pointer transition-all ${active ? 'border-[#1B5E8C] bg-[#1B5E8C] shadow-[0_2px_8px_rgba(27,94,140,0.2)]' : 'border-gray-300 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#1B5E8C]'}`}
          >
            <span className={`text-[0.82rem] font-bold leading-tight ${active ? 'text-white' : 'text-gray-800'}`}>
              {label}
            </span>
            <span className={`text-[0.67rem] font-medium leading-none ltr ${active ? 'text-white/75' : 'text-gray-400'}`}>
              {sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ThresholdHint({ threshold, juzValue, age }) {
  if (!threshold) return null;
  const juz = parseFloat(juzValue) || 0;
  const meets = juz >= threshold.min_juz_per_month;
  
  const statusClass = meets 
    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
    : juz === 0 
      ? 'bg-gray-50 border-gray-200 text-gray-700' 
      : 'bg-amber-50 border-amber-200 text-amber-800';
  
  return (
    <div className={`flex items-start gap-2.5 py-3 px-4 rounded-xl text-[0.82rem] leading-relaxed border ${statusClass}`}>
      <span className="text-[1rem] shrink-0 mt-0.5">
        {meets ? <CheckCircle2 size={16} className="text-emerald-600" /> : juz === 0 ? <Info size={16} className="text-gray-500" /> : <AlertTriangle size={18} className="text-amber-500" />}
      </span>
      <div>
        <span className="font-bold ml-1">{threshold.label}</span>
        <span>
          {` · الحد الأدنى: `}
          <strong>{threshold.min_juz_per_month} جزء/شهر</strong>
          {juz > 0 && (
            meets
              ? <span className="text-emerald-600 font-bold"> — يستوفي الشرط <Check size={16} className="inline-block align-text-bottom" /></span>
              : <span className="text-amber-600 font-bold"> — لا يستوفي الشرط (قد يُوقف الصرف)</span>
          )}
        </span>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function QuranReportSubmissionPage() {
  const router = useRouter();

  const [orphans, setOrphans] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success | error
  const [apiError, setApiError] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      orphanId: '',
      month: defaultMonth,
      year: defaultYear,
      juzMemorized: '',
    },
  });

  const selectedOrphanId = watch('orphanId');
  const juzValue = watch('juzMemorized');
  const selectedMonth = watch('month');
  const selectedYear = watch('year');

  const selectedOrphan = useMemo(
    () => orphans.find((o) => o.id === selectedOrphanId) || null,
    [selectedOrphanId, orphans]
  );

  const orphanAge = selectedOrphan ? calcAge(selectedOrphan.date_of_birth) : null;
  const threshold = getThresholdForAge(orphanAge, thresholds);

  useEffect(() => {
    setDataLoading(true);
    Promise.all([
      api.get(API.ORPHANS),
      api.get(API.QURAN_THRESHOLDS),
    ])
      .then(([orphanRes, thresholdRes]) => {
        setOrphans(orphanRes.data.orphans || []);
        setThresholds(thresholdRes.data.thresholds || []);
      })
      .catch(() => {
        setOrphans([]);
        setThresholds([]);
      })
      .finally(() => setDataLoading(false));
  }, []);

  const yearOptions = [defaultYear - 1, defaultYear, defaultYear + 1];

  const onSubmit = async (data) => {
    setSubmitState('loading');
    setApiError('');
    try {
      await api.post(API.QURAN_REPORTS, {
        orphanId: data.orphanId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        juzMemorized: parseFloat(data.juzMemorized),
      });
      setSubmitted({
        orphanName: selectedOrphan?.full_name,
        month: parseInt(data.month),
        year: parseInt(data.year),
        juz: parseFloat(data.juzMemorized),
        meetsThreshold: threshold ? parseFloat(data.juzMemorized) >= threshold.min_juz_per_month : null,
      });
      setSubmitState('success');
      reset({
        orphanId: '', month: defaultMonth, year: defaultYear, juzMemorized: '',
      });
    } catch (err) {
      setSubmitState('error');
      setApiError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً'
      );
    }
  };

  return (
    <AppShell>
      {/* ── Success modal ──────────────────────────────────────────────── */}
      {submitState === 'success' && submitted && (
        <div className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[3px] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]" dir="rtl">
          <div className="bg-white rounded-[1.25rem] p-10 px-8 max-w-[460px] w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col items-center gap-4 animate-[slideUp_0.25s_ease]">
            <div className="flex items-center justify-center">
              {submitted.meetsThreshold === true
                ? <CheckCircle2 size={48} className="text-emerald-500" />
                : submitted.meetsThreshold === false
                  ? <AlertTriangle size={48} className="text-amber-500" />
                  : <ClipboardList size={48} className="text-[#1B5E8C]" />}
            </div>
            <h2 className="text-[1.35rem] font-extrabold text-[#0d3d5c] m-0">تم رفع التقرير بنجاح</h2>
            <p className="text-[0.88rem] text-gray-700 leading-relaxed m-0">
              تم رفع تقرير حفظ القرآن لـ <strong>{submitted.orphanName}</strong>
              {' '}عن شهر{' '}
              <strong>{MONTHS_AR[submitted.month]} {submitted.year}</strong>
              {' '}بمقدار <strong>{submitted.juz} جزء</strong>.
            </p>

            {submitted.meetsThreshold === false && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl py-3 px-4 text-[0.82rem] text-amber-800 text-right w-full">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>مقدار الحفظ أقل من الحد الأدنى المطلوب. قد يقرر المشرف تعليق الصرف هذا الشهر.</span>
              </div>
            )}

            <p className="text-[0.82rem] text-gray-500 m-0 flex items-center justify-center gap-1.5"><Send size={14} /> التقرير الآن في قائمة انتظار المشرف للمراجعة.</p>

            <div className="flex gap-3 justify-center flex-wrap mt-1">
              <Button
                variant="primary"
                onClick={() => {
                  setSubmitState('idle');
                  reset({ orphanId: '', month: defaultMonth, year: defaultYear, juzMemorized: '' });
                }}
              >
                رفع تقرير آخر
              </Button>
              <Button variant="outline" onClick={() => router.push('/my-orphans')}>
                عرض أيتامي
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[780px] mx-auto pb-16 font-sans flex flex-col gap-5" dir="rtl">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] m-0 mb-1">رفع تقرير حفظ القرآن</h1>
            <p className="text-[0.85rem] text-gray-500 m-0 max-w-[520px] leading-relaxed">
              أدخل مقدار ما حفظه اليتيم هذا الشهر. سيراجع المشرف التقرير ويقرر الاستحقاق المالي.
            </p>
          </div>
          <Button variant="outline" type="button" onClick={() => router.back()}>
            ← رجوع
          </Button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-[0.875rem] py-3.5 px-4 text-[0.82rem] text-blue-700 leading-relaxed">
          <span className="shrink-0 text-blue-600 mt-0.5">ℹ</span>
          <p className="m-0">
            التقرير يُرفع مرة واحدة لكل يتيم كل شهر. إذا تم رفع تقرير سابق لنفس الشهر، سيتم استبداله تلقائياً.
          </p>
        </div>

        {dataLoading ? (
          <div className="flex flex-col items-center gap-4 bg-white border border-gray-200 rounded-2xl p-12 text-center text-[0.88rem] text-gray-500">
            <div className="w-9 h-9 border-4 border-gray-200 border-t-[#1B5E8C] rounded-full animate-[spin_0.7s_linear_infinite]" />
            <p className="m-0">جارٍ تحميل قائمة الأيتام…</p>
          </div>
        ) : orphans.length === 0 ? (
          <div className="flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div><ClipboardList size={48} className="text-[#1B5E8C]" /></div>
            <h3 className="text-[1rem] font-bold text-gray-700 m-0">لا يوجد أيتام نشطون</h3>
            <p className="text-[0.85rem] text-gray-400 m-0">لديك حالياً لا أيتام مكفولين. لا يمكن رفع تقارير إلا للأيتام تحت الكفالة.</p>
            <Button variant="outline" className="mt-2" onClick={() => router.push('/my-orphans')}>
              عرض أيتامي
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

            {/* ── Step 1: Select orphan ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-[0_1px_4px_rgba(27,94,140,0.05)] flex flex-col gap-4">
              <div className="flex items-start gap-4 pb-3 border-b-[1.5px] border-gray-50">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#1B5E8C] to-[#0d3d5c] text-white flex items-center justify-center text-[1.1rem] font-bold shrink-0 font-sans">١</div>
                <div>
                  <h2 className="text-[1.05rem] font-bold text-[#0d3d5c] m-0 mb-0.5">اختيار اليتيم</h2>
                  <p className="text-[0.78rem] text-gray-400 m-0">اختر اليتيم الذي تريد رفع تقرير حفظه</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {orphans.map((o) => {
                  const age = calcAge(o.date_of_birth);
                  const isSelected = selectedOrphanId === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex items-center gap-3.5 py-3 px-4 border-[1.5px] rounded-[0.875rem] cursor-pointer transition-all ${isSelected ? 'border-[#1B5E8C] bg-blue-50 shadow-[0_0_0_2px_rgba(27,94,140,0.12)]' : 'border-gray-200 bg-gray-50 hover:border-[#1B5E8C] hover:bg-blue-50/50'}`}
                    >
                      <input
                        type="radio"
                        value={o.id}
                        {...register('orphanId', { required: 'يرجى اختيار اليتيم' })}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-[#1B5E8C] to-[#0d3d5c] text-white flex items-center justify-center text-[1rem] font-bold">
                        {o.full_name?.charAt(0) || '؟'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.9rem] font-bold text-gray-800">{o.full_name}</div>
                        <div className="text-[0.75rem] text-gray-500 mt-0.5">
                          {age != null ? `${age} سنة` : ''}{o.governorate_ar ? ` · ${o.governorate_ar}` : ''}
                        </div>
                      </div>
                      {isSelected && <span className="text-[#1B5E8C] font-extrabold text-[1rem] shrink-0"><Check size={16} /></span>}
                    </label>
                  );
                })}
              </div>
              {errors.orphanId && <p className="text-[0.77rem] text-red-600 m-0 mt-1">{errors.orphanId.message}</p>}
            </div>

            {/* ── Step 2: Period ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-[0_1px_4px_rgba(27,94,140,0.05)] flex flex-col gap-4">
              <div className="flex items-start gap-4 pb-3 border-b-[1.5px] border-gray-50">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#1B5E8C] to-[#0d3d5c] text-white flex items-center justify-center text-[1.1rem] font-bold shrink-0 font-sans">٢</div>
                <div>
                  <h2 className="text-[1.05rem] font-bold text-[#0d3d5c] m-0 mb-0.5">الفترة الزمنية</h2>
                  <p className="text-[0.78rem] text-gray-400 m-0">الشهر والسنة الذي يغطيهما التقرير</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold text-gray-700">الشهر <span className="text-red-600">*</span></label>
                  <select className="w-full p-2.5 bg-gray-50 border-[1.5px] border-gray-300 rounded-xl text-[0.88rem] text-gray-800 font-sans outline-none transition-colors appearance-none cursor-pointer focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.6rem center' }}
                    {...register('month', { required: true })}>
                    {MONTHS_AR.slice(1).map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold text-gray-700">السنة <span className="text-red-600">*</span></label>
                  <select className="w-full p-2.5 bg-gray-50 border-[1.5px] border-gray-300 rounded-xl text-[0.88rem] text-gray-800 font-sans outline-none transition-colors appearance-none cursor-pointer focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.6rem center' }}
                    {...register('year', { required: true })}>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 py-2.5 px-4 bg-blue-50 border-[1.5px] border-blue-200 rounded-[0.625rem] whitespace-nowrap col-span-1 sm:col-span-full md:col-auto">
                  <span className="text-[0.7rem] font-bold text-gray-400 uppercase tracking-wider">الفترة</span>
                  <span className="text-[0.92rem] font-extrabold text-[#1B5E8C]">
                    {MONTHS_AR[parseInt(selectedMonth)]} {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Step 3: Juz memorized ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-[0_1px_4px_rgba(27,94,140,0.05)] flex flex-col gap-4">
              <div className="flex items-start gap-4 pb-3 border-b-[1.5px] border-gray-50">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#1B5E8C] to-[#0d3d5c] text-white flex items-center justify-center text-[1.1rem] font-bold shrink-0 font-sans">٣</div>
                <div>
                  <h2 className="text-[1.05rem] font-bold text-[#0d3d5c] m-0 mb-0.5">مقدار الحفظ</h2>
                  <p className="text-[0.78rem] text-gray-400 m-0">أدخل عدد الأجزاء المحفوظة هذا الشهر (يمكن كسر)</p>
                </div>
              </div>

              {/* Threshold hint */}
              {selectedOrphan && (
                <ThresholdHint
                  threshold={threshold}
                  juzValue={juzValue}
                  age={orphanAge}
                />
              )}

              {/* Quick pick */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[0.82rem] font-semibold text-gray-700">اختر سريعاً أو أدخل يدوياً</label>
                <JuzQuickPick
                  value={juzValue}
                  onChange={(v) => setValue('juzMemorized', v, { shouldValidate: true })}
                />
              </div>

              {/* Manual input */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[0.82rem] font-semibold text-gray-700" htmlFor="juzMemorized">
                  عدد الأجزاء <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="juzMemorized"
                    type="number"
                    min="0"
                    max="30"
                    step="0.25"
                    className={`flex-1 p-2.5 bg-gray-50 border-[1.5px] rounded-xl text-[1.1rem] font-bold text-gray-800 font-sans outline-none text-center ltr transition-colors focus:bg-white ${errors.juzMemorized ? 'border-red-600 focus:ring-[3px] focus:ring-red-600/10' : 'border-gray-300 focus:border-[#1B5E8C] focus:ring-[3px] focus:ring-[#1B5E8C]/10'}`}
                    placeholder="مثال: 1 أو 0.5"
                    {...register('juzMemorized', {
                      required: 'مقدار الحفظ مطلوب',
                      min: { value: 0, message: 'يجب أن يكون صفراً أو أكثر' },
                      max: { value: 30, message: 'القيمة كبيرة جداً' },
                    })}
                  />
                  <span className="text-[0.83rem] font-semibold text-gray-500 whitespace-nowrap">جزء / شهر</span>
                </div>
                {errors.juzMemorized && <p className="text-[0.77rem] text-red-600 m-0">{errors.juzMemorized.message}</p>}
              </div>

              {/* Visual progress bar if threshold exists */}
              {threshold && juzValue !== '' && parseFloat(juzValue) >= 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between text-[0.75rem] text-gray-500">
                    <span>٠</span>
                    <span className="text-[#1B5E8C] font-bold">
                      الهدف: {threshold.min_juz_per_month}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-400 ease-in-out"
                      style={{
                        width: `${Math.min((parseFloat(juzValue) / threshold.min_juz_per_month) * 100, 100)}%`,
                        background: parseFloat(juzValue) >= threshold.min_juz_per_month ? '#10b981' : '#f59e0b',
                      }}
                    />
                  </div>
                  <p className="text-[0.75rem] text-gray-500 font-semibold m-0">
                    {Math.round((parseFloat(juzValue) / threshold.min_juz_per_month) * 100)}% من الهدف
                  </p>
                </div>
              )}
            </div>

            {/* ── Summary ── */}
            {selectedOrphan && juzValue !== '' && (
              <div className="bg-blue-50/50 border-[1.5px] border-blue-100 rounded-2xl p-5 px-6">
                <div className="text-[0.85rem] font-bold text-[#1B5E8C] mb-3.5 flex items-center gap-1.5"><ClipboardList size={16} /> ملخص التقرير</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.72rem] font-semibold text-gray-400">اليتيم</span>
                    <span className="text-[0.88rem] font-bold text-gray-800">{selectedOrphan.full_name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.72rem] font-semibold text-gray-400">الفترة</span>
                    <span className="text-[0.88rem] font-bold text-gray-800">{MONTHS_AR[parseInt(selectedMonth)]} {selectedYear}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.72rem] font-semibold text-gray-400">الحفظ</span>
                    <span className="text-[0.88rem] font-bold text-gray-800">{juzValue} جزء</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.72rem] font-semibold text-gray-400">الحالة</span>
                    <span className="text-[0.88rem] font-bold text-amber-500">قيد المراجعة</span>
                  </div>
                </div>
              </div>
            )}

            {/* API error */}
            {submitState === 'error' && apiError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <span className="text-[1.2rem] shrink-0 text-red-600"><AlertTriangle size={18} /></span>
                <div>
                  <strong className="block text-[0.9rem] text-red-700 mb-1">فشل الإرسال</strong>
                  <p className="text-[0.83rem] text-red-600 m-0">{apiError}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end items-center gap-4 p-5 px-6 bg-white border border-gray-200 rounded-2xl">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={submitState === 'loading'}
              >
                {submitState === 'loading'
                  ? <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-[spin_0.7s_linear_infinite] shrink-0" /> جارٍ الإرسال…</>
                  : 'إرسال التقرير ←'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
