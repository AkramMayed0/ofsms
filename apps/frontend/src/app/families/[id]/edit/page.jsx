'use client';

import { useState, useEffect, Fragment } from 'react';
import { AlertTriangle, User, Users, CheckCircle2 } from 'lucide-react';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

function SectionHeader({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-4 mb-6 pb-4 border-b-[1.5px] border-[#f0f4f8]">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#0d3d5c] text-white flex items-center justify-center text-[1.1rem] font-bold shrink-0 font-sans">{number}</div>
      <div>
        <h2 className="text-[1.05rem] font-bold text-[#0d3d5c] m-0 mb-0.5">{title}</h2>
        {subtitle && <p className="text-[0.78rem] text-slate-400 m-0">{subtitle}</p>}
      </div>
    </div>
  );
}

function CounterInput({ value, onChange, min = 1, max = 30, error }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={`inline-flex items-center gap-3 bg-slate-50 border-[1.5px] ${error ? 'border-red-600' : 'border-[#e5eaf0]'} rounded-xl py-2 px-4`}>
      <button type="button" className="w-8 h-8 rounded-full border-[1.5px] border-gray-300 bg-white text-[1.1rem] font-bold text-gray-700 cursor-pointer flex items-center justify-center transition-all leading-none hover:not(:disabled):border-[#1B5E8C] hover:not(:disabled):text-[#1B5E8C] hover:not(:disabled):bg-blue-50 disabled:opacity-35 disabled:cursor-not-allowed" onClick={dec} disabled={value <= min}>−</button>
      <span className="min-w-[2.5rem] text-center text-[1.75rem] font-extrabold text-[#0d3d5c] font-sans">{value}</span>
      <button type="button" className="w-8 h-8 rounded-full border-[1.5px] border-gray-300 bg-white text-[1.1rem] font-bold text-gray-700 cursor-pointer flex items-center justify-center transition-all leading-none hover:not(:disabled):border-[#1B5E8C] hover:not(:disabled):text-[#1B5E8C] hover:not(:disabled):bg-blue-50 disabled:opacity-35 disabled:cursor-not-allowed" onClick={inc} disabled={value >= max}>+</button>
      <span className="text-[0.82rem] text-slate-500 font-semibold">فرد</span>
    </div>
  );
}

