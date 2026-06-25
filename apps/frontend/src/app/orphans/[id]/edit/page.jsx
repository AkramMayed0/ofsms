'use client';

import { useState, useEffect, Fragment } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Spinner from '@/components/ui/Spinner';

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
    <div className="flex items-start gap-4 mb-6 pb-4 border-b-[1.5px] border-[#f0f4f8]">
      <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-[#1B5E8C] to-[#0d3d5c] text-white flex items-center justify-center text-[1.1rem] font-bold shrink-0 font-cairo">{number}</div>
      <div>
        <h2 className="text-[1.05rem] font-bold text-[#0d3d5c] m-0 mb-0.5">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 m-0">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OrphanEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthStore();
  const isGM = user?.role === 'gm';

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
    const fetchGovernorates = async () => {
      try {
        const { data } = await api.get('/governorates');
        setGovernorates(data.data || []);
      } catch (err) {
        console.error('Error fetching governorates:', err);
        setGovernorates([]);
      } finally {
        setGovLoading(false);
      }
    };
    fetchGovernorates();
  }, []);

  // Fetch orphan data
  useEffect(() => {
    if (!id) return;
    const fetchOrphan = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/orphans/${id}`);
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
      } catch (err) {
        console.error('Error fetching orphan data:', err);
        setApiError('تعذّر تحميل بيانات اليتيم');
      } finally {
        setLoading(false);
      }
    };
    fetchOrphan();
  }, [id, reset]);

  const [toastVisible, setToastVisible] = useState(false);

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
      setToastVisible(true);
      setTimeout(() => router.push(`/orphans/${id}`), 3000);
    } catch (err) {
      setSubmitState('error');
      setApiError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً'
      );
    }
  };

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <AppShell>

      {/* ── Success toast popup ─────────────────────────────────────────── */}
      {toastVisible && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] p-4 animate-[fadeIn_0.2s_ease]" onClick={() => { setToastVisible(false); router.push(`/orphans/${id}`); }}>
          <div className="bg-white rounded-[1.25rem] p-9 max-w-[400px] w-full text-center shadow-2xl animate-[scaleIn_0.2s_ease]" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex justify-center mb-4">
              <CheckCircle2 size={40} color="#10B981" strokeWidth={1.8} />
            </div>
            <h3 className="text-[1.2rem] font-extrabold text-[#0d3d5c] m-0 mb-2.5">{isGM ? 'تم الحفظ بنجاح' : 'تمت إعادة الإرسال بنجاح'}</h3>
            <p className="text-sm text-gray-500 leading-relaxed m-0 mb-6">
              {isGM
                ? 'تم تحديث بيانات اليتيم بنجاح.'
                : 'تم تحديث بيانات اليتيم وإرسالها إلى قائمة انتظار المراجعة.'}
            </p>
            <button className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white border-none rounded-xl font-cairo text-sm font-bold cursor-pointer shadow-md shadow-sky-950/25 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg" onClick={() => { setToastVisible(false); router.push(`/orphans/${id}`); }}>
              العودة لصفحة اليتيم
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[860px] mx-auto pb-16 font-cairo" dir="rtl">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-col sm:flex-row">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] m-0 mb-1">تعديل بيانات اليتيم</h1>
            <p className="text-sm text-slate-500 m-0">
              {isGM ? 'قم بتعديل البيانات — الحالة لن تتغير' : 'قم بتعديل البيانات وإعادة الإرسال للمراجعة'}
            </p>
          </div>
          <button type="button" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-[#1B5E8C] font-cairo font-semibold text-sm border-[1.5px] border-[#dde5f0] rounded-xl cursor-pointer transition-all duration-150 hover:bg-[#f0f7ff] hover:border-[#1B5E8C]" onClick={() => router.back()}>
            ← رجوع
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">جارٍ التحميل…</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

            {/* ── Section 1: Basic Info ─────────────────────────────────────── */}
            <div className="bg-white border border-[#e5eaf0] rounded-2xl p-7 shadow-sm shadow-sky-900/5">
              <SectionHeader number="١" title="البيانات الأساسية" subtitle="معلومات اليتيم الشخصية" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1.1rem]">

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="fullName">
                    الاسم الكامل <span className="text-red-600 mr-0.5">*</span>
                  </label>
                  <input
                    id="fullName"
                    className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="مثال: محمد أحمد علي"
                    {...register('fullName', {
                      required: 'الاسم الكامل مطلوب',
                      minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                    })}
                  />
                  {errors.fullName && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.fullName.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="dateOfBirth">
                    تاريخ الميلاد <span className="text-red-600 mr-0.5">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] direction-ltr text-left ${errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    max={new Date().toISOString().split('T')[0]}
                    {...register('dateOfBirth', {
                      required: 'تاريخ الميلاد مطلوب',
                      validate: (v) => new Date(v) < new Date() || 'يجب أن يكون في الماضي',
                    })}
                  />
                  {errors.dateOfBirth && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.dateOfBirth.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700">الجنس <span className="text-red-600 mr-0.5">*</span></label>
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
                  {errors.gender && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.gender.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="governorateId">
                    المحافظة <span className="text-red-600 mr-0.5">*</span>
                  </label>
                  <select
                    id="governorateId"
                    className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.governorateId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    disabled={govLoading}
                    {...register('governorateId', { required: 'المحافظة مطلوبة' })}
                  >
                    <option value="">{govLoading ? 'جارٍ التحميل…' : 'اختر المحافظة'}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>{g.name_ar}</option>
                    ))}
                  </select>
                  {errors.governorateId && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.governorateId.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="birthPlace">محل الميلاد <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="birthPlace" className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.birthPlace ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="المدينة أو المنطقة"
                    {...register('birthPlace', { required: 'محل الميلاد مطلوب' })} />
                  {errors.birthPlace && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.birthPlace.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="residence">مكان السكن <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="residence" className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.residence ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="العنوان الحالي"
                    {...register('residence', { required: 'مكان السكن مطلوب' })} />
                  {errors.residence && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.residence.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="motherGovernorate">المحافظة الأم <span className="text-red-600 mr-0.5">*</span></label>
                  <select id="motherGovernorate" className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.motherGovernorate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    disabled={govLoading}
                    {...register('motherGovernorate', { required: 'المحافظة الأم مطلوبة' })}>
                    <option value="">{govLoading ? 'جارٍ التحميل…' : 'اختر المحافظة'}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>{g.name_ar}</option>
                    ))}
                  </select>
                  {errors.motherGovernorate && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.motherGovernorate.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="notes">
                    ملاحظات <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
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

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="phone1">الرقم الأول <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="phone1" className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] direction-ltr text-left ${errors.phone1 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="07XXXXXXXX"
                    {...register('phone1', { required: 'الرقم الأول مطلوب' })} />
                  {errors.phone1 && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.phone1.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="phone1Relation">صلة القرابة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="phone1Relation" className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.phone1Relation ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="مثال: عم، خال، جد"
                    {...register('phone1Relation', { required: 'صلة القرابة مطلوبة' })} />
                  {errors.phone1Relation && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.phone1Relation.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="phone2">الرقم الثاني <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                  <input id="phone2" className="w-full border-[1.5px] border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] direction-ltr text-left" placeholder="07XXXXXXXX"
                    {...register('phone2')} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="phone2Relation">صلة القرابة</label>
                  <input id="phone2Relation" className="w-full border-[1.5px] border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)]" placeholder="مثال: عم، خال، جد"
                    {...register('phone2Relation')} />
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="address">العنوان <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="address" className={`w-full border-[1.5px] rounded-xl px-3.5 py-2.5 text-sm font-cairo text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="الحي، الشارع، رقم المنزل…"
                    {...register('address', { required: 'العنوان مطلوب' })} />
                  {errors.address && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.address.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 3: Guardian ───────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٣" title="بيانات الوصي" subtitle="معلومات الشخص المسؤول عن رعاية اليتيم" />
              <div className="grid">

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="guardianName">
                    اسم الوصي <span className="text-red-600 mr-0.5">*</span>
                  </label>
                  <input
                    id="guardianName"
                    className={`inp ${errors.guardianName ? 'inp-err' : ''}`}
                    placeholder="الاسم الكامل للوصي"
                    {...register('guardianName', { required: 'اسم الوصي مطلوب' })}
                  />
                  {errors.guardianName && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.guardianName.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">
                    صلة الوصي باليتيم <span className="text-red-600 mr-0.5">*</span>
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
                    <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.guardianRelation.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="guardianAge">عمر ولي الأمر <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="guardianAge" className={`inp ltr ${errors.guardianAge ? 'inp-err' : ''}`}
                    placeholder="مثال: 45"
                    {...register('guardianAge', { required: 'عمر ولي الأمر مطلوب' })} />
                  {errors.guardianAge && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.guardianAge.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="guardianEduLevel">المستوى التعليمي <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="guardianEduLevel" className={`inp ${errors.guardianEduLevel ? 'inp-err' : ''}`}
                    placeholder="مثال: ثانوية، جامعي"
                    {...register('guardianEduLevel', { required: 'المستوى التعليمي مطلوب' })} />
                  {errors.guardianEduLevel && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.guardianEduLevel.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="guardianJob">المهنة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="guardianJob" className={`inp ${errors.guardianJob ? 'inp-err' : ''}`}
                    placeholder="مثال: موظف، تاجر"
                    {...register('guardianJob', { required: 'المهنة مطلوبة' })} />
                  {errors.guardianJob && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.guardianJob.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="guardianHealth">الحالة الصحية <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="guardianHealth" className={`inp ${errors.guardianHealth ? 'inp-err' : ''}`}
                    placeholder="مثال: جيدة، مريض"
                    {...register('guardianHealth', { required: 'الحالة الصحية مطلوبة' })} />
                  {errors.guardianHealth && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.guardianHealth.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="familyMaleCount">عدد الذكور في الأسرة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="familyMaleCount" type="number" min="0"
                    className={`inp ltr ${errors.familyMaleCount ? 'inp-err' : ''}`}
                    placeholder="0"
                    {...register('familyMaleCount', { required: 'عدد الذكور مطلوب' })} />
                  {errors.familyMaleCount && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.familyMaleCount.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="familyFemaleCount">عدد الإناث في الأسرة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="familyFemaleCount" type="number" min="0"
                    className={`inp ltr ${errors.familyFemaleCount ? 'inp-err' : ''}`}
                    placeholder="0"
                    {...register('familyFemaleCount', { required: 'عدد الإناث مطلوب' })} />
                  {errors.familyFemaleCount && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.familyFemaleCount.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="familyProblems">أهم المشاكل التي تواجهها الأسرة <span className="text-red-600 mr-0.5">*</span></label>
                  <textarea id="familyProblems" rows={3}
                    className={`inp ta ${errors.familyProblems ? 'inp-err' : ''}`}
                    placeholder="اذكر أبرز المشاكل والتحديات…"
                    {...register('familyProblems', { required: 'هذا الحقل مطلوب' })} />
                  {errors.familyProblems && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.familyProblems.message}</p>}
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

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="talentsOther">أخرى يود تعلمها أو تطويرها <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                  <input id="talentsOther" className="inp" placeholder="مثال: العزف، الطيران…" {...register('talentsOther')} />
                </div>
              </div>
            </div>

            {/* ── Section 5: Economic ─────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٥" title="الوضع الاقتصادي" subtitle="مصادر الدخل والدعم المالي للأسرة" />
              <div className="grid">

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">مصدر الدخل الرئيسي <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['salary','راتب شهري'],['assistance','مساعدات'],['freelance','أعمال حرة'],['none','لا يوجد']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.incomeSource ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('incomeSource', { required: 'مصدر الدخل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.incomeSource && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.incomeSource.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="monthlyIncome">متوسط الدخل الشهري <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="monthlyIncome" className={`inp ltr ${errors.monthlyIncome ? 'inp-err' : ''}`}
                    placeholder="0"
                    {...register('monthlyIncome', { required: 'متوسط الدخل الشهري مطلوب' })} />
                  {errors.monthlyIncome && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.monthlyIncome.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700">هل تتلقى الأسرة دعماً من جهة خيرية؟ <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="radio-row">
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasCharitySupport ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasCharitySupport', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasCharitySupport && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.hasCharitySupport.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="charitySupportDetails">تفصيل الدعم <span className="text-slate-400 font-normal text-xs">(إن وجد)</span></label>
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

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">هل يعاني من أمراض مزمنة؟ <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="radio-row" style={{ maxWidth: '200px' }}>
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasChronicDisease ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasChronicDisease', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasChronicDisease && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.hasChronicDisease.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="chronicDiseaseDetails">تفاصيل الأمراض <span className="text-slate-400 font-normal text-xs">(إن وجدت)</span></label>
                  <input id="chronicDiseaseDetails" className="inp"
                    placeholder="اذكر الأمراض المزمنة…"
                    {...register('chronicDiseaseDetails')} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700">هل يتلقى علاجاً منتظماً؟ <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="radio-row">
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasRegularTreatment ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasRegularTreatment', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasRegularTreatment && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.hasRegularTreatment.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700">هل يتوفر تأمين صحي؟ <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="radio-row">
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.hasHealthInsurance ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('hasHealthInsurance', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hasHealthInsurance && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.hasHealthInsurance.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 7: Housing ──────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٧" title="الوضع السكني" subtitle="معلومات عن السكن والمرافق" />
              <div className="grid">

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">نوع السكن <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['owned','ملك'],['rented','إيجار'],['free','سكن مجاني']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.ownershipType ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('ownershipType', { required: 'نوع السكن مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.ownershipType && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.ownershipType.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">نوع البناء <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['popular','شعبي'],['reinforced','مسلح'],['other','آخر']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.buildingType ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('buildingType', { required: 'نوع البناء مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.buildingType && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.buildingType.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="floorsCount">عدد الطوابق <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="floorsCount" type="number" min="1"
                    className={`inp ltr ${errors.floorsCount ? 'inp-err' : ''}`} placeholder="1"
                    {...register('floorsCount', { required: 'عدد الطوابق مطلوب' })} />
                  {errors.floorsCount && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.floorsCount.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="roomsCount">عدد الغرف <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="roomsCount" type="number" min="1"
                    className={`inp ltr ${errors.roomsCount ? 'inp-err' : ''}`} placeholder="1"
                    {...register('roomsCount', { required: 'عدد الغرف مطلوب' })} />
                  {errors.roomsCount && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.roomsCount.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="water">الماء <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="water" className={`inp ${errors.water ? 'inp-err' : ''}`}
                    placeholder="مثال: شبكة عامة، خزان"
                    {...register('water', { required: 'مصدر الماء مطلوب' })} />
                  {errors.water && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.water.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="electricity">الكهرباء <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="electricity" className={`inp ${errors.electricity ? 'inp-err' : ''}`}
                    placeholder="مثال: متصل، مولد"
                    {...register('electricity', { required: 'مصدر الكهرباء مطلوب' })} />
                  {errors.electricity && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.electricity.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="rentAmount">مقدار الإيجار <span className="text-slate-400 font-normal text-xs">(إن وجد)</span></label>
                  <input id="rentAmount" className="inp ltr" placeholder="بالريال"
                    {...register('rentAmount')} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="housingDetails">تفاصيل أخرى <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                  <input id="housingDetails" className="inp" placeholder="أي تفاصيل إضافية"
                    {...register('housingDetails')} />
                </div>

              </div>
            </div>

            {/* ── Section 8: Educational ───────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٨" title="البيانات الدراسية" subtitle="معلومات عن المستوى التعليمي" />
              <div className="grid">

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="schoolGrade">الصف <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="schoolGrade" className={`inp ${errors.schoolGrade ? 'inp-err' : ''}`}
                    placeholder="مثال: السادس الابتدائي"
                    {...register('schoolGrade', { required: 'الصف مطلوب' })} />
                  {errors.schoolGrade && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.schoolGrade.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700">نوع القطاع <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="radio-row">
                    {[['government','حكومي'],['private','خاص']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.sectorType ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('sectorType', { required: 'نوع القطاع مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.sectorType && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.sectorType.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="directorate">المديرية <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="directorate" className={`inp ${errors.directorate ? 'inp-err' : ''}`}
                    placeholder="اسم المديرية"
                    {...register('directorate', { required: 'المديرية مطلوبة' })} />
                  {errors.directorate && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.directorate.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="schoolOrg">الجهة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="schoolOrg" className={`inp ${errors.schoolOrg ? 'inp-err' : ''}`}
                    placeholder="اسم المدرسة أو الجهة"
                    {...register('schoolOrg', { required: 'الجهة مطلوبة' })} />
                  {errors.schoolOrg && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.schoolOrg.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="favoriteSubject">المادة المفضلة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="favoriteSubject" className={`inp ${errors.favoriteSubject ? 'inp-err' : ''}`}
                    placeholder="مثال: الرياضيات"
                    {...register('favoriteSubject', { required: 'المادة المفضلة مطلوبة' })} />
                  {errors.favoriteSubject && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.favoriteSubject.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="difficultySubject">يواجه صعوبة في <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="difficultySubject" className={`inp ${errors.difficultySubject ? 'inp-err' : ''}`}
                    placeholder="مثال: اللغة الإنجليزية"
                    {...register('difficultySubject', { required: 'هذا الحقل مطلوب' })} />
                  {errors.difficultySubject && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.difficultySubject.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="generalLevel">المستوى العام <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="generalLevel" className={`inp ${errors.generalLevel ? 'inp-err' : ''}`}
                    placeholder="مثال: جيد، متوسط، ضعيف"
                    {...register('generalLevel', { required: 'المستوى العام مطلوب' })} />
                  {errors.generalLevel && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.generalLevel.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="generalGrade">التقدير العام <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="generalGrade" className={`inp ${errors.generalGrade ? 'inp-err' : ''}`}
                    placeholder="مثال: جيد جداً"
                    {...register('generalGrade', { required: 'التقدير العام مطلوب' })} />
                  {errors.generalGrade && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.generalGrade.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="lastResultAvg">معدل آخر نتيجة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="lastResultAvg" className={`inp ltr ${errors.lastResultAvg ? 'inp-err' : ''}`}
                    placeholder="مثال: 85%"
                    {...register('lastResultAvg', { required: 'معدل آخر نتيجة مطلوب' })} />
                  {errors.lastResultAvg && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.lastResultAvg.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="gradeDetail">التفصيل <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="gradeDetail" className={`inp ${errors.gradeDetail ? 'inp-err' : ''}`}
                    placeholder="تفاصيل النتيجة"
                    {...register('gradeDetail', { required: 'التفصيل مطلوب' })} />
                  {errors.gradeDetail && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.gradeDetail.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="highestGrade">أعلى درجة في مادة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="highestGrade" className={`inp ${errors.highestGrade ? 'inp-err' : ''}`}
                    placeholder="المادة والدرجة"
                    {...register('highestGrade', { required: 'هذا الحقل مطلوب' })} />
                  {errors.highestGrade && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.highestGrade.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="lowestGrade">أدنى درجة في مادة <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="lowestGrade" className={`inp ${errors.lowestGrade ? 'inp-err' : ''}`}
                    placeholder="المادة والدرجة"
                    {...register('lowestGrade', { required: 'هذا الحقل مطلوب' })} />
                  {errors.lowestGrade && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.lowestGrade.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">هل أعاد سنة مسبقة؟ <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="radio-row" style={{ maxWidth: '200px' }}>
                    {[['yes','نعم'],['no','لا']].map(([val,lbl]) => (
                      <label key={val} className={`radio-card ${errors.repeatedYear ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('repeatedYear', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.repeatedYear && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.repeatedYear.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="repeatedYearReason">سبب الإعادة <span className="text-slate-400 font-normal text-xs">(إن وجد)</span></label>
                  <input id="repeatedYearReason" className="inp" placeholder="سبب الإعادة"
                    {...register('repeatedYearReason')} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="eduResponsible">المسؤول تعليمياً <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="eduResponsible" className={`inp ${errors.eduResponsible ? 'inp-err' : ''}`}
                    placeholder="الاسم"
                    {...register('eduResponsible', { required: 'المسؤول التعليمي مطلوب' })} />
                  {errors.eduResponsible && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.eduResponsible.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="eduResponsiblePhone">رقم هاتفه <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="eduResponsiblePhone" className={`inp ltr ${errors.eduResponsiblePhone ? 'inp-err' : ''}`}
                    placeholder="07XXXXXXXX"
                    {...register('eduResponsiblePhone', { required: 'رقم الهاتف مطلوب' })} />
                  {errors.eduResponsiblePhone && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.eduResponsiblePhone.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700" htmlFor="eduLevel">المستوى التعليمي للمسؤول <span className="text-red-600 mr-0.5">*</span></label>
                  <input id="eduLevel" className={`inp ${errors.eduLevel ? 'inp-err' : ''}`}
                    placeholder="مثال: ثانوية، جامعي"
                    {...register('eduLevel', { required: 'المستوى التعليمي مطلوب' })} />
                  {errors.eduLevel && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.eduLevel.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 9: Social ───────────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="٩" title="الجانب الاجتماعي" subtitle="العلاقات الاجتماعية والسلوك" />
              <div className="grid">

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">العلاقات داخل الأسرة <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['connected','مترابطة'],['tense','متوترة بعض الشيء'],['fragmented','مفككة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.familyRelations ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('familyRelations', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.familyRelations && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.familyRelations.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">العلاقة مع المجتمع <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['active','يشارك في أنشطة'],['shy','خجول ومنعزل'],['needs_push','يحتاج تشجيعاً على الاندماج']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.communityRelation ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('communityRelation', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.communityRelation && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.communityRelation.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">العلاقة بالمدرسة والمعلمين <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['positive','إيجابية'],['average','متوسطة'],['weak','ضعيفة أو فيها مشكلات']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.schoolRelation ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('schoolRelation', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.schoolRelation && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.schoolRelation.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">سلوكيات اجتماعية ملحوظة <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['cooperative','متعاون'],['introverted','انطوائي'],['aggressive','عدواني'],['leader','قيادي']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.socialBehavior ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('socialBehavior', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.socialBehavior && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.socialBehavior.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">يحتاج إلى دعم اجتماعي إضافي؟ <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['yes','نعم'],['no','لا'],['pending','قيد المتابعة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.needsSocialSupport ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('needsSocialSupport', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.needsSocialSupport && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.needsSocialSupport.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 10: Religious ───────────────────────────────────── */}
            <div className="card">
              <SectionHeader number="١٠" title="الجانب الروحي الديني" subtitle="مستوى الالتزام الديني والأخلاقي" />
              <div className="grid">

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">حفظ القرآن الكريم <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['none','لا يحفظ'],['few_suras','يحفظ سور قليلة'],['few_parts','يحفظ أجزاء قليلة'],['half','يحفظ نصف القرآن'],['full','يحفظ كامل']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.quranLevel ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('quranLevel', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.quranLevel && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.quranLevel.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">الالتزام بالصلاة <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['always','دائم الالتزام'],['sometimes','أحياناً'],['rarely','نادراً']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.prayerCommitment ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('prayerCommitment', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.prayerCommitment && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.prayerCommitment.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">السلوك والأخلاق <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['good','مهذب ومتعاون'],['needs_follow','يحتاج متابعة بسيطة'],['needs_guide','لديه سلوكيات تحتاج توجيه']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.moralBehavior ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('moralBehavior', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.moralBehavior && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.moralBehavior.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 11: Psychological ───────────────────────────────── */}
            <div className="card">
              <SectionHeader number="١١" title="الجانب النفسي" subtitle="الحالة النفسية والعاطفية لليتيم" />
              <div className="grid">

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">المظهر العام والتفاعل <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['smiling','مبتسم ومتفاعل'],['shy','خجول'],['introverted','منطوٍ'],['aggressive','عدواني بعض الشيء']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.generalAppearance ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('generalAppearance', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.generalAppearance && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.generalAppearance.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">التعبير عن الذات <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {[['confident','يتحدث بثقة'],['hesitant','يتردد في الكلام'],['silent','صامت أغلب الوقت']].map(([val,lbl]) => (
                      <label key={val} className={`flex items-center gap-2 px-4 py-2 border-[1.5px] rounded-xl cursor-pointer transition-all ${errors.selfExpression ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <input type="radio" value={val} {...register('selfExpression', { required: 'هذا الحقل مطلوب' })} />
                        <span className="text-sm font-medium text-gray-700">{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.selfExpression && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.selfExpression.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">العلاقات الأسرية <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {[['stable','جيدة ومستقرة'],['tense','متوترة قليلاً'],['troubled','مضطربة وتحتاج تدخل']].map(([val,lbl]) => (
                      <label key={val} className={`flex items-center gap-2 px-4 py-2 border-[1.5px] rounded-xl cursor-pointer transition-all ${errors.psychFamilyRelations ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <input type="radio" value={val} {...register('psychFamilyRelations', { required: 'هذا الحقل مطلوب' })} />
                        <span className="text-sm font-medium text-gray-700">{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.psychFamilyRelations && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.psychFamilyRelations.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">العلاقة مع الزملاء والأصدقاء <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['positive','إيجابية'],['limited','محدودة'],['none','لا يملك أصدقاء']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.peerRelations ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('peerRelations', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.peerRelations && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.peerRelations.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">النوم والشهية <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['normal','طبيعية'],['poor_sleep','قلة نوم'],['poor_appetite','فقدان شهية'],['anxiety','قلق أو أحلام مزعجة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.sleepAppetite ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('sleepAppetite', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.sleepAppetite && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.sleepAppetite.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">علامات نفسية ظاهرة <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['none','لا يوجد'],['sadness','حزن / بكاء متكرر'],['fear','خوف / قلق'],['aggression','عدوانية / غضب']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.psychSigns ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('psychSigns', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.psychSigns && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.psychSigns.message}</p>}
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[13px] font-semibold text-gray-700">يحتاج إلى متابعة نفسية متخصصة؟ <span className="text-red-600 mr-0.5">*</span></label>
                  <div className="rel-row">
                    {[['yes','نعم'],['no','لا'],['pending','قيد الملاحظة']].map(([val,lbl]) => (
                      <label key={val} className={`rel-chip ${errors.needsPsychSupport ? 'rc-err' : ''}`}>
                        <input type="radio" value={val} {...register('needsPsychSupport', { required: 'هذا الحقل مطلوب' })} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {errors.needsPsychSupport && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.needsPsychSupport.message}</p>}
                </div>

              </div>
            </div>

            {/* ── Section 12: Recommendations ─────────────────────────────── */}
            <div className="card">
              <SectionHeader number="١٢" title="التوصيات" subtitle="ملاحظات وتوصيات الأخصائية" />
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-gray-700" htmlFor="recommendations">
                  التوصيات <span className="text-red-600 mr-0.5">*</span>
                </label>
                <textarea
                  id="recommendations"
                  className={`inp ta ${errors.recommendations ? 'inp-err' : ''}`}
                  rows={5}
                  placeholder="اكتب توصياتك وملاحظاتك هنا…"
                  {...register('recommendations', { required: 'التوصيات مطلوبة' })}
                />
                {errors.recommendations && <p className="text-xs text-red-600 m-0 before:content-['•'] before:ml-1">{errors.recommendations.message}</p>}
              </div>
            </div>

            {/* Submit row */}
            <div className="flex justify-end items-center gap-4 p-4 px-5 bg-white border border-[#e5eaf0] rounded-2xl">
              <button type="button" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-[#1B5E8C] font-cairo font-semibold text-sm border-[1.5px] border-[#dde5f0] rounded-xl cursor-pointer transition-all duration-150 hover:bg-[#f0f7ff] hover:border-[#1B5E8C]" onClick={() => router.back()}>
                إلغاء
              </button>
              <PrimaryButton
                type="submit"
                disabled={submitState === 'loading'}
              >
                {submitState === 'loading'
                  ? <><Spinner size="sm" />جارٍ الحفظ…</>
                  : isGM ? 'حفظ التعديلات ←' : 'حفظ وإعادة إرسال ←'}
              </PrimaryButton>
            </div>

          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(.93); } to { opacity:1; transform:none; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
      `}</style>
    </AppShell>
  );
}
