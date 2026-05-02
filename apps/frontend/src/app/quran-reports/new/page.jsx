'use client';

/**
 * page.jsx
 * Route:  /quran-reports/new  (Agent only)
 * Task:   feature/ui-quran-report-submission
 *
 * Agent submits monthly Quran memorization report for one of their active orphans.
 *
 * Flow:
 *   1. Load agent's orphans that are under_sponsorship (active)
 *   2. Load quran thresholds to show the required juz for the orphan's age
 *   3. Submit → POST /api/quran-reports
 *   4. Show success with link to submit another
 *
 * After submit, orphan appears in supervisor's pending queue.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Arabic month names ─────────────────────────────────────────────────────────
const MONTHS_AR = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
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

// ── JuzSlider ─────────────────────────────────────────────────────────────────
// Visual quick-pick for common juz values

function JuzQuickPick({ value, onChange }) {
  const presets = [0, 0.25, 0.5, 1, 1.5, 2, 3];
  return (
    <div className="juz-presets">
      {presets.map((v) => (
        <button
          key={v}
          type="button"
          className={`juz-btn ${parseFloat(value) === v ? 'juz-btn-active' : ''}`}
          onClick={() => onChange(v)}
        >
          {v === 0 ? 'صفر' : v}
        </button>
      ))}
    </div>
  );
}

// ── ThresholdHint ─────────────────────────────────────────────────────────────

function ThresholdHint({ threshold, juzValue, age }) {
  if (!threshold) return null;
  const juz = parseFloat(juzValue) || 0;
  const meets = juz >= threshold.min_juz_per_month;
  return (
    <div className={`threshold-hint ${meets ? 'hint-ok' : juz === 0 ? 'hint-neutral' : 'hint-warn'}`}>
      <span className="hint-icon">{meets ? '✅' : juz === 0 ? 'ℹ' : '⚠'}</span>
      <div>
        <span className="hint-label">{threshold.label}</span>
        <span className="hint-body">
          {` · الحد الأدنى: `}
          <strong>{threshold.min_juz_per_month} جزء/شهر</strong>
          {juz > 0 && (
            meets
              ? <span className="hint-ok-text"> — يستوفي الشرط ✓</span>
              : <span className="hint-warn-text"> — لا يستوفي الشرط (قد يُوقف الصرف)</span>
          )}
        </span>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function QuranReportSubmissionPage() {
  const router = useRouter();

  const [orphans,     setOrphans]     = useState([]);
  const [thresholds,  setThresholds]  = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success | error
  const [apiError,    setApiError]    = useState('');
  const [submitted,   setSubmitted]   = useState(null); // last submitted report info

  const now = new Date();
  const defaultMonth = now.getMonth() + 1; // 1-12
  const defaultYear  = now.getFullYear();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      orphanId:     '',
      month:        defaultMonth,
      year:         defaultYear,
      juzMemorized: '',
    },
  });

  const selectedOrphanId = watch('orphanId');
  const juzValue         = watch('juzMemorized');
  const selectedMonth    = watch('month');
  const selectedYear     = watch('year');

  // Selected orphan object
  const selectedOrphan = useMemo(
    () => orphans.find((o) => o.id === selectedOrphanId) || null,
    [selectedOrphanId, orphans]
  );

  const orphanAge = selectedOrphan ? calcAge(selectedOrphan.date_of_birth) : null;
  const threshold = getThresholdForAge(orphanAge, thresholds);

  // Load data
  useEffect(() => {
    setDataLoading(true);
    Promise.all([
      api.get('/orphans?status=under_sponsorship'),
      api.get('/quran-thresholds'),
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

  // Generate year options (current year ± 1)
  const yearOptions = [defaultYear - 1, defaultYear, defaultYear + 1];

  const onSubmit = async (data) => {
    setSubmitState('loading');
    setApiError('');
    try {
      const res = await api.post('/quran-reports', {
        orphanId:     data.orphanId,
        month:        parseInt(data.month),
        year:         parseInt(data.year),
        juzMemorized: parseFloat(data.juzMemorized),
      });
      setSubmitted({
        orphanName: selectedOrphan?.full_name,
        month:      parseInt(data.month),
        year:       parseInt(data.year),
        juz:        parseFloat(data.juzMemorized),
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

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitState === 'success' && submitted) {
    return (
      <AppShell>
        <div className="page" dir="rtl">
          <div className="success-wrap">
            <div className="success-card">
              <div className="success-ico">
                {submitted.meetsThreshold === true ? '✅' :
                 submitted.meetsThreshold === false ? '⚠️' : '📋'}
              </div>
              <h2 className="success-title">تم رفع التقرير بنجاح</h2>
              <p className="success-body">
                تم رفع تقرير حفظ القرآن لـ <strong>{submitted.orphanName}</strong>
                {' '}عن شهر{' '}
                <strong>{MONTHS_AR[submitted.month]} {submitted.year}</strong>
                {' '}بمقدار{' '}
                <strong>{submitted.juz} جزء</strong>.
              </p>

              {submitted.meetsThreshold === false && (
                <div className="success-warning">
                  ⚠ مقدار الحفظ أقل من الحد الأدنى المطلوب. قد يقرر المشرف تعليق الصرف هذا الشهر.
                </div>
              )}

              <p className="success-status">
                📬 التقرير الآن في قائمة انتظار المشرف للمراجعة.
              </p>

              <div className="success-actions">
                <button
                  className="btn-primary"
                  onClick={() => setSubmitState('idle')}
                >
                  رفع تقرير آخر
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => router.push('/my-orphans')}
                >
                  عرض أيتامي
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Page header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">رفع تقرير حفظ القرآن</h1>
            <p className="page-sub">
              أدخل مقدار ما حفظه اليتيم هذا الشهر. سيراجع المشرف التقرير ويقرر الاستحقاق المالي.
            </p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>
            ← رجوع
          </button>
        </div>

        {/* Info banner */}
        <div className="info-banner">
          <span>ℹ</span>
          <p>
            التقرير يُرفع مرة واحدة لكل يتيم كل شهر. إذا تم رفع تقرير سابق لنفس الشهر، سيتم استبداله تلقائياً.
          </p>
        </div>

        {dataLoading ? (
          <div className="loading-card">
            <div className="spin-lg" />
            <p>جارٍ تحميل قائمة الأيتام…</p>
          </div>
        ) : orphans.length === 0 ? (
          <div className="empty-card">
            <div style={{ fontSize: '3rem' }}>📋</div>
            <h3>لا يوجد أيتام نشطون</h3>
            <p>لديك حالياً لا أيتام مكفولين. لا يمكن رفع تقارير إلا للأيتام تحت الكفالة.</p>
            <button className="btn-ghost" onClick={() => router.push('/my-orphans')}>
              عرض أيتامي
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-card">

            {/* ── Step 1: Select orphan ── */}
            <div className="form-section">
              <div className="section-head">
                <div className="section-num">١</div>
                <div>
                  <h2 className="section-title">اختيار اليتيم</h2>
                  <p className="section-sub">اختر اليتيم الذي تريد رفع تقرير حفظه</p>
                </div>
              </div>

              <div className="orphan-grid">
                {orphans.map((o) => {
                  const age = calcAge(o.date_of_birth);
                  const isSelected = selectedOrphanId === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`orphan-card ${isSelected ? 'orphan-card-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        value={o.id}
                        {...register('orphanId', { required: 'يرجى اختيار اليتيم' })}
                        style={{ display: 'none' }}
                      />
                      <div className="orphan-avatar">
                        {o.full_name?.charAt(0) || '؟'}
                      </div>
                      <div className="orphan-info">
                        <div className="orphan-name">{o.full_name}</div>
                        <div className="orphan-meta">
                          {age != null ? `${age} سنة` : ''}{o.governorate_ar ? ` · ${o.governorate_ar}` : ''}
                        </div>
                      </div>
                      {isSelected && <span className="orphan-check">✓</span>}
                    </label>
                  );
                })}
              </div>
              {errors.orphanId && <p className="ferr mt">{errors.orphanId.message}</p>}
            </div>

            {/* ── Step 2: Period ── */}
            <div className="form-section">
              <div className="section-head">
                <div className="section-num">٢</div>
                <div>
                  <h2 className="section-title">الفترة الزمنية</h2>
                  <p className="section-sub">الشهر والسنة الذي يغطيهما التقرير</p>
                </div>
              </div>

              <div className="period-row">
                <div className="fg">
                  <label className="lbl">الشهر <span className="req">*</span></label>
                  <select className="inp sel" {...register('month', { required: true })}>
                    {MONTHS_AR.slice(1).map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="lbl">السنة <span className="req">*</span></label>
                  <select className="inp sel" {...register('year', { required: true })}>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="period-preview">
                  <span className="period-label">الفترة</span>
                  <span className="period-value">
                    {MONTHS_AR[parseInt(selectedMonth)]} {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Step 3: Juz memorized ── */}
            <div className="form-section">
              <div className="section-head">
                <div className="section-num">٣</div>
                <div>
                  <h2 className="section-title">مقدار الحفظ</h2>
                  <p className="section-sub">أدخل عدد الأجزاء المحفوظة هذا الشهر (يمكن كسر)</p>
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
              <div className="fg">
                <label className="lbl">اختر سريعاً أو أدخل يدوياً</label>
                <JuzQuickPick
                  value={juzValue}
                  onChange={(v) => setValue('juzMemorized', v, { shouldValidate: true })}
                />
              </div>

              {/* Manual input */}
              <div className="fg">
                <label className="lbl" htmlFor="juzMemorized">
                  عدد الأجزاء <span className="req">*</span>
                </label>
                <div className="juz-input-wrap">
                  <input
                    id="juzMemorized"
                    type="number"
                    min="0"
                    max="30"
                    step="0.25"
                    className={`inp juz-inp ${errors.juzMemorized ? 'inp-err' : ''}`}
                    placeholder="مثال: 1 أو 0.5"
                    {...register('juzMemorized', {
                      required: 'مقدار الحفظ مطلوب',
                      min: { value: 0, message: 'يجب أن يكون صفراً أو أكثر' },
                      max: { value: 30, message: 'القيمة كبيرة جداً' },
                    })}
                  />
                  <span className="juz-unit">جزء / شهر</span>
                </div>
                {errors.juzMemorized && <p className="ferr">{errors.juzMemorized.message}</p>}
              </div>

              {/* Visual progress bar if threshold exists */}
              {threshold && juzValue !== '' && parseFloat(juzValue) >= 0 && (
                <div className="progress-section">
                  <div className="progress-labels">
                    <span>٠</span>
                    <span style={{ color: '#1B5E8C', fontWeight: 700 }}>
                      الهدف: {threshold.min_juz_per_month}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min((parseFloat(juzValue) / threshold.min_juz_per_month) * 100, 100)}%`,
                        background: parseFloat(juzValue) >= threshold.min_juz_per_month ? '#10b981' : '#f59e0b',
                      }}
                    />
                    {/* Target marker */}
                    <div className="progress-target" />
                  </div>
                  <p className="progress-pct">
                    {Math.round((parseFloat(juzValue) / threshold.min_juz_per_month) * 100)}% من الهدف
                  </p>
                </div>
              )}
            </div>

            {/* ── Summary ── */}
            {selectedOrphan && juzValue !== '' && (
              <div className="summary-card">
                <div className="summary-title">📋 ملخص التقرير</div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-lbl">اليتيم</span>
                    <span className="summary-val">{selectedOrphan.full_name}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-lbl">الفترة</span>
                    <span className="summary-val">{MONTHS_AR[parseInt(selectedMonth)]} {selectedYear}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-lbl">الحفظ</span>
                    <span className="summary-val">{juzValue} جزء</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-lbl">الحالة</span>
                    <span className="summary-val" style={{ color: '#f59e0b' }}>قيد المراجعة</span>
                  </div>
                </div>
              </div>
            )}

            {/* API error */}
            {submitState === 'error' && apiError && (
              <div className="err-banner">
                <span>⚠</span>
                <div>
                  <strong>فشل الإرسال</strong>
                  <p>{apiError}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="submit-row">
              <button type="button" className="btn-ghost" onClick={() => router.back()}>
                إلغاء
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitState === 'loading'}
                aria-busy={submitState === 'loading'}
              >
                {submitState === 'loading'
                  ? <><span className="spin" /> جارٍ الإرسال…</>
                  : 'إرسال التقرير ←'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page { max-width: 780px; margin: 0 auto; padding-bottom: 4rem; font-family: 'Cairo', 'Tajawal', sans-serif; }
        .page-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .25rem; }
        .page-sub { font-size: .85rem; color: #6b7a8d; margin: 0; max-width: 520px; line-height: 1.7; }

        /* ── Info banner ──────────────────────────────────────────────── */
        .info-banner {
          display: flex; align-items: flex-start; gap: .75rem;
          background: #eff6ff; border: 1px solid #bfdbfe; border-radius: .875rem;
          padding: .9rem 1.1rem; margin-bottom: 1.25rem;
          font-size: .82rem; color: #1d4ed8; line-height: 1.7;
        }
        .info-banner span { flex-shrink: 0; }
        .info-banner p { margin: 0; }

        /* ── Loading / Empty ──────────────────────────────────────────── */
        .loading-card {
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 3rem; text-align: center; color: #6b7a8d; font-size: .88rem;
        }
        .spin-lg {
          width: 36px; height: 36px;
          border: 3px solid #e5eaf0; border-top-color: #1B5E8C;
          border-radius: 50%; animation: spin .7s linear infinite;
        }
        .empty-card {
          display: flex; flex-direction: column; align-items: center; gap: .75rem;
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 3rem; text-align: center;
        }
        .empty-card h3 { font-size: 1rem; font-weight: 700; color: #374151; margin: 0; }
        .empty-card p { font-size: .85rem; color: #9ca3af; margin: 0; }

        /* ── Form card ────────────────────────────────────────────────── */
        .form-card { display: flex; flex-direction: column; gap: 1.25rem; }

        /* ── Section ──────────────────────────────────────────────────── */
        .form-section {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 1.75rem; box-shadow: 0 1px 4px rgba(27,94,140,.05);
          display: flex; flex-direction: column; gap: 1rem;
        }
        .section-head { display: flex; align-items: flex-start; gap: 1rem; padding-bottom: .85rem; border-bottom: 1.5px solid #f0f4f8; }
        .section-num {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; font-weight: 700; flex-shrink: 0; font-family: 'Cairo', sans-serif;
        }
        .section-title { font-size: 1.05rem; font-weight: 700; color: #0d3d5c; margin: 0 0 .15rem; }
        .section-sub { font-size: .78rem; color: #94a3b8; margin: 0; }

        /* ── Orphan grid ──────────────────────────────────────────────── */
        .orphan-grid { display: flex; flex-direction: column; gap: .5rem; }
        .orphan-card {
          display: flex; align-items: center; gap: .85rem;
          padding: .85rem 1rem; border: 1.5px solid #e5eaf0; border-radius: .875rem;
          cursor: pointer; transition: all .15s; background: #fafafa;
        }
        .orphan-card:hover { border-color: #1B5E8C; background: #f0f7ff; }
        .orphan-card-selected { border-color: #1B5E8C; background: #eff6ff; box-shadow: 0 0 0 2px rgba(27,94,140,.12); }
        .orphan-avatar {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 700;
        }
        .orphan-info { flex: 1; min-width: 0; }
        .orphan-name { font-size: .9rem; font-weight: 700; color: #1f2937; }
        .orphan-meta { font-size: .75rem; color: #6b7a8d; margin-top: .1rem; }
        .orphan-check { color: #1B5E8C; font-weight: 800; font-size: 1rem; flex-shrink: 0; }

        /* ── Period row ───────────────────────────────────────────────── */
        .period-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; }
        .period-preview {
          display: flex; flex-direction: column; gap: .3rem;
          padding: .65rem 1rem; background: #f0f7ff; border: 1.5px solid #bfdbfe;
          border-radius: .625rem; white-space: nowrap;
        }
        .period-label { font-size: .7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
        .period-value { font-size: .92rem; font-weight: 800; color: #1B5E8C; }

        /* ── Threshold hint ───────────────────────────────────────────── */
        .threshold-hint {
          display: flex; align-items: flex-start; gap: .65rem;
          padding: .85rem 1rem; border-radius: .75rem; font-size: .82rem; line-height: 1.6;
        }
        .hint-neutral { background: #f8fafc; border: 1px solid #e5eaf0; color: #374151; }
        .hint-ok      { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; }
        .hint-warn    { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .hint-icon { font-size: 1rem; flex-shrink: 0; }
        .hint-label { font-weight: 700; margin-left: .3rem; }
        .hint-ok-text   { color: #059669; font-weight: 700; }
        .hint-warn-text { color: #d97706; font-weight: 700; }

        /* ── Juz presets ──────────────────────────────────────────────── */
        .juz-presets { display: flex; gap: .5rem; flex-wrap: wrap; }
        .juz-btn {
          padding: .4rem .85rem; border: 1.5px solid #e5eaf0; border-radius: 2rem;
          font-size: .8rem; font-weight: 700; font-family: 'Cairo', sans-serif;
          color: #6b7280; background: #fff; cursor: pointer; transition: all .15s;
        }
        .juz-btn:hover { border-color: #1B5E8C; color: #1B5E8C; }
        .juz-btn-active { border-color: #1B5E8C; background: #1B5E8C; color: #fff; }

        /* ── Juz input ────────────────────────────────────────────────── */
        .juz-input-wrap { display: flex; align-items: center; gap: .75rem; }
        .juz-inp { flex: 1; direction: ltr; text-align: center; font-size: 1.1rem; font-weight: 700; }
        .juz-unit { font-size: .83rem; font-weight: 600; color: #6b7a8d; white-space: nowrap; }

        /* ── Progress ─────────────────────────────────────────────────── */
        .progress-section { display: flex; flex-direction: column; gap: .35rem; }
        .progress-labels { display: flex; justify-content: space-between; font-size: .75rem; color: #6b7a8d; }
        .progress-track { height: 10px; background: #f0f4f8; border-radius: 5px; overflow: hidden; position: relative; }
        .progress-fill { height: 100%; border-radius: 5px; transition: width .4s ease, background .3s; }
        .progress-pct { font-size: .75rem; color: #6b7a8d; font-weight: 600; }

        /* ── Summary ──────────────────────────────────────────────────── */
        .summary-card { background: #f8fbff; border: 1.5px solid #dbeafe; border-radius: 1rem; padding: 1.25rem 1.5rem; }
        .summary-title { font-size: .85rem; font-weight: 700; color: #1B5E8C; margin-bottom: .85rem; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
        .summary-item { display: flex; flex-direction: column; gap: .2rem; }
        .summary-lbl { font-size: .72rem; font-weight: 600; color: #94a3b8; }
        .summary-val { font-size: .88rem; font-weight: 700; color: #1f2937; }

        /* ── Error ────────────────────────────────────────────────────── */
        .err-banner {
          display: flex; align-items: flex-start; gap: .75rem;
          background: #fef2f2; border: 1px solid #fecaca; border-radius: .75rem;
          padding: 1rem 1.25rem;
        }
        .err-banner span { font-size: 1.2rem; flex-shrink: 0; }
        .err-banner strong { display: block; font-size: .9rem; color: #b91c1c; margin-bottom: .2rem; }
        .err-banner p { font-size: .83rem; color: #dc2626; margin: 0; }

        /* ── Submit row ───────────────────────────────────────────────── */
        .submit-row {
          display: flex; justify-content: flex-end; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem; background: #fff; border: 1px solid #e5eaf0;
          border-radius: 1rem;
        }

        /* ── Success ──────────────────────────────────────────────────── */
        .success-wrap { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
        .success-card {
          text-align: center; max-width: 480px; background: #fff; border-radius: 1.25rem;
          padding: 3rem 2rem; border: 1px solid #e5eaf0;
          box-shadow: 0 4px 24px rgba(27,94,140,.08);
          display: flex; flex-direction: column; align-items: center; gap: .85rem;
        }
        .success-ico { font-size: 3.5rem; }
        .success-title { font-size: 1.4rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .success-body { font-size: .9rem; color: #374151; line-height: 1.75; margin: 0; }
        .success-warning {
          background: #fffbeb; border: 1px solid #fde68a; border-radius: .75rem;
          padding: .85rem 1rem; font-size: .83rem; color: #92400e; text-align: right;
        }
        .success-status { font-size: .83rem; color: #6b7a8d; margin: 0; }
        .success-actions { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; margin-top: .5rem; }

        /* ── Field helpers ────────────────────────────────────────────── */
        .fg { display: flex; flex-direction: column; gap: .35rem; }
        .lbl { font-size: .82rem; font-weight: 600; color: #374151; }
        .req { color: #dc2626; }
        .inp {
          width: 100%; border: 1.5px solid #d1d5db; border-radius: .625rem;
          padding: .65rem .9rem; font-size: .88rem; font-family: 'Cairo', sans-serif;
          color: #1f2937; background: #fafafa; outline: none; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color: #dc2626 !important; }
        .sel { appearance: none; cursor: pointer; }
        .ferr { font-size: .77rem; color: #dc2626; margin: 0; }
        .ferr.mt { margin-top: .25rem; }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .btn-primary {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .8rem 2rem; background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-family: 'Cairo', sans-serif; font-size: .95rem; font-weight: 700;
          border: none; border-radius: .75rem; cursor: pointer;
          box-shadow: 0 2px 8px rgba(27,94,140,.25); transition: all .15s;
        }
        .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #2E7EB8, #1B5E8C); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: .65; cursor: not-allowed; }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .7rem 1.25rem; background: none; color: #1B5E8C;
          font-family: 'Cairo', sans-serif; font-size: .88rem; font-weight: 600;
          border: 1.5px solid #dde5f0; border-radius: .75rem; cursor: pointer; transition: all .15s;
        }
        .btn-ghost:hover { background: #f0f7ff; border-color: #1B5E8C; }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin {
          display: inline-block; width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .page-top { flex-direction: column; }
          .period-row { grid-template-columns: 1fr 1fr; }
          .period-preview { grid-column: 1 / -1; }
          .summary-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </AppShell>
  );
}