export default function FamilyEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const [governorates, setGovernorates] = useState([]);
  const [govLoading,   setGovLoading]   = useState(true);
  const [memberCount,  setMemberCount]  = useState(3);
  
  const [loading,      setLoading]      = useState(true);
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/families/${id}`)
      .then(({ data }) => {
        const f = data.family || data;
        setMemberCount(f.member_count || 3);
        reset({
          familyName: f.family_name || '',
          headOfFamily: f.head_of_family || '',
          governorateId: f.governorate_id || '',
          notes: f.notes || '',
        });
      })
      .catch((err) => setApiError('تعذّر تحميل بيانات الأسرة'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    setSubmitState('loading');
    setApiError('');

    try {
      await api.patch(`/families/${id}`, {
        familyName:   data.familyName.trim(),
        headOfFamily: data.headOfFamily.trim(),
        memberCount,
        governorateId: parseInt(data.governorateId, 10),
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

  if (submitState === 'success') {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-[420px] bg-white rounded-3xl py-12 px-8 border border-[#e5eaf0] shadow-sm">
            <div className="text-[3rem] mb-4 text-emerald-500 flex justify-center"><CheckCircle2 size={48} strokeWidth={1.5} /></div>
            <h2 className="text-[1.4rem] font-extrabold text-[#0d3d5c] m-0 mb-3">تمت إعادة الإرسال بنجاح</h2>
            <p className="text-[0.88rem] text-[#6b7a8d] leading-relaxed m-0 mb-8">
              تم تحديث بيانات الأسرة وإرسالها إلى قائمة انتظار المراجعة.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="primary" onClick={() => router.push('/dashboard')}>
                العودة للوحة القيادة
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[760px] mx-auto pb-16 font-sans" dir="rtl">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] m-0 mb-1">تعديل بيانات الأسرة</h1>
            <p className="text-[0.85rem] text-slate-500 m-0">قم بتعديل البيانات وإعادة الإرسال للمراجعة</p>
          </div>
          <Button variant="outline" type="button" onClick={() => router.back()}>
            ← رجوع
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">جارٍ التحميل…</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

            <div className="bg-white border border-[#e5eaf0] rounded-2xl p-7 shadow-sm">
              <SectionHeader number="١" title="بيانات الأسرة" subtitle="المعلومات الأساسية للأسرة المحتاجة" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[0.82rem] font-semibold text-gray-700" htmlFor="familyName">
                    اسم الأسرة <span className="text-red-600 mr-[2px]">*</span>
                  </label>
                  <input
                    id="familyName"
                    className={`w-full border-[1.5px] border-gray-300 rounded-[0.625rem] py-2.5 px-3.5 text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-all focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10 ${errors.familyName ? '!border-red-600 !bg-red-50 focus:!ring-red-600/10' : ''}`}
                    placeholder="مثال: أسرة محمد أحمد"
                    {...register('familyName', {
                      required: 'اسم الأسرة مطلوب',
                      minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                    })}
                  />
                  {errors.familyName && <p className="text-red-600 text-xs mt-1">{errors.familyName.message}</p>}
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[0.82rem] font-semibold text-gray-700" htmlFor="governorateId">
                    المحافظة <span className="text-red-600 mr-[2px]">*</span>
                  </label>
                  <select
                    id="governorateId"
                    className={`w-full border-[1.5px] border-gray-300 rounded-[0.625rem] py-2.5 px-3.5 text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-all focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10 appearance-none cursor-pointer ${errors.governorateId ? '!border-red-600 !bg-red-50 focus:!ring-red-600/10' : ''}`}
                    disabled={govLoading}
                    {...register('governorateId', { required: 'المحافظة مطلوبة' })}
                  >
                    <option value="">{govLoading ? 'جارٍ التحميل…' : 'اختر المحافظة'}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>{g.name_ar}</option>
                    ))}
                  </select>
                  {errors.governorateId && <p className="text-red-600 text-xs mt-1">{errors.governorateId.message}</p>}
                </div>

              </div>
            </div>

            <div className="bg-white border border-[#e5eaf0] rounded-2xl p-7 shadow-sm">
              <SectionHeader number="٢" title="المعيل" subtitle="بيانات رب الأسرة أو المسؤول عنها" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[0.82rem] font-semibold text-gray-700" htmlFor="headOfFamily">
                    اسم المعيل <span className="text-red-600 mr-[2px]">*</span>
                  </label>
                  <input
                    id="headOfFamily"
                    className={`w-full border-[1.5px] border-gray-300 rounded-[0.625rem] py-2.5 px-3.5 text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-all focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10 ${errors.headOfFamily ? '!border-red-600 !bg-red-50 focus:!ring-red-600/10' : ''}`}
                    placeholder="الاسم الكامل لرب الأسرة أو المسؤول"
                    {...register('headOfFamily', {
                      required: 'اسم المعيل مطلوب',
                      minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                    })}
                  />
                  {errors.headOfFamily && <p className="text-red-600 text-xs mt-1">{errors.headOfFamily.message}</p>}
                </div>

              </div>
            </div>

            <div className="bg-white border border-[#e5eaf0] rounded-2xl p-7 shadow-sm">
              <SectionHeader number="٣" title="التفاصيل" subtitle="عدد الأفراد وملاحظات إضافية" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[0.82rem] font-semibold text-gray-700">
                    عدد أفراد الأسرة <span className="text-red-600 mr-[2px]">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6 flex-wrap">
                    <CounterInput
                      value={memberCount}
                      onChange={setMemberCount}
                      min={1}
                      max={30}
                    />
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2 text-[0.8rem] text-slate-500">
                        <span className="text-[1rem]"><Users size={18} />‍<User size={18} /></span>
                        <span>يشمل جميع أفراد الأسرة المعيشية بما فيهم المعيل</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { max: 3,  label: 'أسرة صغيرة',  color: '#10b981' },
                          { max: 6,  label: 'أسرة متوسطة', color: '#f59e0b' },
                          { max: 30, label: 'أسرة كبيرة',   color: '#ef4444' },
                        ].map(({ max, label, color }) => (
                          <span
                            key={max}
                            className="text-[0.72rem] py-1 px-2.5 rounded-full font-medium"
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

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[0.82rem] font-semibold text-gray-700" htmlFor="notes">
                    ملاحظات إضافية <span className="text-slate-400 font-normal text-[0.75rem]">(اختياري)</span>
                  </label>
                  <textarea
                    id="notes"
                    className="w-full border-[1.5px] border-gray-300 rounded-[0.625rem] py-2.5 px-3.5 text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-all focus:border-[#1B5E8C] focus:bg-white focus:ring-[3px] focus:ring-[#1B5E8C]/10 resize-y min-h-[100px]"
                    rows={4}
                    placeholder="أي معلومات إضافية عن الأسرة — وضعها الاجتماعي، ظروفها الخاصة، احتياجاتها…"
                    {...register('notes')}
                  />
                </div>

              </div>
            </div>

            {submitState === 'error' && apiError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl py-4 px-5 text-red-600 text-[0.83rem]" role="alert">
                <span className="text-[1.2rem] shrink-0"><AlertTriangle size={18} /></span>
                <div>
                  <strong className="block text-[0.9rem] text-red-700 mb-1">فشل الإرسال</strong>
                  <p className="m-0 text-red-600">{apiError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end items-center gap-4 py-4 px-5 bg-white border border-[#e5eaf0] rounded-2xl">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={submitState === 'loading'}
              >
                {submitState === 'loading'
                  ? <><Spinner size="sm" />جارٍ الحفظ…</>
                  : 'حفظ وإعادة إرسال ←'}
              </Button>
            </div>

          </form>
        )}
      </div>
    </AppShell>
  );
}
