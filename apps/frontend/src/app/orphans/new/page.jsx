'use client';

/**
 * page.jsx
 * Route:  /orphans/new  (Agent only)
 * API:    POST /api/orphans  (multipart/form-data)
 *
 * Fixes applied:
 *  [Fix 3a] Progress bar uses Fragment with key prop — no more React key warning
 *  [Fix 3b] onSubmit guards gender + guardianRelation before building FormData
 *  [Fix 3c] All fd.append calls use || '' fallback — never sends undefined/null
 */

import { useState, useEffect, useRef, Fragment } from 'react';  // [Fix 3a] Fragment imported
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '../../../lib/api';
import AppShell from '../../../components/AppShell';

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
const ALLOWED_TYPES   = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_BYTES  = 5 * 1024 * 1024;

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatBytes = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const validateFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type))
    return 'نوع الملف غير مسموح. المقبول: PDF، JPG، PNG';
  if (file.size > MAX_FILE_BYTES)
    return `الحجم تجاوز الحد الأقصى (${formatBytes(MAX_FILE_BYTES)})`;
  return null;
};

const fileIcon = (type) => (type === 'application/pdf' ? '📄' : '🖼️');

// ── FileDropZone ───────────────────────────────────────────────────────────────

function FileDropZone({ label, hint, accept, multiple = false, onChange, error, value }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const arr = Array.from(files);
    onChange(multiple ? arr : arr[0] || null);
  };

  const removeFile = (idx) => {
    if (!multiple) { onChange(null); return; }
    const next = [...(value || [])];
    next.splice(idx, 1);
    onChange(next);
  };

  const files = multiple ? (value || []) : value ? [value] : [];

  return (
    <div className="dz-wrapper">
      <div
        className={`dz ${dragging ? 'dz-drag' : ''} ${error ? 'dz-err' : ''} ${files.length ? 'dz-filled' : ''}`}
        onClick={() => !files.length && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={label}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {files.length === 0 ? (
          <div className="dz-empty">
            <span className="dz-ico">📁</span>
            <span className="dz-cta">اضغط أو اسحب الملف هنا</span>
            <span className="dz-hint">{hint}</span>
          </div>
        ) : (
          <div className="dz-files" onClick={(e) => e.stopPropagation()}>
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="chip">
                <span className="chip-ico">{fileIcon(f.type)}</span>
                <span className="chip-name" title={f.name}>{f.name}</span>
                <span className="chip-size">{formatBytes(f.size)}</span>
                <button type="button" className="chip-rm" onClick={() => removeFile(i)} aria-label="حذف">✕</button>
              </div>
            ))}
            {multiple && files.length < 5 && (
              <button type="button" className="add-more" onClick={() => inputRef.current?.click()}>
                + إضافة ملف آخر
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="ferr">{error}</p>}
    </div>
  );
}

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

