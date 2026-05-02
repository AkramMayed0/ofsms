'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Constants ──────────────────────────────────────────────────────────────────

const GUARDIAN_RELATIONS = [
  { value: 'uncle',          label: 'عم' },
  { value: 'maternal_uncle', label: 'خال' },
  { value: 'grandfather',    label: 'جد' },
  { value: 'sibling',        label: 'أخ / أخت' },
  { value: 'other',          label: 'أخرى' },
];

const VALID_RELATIONS = ['uncle', 'maternal_uncle', 'grandfather', 'sibling', 'other'];
const VALID_GENDERS   = ['male', 'female'];

// ── SectionHeader ──────────────────────────────────────────────────────────────

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

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OrphanEditPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [governorates, setGovernorates] = useState([]);
  const [govLoading,   setGovLoading]   = useState(true);
  
  const [loading,      setLoading]      = useState(true);
  const [submitState,  setSubmitState]  = useState('idle'); // idle | loading | success | error
  const [apiError,     setApiError]     = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm({
    defaultValues: {
      fullName: '', dateOfBirth: '', gender: '',
      governorateId: '', guardianName: '', guardianRelation: '', notes: '',
    },
  });

  // Fetch governorates
  useEffect(() => {
    api.get('/governorates')
      .then(({ data }) => setGovernorates(data.data || []))
      .catch(() => setGovernorates([]))
      .finally(() => setGovLoading(false));
  }, []);

  // Fetch orphan data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/orphans/${id}`)
      .then(({ data }) => {
        const o = data.orphan || data;
        reset({
          fullName: o.full_name || '',
          dateOfBirth: o.date_of_birth ? o.date_of_birth.split('T')[0] : '',
          gender: o.gender || '',
          governorateId: o.governorate_id || '',
          guardianName: o.guardian_name || '',
          guardianRelation: o.guardian_relation || '',
          notes: o.notes || '',
        });
      })
      .catch((err) => setApiError('تعذّر تحميل بيانات اليتيم'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    let hasRadioError = false;

    if (!data.gender || !VALID_GENDERS.includes(data.gender)) {
      setError('gender', { type: 'manual', message: 'يرجى اختيار الجنس' });
      hasRadioError = true;
    }

    if (!data.guardianRelation || !VALID_RELATIONS.includes(data.guardianRelation)) {
      setError('guardianRelation', { type: 'manual', message: 'يرجى اختيار صلة الوصي' });
      hasRadioError = true;
    }

    if (hasRadioError) return;

    setSubmitState('loading');
    setApiError('');

    try {
      await api.patch(`/orphans/${id}`, {
        fullName: (data.fullName || '').trim(),
        dateOfBirth: data.dateOfBirth || '',
        gender: data.gender || '',
        governorateId: parseInt(data.governorateId),
        guardianName: (data.guardianName || '').trim(),
        guardianRelation: data.guardianRelation || '',
        notes: data.notes?.trim() || '',
      });
      setSubmitState('success');
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
            <h2 className="success-title">تمت إعادة الإرسال بنجاح</h2>
            <p className="success-body">
              تم تحديث بيانات اليتيم وإرسالها إلى قائمة انتظار المراجعة.
            </p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => router.push('/dashboard')}>
                العودة للوحة القيادة
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
            <h1 className="page-title">تعديل بيانات اليتيم</h1>
            <p className="page-sub">قم بتعديل البيانات وإعادة الإرسال للمراجعة</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>
            ← رجوع
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>جارٍ التحميل…</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="form">

            {/* ── Section 1: Basic Info ─────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="١" title="البيانات الأساسية" subtitle="معلومات اليتيم الشخصية" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl" htmlFor="fullName">
                    الاسم الكامل <span className="req">*</span>
                  </label>
                  <input
                    id="fullName"
                    className={`inp ${errors.fullName ? 'inp-err' : ''}`}
                    placeholder="مثال: محمد أحمد علي"
                    {...register('fullName', {
                      required: 'الاسم الكامل مطلوب',
                      minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                    })}
                  />
                  {errors.fullName && <p className="ferr">{errors.fullName.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="dateOfBirth">
                    تاريخ الميلاد <span className="req">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    className={`inp ltr ${errors.dateOfBirth ? 'inp-err' : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                    {...register('dateOfBirth', {
                      required: 'تاريخ الميلاد مطلوب',
                      validate: (v) => new Date(v) < new Date() || 'يجب أن يكون في الماضي',
                    })}
                  />
                  {errors.dateOfBirth && <p className="ferr">{errors.dateOfBirth.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl">الجنس <span className="req">*</span></label>
                  <div className="radio-row">
                    {[['male', 'ذكر'], ['female', 'أنثى']].map(([val, lbl]) => (
                      <label key={val} className={`radio-card ${errors.gender ? 'rc-err' : ''}`}>
                        <input
                          type="radio"
                          value={val}
                          {...register('gender', { required: 'يرجى اختيار الجنس' })}
                        />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && <p className="ferr">{errors.gender.message}</p>}
                </div>

                <div className="fg">
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

                <div className="fg span2">
                  <label className="lbl" htmlFor="notes">
                    ملاحظات <span className="opt">(اختياري)</span>
                  </label>
                  <textarea
                    id="notes"
                    className="inp ta"
                    rows={3}
                    placeholder="أي معلومات إضافية مفيدة عن اليتيم…"
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Guardian ───────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٢" title="بيانات الوصي" subtitle="معلومات الشخص المسؤول عن رعاية اليتيم" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl" htmlFor="guardianName">
                    اسم الوصي <span className="req">*</span>
                  </label>
                  <input
                    id="guardianName"
                    className={`inp ${errors.guardianName ? 'inp-err' : ''}`}
                    placeholder="الاسم الكامل للوصي"
                    {...register('guardianName', { required: 'اسم الوصي مطلوب' })}
                  />
                  {errors.guardianName && <p className="ferr">{errors.guardianName.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">
                    صلة الوصي باليتيم <span className="req">*</span>
                  </label>
                  <div className="rel-row">
                    {GUARDIAN_RELATIONS.map(({ value, label }) => (
                      <label
                        key={value}
                        className={`rel-chip ${errors.guardianRelation ? 'rc-err' : ''}`}
                      >
                        <input
                          type="radio"
                          value={value}
                          {...register('guardianRelation', { required: 'يرجى اختيار صلة الوصي' })}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.guardianRelation && (
                    <p className="ferr">{errors.guardianRelation.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* API error banner */}
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
                  ? <><span className="spin" aria-hidden />جارٍ الحفظ…</>
                  : 'حفظ وإعادة إرسال ←'}
              </button>
            </div>

          </form>
        )}
      </div>

      <style jsx>{`
        .page { max-width:860px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; }
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .25rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        .form { display:flex; flex-direction:column; gap:1.25rem; }
        .card { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.75rem; box-shadow:0 1px 4px rgba(27,94,140,.05); }

        .sec-head { display:flex; align-items:flex-start; gap:1rem; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1.5px solid #f0f4f8; }
        .sec-num { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; flex-shrink:0; font-family:'Cairo',sans-serif; }
        .sec-title { font-size:1.05rem; font-weight:700; color:#0d3d5c; margin:0 0 .15rem; }
        .sec-sub { font-size:.78rem; color:#94a3b8; margin:0; }

        .grid { display:grid; grid-template-columns:1fr 1fr; gap:1.1rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .span2 { grid-column:1 / -1; }

        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; margin-right:2px; }
        .opt { color:#94a3b8; font-weight:400; font-size:.75rem; }

        .inp { width:100%; border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s,background .15s; box-sizing:border-box; }
        .inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color:#dc2626!important; background:#fff8f8!important; }
        .sel { appearance:none; cursor:pointer; }
        .ta { resize:vertical; min-height:80px; }
        .ltr { direction:ltr; text-align:left; }

        .radio-row { display:flex; gap:.75rem; }
        .radio-card { flex:1; display:flex; align-items:center; justify-content:center; gap:.5rem; padding:.65rem 1rem; border:1.5px solid #d1d5db; border-radius:.625rem; font-size:.88rem; font-weight:600; color:#6b7280; cursor:pointer; transition:all .15s; background:#fafafa; user-select:none; }
        .radio-card input[type=radio] { display:none; }
        .radio-card:has(input:checked) { border-color:#1B5E8C; background:#f0f7ff; color:#1B5E8C; box-shadow:0 0 0 2px rgba(27,94,140,.12); }
        .radio-card:hover { border-color:#1B5E8C; }
        .rc-err { border-color:#dc2626!important; }

        .rel-row { display:flex; gap:.6rem; flex-wrap:wrap; }
        .rel-chip { display:flex; align-items:center; padding:.55rem 1.1rem; border:1.5px solid #d1d5db; border-radius:2rem; font-size:.83rem; font-weight:600; color:#6b7280; cursor:pointer; transition:all .15s; background:#fafafa; user-select:none; }
        .rel-chip input[type=radio] { display:none; }
        .rel-chip:has(input:checked) { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }
        .rel-chip:hover:not(:has(input:checked)) { border-color:#1B5E8C; color:#1B5E8C; }

        .ferr { font-size:.77rem; color:#dc2626; margin:0; display:flex; align-items:center; gap:.2rem; }
        .ferr::before { content:'•'; }

        .err-banner { display:flex; align-items:flex-start; gap:.75rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:1rem 1.25rem; animation:fadeIn .2s ease; }
        .err-banner span { font-size:1.2rem; flex-shrink:0; }
        .err-banner strong { display:block; font-size:.9rem; color:#b91c1c; margin-bottom:.2rem; }
        .err-banner p { font-size:.83rem; color:#dc2626; margin:0; }

        .submit-row { display:flex; justify-content:flex-end; align-items:center; gap:1rem; padding:1rem 1.25rem; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; }

        .btn-primary { display:inline-flex; align-items:center; gap:.5rem; padding:.8rem 2rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.95rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); box-shadow:0 4px 14px rgba(27,94,140,.35); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-ghost { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.25rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-ghost:hover { background:#f0f7ff; border-color:#1B5E8C; }

        .spin { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }

        .success-wrap { display:flex; align-items:center; justify-content:center; min-height:60vh; }
        .success-card { text-align:center; max-width:420px; background:#fff; border-radius:1.25rem; padding:3rem 2rem; border:1px solid #e5eaf0; box-shadow:0 4px 24px rgba(27,94,140,.08); }
        .success-ico { font-size:3rem; margin-bottom:1rem; }
        .success-title { font-size:1.4rem; font-weight:800; color:#0d3d5c; margin:0 0 .75rem; }
        .success-body { font-size:.88rem; color:#6b7a8d; line-height:1.75; margin:0 0 2rem; }
        .success-actions { display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap; }

        @media (max-width: 640px) {
          .grid { grid-template-columns:1fr; }
          .span2 { grid-column:1; }
          .page-top { flex-direction:column; }
        }
      `}</style>
    </AppShell>
  );
}
