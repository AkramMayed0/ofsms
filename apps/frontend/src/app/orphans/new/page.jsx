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
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Constants ──────────────────────────────────────────────────────────────────

const TALENT_CATEGORIES = [
  { key: 'creativity', label: 'الإبداع والكتابة',   options: ['كتابة قصص', 'شعر', 'رسم', 'تصميم'] },
  { key: 'sports',     label: 'الرياضة',             options: ['كرة قدم', 'سباحة', 'كاراتيه', 'أخرى'] },
  { key: 'arts',       label: 'الفنون والأداء',      options: ['إنشاد', 'تمثيل', 'إلقاء'] },
  { key: 'tech',       label: 'المهارات التقنية',    options: ['استخدام الحاسب', 'تصميم', 'برمجة', 'صيانة أجهزة'] },
  { key: 'social',     label: 'المهارات الاجتماعية', options: ['قيادة', 'تعاون', 'خدمة مجتمعية'] },
  { key: 'life',       label: 'المهارات الحياتية',   options: ['الطبخ', 'الخياطة', 'البستنة', 'حرف يدوية'] },
];

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

  const [currentPage,     setCurrentPage]     = useState(1);

  const [repeatedYear,    setRepeatedYear]    = useState('');
  const [ownershipType,   setOwnershipType]   = useState('');
  const [buildingType,    setBuildingType]    = useState('');
  const [hasChronicDisease,    setHasChronicDisease]    = useState('');
  const [hasRegularTreatment,  setHasRegularTreatment]  = useState('');
  const [hasHealthInsurance,   setHasHealthInsurance]   = useState('');
  const [incomeSource,         setIncomeSource]         = useState('');
  const [hasCharitySupport,    setHasCharitySupport]    = useState('');
  const [selectedTalents,      setSelectedTalents]      = useState(new Set());
  const [familyRelations,      setFamilyRelations]      = useState('');
  const [communityRelation,    setCommunityRelation]    = useState('');
  const [schoolRelation,       setSchoolRelation]       = useState('');
  const [socialBehavior,       setSocialBehavior]       = useState('');
  const [needsSocialSupport,   setNeedsSocialSupport]   = useState('');
  const [quranLevel,           setQuranLevel]           = useState('');
  const [prayerCommitment,     setPrayerCommitment]     = useState('');
  const [moralBehavior,        setMoralBehavior]        = useState('');
  const [generalAppearance,    setGeneralAppearance]    = useState('');
  const [selfExpression,       setSelfExpression]       = useState('');
  const [psychFamilyRelations, setPsychFamilyRelations] = useState('');
  const [peerRelations,        setPeerRelations]        = useState('');
  const [sleepAppetite,        setSleepAppetite]        = useState('');
  const [psychSigns,           setPsychSigns]           = useState('');
  const [needsPsychSupport,    setNeedsPsychSupport]    = useState('');

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
      governorateId: '', motherGovernorate: '',
      birthPlace: '', residence: '',
      phone1: '', phone1Relation: '',
      phone2: '', phone2Relation: '', address: '',
      schoolGrade: '', sectorType: '', directorate: '', schoolOrg: '',
      favoriteSubject: '', difficultySubject: '', generalLevel: '',
      repeatedYearReason: '', gradeDetail: '', generalGrade: '',
      lastResultAvg: '', highestGrade: '', lowestGrade: '',
      eduResponsible: '', eduResponsiblePhone: '', eduLevel: '',
      guardianName: '', guardianRelation: '',
      guardianAge: '', guardianEduLevel: '', guardianJob: '', guardianHealth: '',
      familyMaleCount: '', familyFemaleCount: '', familyProblems: '',
      floorsCount: '', roomsCount: '', water: '', electricity: '', rentAmount: '', housingDetails: '',
      chronicDiseaseDetails: '',
      monthlyIncome: '', charitySupportDetails: '',
      talentsOther: '',
      recommendations: '',
      notes: '',
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
    fd.append('fullName',          (data.fullName         || '').trim());
    fd.append('dateOfBirth',       data.dateOfBirth       || '');
    fd.append('gender',            data.gender            || '');
    fd.append('governorateId',     data.governorateId     || '');
    fd.append('guardianName',      (data.guardianName     || '').trim());
    fd.append('guardianRelation',  data.guardianRelation  || '');
    if (data.birthPlace?.trim())        fd.append('birthPlace',        data.birthPlace.trim());
    if (data.residence?.trim())         fd.append('residence',         data.residence.trim());
    if (data.motherGovernorate)         fd.append('motherGovernorate', data.motherGovernorate);
    if (data.phone1?.trim())            fd.append('phone1',            data.phone1.trim());
    if (data.phone1Relation?.trim())    fd.append('phone1Relation',    data.phone1Relation.trim());
    if (data.phone2?.trim())            fd.append('phone2',            data.phone2.trim());
    if (data.phone2Relation?.trim())    fd.append('phone2Relation',    data.phone2Relation.trim());
    if (data.address?.trim())            fd.append('address',              data.address.trim());
    if (data.schoolGrade?.trim())        fd.append('schoolGrade',          data.schoolGrade.trim());
    if (data.sectorType)                 fd.append('sectorType',           data.sectorType);
    if (data.directorate?.trim())        fd.append('directorate',          data.directorate.trim());
    if (data.schoolOrg?.trim())          fd.append('schoolOrg',            data.schoolOrg.trim());
    if (data.favoriteSubject?.trim())    fd.append('favoriteSubject',      data.favoriteSubject.trim());
    if (data.difficultySubject?.trim())  fd.append('difficultySubject',    data.difficultySubject.trim());
    if (data.generalLevel?.trim())       fd.append('generalLevel',         data.generalLevel.trim());
    if (repeatedYear)                    fd.append('repeatedYear',         repeatedYear);
    if (data.repeatedYearReason?.trim()) fd.append('repeatedYearReason',   data.repeatedYearReason.trim());
    if (data.gradeDetail?.trim())        fd.append('gradeDetail',          data.gradeDetail.trim());
    if (data.generalGrade?.trim())       fd.append('generalGrade',         data.generalGrade.trim());
    if (data.lastResultAvg?.trim())      fd.append('lastResultAvg',        data.lastResultAvg.trim());
    if (data.highestGrade?.trim())       fd.append('highestGrade',         data.highestGrade.trim());
    if (data.lowestGrade?.trim())        fd.append('lowestGrade',          data.lowestGrade.trim());
    if (data.eduResponsible?.trim())     fd.append('eduResponsible',       data.eduResponsible.trim());
    if (data.eduResponsiblePhone?.trim()) fd.append('eduResponsiblePhone', data.eduResponsiblePhone.trim());
    if (data.eduLevel?.trim())            fd.append('eduLevel',             data.eduLevel.trim());
    if (data.guardianAge?.trim())         fd.append('guardianAge',          data.guardianAge.trim());
    if (data.guardianEduLevel?.trim())    fd.append('guardianEduLevel',     data.guardianEduLevel.trim());
    if (data.guardianJob?.trim())         fd.append('guardianJob',          data.guardianJob.trim());
    if (data.guardianHealth?.trim())      fd.append('guardianHealth',       data.guardianHealth.trim());
    if (data.familyMaleCount?.trim())     fd.append('familyMaleCount',      data.familyMaleCount.trim());
    if (data.familyFemaleCount?.trim())   fd.append('familyFemaleCount',    data.familyFemaleCount.trim());
    if (data.familyProblems?.trim())      fd.append('familyProblems',    data.familyProblems.trim());
    if (ownershipType)                    fd.append('ownershipType',     ownershipType);
    if (buildingType)                     fd.append('buildingType',      buildingType);
    if (data.floorsCount?.trim())         fd.append('floorsCount',       data.floorsCount.trim());
    if (data.roomsCount?.trim())          fd.append('roomsCount',        data.roomsCount.trim());
    if (data.water?.trim())               fd.append('water',             data.water.trim());
    if (data.electricity?.trim())         fd.append('electricity',       data.electricity.trim());
    if (data.rentAmount?.trim())          fd.append('rentAmount',        data.rentAmount.trim());
    if (data.housingDetails?.trim())           fd.append('housingDetails',        data.housingDetails.trim());
    if (hasChronicDisease)                     fd.append('hasChronicDisease',     hasChronicDisease);
    if (data.chronicDiseaseDetails?.trim())    fd.append('chronicDiseaseDetails', data.chronicDiseaseDetails.trim());
    if (hasRegularTreatment)                   fd.append('hasRegularTreatment',   hasRegularTreatment);
    if (hasHealthInsurance)                        fd.append('hasHealthInsurance',    hasHealthInsurance);
    if (incomeSource)                              fd.append('incomeSource',          incomeSource);
    if (data.monthlyIncome?.trim())                fd.append('monthlyIncome',         data.monthlyIncome.trim());
    if (hasCharitySupport)                         fd.append('hasCharitySupport',     hasCharitySupport);
    if (data.charitySupportDetails?.trim())        fd.append('charitySupportDetails', data.charitySupportDetails.trim());
    if (selectedTalents.size > 0) {
      fd.append('isGifted', 'true');
      fd.append('talents', JSON.stringify([...selectedTalents]));
    }
    if (data.talentsOther?.trim())    fd.append('talentsOther',        data.talentsOther.trim());
    if (familyRelations)              fd.append('familyRelations',     familyRelations);
    if (communityRelation)            fd.append('communityRelation',   communityRelation);
    if (schoolRelation)               fd.append('schoolRelation',      schoolRelation);
    if (socialBehavior)               fd.append('socialBehavior',      socialBehavior);
    if (needsSocialSupport)           fd.append('needsSocialSupport',  needsSocialSupport);
    if (quranLevel)                   fd.append('quranLevel',          quranLevel);
    if (prayerCommitment)             fd.append('prayerCommitment',    prayerCommitment);
    if (moralBehavior)                fd.append('moralBehavior',        moralBehavior);
    if (generalAppearance)            fd.append('generalAppearance',    generalAppearance);
    if (selfExpression)               fd.append('selfExpression',       selfExpression);
    if (psychFamilyRelations)         fd.append('psychFamilyRelations', psychFamilyRelations);
    if (peerRelations)                fd.append('peerRelations',        peerRelations);
    if (sleepAppetite)                fd.append('sleepAppetite',        sleepAppetite);
    if (psychSigns)                   fd.append('psychSigns',           psychSigns);
    if (needsPsychSupport)                fd.append('needsPsychSupport',  needsPsychSupport);
    if (data.recommendations?.trim())     fd.append('recommendations',    data.recommendations.trim());
    if (data.notes?.trim())               fd.append('notes',              data.notes.trim());

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

        {/* Progress bar — 5 steps */}
        <div className="progress">
          {[
            ['١', 'البيانات الأساسية'],
            ['٢', 'الأسرة والتعليم'],
            ['٣', 'السكن والصحة'],
            ['٤', 'المواهب والجوانب'],
            ['٥', 'المستندات'],
          ].map(([n, lbl], i) => {
            const stepNum = i + 1;
            const done    = stepNum < currentPage;
            const active  = stepNum === currentPage;
            return (
              <Fragment key={n}>
                <div className={`p-step ${active ? 'p-active' : ''} ${done ? 'p-done' : ''}`}>
                  <span className="p-num">{done ? '✓' : n}</span>
                  <span className="p-lbl">{lbl}</span>
                </div>
                {i < 4 && <div className="p-sep" />}
              </Fragment>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="form">

          {/* ══ PAGE 1: البيانات الأساسية والتواصل ══ */}
          {currentPage === 1 && <Fragment>
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

              {/* Birth place */}
              <div className="fg">
                <label className="lbl" htmlFor="birthPlace">
                  محل الميلاد <span className="opt">(اختياري)</span>
                </label>
                <input
                  id="birthPlace"
                  className="inp"
                  placeholder="المدينة أو المنطقة"
                  {...register('birthPlace')}
                />
              </div>

              {/* Residence */}
              <div className="fg">
                <label className="lbl" htmlFor="residence">
                  مكان السكن <span className="opt">(اختياري)</span>
                </label>
                <input
                  id="residence"
                  className="inp"
                  placeholder="العنوان الحالي"
                  {...register('residence')}
                />
              </div>

              {/* Mother's governorate */}
              <div className="fg">
                <label className="lbl" htmlFor="motherGovernorate">
                  المحافظة الأم <span className="opt">(اختياري)</span>
                </label>
                <select
                  id="motherGovernorate"
                  className="inp sel"
                  disabled={govLoading}
                  {...register('motherGovernorate')}
                >
                  <option value="">{govLoading ? 'جارٍ التحميل…' : 'اختر المحافظة'}</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>{g.name_ar}</option>
                  ))}
                </select>
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

          {/* ── Section 2: Contact Info ──────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٢" title="معلومات التواصل" subtitle="أرقام التواصل والعنوان" />
            <div className="grid">

              {/* Phone 1 */}
              <div className="fg">
                <label className="lbl" htmlFor="phone1">
                  الرقم الأول <span className="opt">(اختياري)</span>
                </label>
                <input
                  id="phone1"
                  className="inp ltr"
                  placeholder="07XXXXXXXX"
                  {...register('phone1')}
                />
              </div>

              {/* Phone 1 relation */}
              <div className="fg">
                <label className="lbl" htmlFor="phone1Relation">
                  صلة القرابة <span className="opt">(اختياري)</span>
                </label>
                <input
                  id="phone1Relation"
                  className="inp"
                  placeholder="مثال: عم، خال، جد"
                  {...register('phone1Relation')}
                />
              </div>

              {/* Phone 2 */}
              <div className="fg">
                <label className="lbl" htmlFor="phone2">
                  الرقم الثاني <span className="opt">(اختياري)</span>
                </label>
                <input
                  id="phone2"
                  className="inp ltr"
                  placeholder="07XXXXXXXX"
                  {...register('phone2')}
                />
              </div>

              {/* Phone 2 relation */}
              <div className="fg">
                <label className="lbl" htmlFor="phone2Relation">
                  صلة القرابة <span className="opt">(اختياري)</span>
                </label>
                <input
                  id="phone2Relation"
                  className="inp"
                  placeholder="مثال: عم، خال، جد"
                  {...register('phone2Relation')}
                />
              </div>

              {/* Address */}
              <div className="fg span2">
                <label className="lbl" htmlFor="address">
                  العنوان <span className="opt">(اختياري)</span>
                </label>
                <input
                  id="address"
                  className="inp"
                  placeholder="الحي، الشارع، رقم المنزل…"
                  {...register('address')}
                />
              </div>

            </div>
          </div>
          </Fragment>}

          {/* ══ PAGE 2: الأسرة والتعليم ══ */}
          {currentPage === 2 && <Fragment>
          {/* ── Section 3: Guardian + Family ─────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٣" title="معلومات الأسرة" subtitle="بيانات ولي الأمر وأفراد الأسرة" />
            <div className="grid">

              {/* Guardian name */}
              <div className="fg span2">
                <label className="lbl" htmlFor="guardianName">
                  اسم ولي الأمر <span className="req">*</span>
                </label>
                <input
                  id="guardianName"
                  className={`inp ${errors.guardianName ? 'inp-err' : ''}`}
                  placeholder="الأم / الجد / العم / غيره"
                  {...register('guardianName', { required: 'اسم الوصي مطلوب' })}
                />
                {errors.guardianName && <p className="ferr">{errors.guardianName.message}</p>}
              </div>

              {/* Guardian relation */}
              <div className="fg span2">
                <label className="lbl">صلة القرابة باليتيم <span className="req">*</span></label>
                <div className="rel-row">
                  {GUARDIAN_RELATIONS.map(({ value, label }) => (
                    <label key={value} className={`rel-chip ${errors.guardianRelation ? 'rc-err' : ''}`}>
                      <input type="radio" value={value}
                        {...register('guardianRelation', { required: 'يرجى اختيار صلة الوصي' })} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {errors.guardianRelation && <p className="ferr">{errors.guardianRelation.message}</p>}
              </div>

              {/* Guardian age */}
              <div className="fg">
                <label className="lbl" htmlFor="guardianAge">عمر ولي الأمر <span className="opt">(اختياري)</span></label>
                <input id="guardianAge" className="inp ltr" placeholder="مثال: 45" {...register('guardianAge')} />
              </div>

              {/* Guardian education level */}
              <div className="fg">
                <label className="lbl" htmlFor="guardianEduLevel">المستوى التعليمي <span className="opt">(اختياري)</span></label>
                <input id="guardianEduLevel" className="inp" placeholder="مثال: ثانوية، جامعي" {...register('guardianEduLevel')} />
              </div>

              {/* Guardian job */}
              <div className="fg">
                <label className="lbl" htmlFor="guardianJob">المهنة <span className="opt">(اختياري)</span></label>
                <input id="guardianJob" className="inp" placeholder="مثال: موظف، تاجر" {...register('guardianJob')} />
              </div>

              {/* Guardian health */}
              <div className="fg">
                <label className="lbl" htmlFor="guardianHealth">الحالة الصحية <span className="opt">(اختياري)</span></label>
                <input id="guardianHealth" className="inp" placeholder="مثال: جيدة، مريض" {...register('guardianHealth')} />
              </div>

              {/* Family members count */}
              <div className="fg">
                <label className="lbl" htmlFor="familyMaleCount">عدد الذكور في الأسرة <span className="opt">(اختياري)</span></label>
                <input id="familyMaleCount" className="inp ltr" type="number" min="0" placeholder="0" {...register('familyMaleCount')} />
              </div>

              <div className="fg">
                <label className="lbl" htmlFor="familyFemaleCount">عدد الإناث في الأسرة <span className="opt">(اختياري)</span></label>
                <input id="familyFemaleCount" className="inp ltr" type="number" min="0" placeholder="0" {...register('familyFemaleCount')} />
              </div>

              {/* Family problems */}
              <div className="fg span2">
                <label className="lbl" htmlFor="familyProblems">أهم المشاكل التي تواجهها الأسرة <span className="opt">(اختياري)</span></label>
                <textarea id="familyProblems" className="inp ta" rows={3}
                  placeholder="اذكر أبرز المشاكل والتحديات…" {...register('familyProblems')} />
              </div>

            </div>
          </div>

          {/* ── Section 4: Educational Data ──────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٤" title="البيانات الدراسية" subtitle="معلومات عن المستوى التعليمي للأيتام" />
            <div className="grid">

              {/* Grade */}
              <div className="fg">
                <label className="lbl" htmlFor="schoolGrade">الصف <span className="opt">(اختياري)</span></label>
                <input id="schoolGrade" className="inp" placeholder="مثال: السادس الابتدائي" {...register('schoolGrade')} />
              </div>

              {/* Sector type */}
              <div className="fg">
                <label className="lbl">نوع القطاع <span className="opt">(اختياري)</span></label>
                <div className="radio-row">
                  {[['government', 'حكومي'], ['private', 'خاص']].map(([val, lbl]) => (
                    <label key={val} className="radio-card">
                      <input type="radio" value={val} {...register('sectorType')} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Directorate */}
              <div className="fg">
                <label className="lbl" htmlFor="directorate">المديرية <span className="opt">(اختياري)</span></label>
                <input id="directorate" className="inp" placeholder="اسم المديرية" {...register('directorate')} />
              </div>

              {/* Organization */}
              <div className="fg">
                <label className="lbl" htmlFor="schoolOrg">الجهة <span className="opt">(اختياري)</span></label>
                <input id="schoolOrg" className="inp" placeholder="اسم المدرسة أو الجهة" {...register('schoolOrg')} />
              </div>

              {/* Favorite subject */}
              <div className="fg">
                <label className="lbl" htmlFor="favoriteSubject">المادة المفضلة <span className="opt">(اختياري)</span></label>
                <input id="favoriteSubject" className="inp" placeholder="مثال: الرياضيات" {...register('favoriteSubject')} />
              </div>

              {/* Difficulty subject */}
              <div className="fg">
                <label className="lbl" htmlFor="difficultySubject">يواجه صعوبة في <span className="opt">(اختياري)</span></label>
                <input id="difficultySubject" className="inp" placeholder="مثال: اللغة الإنجليزية" {...register('difficultySubject')} />
              </div>

              {/* General level */}
              <div className="fg">
                <label className="lbl" htmlFor="generalLevel">المستوى العام <span className="opt">(اختياري)</span></label>
                <input id="generalLevel" className="inp" placeholder="مثال: جيد، متوسط، ضعيف" {...register('generalLevel')} />
              </div>

              {/* General grade */}
              <div className="fg">
                <label className="lbl" htmlFor="generalGrade">التقدير العام <span className="opt">(اختياري)</span></label>
                <input id="generalGrade" className="inp" placeholder="مثال: جيد جداً" {...register('generalGrade')} />
              </div>

              {/* Repeated year */}
              <div className="fg span2">
                <label className="lbl">هل أعاد سنة مسبقة؟ <span className="opt">(اختياري)</span></label>
                <div className="radio-row" style={{ maxWidth: '200px' }}>
                  {[['yes', 'نعم'], ['no', 'لا']].map(([val, lbl]) => (
                    <label key={val} className="radio-card">
                      <input type="radio" value={val} checked={repeatedYear === val}
                        onChange={() => setRepeatedYear(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason — only if repeated */}
              {repeatedYear === 'yes' && (
                <div className="fg span2">
                  <label className="lbl" htmlFor="repeatedYearReason">السبب</label>
                  <input id="repeatedYearReason" className="inp" placeholder="سبب الإعادة" {...register('repeatedYearReason')} />
                </div>
              )}

              {/* Last result average */}
              <div className="fg">
                <label className="lbl" htmlFor="lastResultAvg">معدل آخر نتيجة <span className="opt">(اختياري)</span></label>
                <input id="lastResultAvg" className="inp ltr" placeholder="مثال: 85%" {...register('lastResultAvg')} />
              </div>

              {/* Grade detail */}
              <div className="fg">
                <label className="lbl" htmlFor="gradeDetail">التفصيل <span className="opt">(اختياري)</span></label>
                <input id="gradeDetail" className="inp" placeholder="تفاصيل النتيجة" {...register('gradeDetail')} />
              </div>

              {/* Highest grade */}
              <div className="fg">
                <label className="lbl" htmlFor="highestGrade">أعلى درجة في مادة <span className="opt">(اختياري)</span></label>
                <input id="highestGrade" className="inp" placeholder="المادة والدرجة" {...register('highestGrade')} />
              </div>

              {/* Lowest grade */}
              <div className="fg">
                <label className="lbl" htmlFor="lowestGrade">أدنى درجة في مادة <span className="opt">(اختياري)</span></label>
                <input id="lowestGrade" className="inp" placeholder="المادة والدرجة" {...register('lowestGrade')} />
              </div>

              {/* Edu responsible */}
              <div className="fg">
                <label className="lbl" htmlFor="eduResponsible">المسؤول تعليمياً <span className="opt">(اختياري)</span></label>
                <input id="eduResponsible" className="inp" placeholder="الاسم" {...register('eduResponsible')} />
              </div>

              {/* Edu responsible phone */}
              <div className="fg">
                <label className="lbl" htmlFor="eduResponsiblePhone">رقم هاتفه <span className="opt">(اختياري)</span></label>
                <input id="eduResponsiblePhone" className="inp ltr" placeholder="07XXXXXXXX" {...register('eduResponsiblePhone')} />
              </div>

              {/* Edu level */}
              <div className="fg span2">
                <label className="lbl" htmlFor="eduLevel">المستوى التعليمي للمسؤول <span className="opt">(اختياري)</span></label>
                <input id="eduLevel" className="inp" placeholder="مثال: ثانوية، جامعي" {...register('eduLevel')} />
              </div>

            </div>
          </div>
          </Fragment>}

          {/* ══ PAGE 3: السكن والصحة والاقتصاد ══ */}
          {currentPage === 3 && <Fragment>
          {/* ── Section 5: Housing ───────────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٥" title="الوضع السكني" subtitle="معلومات عن السكن والمرافق" />
            <div className="grid">

              {/* Ownership type */}
              <div className="fg span2">
                <label className="lbl">نوع السكن <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['owned', 'ملك'], ['rented', 'إيجار'], ['free', 'سكن مجاني']].map(([val, lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" value={val} checked={ownershipType === val}
                        onChange={() => setOwnershipType(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Building type */}
              <div className="fg span2">
                <label className="lbl">نوع البناء <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['popular', 'شعبي'], ['reinforced', 'مسلح'], ['other', 'آخر']].map(([val, lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" value={val} checked={buildingType === val}
                        onChange={() => setBuildingType(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Floors */}
              <div className="fg">
                <label className="lbl" htmlFor="floorsCount">عدد الطوابق <span className="opt">(اختياري)</span></label>
                <input id="floorsCount" className="inp ltr" type="number" min="1" placeholder="1" {...register('floorsCount')} />
              </div>

              {/* Rooms */}
              <div className="fg">
                <label className="lbl" htmlFor="roomsCount">عدد الغرف <span className="opt">(اختياري)</span></label>
                <input id="roomsCount" className="inp ltr" type="number" min="1" placeholder="1" {...register('roomsCount')} />
              </div>

              {/* Water */}
              <div className="fg">
                <label className="lbl" htmlFor="water">الماء <span className="opt">(اختياري)</span></label>
                <input id="water" className="inp" placeholder="مثال: شبكة عامة، خزان" {...register('water')} />
              </div>

              {/* Electricity */}
              <div className="fg">
                <label className="lbl" htmlFor="electricity">الكهرباء <span className="opt">(اختياري)</span></label>
                <input id="electricity" className="inp" placeholder="مثال: متصل، مولد" {...register('electricity')} />
              </div>

              {/* Rent amount — only if rented */}
              {ownershipType === 'rented' && (
                <div className="fg">
                  <label className="lbl" htmlFor="rentAmount">مقدار الإيجار <span className="opt">(اختياري)</span></label>
                  <input id="rentAmount" className="inp ltr" placeholder="بالريال" {...register('rentAmount')} />
                </div>
              )}

              {/* Other details */}
              <div className={`fg ${ownershipType === 'rented' ? '' : 'span2'}`}>
                <label className="lbl" htmlFor="housingDetails">تفاصيل أخرى <span className="opt">(اختياري)</span></label>
                <input id="housingDetails" className="inp" placeholder="أي تفاصيل إضافية" {...register('housingDetails')} />
              </div>

            </div>
          </div>

          {/* ── Section 6: Health ────────────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٦" title="الحالة الصحية" subtitle="معلومات عن الوضع الصحي لليتيم" />
            <div className="grid">

              {/* Chronic disease */}
              <div className="fg span2">
                <label className="lbl">هل يعاني من أمراض مزمنة؟ <span className="opt">(اختياري)</span></label>
                <div className="radio-row" style={{ maxWidth: '200px' }}>
                  {[['yes', 'نعم'], ['no', 'لا']].map(([val, lbl]) => (
                    <label key={val} className="radio-card">
                      <input type="radio" value={val} checked={hasChronicDisease === val}
                        onChange={() => setHasChronicDisease(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Disease details — only if yes */}
              {hasChronicDisease === 'yes' && (
                <div className="fg span2">
                  <label className="lbl" htmlFor="chronicDiseaseDetails">التفاصيل</label>
                  <input id="chronicDiseaseDetails" className="inp"
                    placeholder="اذكر الأمراض المزمنة…" {...register('chronicDiseaseDetails')} />
                </div>
              )}

              {/* Regular treatment */}
              <div className="fg">
                <label className="lbl">هل يتلقى علاجاً منتظماً؟ <span className="opt">(اختياري)</span></label>
                <div className="radio-row">
                  {[['yes', 'نعم'], ['no', 'لا']].map(([val, lbl]) => (
                    <label key={val} className="radio-card">
                      <input type="radio" value={val} checked={hasRegularTreatment === val}
                        onChange={() => setHasRegularTreatment(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Health insurance */}
              <div className="fg">
                <label className="lbl">هل يتوفر تأمين صحي؟ <span className="opt">(اختياري)</span></label>
                <div className="radio-row">
                  {[['yes', 'نعم'], ['no', 'لا']].map(([val, lbl]) => (
                    <label key={val} className="radio-card">
                      <input type="radio" value={val} checked={hasHealthInsurance === val}
                        onChange={() => setHasHealthInsurance(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Section 7: Economic ──────────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٧" title="الوضع الاقتصادي" subtitle="مصادر الدخل والدعم المالي للأسرة" />
            <div className="grid">

              {/* Income source */}
              <div className="fg span2">
                <label className="lbl">مصدر الدخل الرئيسي <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[
                    ['salary',    'راتب شهري'],
                    ['assistance','مساعدات'],
                    ['freelance', 'أعمال حرة'],
                    ['none',      'لا يوجد'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" value={val} checked={incomeSource === val}
                        onChange={() => setIncomeSource(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Monthly income */}
              <div className="fg">
                <label className="lbl" htmlFor="monthlyIncome">
                  متوسط الدخل الشهري <span className="opt">(اختياري)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input id="monthlyIncome" className="inp ltr"
                    placeholder="0" {...register('monthlyIncome')}
                    style={{ paddingLeft: '3rem' }} />
                  <span style={{
                    position: 'absolute', left: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', fontSize: '0.8rem',
                    color: '#9ca3af', pointerEvents: 'none',
                  }}>ريال</span>
                </div>
              </div>

              {/* Charity support */}
              <div className="fg">
                <label className="lbl">
                  هل تتلقى الأسرة دعماً من جهة خيرية؟ <span className="opt">(اختياري)</span>
                </label>
                <div className="radio-row">
                  {[['yes', 'نعم'], ['no', 'لا']].map(([val, lbl]) => (
                    <label key={val} className="radio-card">
                      <input type="radio" value={val} checked={hasCharitySupport === val}
                        onChange={() => setHasCharitySupport(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Support details — only if yes */}
              {hasCharitySupport === 'yes' && (
                <div className="fg span2">
                  <label className="lbl" htmlFor="charitySupportDetails">تفصيل الدعم</label>
                  <textarea id="charitySupportDetails" className="inp ta" rows={2}
                    placeholder="اذكر الجهة ومقدار الدعم…"
                    {...register('charitySupportDetails')} />
                </div>
              )}

            </div>
          </div>
          </Fragment>}

          {/* ══ PAGE 4: المواهب والجوانب الشخصية ══ */}
          {currentPage === 4 && <Fragment>
          {/* ── Section 8: Skills & Talents ──────────────────────────────── */}
          <div className="card">
            <SectionHeader
              number="٨"
              title="المهارات والمواهب"
              subtitle={
                selectedTalents.size > 0
                  ? `✓ سيتم تصنيف اليتيم كموهوب تلقائياً (${selectedTalents.size} موهبة)`
                  : 'اختر المهارات والمواهب — أي اختيار يصنّف اليتيم كموهوب تلقائياً'
              }
            />

            {selectedTalents.size > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#ECFDF5', border: '1px solid #6EE7B7',
                borderRadius: '0.625rem', padding: '0.6rem 1rem',
                marginBottom: '1.25rem', fontSize: '0.85rem',
                color: '#065F46', fontWeight: 600,
              }}>
                <span>⭐</span>
                <span>سيتم تصنيف هذا اليتيم كموهوب بناءً على المهارات المختارة</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {TALENT_CATEGORIES.map(({ key, label, options }) => (
                <div key={key}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', margin: '0 0 0.5rem' }}>
                    {label}
                  </p>
                  <div className="rel-row">
                    {options.map((opt) => {
                      const id = `${key}__${opt}`;
                      const checked = selectedTalents.has(id);
                      return (
                        <label key={id} style={{
                          display: 'flex', alignItems: 'center', padding: '0.45rem 0.9rem',
                          border: `1.5px solid ${checked ? '#1B5E8C' : '#d1d5db'}`,
                          borderRadius: '2rem', fontSize: '0.82rem', fontWeight: 600,
                          color: checked ? '#fff' : '#6b7280',
                          background: checked ? '#1B5E8C' : '#fafafa',
                          cursor: 'pointer', transition: 'all .15s', userSelect: 'none',
                        }}>
                          <input
                            type="checkbox"
                            style={{ display: 'none' }}
                            checked={checked}
                            onChange={() => {
                              setSelectedTalents(prev => {
                                const next = new Set(prev);
                                next.has(id) ? next.delete(id) : next.add(id);
                                return next;
                              });
                            }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Other talents */}
              <div className="fg">
                <label className="lbl" htmlFor="talentsOther">
                  أخرى يود تعلمها أو تطويرها <span className="opt">(اختياري)</span>
                </label>
                <input id="talentsOther" className="inp"
                  placeholder="مثال: العزف، الطيران…"
                  {...register('talentsOther')} />
              </div>
            </div>
          </div>

          {/* ── Section 9a: Social Aspect ────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="٩" title="الجانب الاجتماعي" subtitle="العلاقات الاجتماعية والسلوك" />
            <div className="grid">

              <div className="fg span2">
                <label className="lbl">العلاقات داخل الأسرة <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['connected','مترابطة'],['tense','متوترة بعض الشيء'],['fragmented','مفككة']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={familyRelations===val} onChange={()=>setFamilyRelations(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">العلاقة مع المجتمع <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['active','يشارك في أنشطة'],['shy','خجول ومنعزل'],['needs_push','يحتاج تشجيعاً على الاندماج']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={communityRelation===val} onChange={()=>setCommunityRelation(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">العلاقة بالمدرسة والمعلمين <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['positive','إيجابية'],['average','متوسطة'],['weak','ضعيفة أو فيها مشكلات']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={schoolRelation===val} onChange={()=>setSchoolRelation(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">سلوكيات اجتماعية ملحوظة <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['cooperative','متعاون'],['introverted','انطوائي'],['aggressive','عدواني'],['leader','قيادي']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={socialBehavior===val} onChange={()=>setSocialBehavior(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">يحتاج إلى دعم اجتماعي إضافي؟ <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['yes','نعم'],['no','لا'],['pending','قيد المتابعة']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={needsSocialSupport===val} onChange={()=>setNeedsSocialSupport(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Section 9b: Religious/Spiritual ──────────────────────────── */}
          <div className="card">
            <SectionHeader number="١٠" title="الجانب الروحي الديني" subtitle="مستوى الالتزام الديني والأخلاقي" />
            <div className="grid">

              <div className="fg span2">
                <label className="lbl">حفظ القرآن الكريم <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[
                    ['none',      'لا يحفظ'],
                    ['few_suras', 'يحفظ سور قليلة'],
                    ['few_parts', 'يحفظ أجزاء قليلة'],
                    ['half',      'يحفظ نصف القرآن'],
                    ['full',      'يحفظ كامل'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={quranLevel === val} onChange={() => setQuranLevel(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">الالتزام بالصلاة <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[
                    ['always',    'دائم الالتزام'],
                    ['sometimes', 'أحياناً'],
                    ['rarely',    'نادراً'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={prayerCommitment === val} onChange={() => setPrayerCommitment(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">السلوك والأخلاق <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[
                    ['good',         'مهذب ومتعاون'],
                    ['needs_follow', 'يحتاج متابعة بسيطة'],
                    ['needs_guide',  'لديه سلوكيات تحتاج توجيه'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={moralBehavior === val} onChange={() => setMoralBehavior(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Section 9c: Psychological ────────────────────────────────── */}
          <div className="card">
            <SectionHeader number="١١" title="الجانب النفسي" subtitle="الحالة النفسية والعاطفية لليتيم" />
            <div className="grid">

              <div className="fg span2">
                <label className="lbl">المظهر العام والتفاعل <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['smiling','مبتسم ومتفاعل'],['shy','خجول'],['introverted','منطوٍ'],['aggressive','عدواني بعض الشيء']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={generalAppearance===val} onChange={()=>setGeneralAppearance(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">التعبير عن الذات <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['confident','يتحدث بثقة'],['hesitant','يتردد في الكلام'],['silent','صامت أغلب الوقت']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={selfExpression===val} onChange={()=>setSelfExpression(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">العلاقات الأسرية <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['stable','جيدة ومستقرة'],['tense','متوترة قليلاً'],['troubled','مضطربة وتحتاج تدخل']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={psychFamilyRelations===val} onChange={()=>setPsychFamilyRelations(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">العلاقة مع الزملاء والأصدقاء <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['positive','إيجابية'],['limited','محدودة'],['none','لا يملك أصدقاء']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={peerRelations===val} onChange={()=>setPeerRelations(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">النوم والشهية <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['normal','طبيعية'],['poor_sleep','قلة نوم'],['poor_appetite','فقدان شهية'],['anxiety','قلق أو أحلام مزعجة']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={sleepAppetite===val} onChange={()=>setSleepAppetite(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">علامات نفسية ظاهرة <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['none','لا يوجد'],['sadness','حزن / بكاء متكرر'],['fear','خوف / قلق'],['aggression','عدوانية / غضب']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={psychSigns===val} onChange={()=>setPsychSigns(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg span2">
                <label className="lbl">يحتاج إلى متابعة نفسية متخصصة؟ <span className="opt">(اختياري)</span></label>
                <div className="rel-row">
                  {[['yes','نعم'],['no','لا'],['pending','قيد الملاحظة']].map(([val,lbl]) => (
                    <label key={val} className="rel-chip">
                      <input type="radio" checked={needsPsychSupport===val} onChange={()=>setNeedsPsychSupport(val)} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Section 9d: Recommendations ──────────────────────────────── */}
          <div className="card">
            <SectionHeader number="١٢" title="التوصيات" subtitle="ملاحظات وتوصيات الأخصائية" />
            <div className="fg">
              <label className="lbl" htmlFor="recommendations">
                التوصيات <span className="opt">(اختياري)</span>
              </label>
              <textarea
                id="recommendations"
                className="inp ta"
                rows={5}
                placeholder="اكتب توصياتك وملاحظاتك هنا…"
                {...register('recommendations')}
              />
            </div>
          </div>
          </Fragment>}

          {/* ══ PAGE 5: المستندات ══ */}
          {currentPage === 5 && <div className="card">
            <SectionHeader
              number="١٣"
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
          </div>}

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

          {/* Navigation row */}
          <div className="submit-row">
            {/* Left side: Cancel (page 1) or Back */}
            {currentPage === 1 ? (
              <button type="button" className="btn-ghost" onClick={() => router.back()}>
                إلغاء
              </button>
            ) : (
              <button type="button" className="btn-ghost" onClick={() => setCurrentPage(p => p - 1)}>
                ← رجوع
              </button>
            )}

            {/* Right side: Next or Submit */}
            {currentPage < 5 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentPage(p => p + 1)}
              >
                التالي ←
              </button>
            ) : (
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
            )}
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
        .p-step { display:flex; align-items:center; gap:.4rem; color:#94a3b8; }
        .p-active { color:#1B5E8C; }
        .p-done { color:#16a34a; }
        .p-num { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#d1d5db; color:#fff; font-size:.72rem; font-weight:700; }
        .p-active .p-num { background:#1B5E8C; }
        .p-done .p-num { background:#16a34a; }
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