export default function OrphanRegistrationPage() {
  const router = useRouter();
  const [governorates, setGovernorates] = useState([]);
  const [govLoading,   setGovLoading]   = useState(true);
  const [submitState,  setSubmitState]  = useState('idle'); // idle | loading | success | error
  const [apiError,     setApiError]     = useState('');

  const [deathCertFile,   setDeathCertFile]   = useState(null);
  const [birthCertFile,   setBirthCertFile]   = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [fileErrors,      setFileErrors]      = useState({});

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

  // Fetch governorates on mount
  useEffect(() => {
    api.get('/governorates')
      .then(({ data }) => setGovernorates(data.data || []))
      .catch(() => setGovernorates([]))
      .finally(() => setGovLoading(false));
  }, []);

  // Validate file fields (outside RHF)
  const validateFiles = () => {
    const errs = {};
    if (!deathCertFile) errs.deathCert = 'شهادة وفاة الأب مطلوبة';
    else { const e = validateFile(deathCertFile); if (e) errs.deathCert = e; }
    if (!birthCertFile) errs.birthCert = 'شهادة الميلاد مطلوبة';
    else { const e = validateFile(birthCertFile); if (e) errs.birthCert = e; }
    additionalFiles.forEach((f, i) => {
      const e = validateFile(f); if (e) errs[`add_${i}`] = e;
    });
    setFileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (data) => {
    // ── [Fix 3b] Guard radio fields before touching FormData ──────────────────
    // RHF's required rule fires on submit, but we add an extra check here
    // because multipart radio values can sometimes arrive as empty string
    // when nothing is selected, bypassing the required check silently.
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

    // Validate file uploads
    if (!validateFiles()) return;

    setSubmitState('loading');
    setApiError('');

    // ── [Fix 3c] Build FormData — always send strings, never undefined ────────
    const fd = new FormData();
    fd.append('fullName',         (data.fullName        || '').trim());
    fd.append('dateOfBirth',      data.dateOfBirth      || '');
    fd.append('gender',           data.gender           || '');
    fd.append('governorateId',    data.governorateId    || '');
    fd.append('guardianName',     (data.guardianName    || '').trim());
    fd.append('guardianRelation', data.guardianRelation || '');
    if (data.notes?.trim()) fd.append('notes', data.notes.trim());

    fd.append('deathCert', deathCertFile);
    fd.append('birthCert', birthCertFile);
    additionalFiles.forEach((f) => fd.append('additionalDocs', f));

    try {
      await api.post('/orphans', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitState('success');
      reset();
      setDeathCertFile(null);
      setBirthCertFile(null);
      setAdditionalFiles([]);
      setFileErrors({});
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
            <h2 className="success-title">تم التسجيل بنجاح</h2>
            <p className="success-body">
              تم إرسال بيانات اليتيم إلى قائمة انتظار مراجعة المشرف.
              ستتلقى إشعاراً عند اتخاذ قرار بشأن الطلب.
            </p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => setSubmitState('idle')}>
                تسجيل يتيم آخر
              </button>
              <button className="btn-ghost" onClick={() => router.push('/my-orphans')}>
                عرض أيتامي
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
            <h1 className="page-title">تسجيل يتيم جديد</h1>
            <p className="page-sub">أدخل بيانات اليتيم والمستندات المطلوبة لإرسالها للمراجعة</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>
            ← رجوع
          </button>
        </div>

        {/* [Fix 3a] Progress bar — Fragment with key, separators inside Fragment */}
        <div className="progress">
          {[['١', 'البيانات الأساسية'], ['٢', 'بيانات الوصي'], ['٣', 'المستندات']].map(
            ([n, lbl], i) => (
              <Fragment key={n}>
                <div className="p-step">
                  <span className="p-num">{n}</span>
                  <span className="p-lbl">{lbl}</span>
                </div>
                {i < 2 && <div className="p-sep" />}
              </Fragment>
            )
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="form">

          {/* ── Section 1: Basic Info ─────────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="١" title="البيانات الأساسية" subtitle="معلومات اليتيم الشخصية" />
            <div className="grid">

              {/* Full name */}
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

              {/* Date of birth */}
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

              {/* Gender */}
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

              {/* Governorate */}
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

              {/* Notes */}
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

              {/* Guardian name */}
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

              {/* Guardian relation */}
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

          {/* ── Section 3: Documents ─────────────────────────────────────── */}
          <div className="card">
            <SectionHeader
              number="٣"
              title="المستندات المطلوبة"
              subtitle="يُقبل: PDF، JPG، PNG — الحد الأقصى 5 ميغابايت لكل ملف"
            />
            <div className="doc-grid">

              {/* Death certificate */}
              <div className="fg">
                <label className="lbl">
                  شهادة وفاة الأب <span className="req">*</span>
                </label>
                <FileDropZone
                  label="شهادة وفاة الأب"
                  hint="PDF أو JPG أو PNG — 5 MB"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={deathCertFile}
                  onChange={setDeathCertFile}
                  error={fileErrors.deathCert}
                />
              </div>

              {/* Birth certificate */}
              <div className="fg">
                <label className="lbl">
                  شهادة الميلاد <span className="req">*</span>
                </label>
                <FileDropZone
                  label="شهادة الميلاد"
                  hint="PDF أو JPG أو PNG — 5 MB"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={birthCertFile}
                  onChange={setBirthCertFile}
                  error={fileErrors.birthCert}
                />
              </div>

              {/* Additional docs */}
              <div className="fg span2">
                <label className="lbl">
                  مستندات إضافية <span className="opt">(حتى 5 ملفات — اختياري)</span>
                </label>
                <FileDropZone
                  label="مستندات إضافية"
                  hint="أضف أي مستندات داعمة — حتى 5 ملفات"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  value={additionalFiles}
                  onChange={(files) => setAdditionalFiles(files.slice(0, 5))}
                  error={
                    Object.entries(fileErrors)
                      .filter(([k]) => k.startsWith('add_'))
                      .map(([, v]) => v)[0]
                  }
                />
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
                ? <><span className="spin" aria-hidden />جارٍ الإرسال…</>
                : 'إرسال للمراجعة ←'}
            </button>
          </div>

        </form>
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page { max-width:860px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; }
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

        /* ── Grids ────────────────────────────────────────────────────── */
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:1.1rem; }
        .doc-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.1rem; }
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
        .ta { resize:vertical; min-height:80px; }
        .ltr { direction:ltr; text-align:left; }

        /* ── Gender radio cards ───────────────────────────────────────── */
        .radio-row { display:flex; gap:.75rem; }
        .radio-card { flex:1; display:flex; align-items:center; justify-content:center; gap:.5rem; padding:.65rem 1rem; border:1.5px solid #d1d5db; border-radius:.625rem; font-size:.88rem; font-weight:600; color:#6b7280; cursor:pointer; transition:all .15s; background:#fafafa; user-select:none; }
        .radio-card input[type=radio] { display:none; }
        .radio-card:has(input:checked) { border-color:#1B5E8C; background:#f0f7ff; color:#1B5E8C; box-shadow:0 0 0 2px rgba(27,94,140,.12); }
        .radio-card:hover { border-color:#1B5E8C; }
        .rc-err { border-color:#dc2626!important; }

        /* ── Relation pill chips ──────────────────────────────────────── */
        .rel-row { display:flex; gap:.6rem; flex-wrap:wrap; }
        .rel-chip { display:flex; align-items:center; padding:.55rem 1.1rem; border:1.5px solid #d1d5db; border-radius:2rem; font-size:.83rem; font-weight:600; color:#6b7280; cursor:pointer; transition:all .15s; background:#fafafa; user-select:none; }
        .rel-chip input[type=radio] { display:none; }
        .rel-chip:has(input:checked) { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }
        .rel-chip:hover:not(:has(input:checked)) { border-color:#1B5E8C; color:#1B5E8C; }

        /* ── Dropzone ─────────────────────────────────────────────────── */
        .dz-wrapper { display:flex; flex-direction:column; gap:.3rem; }
        .dz { border:2px dashed #d1d5db; border-radius:.75rem; padding:1.25rem; transition:all .15s; background:#fafbfc; min-height:100px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .dz:hover,.dz-drag { border-color:#1B5E8C; background:#f0f7ff; }
        .dz-filled { border-style:solid; border-color:#93c5fd; background:#f8fbff; cursor:default; }
        .dz-err { border-color:#dc2626!important; background:#fff8f8!important; }
        .dz-empty { display:flex; flex-direction:column; align-items:center; gap:.4rem; text-align:center; pointer-events:none; }
        .dz-ico { font-size:1.8rem; }
        .dz-cta { font-size:.83rem; font-weight:600; color:#1B5E8C; }
        .dz-hint { font-size:.73rem; color:#94a3b8; }
        .dz-files { display:flex; flex-direction:column; gap:.45rem; width:100%; }
        .chip { display:flex; align-items:center; gap:.5rem; padding:.45rem .65rem; background:#fff; border:1px solid #dde5f0; border-radius:.5rem; font-size:.78rem; }
        .chip-ico { font-size:1rem; flex-shrink:0; }
        .chip-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#374151; font-weight:500; direction:ltr; text-align:left; }
        .chip-size { color:#94a3b8; flex-shrink:0; }
        .chip-rm { background:none; border:none; cursor:pointer; color:#ef4444; font-size:.75rem; padding:.1rem .25rem; border-radius:4px; transition:background .1s; }
        .chip-rm:hover { background:#fee2e2; }
        .add-more { background:none; border:1.5px dashed #93c5fd; border-radius:.5rem; padding:.35rem .75rem; font-size:.78rem; color:#1B5E8C; cursor:pointer; font-family:'Cairo',sans-serif; font-weight:600; transition:all .15s; align-self:flex-start; margin-top:.2rem; }
        .add-more:hover { background:#eff6ff; }

        /* ── Field errors ─────────────────────────────────────────────── */
        .ferr { font-size:.77rem; color:#dc2626; margin:0; display:flex; align-items:center; gap:.2rem; }
        .ferr::before { content:'•'; }

        /* ── API error banner ─────────────────────────────────────────── */
        .err-banner { display:flex; align-items:flex-start; gap:.75rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:1rem 1.25rem; animation:fadeIn .2s ease; }
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
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }

        /* ── Success screen ───────────────────────────────────────────── */
        .success-wrap { display:flex; align-items:center; justify-content:center; min-height:60vh; }
        .success-card { text-align:center; max-width:420px; background:#fff; border-radius:1.25rem; padding:3rem 2rem; border:1px solid #e5eaf0; box-shadow:0 4px 24px rgba(27,94,140,.08); }
        .success-ico { font-size:3rem; margin-bottom:1rem; }
        .success-title { font-size:1.4rem; font-weight:800; color:#0d3d5c; margin:0 0 .75rem; }
        .success-body { font-size:.88rem; color:#6b7a8d; line-height:1.75; margin:0 0 2rem; }
        .success-actions { display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap; }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .grid, .doc-grid { grid-template-columns:1fr; }
          .span2 { grid-column:1; }
          .page-top { flex-direction:column; }
          .progress { flex-wrap:wrap; font-size:.72rem; }
        }
      `}</style>
    </AppShell>
  );
}
