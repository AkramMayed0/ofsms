'use client';

/**
 * page.jsx
 * Route:  /families/new  (Agent only)
 * Task:   feature/ui-family-registration-form
 * API:    POST /api/families  (application/json)
 *
 * Mirrors the orphan registration form structure but with
 * family-specific fields: family name, head of family, member count.
 * No file uploads required for families.
 */

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ number, title, subtitle }) {
  return (
    <div className="sec-head">
      <div className="sec-num">{number}</div>
      <div>
        <h2 className="sec-title">{title}</h2>
        {subtitle && <p className="sec-sub">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Counter input ──────────────────────────────────────────────────────────────

function CounterInput({ value, onChange, min = 1, max = 30, error }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={`counter-wrap ${error ? 'counter-err' : ''}`}>
      <button type="button" className="counter-btn" onClick={dec} disabled={value <= min}>−</button>
      <span className="counter-val">{value}</span>
      <button type="button" className="counter-btn" onClick={inc} disabled={value >= max}>+</button>
      <span className="counter-label">فرد</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FamilyRegistrationPage() {
  const router = useRouter();
  const [governorates, setGovernorates] = useState([]);
  const [govLoading,   setGovLoading]   = useState(true);
  const [memberCount,  setMemberCount]  = useState(3);
  const [submitState,  setSubmitState]  = useState('idle');
  const [apiError,     setApiError]     = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      familyName: '', headOfFamily: '', governorateId: '', notes: '',
    },
  });

  useEffect(() => {
    api.get('/governorates')
      .then(({ data }) => setGovernorates(data.data || []))
      .catch(() => setGovernorates([]))
      .finally(() => setGovLoading(false));
  }, []);

  const onSubmit = async (data) => {
    setSubmitState('loading');
    setApiError('');

    try {
      await api.post('/families', {
        familyName:   data.familyName.trim(),
        headOfFamily: data.headOfFamily.trim(),
        memberCount,
        governorateId: parseInt(data.governorateId, 10),
        notes: data.notes?.trim() || undefined,
      });

      setSubmitState('success');
      reset();
      setMemberCount(3);
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

  if (submitState === 'success') {
    return (
      <AppShell>
        <div className="success-wrap">
          <div className="success-card">
            <div className="success-ico">✅</div>
            <h2 className="success-title">تم تسجيل الأسرة بنجاح</h2>
            <p className="success-body">
              تم إرسال بيانات الأسرة إلى قائمة انتظار مراجعة المشرف.
              ستتلقى إشعاراً عند اتخاذ قرار بشأن الطلب.
            </p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => setSubmitState('idle')}>
                تسجيل أسرة أخرى
              </button>
              <button className="btn-ghost" onClick={() => router.push('/dashboard')}>
                العودة للوحة التحكم
              </button>
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
            <h1 className="page-title">تسجيل أسرة محتاجة</h1>
            <p className="page-sub">أدخل بيانات الأسرة لإرسالها للمراجعة</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>
            ← رجوع
          </button>
        </div>

        {/* Progress bar */}
        <div className="progress">
          {[['١', 'بيانات الأسرة'], ['٢', 'المعيل'], ['٣', 'التفاصيل']].map(([n, lbl], i) => (
            <Fragment key={n}>
              <div className="p-step">
                <span className="p-num">{n}</span>
                <span className="p-lbl">{lbl}</span>
              </div>
              {i < 2 && <div className="p-sep" />}
            </Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="form">

          {/* ── Section 1: Family Info ──────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="١" title="بيانات الأسرة" subtitle="المعلومات الأساسية للأسرة المحتاجة" />
            <div className="grid">

              {/* Family name */}
              <div className="fg span2">
                <label className="lbl" htmlFor="familyName">
                  اسم الأسرة <span className="req">*</span>
                </label>
                <input
                  id="familyName"
                  className={`inp ${errors.familyName ? 'inp-err' : ''}`}
                  placeholder="مثال: أسرة محمد أحمد"
                  {...register('familyName', {
                    required: 'اسم الأسرة مطلوب',
                    minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                  })}
                />
                {errors.familyName && <p className="ferr">{errors.familyName.message}</p>}
              </div>

              {/* Governorate */}
              <div className="fg span2">
                <label className="lbl" htmlFor="governorateId">
                  المحافظة <span className="req">*</span>
                </label>
                <select
                  id="governorateId"
                  className={`inp sel ${errors.governorateId ? 'inp-err' : ''}`}
                  disabled={govLoading}
                  {...register('governorateId', { required: 'المحافظة مطلوبة' })}
                >
                  <option value="">{govLoading ? 'جارٍ التحميل…' : 'اختر المحافظة'}</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>{g.name_ar}</option>
                  ))}
                </select>
                {errors.governorateId && <p className="ferr">{errors.governorateId.message}</p>}
              </div>

            </div>
          </div>

          {/* ── Section 2: Head of Family ───────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٢" title="المعيل" subtitle="بيانات رب الأسرة أو المسؤول عنها" />
            <div className="grid">

              {/* Head of family */}
              <div className="fg span2">
                <label className="lbl" htmlFor="headOfFamily">
                  اسم المعيل <span className="req">*</span>
                </label>
                <input
                  id="headOfFamily"
                  className={`inp ${errors.headOfFamily ? 'inp-err' : ''}`}
                  placeholder="الاسم الكامل لرب الأسرة أو المسؤول"
                  {...register('headOfFamily', {
                    required: 'اسم المعيل مطلوب',
                    minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                  })}
                />
                {errors.headOfFamily && <p className="ferr">{errors.headOfFamily.message}</p>}
              </div>

            </div>
          </div>

          {/* ── Section 3: Details ─────────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٣" title="التفاصيل" subtitle="عدد الأفراد وملاحظات إضافية" />
            <div className="grid">

              {/* Member count */}
              <div className="fg span2">
                <label className="lbl">
                  عدد أفراد الأسرة <span className="req">*</span>
                </label>
                <div className="member-count-section">
                  <CounterInput
                    value={memberCount}
                    onChange={setMemberCount}
                    min={1}
                    max={30}
                  />
                  <div className="member-hint">
                    <div className="member-hint-row">
                      <span className="member-hint-icon">👨‍👩‍👧‍👦</span>
                      <span>يشمل جميع أفراد الأسرة المعيشية بما فيهم المعيل</span>
                    </div>
                    <div className="member-scale">
                      {[
                        { max: 3,  label: 'أسرة صغيرة',  color: '#10b981' },
                        { max: 6,  label: 'أسرة متوسطة', color: '#f59e0b' },
                        { max: 30, label: 'أسرة كبيرة',   color: '#ef4444' },
                      ].map(({ max, label, color }) => (
                        <span
                          key={max}
                          className="scale-tag"
                          style={{
                            color,
                            background: `${color}15`,
                            border: `1px solid ${color}30`,
                            fontWeight: memberCount <= max && (max === 3 || memberCount > (max === 6 ? 3 : 6)) ? 700 : 500,
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="fg span2">
                <label className="lbl" htmlFor="notes">
                  ملاحظات إضافية <span className="opt">(اختياري)</span>
                </label>
                <textarea
                  id="notes"
                  className="inp ta"
                  rows={4}
                  placeholder="أي معلومات إضافية عن الأسرة — وضعها الاجتماعي، ظروفها الخاصة، احتياجاتها…"
                  {...register('notes')}
                />
              </div>

            </div>
          </div>

          {/* Summary preview */}
          <div className="summary-card">
            <div className="summary-title">📋 ملخص الطلب</div>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">نوع الطلب</span>
                <span className="summary-value">تسجيل أسرة محتاجة</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">عدد الأفراد</span>
                <span className="summary-value">{memberCount} فرد</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">الحالة بعد الإرسال</span>
                <span className="summary-value summary-pending">قيد المراجعة</span>
              </div>
            </div>
          </div>

          {/* API error */}
          {submitState === 'error' && apiError && (
            <div className="err-banner" role="alert">
              <span>⚠</span>
              <div>
                <strong>فشل الإرسال</strong>
                <p>{apiError}</p>
              </div>
            </div>
          )}

          {/* Submit row */}
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
                ? <><span className="spin" aria-hidden />جارٍ الإرسال…</>
                : 'إرسال للمراجعة ←'}
            </button>
          </div>

        </form>
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page { max-width:760px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; }
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .25rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        /* ── Progress ─────────────────────────────────────────────────── */
        .progress { display:flex; align-items:center; gap:.5rem; padding:.85rem 1.25rem; background:#fff; border:1px solid #e5eaf0; border-radius:.875rem; margin-bottom:1.75rem; font-size:.8rem; font-weight:600; }
        .p-step { display:flex; align-items:center; gap:.4rem; color:#1B5E8C; }
        .p-num { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#1B5E8C; color:#fff; font-size:.72rem; font-weight:700; }
        .p-lbl { white-space:nowrap; }
        .p-sep { flex:1; border-top:1.5px dashed #dde2e8; margin:0 .25rem; }

        /* ── Cards ────────────────────────────────────────────────────── */
        .form { display:flex; flex-direction:column; gap:1.25rem; }
        .card { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.75rem; box-shadow:0 1px 4px rgba(27,94,140,.05); }

        /* ── Section header ───────────────────────────────────────────── */
        .sec-head { display:flex; align-items:flex-start; gap:1rem; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1.5px solid #f0f4f8; }
        .sec-num { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; flex-shrink:0; font-family:'Cairo',sans-serif; }
        .sec-title { font-size:1.05rem; font-weight:700; color:#0d3d5c; margin:0 0 .15rem; }
        .sec-sub { font-size:.78rem; color:#94a3b8; margin:0; }

        /* ── Grid ─────────────────────────────────────────────────────── */
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:1.1rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .span2 { grid-column:1 / -1; }

        /* ── Labels ───────────────────────────────────────────────────── */
        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; margin-right:2px; }
        .opt { color:#94a3b8; font-weight:400; font-size:.75rem; }

        /* ── Inputs ───────────────────────────────────────────────────── */
        .inp { width:100%; border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s,background .15s; box-sizing:border-box; }
        .inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color:#dc2626!important; background:#fff8f8!important; }
        .inp-err:focus { box-shadow:0 0 0 3px rgba(220,38,38,.08)!important; }
        .sel { appearance:none; cursor:pointer; }
        .ta { resize:vertical; min-height:100px; }

        /* ── Counter ──────────────────────────────────────────────────── */
        .member-count-section { display:flex; align-items:flex-start; gap:1.5rem; flex-wrap:wrap; }
        .counter-wrap { display:inline-flex; align-items:center; gap:.75rem; background:#f8fafc; border:1.5px solid #e5eaf0; border-radius:.75rem; padding:.5rem 1rem; }
        .counter-err { border-color:#dc2626; }
        .counter-btn { width:32px; height:32px; border-radius:50%; border:1.5px solid #d1d5db; background:#fff; font-size:1.1rem; font-weight:700; color:#374151; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; line-height:1; }
        .counter-btn:hover:not(:disabled) { border-color:#1B5E8C; color:#1B5E8C; background:#f0f7ff; }
        .counter-btn:disabled { opacity:.35; cursor:not-allowed; }
        .counter-val { font-size:1.75rem; font-weight:800; color:#0d3d5c; min-width:2.5rem; text-align:center; font-family:'Cairo',sans-serif; }
        .counter-label { font-size:.82rem; color:#6b7a8d; font-weight:600; }

        .member-hint { display:flex; flex-direction:column; gap:.5rem; padding-top:.25rem; }
        .member-hint-row { display:flex; align-items:center; gap:.5rem; font-size:.8rem; color:#6b7a8d; }
        .member-hint-icon { font-size:1rem; }
        .member-scale { display:flex; gap:.4rem; flex-wrap:wrap; }
        .scale-tag { font-size:.72rem; padding:.2rem .6rem; border-radius:2rem; font-weight:500; }

        /* ── Summary card ─────────────────────────────────────────────── */
        .summary-card { background:#f8fbff; border:1.5px solid #dbeafe; border-radius:1rem; padding:1.25rem 1.5rem; }
        .summary-title { font-size:.85rem; font-weight:700; color:#1B5E8C; margin-bottom:.85rem; }
        .summary-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:.75rem; }
        .summary-item { display:flex; flex-direction:column; gap:.2rem; }
        .summary-label { font-size:.72rem; font-weight:600; color:#94a3b8; }
        .summary-value { font-size:.85rem; font-weight:700; color:#1f2937; }
        .summary-pending { color:#f59e0b; }

        /* ── Error banner ─────────────────────────────────────────────── */
        .err-banner { display:flex; align-items:flex-start; gap:.75rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:1rem 1.25rem; }
        .err-banner span { font-size:1.2rem; flex-shrink:0; }
        .err-banner strong { display:block; font-size:.9rem; color:#b91c1c; margin-bottom:.2rem; }
        .err-banner p { font-size:.83rem; color:#dc2626; margin:0; }

        /* ── Submit row ───────────────────────────────────────────────── */
        .submit-row { display:flex; justify-content:flex-end; align-items:center; gap:1rem; padding:1rem 1.25rem; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .btn-primary { display:inline-flex; align-items:center; gap:.5rem; padding:.8rem 2rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.95rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); box-shadow:0 4px 14px rgba(27,94,140,.35); transform:translateY(-1px); }
        .btn-primary:active:not(:disabled) { transform:translateY(0) scale(.99); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-ghost { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.25rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-ghost:hover { background:#f0f7ff; border-color:#1B5E8C; }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── Success ──────────────────────────────────────────────────── */
        .success-wrap { display:flex; align-items:center; justify-content:center; min-height:60vh; }
        .success-card { text-align:center; max-width:420px; background:#fff; border-radius:1.25rem; padding:3rem 2rem; border:1px solid #e5eaf0; box-shadow:0 4px 24px rgba(27,94,140,.08); }
        .success-ico { font-size:3rem; margin-bottom:1rem; }
        .success-title { font-size:1.4rem; font-weight:800; color:#0d3d5c; margin:0 0 .75rem; }
        .success-body { font-size:.88rem; color:#6b7a8d; line-height:1.75; margin:0 0 2rem; }
        .success-actions { display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap; }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .grid { grid-template-columns:1fr; }
          .span2 { grid-column:1; }
          .page-top { flex-direction:column; }
          .summary-grid { grid-template-columns:1fr 1fr; }
          .member-count-section { flex-direction:column; }
        }
      `}</style>
    </AppShell>
  );
}
