'use client';

import { useState, useEffect, Fragment } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

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

const TALENT_CATEGORIES = [
  { key: 'creativity', label: 'الإبداع والكتابة',   options: ['كتابة قصص', 'شعر', 'رسم', 'تصميم'] },
  { key: 'sports',     label: 'الرياضة',             options: ['كرة قدم', 'سباحة', 'كاراتيه', 'أخرى'] },
  { key: 'arts',       label: 'الفنون والأداء',      options: ['إنشاد', 'تمثيل', 'إلقاء'] },
  { key: 'tech',       label: 'المهارات التقنية',    options: ['استخدام الحاسب', 'تصميم', 'برمجة', 'صيانة أجهزة'] },
  { key: 'social',     label: 'المهارات الاجتماعية', options: ['قيادة', 'تعاون', 'خدمة مجتمعية'] },
  { key: 'life',       label: 'المهارات الحياتية',   options: ['الطبخ', 'الخياطة', 'البستنة', 'حرف يدوية'] },
];

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
  const [submitState,  setSubmitState]  = useState('idle');
  const [apiError,     setApiError]     = useState('');
  const [selectedTalents, setSelectedTalents] = useState(new Set());

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
      birthPlace: '', residence: '', motherGovernorate: '',
      phone1: '', phone1Relation: '', phone2: '', phone2Relation: '', address: '',
      guardianAge: '', guardianEduLevel: '', guardianJob: '', guardianHealth: '',
      familyMaleCount: '', familyFemaleCount: '', familyProblems: '',
      ownershipType: '', buildingType: '', floorsCount: '', roomsCount: '',
      water: '', electricity: '', rentAmount: '', housingDetails: '',
      hasChronicDisease: '', chronicDiseaseDetails: '', hasRegularTreatment: '', hasHealthInsurance: '',
      incomeSource: '', monthlyIncome: '', hasCharitySupport: '', charitySupportDetails: '',
      talentsOther: '',
      familyRelations: '', communityRelation: '', schoolRelation: '', socialBehavior: '', needsSocialSupport: '',
      quranLevel: '', prayerCommitment: '', moralBehavior: '',
      generalAppearance: '', selfExpression: '', psychFamilyRelations: '', peerRelations: '',
      sleepAppetite: '', psychSigns: '', needsPsychSupport: '',
      recommendations: '',
      schoolGrade: '', sectorType: '', directorate: '', schoolOrg: '',
      favoriteSubject: '', difficultySubject: '', generalLevel: '', generalGrade: '',
      repeatedYear: '', repeatedYearReason: '', lastResultAvg: '', gradeDetail: '',
      highestGrade: '', lowestGrade: '', eduResponsible: '', eduResponsiblePhone: '', eduLevel: '',
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
        const p = o.profile || {};
        reset({
          fullName: o.full_name || '',
          dateOfBirth: o.date_of_birth ? o.date_of_birth.split('T')[0] : '',
          gender: o.gender || '',
          governorateId: o.governorate_id || '',
          guardianName: o.guardian_name || '',
          guardianRelation: o.guardian_relation || '',
          notes: o.notes || '',
          birthPlace: p.birthPlace || '',
          residence: p.residence || '',
          motherGovernorate: p.motherGovernorate || '',
          phone1: p.phone1 || '',
          phone1Relation: p.phone1Relation || '',
          phone2: p.phone2 || '',
          phone2Relation: p.phone2Relation || '',
          address: p.address || '',
          guardianAge: p.guardianAge || '',
          guardianEduLevel: p.guardianEduLevel || '',
          guardianJob: p.guardianJob || '',
          guardianHealth: p.guardianHealth || '',
          familyMaleCount: p.familyMaleCount || '',
          familyFemaleCount: p.familyFemaleCount || '',
          familyProblems: p.familyProblems || '',
          hasChronicDisease: p.hasChronicDisease || '',
          chronicDiseaseDetails: p.chronicDiseaseDetails || '',
          hasRegularTreatment: p.hasRegularTreatment || '',
          hasHealthInsurance: p.hasHealthInsurance || '',
          incomeSource: p.incomeSource || '',
          monthlyIncome: p.monthlyIncome || '',
          hasCharitySupport: p.hasCharitySupport || '',
          charitySupportDetails: p.charitySupportDetails || '',
          talentsOther: p.talentsOther || '',
          ownershipType: p.ownershipType || '',
          buildingType: p.buildingType || '',
          floorsCount: p.floorsCount || '',
          roomsCount: p.roomsCount || '',
          water: p.water || '',
          electricity: p.electricity || '',
          rentAmount: p.rentAmount || '',
          housingDetails: p.housingDetails || '',
          schoolGrade: p.schoolGrade || '',
          sectorType: p.sectorType || '',
          directorate: p.directorate || '',
          schoolOrg: p.schoolOrg || '',
          favoriteSubject: p.favoriteSubject || '',
          difficultySubject: p.difficultySubject || '',
          generalLevel: p.generalLevel || '',
          generalGrade: p.generalGrade || '',
          repeatedYear: p.repeatedYear || '',
          repeatedYearReason: p.repeatedYearReason || '',
          lastResultAvg: p.lastResultAvg || '',
          gradeDetail: p.gradeDetail || '',
          highestGrade: p.highestGrade || '',
          lowestGrade: p.lowestGrade || '',
          eduResponsible: p.eduResponsible || '',
          eduResponsiblePhone: p.eduResponsiblePhone || '',
          eduLevel: p.eduLevel || '',
          talentsOther: p.talentsOther || '',
          familyRelations: p.familyRelations || '',
          communityRelation: p.communityRelation || '',
          schoolRelation: p.schoolRelation || '',
          socialBehavior: p.socialBehavior || '',
          needsSocialSupport: p.needsSocialSupport || '',
          quranLevel: p.quranLevel || '',
          prayerCommitment: p.prayerCommitment || '',
          moralBehavior: p.moralBehavior || '',
          generalAppearance: p.generalAppearance || '',
          selfExpression: p.selfExpression || '',
          psychFamilyRelations: p.psychFamilyRelations || '',
          peerRelations: p.peerRelations || '',
          sleepAppetite: p.sleepAppetite || '',
          psychSigns: p.psychSigns || '',
          needsPsychSupport: p.needsPsychSupport || '',
          recommendations: p.recommendations || '',
        });
        if (Array.isArray(p.talents)) {
          setSelectedTalents(new Set(p.talents));
        }
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
        profile: {
          birthPlace: data.birthPlace?.trim() || '',
          residence: data.residence?.trim() || '',
          motherGovernorate: data.motherGovernorate || '',
          phone1: data.phone1?.trim() || '',
          phone1Relation: data.phone1Relation?.trim() || '',
          phone2: data.phone2?.trim() || '',
          phone2Relation: data.phone2Relation?.trim() || '',
          address: data.address?.trim() || '',
          guardianAge: data.guardianAge?.trim() || '',
          guardianEduLevel: data.guardianEduLevel?.trim() || '',
          guardianJob: data.guardianJob?.trim() || '',
          guardianHealth: data.guardianHealth?.trim() || '',
          familyMaleCount: data.familyMaleCount || '',
          familyFemaleCount: data.familyFemaleCount || '',
          familyProblems: data.familyProblems?.trim() || '',
          hasChronicDisease: data.hasChronicDisease || '',
          chronicDiseaseDetails: data.chronicDiseaseDetails?.trim() || '',
          hasRegularTreatment: data.hasRegularTreatment || '',
          hasHealthInsurance: data.hasHealthInsurance || '',
          incomeSource: data.incomeSource || '',
          monthlyIncome: data.monthlyIncome?.trim() || '',
          hasCharitySupport: data.hasCharitySupport || '',
          charitySupportDetails: data.charitySupportDetails?.trim() || '',
          talents: Array.from(selectedTalents),
          talentsOther: data.talentsOther?.trim() || '',
          familyRelations: data.familyRelations || '',
          communityRelation: data.communityRelation || '',
          schoolRelation: data.schoolRelation || '',
          socialBehavior: data.socialBehavior || '',
          needsSocialSupport: data.needsSocialSupport || '',
          quranLevel: data.quranLevel || '',
          prayerCommitment: data.prayerCommitment || '',
          moralBehavior: data.moralBehavior || '',
          generalAppearance: data.generalAppearance || '',
          selfExpression: data.selfExpression || '',
          psychFamilyRelations: data.psychFamilyRelations || '',
          peerRelations: data.peerRelations || '',
          sleepAppetite: data.sleepAppetite || '',
          psychSigns: data.psychSigns || '',
          needsPsychSupport: data.needsPsychSupport || '',
          recommendations: data.recommendations?.trim() || '',
          ownershipType: data.ownershipType || '',
          buildingType: data.buildingType || '',
          floorsCount: data.floorsCount || '',
          roomsCount: data.roomsCount || '',
          water: data.water?.trim() || '',
          electricity: data.electricity?.trim() || '',
          rentAmount: data.rentAmount?.trim() || '',
          housingDetails: data.housingDetails?.trim() || '',
          schoolGrade: data.schoolGrade?.trim() || '',
          sectorType: data.sectorType || '',
          directorate: data.directorate?.trim() || '',
          schoolOrg: data.schoolOrg?.trim() || '',
          favoriteSubject: data.favoriteSubject?.trim() || '',
          difficultySubject: data.difficultySubject?.trim() || '',
          generalLevel: data.generalLevel?.trim() || '',
          generalGrade: data.generalGrade?.trim() || '',
          repeatedYear: data.repeatedYear || '',
          repeatedYearReason: data.repeatedYearReason?.trim() || '',
          lastResultAvg: data.lastResultAvg?.trim() || '',
          gradeDetail: data.gradeDetail?.trim() || '',
          highestGrade: data.highestGrade?.trim() || '',
          lowestGrade: data.lowestGrade?.trim() || '',
          eduResponsible: data.eduResponsible?.trim() || '',
          eduResponsiblePhone: data.eduResponsiblePhone?.trim() || '',
          eduLevel: data.eduLevel?.trim() || '',
        },
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
            <div className="success-ico"><CheckCircle2 size={16} /></div>
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

                <div className="fg">
                  <label className="lbl" htmlFor="birthPlace">محل الميلاد <span className="req">*</span></label>
                  <input id="birthPlace" className={`inp ${errors.birthPlace ? 'inp-err' : ''}`}
                    placeholder="المدينة أو المنطقة"
                    {...register('birthPlace', { required: 'محل الميلاد مطلوب' })} />
                  {errors.birthPlace && <p className="ferr">{errors.birthPlace.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="residence">مكان السكن <span className="req">*</span></label>
                  <input id="residence" className={`inp ${errors.residence ? 'inp-err' : ''}`}
                    placeholder="العنوان الحالي"
                    {...register('residence', { required: 'مكان السكن مطلوب' })} />
                  {errors.residence && <p className="ferr">{errors.residence.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="motherGovernorate">المحافظة الأم <span className="req">*</span></label>
                  <select id="motherGovernorate" className={`inp sel ${errors.motherGovernorate ? 'inp-err' : ''}`}
                    disabled={govLoading}
                    {...register('motherGovernorate', { required: 'المحافظة الأم مطلوبة' })}>
                    <option value="">{govLoading ? 'جارٍ التحميل…' : 'اختر المحافظة'}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>{g.name_ar}</option>
                    ))}
                  </select>
                  {errors.motherGovernorate && <p className="ferr">{errors.motherGovernorate.message}</p>}
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

            {/* ── Section 2: Contact ───────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٢" title="معلومات التواصل" subtitle="أرقام التواصل والعنوان" />
              <div className="grid">

                <div className="fg">
                  <label className="lbl" htmlFor="phone1">الرقم الأول <span className="req">*</span></label>
                  <input id="phone1" className={`inp ltr ${errors.phone1 ? 'inp-err' : ''}`}
                    placeholder="07XXXXXXXX"
                    {...register('phone1', { required: 'الرقم الأول مطلوب' })} />
                  {errors.phone1 && <p className="ferr">{errors.phone1.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="phone1Relation">صلة القرابة <span className="req">*</span></label>
                  <input id="phone1Relation" className={`inp ${errors.phone1Relation ? 'inp-err' : ''}`}
                    placeholder="مثال: عم، خال، جد"
                    {...register('phone1Relation', { required: 'صلة القرابة مطلوبة' })} />
                  {errors.phone1Relation && <p className="ferr">{errors.phone1Relation.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="phone2">الرقم الثاني <span className="opt">(اختياري)</span></label>
                  <input id="phone2" className="inp ltr" placeholder="07XXXXXXXX"
                    {...register('phone2')} />
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="phone2Relation">صلة القرابة</label>
                  <input id="phone2Relation" className="inp" placeholder="مثال: عم، خال، جد"
                    {...register('phone2Relation')} />
                </div>

                <div className="fg span2">
                  <label className="lbl" htmlFor="address">العنوان <span className="req">*</span></label>
                  <input id="address" className={`inp ${errors.address ? 'inp-err' : ''}`}
                    placeholder="الحي، الشارع، رقم المنزل…"
                    {...register('address', { required: 'العنوان مطلوب' })} />
                  {errors.address && <p className="ferr">{errors.address.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 3: Guardian ───────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٣" title="بيانات الوصي" subtitle="معلومات الشخص المسؤول عن رعاية اليتيم" />
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

                <div className="fg">
                  <label className="lbl" htmlFor="guardianAge">عمر ولي الأمر <span className="req">*</span></label>
                  <input id="guardianAge" className={`inp ltr ${errors.guardianAge ? 'inp-err' : ''}`}
                    placeholder="مثال: 45"
                    {...register('guardianAge', { required: 'عمر ولي الأمر مطلوب' })} />
                  {errors.guardianAge && <p className="ferr">{errors.guardianAge.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="guardianEduLevel">المستوى التعليمي <span className="req">*</span></label>
                  <input id="guardianEduLevel" className={`inp ${errors.guardianEduLevel ? 'inp-err' : ''}`}
                    placeholder="مثال: ثانوية، جامعي"
                    {...register('guardianEduLevel', { required: 'المستوى التعليمي مطلوب' })} />
                  {errors.guardianEduLevel && <p className="ferr">{errors.guardianEduLevel.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="guardianJob">المهنة <span className="req">*</span></label>
                  <input id="guardianJob" className={`inp ${errors.guardianJob ? 'inp-err' : ''}`}
                    placeholder="مثال: موظف، تاجر"
                    {...register('guardianJob', { required: 'المهنة مطلوبة' })} />
                  {errors.guardianJob && <p className="ferr">{errors.guardianJob.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="guardianHealth">الحالة الصحية <span className="req">*</span></label>
                  <input id="guardianHealth" className={`inp ${errors.guardianHealth ? 'inp-err' : ''}`}
                    placeholder="مثال: جيدة، مريض"
                    {...register('guardianHealth', { required: 'الحالة الصحية مطلوبة' })} />
                  {errors.guardianHealth && <p className="ferr">{errors.guardianHealth.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="familyMaleCount">عدد الذكور في الأسرة <span className="req">*</span></label>
                  <input id="familyMaleCount" type="number" min="0"
                    className={`inp ltr ${errors.familyMaleCount ? 'inp-err' : ''}`}
                    placeholder="0"
                    {...register('familyMaleCount', { required: 'عدد الذكور مطلوب' })} />
                  {errors.familyMaleCount && <p className="ferr">{errors.familyMaleCount.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="familyFemaleCount">عدد الإناث في الأسرة <span className="req">*</span></label>
                  <input id="familyFemaleCount" type="number" min="0"
                    className={`inp ltr ${errors.familyFemaleCount ? 'inp-err' : ''}`}
                    placeholder="0"
                    {...register('familyFemaleCount', { required: 'عدد الإناث مطلوب' })} />
                  {errors.familyFemaleCount && <p className="ferr">{errors.familyFemaleCount.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl" htmlFor="familyProblems">أهم المشاكل التي تواجهها الأسرة <span className="req">*</span></label>
                  <textarea id="familyProblems" rows={3}
                    className={`inp ta ${errors.familyProblems ? 'inp-err' : ''}`}
                    placeholder="اذكر أبرز المشاكل والتحديات…"
                    {...register('familyProblems', { required: 'هذا الحقل مطلوب' })} />
                  {errors.familyProblems && <p className="ferr">{errors.familyProblems.message}</p>}
                </div>

              </div>
            </div>

            {/* API error banner */}
            {submitState === 'error' && apiError && (
              <div className="err-banner" role="alert">
                <span><AlertTriangle size={18} /></span>
                <div>
                  <strong>فشل الإرسال</strong>
                  <p>{apiError}</p>
                </div>
              </div>
            )}

            {/* ── Section 4: Talents ──────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٤" title="المهارات والمواهب" subtitle="اختر المهارات — أي اختيار يصنّف اليتيم كموهوب" />

              {selectedTalents.size > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', background:'#ECFDF5', border:'1px solid #6EE7B7', borderRadius:'.625rem', padding:'.6rem 1rem', marginBottom:'1.25rem', fontSize:'.85rem', color:'#065F46', fontWeight:600 }}>
                  ⭐ سيتم تصنيف هذا اليتيم كموهوب بناءً على المهارات المختارة
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
                {TALENT_CATEGORIES.map(({ key, label, options }) => (
                  <div key={key}>
                    <p style={{ fontSize:'.82rem', fontWeight:700, color:'#374151', margin:'0 0 .5rem' }}>{label}</p>
                    <div className="rel-row">
                      {options.map((opt) => {
                        const tid = `${key}__${opt}`;
                        const checked = selectedTalents.has(tid);
                        return (
                          <label key={tid} style={{ display:'flex', alignItems:'center', padding:'.45rem .9rem', border:`1.5px solid ${checked ? '#1B5E8C' : '#d1d5db'}`, borderRadius:'2rem', fontSize:'.82rem', fontWeight:600, color: checked ? '#fff' : '#6b7280', background: checked ? '#1B5E8C' : '#fafafa', cursor:'pointer', transition:'all .15s', userSelect:'none' }}>
                            <input type="checkbox" style={{ display:'none' }} checked={checked}
                              onChange={() => setSelectedTalents(prev => { const n = new Set(prev); n.has(tid) ? n.delete(tid) : n.add(tid); return n; })} />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="fg">
                  <label className="lbl" htmlFor="talentsOther">أخرى يود تعلمها أو تطويرها <span className="opt">(اختياري)</span></label>
                  <input id="talentsOther" className="inp" placeholder="مثال: العزف، الطيران…" {...register('talentsOther')} />
                </div>
              </div>
            </div>

            {/* ── Section 5: Economic ─────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٥" title="الوضع الاقتصادي" subtitle="مصادر الدخل والدعم المالي للأسرة" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl">مصدر الدخل الرئيسي <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['salary','راتب شهري'],['assistance','مساعدات'],['freelance','أعمال حرة'],['none','لا يوجد']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.incomeSource ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('incomeSource', { required: 'مصدر الدخل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.incomeSource && <p className="ferr">{errors.incomeSource.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="monthlyIncome">متوسط الدخل الشهري <span className="req">*</span></label>
                  <input id="monthlyIncome" className={`inp ltr ${errors.monthlyIncome ? 'inp-err' : ''}`}
                    placeholder="0"
                    {...register('monthlyIncome', { required: 'متوسط الدخل الشهري مطلوب' })} />
                  {errors.monthlyIncome && <p className="ferr">{errors.monthlyIncome.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl">هل تتلقى الأسرة دعماً من جهة خيرية؟ <span className="req">*</span></label>
                  <div className="radio-row">
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasCharitySupport ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasCharitySupport', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasCharitySupport && <p className="ferr">{errors.hasCharitySupport.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl" htmlFor="charitySupportDetails">تفصيل الدعم <span className="opt">(إن وجد)</span></label>
                  <textarea id="charitySupportDetails" className="inp ta" rows={2}
                    placeholder="اذكر الجهة ومقدار الدعم…"
                    {...register('charitySupportDetails')} />
                </div>

              </div>
            </div>

            {/* ── Section 6: Health ───────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٦" title="الحالة الصحية" subtitle="معلومات عن الوضع الصحي لليتيم" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl">هل يعاني من أمراض مزمنة؟ <span className="req">*</span></label>
                  <div className="radio-row" style={{ maxWidth: '200px' }}>
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasChronicDisease ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasChronicDisease', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasChronicDisease && <p className="ferr">{errors.hasChronicDisease.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl" htmlFor="chronicDiseaseDetails">تفاصيل الأمراض <span className="opt">(إن وجدت)</span></label>
                  <input id="chronicDiseaseDetails" className="inp"
                    placeholder="اذكر الأمراض المزمنة…"
                    {...register('chronicDiseaseDetails')} />
                </div>

                <div className="fg">
                  <label className="lbl">هل يتلقى علاجاً منتظماً؟ <span className="req">*</span></label>
                  <div className="radio-row">
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasRegularTreatment ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasRegularTreatment', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasRegularTreatment && <p className="ferr">{errors.hasRegularTreatment.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl">هل يتوفر تأمين صحي؟ <span className="req">*</span></label>
                  <div className="radio-row">
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasHealthInsurance ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasHealthInsurance', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasHealthInsurance && <p className="ferr">{errors.hasHealthInsurance.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 7: Housing ──────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٧" title="الوضع السكني" subtitle="معلومات عن السكن والمرافق" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl">نوع السكن <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['owned','ملك'],['rented','إيجار'],['free','سكن مجاني']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.ownershipType ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('ownershipType', { required: 'نوع السكن مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.ownershipType && <p className="ferr">{errors.ownershipType.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">نوع البناء <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['popular','شعبي'],['reinforced','مسلح'],['other','آخر']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.buildingType ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('buildingType', { required: 'نوع البناء مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.buildingType && <p className="ferr">{errors.buildingType.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="floorsCount">عدد الطوابق <span className="req">*</span></label>
                  <input id="floorsCount" type="number" min="1"
                    className={`inp ltr ${errors.floorsCount ? 'inp-err' : ''}`} placeholder="1"
                    {...register('floorsCount', { required: 'عدد الطوابق مطلوب' })} />
                  {errors.floorsCount && <p className="ferr">{errors.floorsCount.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="roomsCount">عدد الغرف <span className="req">*</span></label>
                  <input id="roomsCount" type="number" min="1"
                    className={`inp ltr ${errors.roomsCount ? 'inp-err' : ''}`} placeholder="1"
                    {...register('roomsCount', { required: 'عدد الغرف مطلوب' })} />
                  {errors.roomsCount && <p className="ferr">{errors.roomsCount.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="water">الماء <span className="req">*</span></label>
                  <input id="water" className={`inp ${errors.water ? 'inp-err' : ''}`}
                    placeholder="مثال: شبكة عامة، خزان"
                    {...register('water', { required: 'مصدر الماء مطلوب' })} />
                  {errors.water && <p className="ferr">{errors.water.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="electricity">الكهرباء <span className="req">*</span></label>
                  <input id="electricity" className={`inp ${errors.electricity ? 'inp-err' : ''}`}
                    placeholder="مثال: متصل، مولد"
                    {...register('electricity', { required: 'مصدر الكهرباء مطلوب' })} />
                  {errors.electricity && <p className="ferr">{errors.electricity.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="rentAmount">مقدار الإيجار <span className="opt">(إن وجد)</span></label>
                  <input id="rentAmount" className="inp ltr" placeholder="بالريال"
                    {...register('rentAmount')} />
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="housingDetails">تفاصيل أخرى <span className="opt">(اختياري)</span></label>
                  <input id="housingDetails" className="inp" placeholder="أي تفاصيل إضافية"
                    {...register('housingDetails')} />
                </div>

              </div>
            </div>

            {/* ── Section 8: Educational ───────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٨" title="البيانات الدراسية" subtitle="معلومات عن المستوى التعليمي" />
              <div className="grid">

                <div className="fg">
                  <label className="lbl" htmlFor="schoolGrade">الصف <span className="req">*</span></label>
                  <input id="schoolGrade" className={`inp ${errors.schoolGrade ? 'inp-err' : ''}`}
                    placeholder="مثال: السادس الابتدائي"
                    {...register('schoolGrade', { required: 'الصف مطلوب' })} />
                  {errors.schoolGrade && <p className="ferr">{errors.schoolGrade.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl">نوع القطاع <span className="req">*</span></label>
                  <div className="radio-row">
                    {[['government','حكومي'],['private','خاص']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.sectorType ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('sectorType', { required: 'نوع القطاع مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.sectorType && <p className="ferr">{errors.sectorType.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="directorate">المديرية <span className="req">*</span></label>
                  <input id="directorate" className={`inp ${errors.directorate ? 'inp-err' : ''}`}
                    placeholder="اسم المديرية"
                    {...register('directorate', { required: 'المديرية مطلوبة' })} />
                  {errors.directorate && <p className="ferr">{errors.directorate.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="schoolOrg">الجهة <span className="req">*</span></label>
                  <input id="schoolOrg" className={`inp ${errors.schoolOrg ? 'inp-err' : ''}`}
                    placeholder="اسم المدرسة أو الجهة"
                    {...register('schoolOrg', { required: 'الجهة مطلوبة' })} />
                  {errors.schoolOrg && <p className="ferr">{errors.schoolOrg.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="favoriteSubject">المادة المفضلة <span className="req">*</span></label>
                  <input id="favoriteSubject" className={`inp ${errors.favoriteSubject ? 'inp-err' : ''}`}
                    placeholder="مثال: الرياضيات"
                    {...register('favoriteSubject', { required: 'المادة المفضلة مطلوبة' })} />
                  {errors.favoriteSubject && <p className="ferr">{errors.favoriteSubject.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="difficultySubject">يواجه صعوبة في <span className="req">*</span></label>
                  <input id="difficultySubject" className={`inp ${errors.difficultySubject ? 'inp-err' : ''}`}
                    placeholder="مثال: اللغة الإنجليزية"
                    {...register('difficultySubject', { required: 'هذا الحقل مطلوب' })} />
                  {errors.difficultySubject && <p className="ferr">{errors.difficultySubject.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="generalLevel">المستوى العام <span className="req">*</span></label>
                  <input id="generalLevel" className={`inp ${errors.generalLevel ? 'inp-err' : ''}`}
                    placeholder="مثال: جيد، متوسط، ضعيف"
                    {...register('generalLevel', { required: 'المستوى العام مطلوب' })} />
                  {errors.generalLevel && <p className="ferr">{errors.generalLevel.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="generalGrade">التقدير العام <span className="req">*</span></label>
                  <input id="generalGrade" className={`inp ${errors.generalGrade ? 'inp-err' : ''}`}
                    placeholder="مثال: جيد جداً"
                    {...register('generalGrade', { required: 'التقدير العام مطلوب' })} />
                  {errors.generalGrade && <p className="ferr">{errors.generalGrade.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="lastResultAvg">معدل آخر نتيجة <span className="req">*</span></label>
                  <input id="lastResultAvg" className={`inp ltr ${errors.lastResultAvg ? 'inp-err' : ''}`}
                    placeholder="مثال: 85%"
                    {...register('lastResultAvg', { required: 'معدل آخر نتيجة مطلوب' })} />
                  {errors.lastResultAvg && <p className="ferr">{errors.lastResultAvg.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="gradeDetail">التفصيل <span className="req">*</span></label>
                  <input id="gradeDetail" className={`inp ${errors.gradeDetail ? 'inp-err' : ''}`}
                    placeholder="تفاصيل النتيجة"
                    {...register('gradeDetail', { required: 'التفصيل مطلوب' })} />
                  {errors.gradeDetail && <p className="ferr">{errors.gradeDetail.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="highestGrade">أعلى درجة في مادة <span className="req">*</span></label>
                  <input id="highestGrade" className={`inp ${errors.highestGrade ? 'inp-err' : ''}`}
                    placeholder="المادة والدرجة"
                    {...register('highestGrade', { required: 'هذا الحقل مطلوب' })} />
                  {errors.highestGrade && <p className="ferr">{errors.highestGrade.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="lowestGrade">أدنى درجة في مادة <span className="req">*</span></label>
                  <input id="lowestGrade" className={`inp ${errors.lowestGrade ? 'inp-err' : ''}`}
                    placeholder="المادة والدرجة"
                    {...register('lowestGrade', { required: 'هذا الحقل مطلوب' })} />
                  {errors.lowestGrade && <p className="ferr">{errors.lowestGrade.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">هل أعاد سنة مسبقة؟ <span className="req">*</span></label>
                  <div className="radio-row" style={{ maxWidth: '200px' }}>
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.repeatedYear ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('repeatedYear', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.repeatedYear && <p className="ferr">{errors.repeatedYear.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl" htmlFor="repeatedYearReason">سبب الإعادة <span className="opt">(إن وجد)</span></label>
                  <input id="repeatedYearReason" className="inp" placeholder="سبب الإعادة"
                    {...register('repeatedYearReason')} />
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="eduResponsible">المسؤول تعليمياً <span className="req">*</span></label>
                  <input id="eduResponsible" className={`inp ${errors.eduResponsible ? 'inp-err' : ''}`}
                    placeholder="الاسم"
                    {...register('eduResponsible', { required: 'المسؤول التعليمي مطلوب' })} />
                  {errors.eduResponsible && <p className="ferr">{errors.eduResponsible.message}</p>}
                </div>

                <div className="fg">
                  <label className="lbl" htmlFor="eduResponsiblePhone">رقم هاتفه <span className="req">*</span></label>
                  <input id="eduResponsiblePhone" className={`inp ltr ${errors.eduResponsiblePhone ? 'inp-err' : ''}`}
                    placeholder="07XXXXXXXX"
                    {...register('eduResponsiblePhone', { required: 'رقم الهاتف مطلوب' })} />
                  {errors.eduResponsiblePhone && <p className="ferr">{errors.eduResponsiblePhone.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl" htmlFor="eduLevel">المستوى التعليمي للمسؤول <span className="req">*</span></label>
                  <input id="eduLevel" className={`inp ${errors.eduLevel ? 'inp-err' : ''}`}
                    placeholder="مثال: ثانوية، جامعي"
                    {...register('eduLevel', { required: 'المستوى التعليمي مطلوب' })} />
                  {errors.eduLevel && <p className="ferr">{errors.eduLevel.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 9: Social ───────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٩" title="الجانب الاجتماعي" subtitle="العلاقات الاجتماعية والسلوك" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl">العلاقات داخل الأسرة <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['connected','مترابطة'],['tense','متوترة بعض الشيء'],['fragmented','مفككة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.familyRelations ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('familyRelations', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.familyRelations && <p className="ferr">{errors.familyRelations.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">العلاقة مع المجتمع <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['active','يشارك في أنشطة'],['shy','خجول ومنعزل'],['needs_push','يحتاج تشجيعاً على الاندماج']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.communityRelation ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('communityRelation', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.communityRelation && <p className="ferr">{errors.communityRelation.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">العلاقة بالمدرسة والمعلمين <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['positive','إيجابية'],['average','متوسطة'],['weak','ضعيفة أو فيها مشكلات']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.schoolRelation ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('schoolRelation', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.schoolRelation && <p className="ferr">{errors.schoolRelation.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">سلوكيات اجتماعية ملحوظة <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['cooperative','متعاون'],['introverted','انطوائي'],['aggressive','عدواني'],['leader','قيادي']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.socialBehavior ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('socialBehavior', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.socialBehavior && <p className="ferr">{errors.socialBehavior.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">يحتاج إلى دعم اجتماعي إضافي؟ <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['yes','نعم'],['no','لا'],['pending','قيد المتابعة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.needsSocialSupport ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('needsSocialSupport', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.needsSocialSupport && <p className="ferr">{errors.needsSocialSupport.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 10: Religious ───────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="١٠" title="الجانب الروحي الديني" subtitle="مستوى الالتزام الديني والأخلاقي" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl">حفظ القرآن الكريم <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['none','لا يحفظ'],['few_suras','يحفظ سور قليلة'],['few_parts','يحفظ أجزاء قليلة'],['half','يحفظ نصف القرآن'],['full','يحفظ كامل']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.quranLevel ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('quranLevel', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.quranLevel && <p className="ferr">{errors.quranLevel.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">الالتزام بالصلاة <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['always','دائم الالتزام'],['sometimes','أحياناً'],['rarely','نادراً']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.prayerCommitment ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('prayerCommitment', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.prayerCommitment && <p className="ferr">{errors.prayerCommitment.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">السلوك والأخلاق <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['good','مهذب ومتعاون'],['needs_follow','يحتاج متابعة بسيطة'],['needs_guide','لديه سلوكيات تحتاج توجيه']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.moralBehavior ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('moralBehavior', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.moralBehavior && <p className="ferr">{errors.moralBehavior.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 11: Psychological ───────────────────────────────── */}
            <div className="card">
              <SectionHeader number="١١" title="الجانب النفسي" subtitle="الحالة النفسية والعاطفية لليتيم" />
              <div className="grid">

                <div className="fg span2">
                  <label className="lbl">المظهر العام والتفاعل <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['smiling','مبتسم ومتفاعل'],['shy','خجول'],['introverted','منطوٍ'],['aggressive','عدواني بعض الشيء']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.generalAppearance ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('generalAppearance', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.generalAppearance && <p className="ferr">{errors.generalAppearance.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">التعبير عن الذات <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['confident','يتحدث بثقة'],['hesitant','يتردد في الكلام'],['silent','صامت أغلب الوقت']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.selfExpression ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('selfExpression', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.selfExpression && <p className="ferr">{errors.selfExpression.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">العلاقات الأسرية <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['stable','جيدة ومستقرة'],['tense','متوترة قليلاً'],['troubled','مضطربة وتحتاج تدخل']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.psychFamilyRelations ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('psychFamilyRelations', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.psychFamilyRelations && <p className="ferr">{errors.psychFamilyRelations.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">العلاقة مع الزملاء والأصدقاء <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['positive','إيجابية'],['limited','محدودة'],['none','لا يملك أصدقاء']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.peerRelations ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('peerRelations', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.peerRelations && <p className="ferr">{errors.peerRelations.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">النوم والشهية <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['normal','طبيعية'],['poor_sleep','قلة نوم'],['poor_appetite','فقدان شهية'],['anxiety','قلق أو أحلام مزعجة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.sleepAppetite ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('sleepAppetite', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.sleepAppetite && <p className="ferr">{errors.sleepAppetite.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">علامات نفسية ظاهرة <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['none','لا يوجد'],['sadness','حزن / بكاء متكرر'],['fear','خوف / قلق'],['aggression','عدوانية / غضب']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.psychSigns ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('psychSigns', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.psychSigns && <p className="ferr">{errors.psychSigns.message}</p>}
                </div>

                <div className="fg span2">
                  <label className="lbl">يحتاج إلى متابعة نفسية متخصصة؟ <span className="req">*</span></label>
                  <div className="rel-row">
                    {[['yes','نعم'],['no','لا'],['pending','قيد الملاحظة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.needsPsychSupport ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('needsPsychSupport', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.needsPsychSupport && <p className="ferr">{errors.needsPsychSupport.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 12: Recommendations ─────────────────────────────── */}
            <div className="card">
              <SectionHeader number="١٢" title="التوصيات" subtitle="ملاحظات وتوصيات الأخصائية" />
              <div className="fg">
                <label className="lbl" htmlFor="recommendations">
                  التوصيات <span className="req">*</span>
                </label>
                <textarea
                  id="recommendations"
                  className={`inp ta ${errors.recommendations ? 'inp-err' : ''}`}
                  rows={5}
                  placeholder="اكتب توصياتك وملاحظاتك هنا…"
                  {...register('recommendations', { required: 'التوصيات مطلوبة' })}
                />
                {errors.recommendations && <p className="ferr">{errors.recommendations.message}</p>}
              </div>
            </div>

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
