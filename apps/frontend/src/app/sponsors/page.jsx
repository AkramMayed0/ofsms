'use client';

/**
 * page.jsx
 * Route:  /sponsors  (GM only)
 * Task:   feature/ui-sponsor-management
 *
 * List all sponsors with orphan/family counts and monthly totals.
 * Click row → navigates to full sponsor detail page.
 * Create sponsor button → modal form.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { 
  Search, 
  Plus, 
  X, 
  User, 
  AlertTriangle, 
  Handshake 
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
const MIN_NAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

// ── CreateSponsorModal ─────────────────────────────────────────────────────────
function CreateSponsorModal({ onClose, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { fullName: '', phone: '', email: '', portalPassword: '' },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    setApiErr('');
    try {
      await api.post('/sponsors', data);
      onCreated();
      onClose();
    } catch (err) {
      setApiErr(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ. يرجى المحاولة مجدداً'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 animate-fadeIn" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-[460px] bg-white rounded-2xl z-10 shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-slideUp font-sans" dir="rtl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f8]">
          <h2 className="text-[1.05rem] font-extrabold text-[#0d3d5c] m-0">إضافة كافل جديد</h2>
          <button className="bg-none border-none flex items-center justify-center text-gray-400 cursor-pointer p-1.5 rounded-md transition-all duration-150 hover:bg-gray-100 hover:text-red-500" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 p-6">
          {apiErr && (
            <div className="bg-red-50 border border-red-200 rounded-[0.625rem] px-3.5 py-2.5 text-[0.82rem] text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle size={16} /> 
              <span>{apiErr}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-gray-700">الاسم الكامل <span className="text-red-600">*</span></label>
            <input className={`border-[1.5px] border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 w-full box-border focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] ${errors.fullName ? '!border-red-600' : ''}`}
              placeholder="اسم الكافل كاملاً"
              {...register('fullName', { 
                required: 'الاسم مطلوب', 
                minLength: { value: MIN_NAME_LENGTH, message: `الاسم يجب أن يكون ${MIN_NAME_LENGTH} أحرف على الأقل` },
                pattern: { value: /^[\p{L}\s'-]+$/u, message: 'الاسم يجب أن يحتوي على أحرف فقط' }
              })}
            />
            {errors.fullName && <p className="text-[0.77rem] text-red-600 m-0">{errors.fullName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-gray-700">رقم الهاتف <span className="text-slate-400 font-normal text-[0.75rem]">(اختياري)</span></label>
            <input className="border-[1.5px] border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 w-full box-border focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left" placeholder="+967 7XX XXX XXX" {...register('phone')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-gray-700">البريد الإلكتروني <span className="text-slate-400 font-normal text-[0.75rem]">(اختياري)</span></label>
            <input className="border-[1.5px] border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 w-full box-border focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left" type="email" placeholder="sponsor@example.com"
              {...register('email', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد إلكتروني غير صحيح' }
              })}
            />
            {errors.email && <p className="text-[0.77rem] text-red-600 m-0">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-gray-700">كلمة مرور البوابة <span className="text-red-600">*</span></label>
            <input className={`border-[1.5px] border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 w-full box-border focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left ${errors.portalPassword ? '!border-red-600' : ''}`}
              type="password" placeholder="8 أحرف على الأقل"
              {...register('portalPassword', {
                required: 'كلمة المرور مطلوبة',
                minLength: { value: MIN_PASSWORD_LENGTH, message: `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` }
              })}
            />
            {errors.portalPassword && <p className="text-[0.77rem] text-red-600 m-0">{errors.portalPassword.message}</p>}
            <p className="text-[0.72rem] text-slate-400 m-0">سيستخدمها الكافل للدخول إلى بوابته الخاصة</p>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-[#f0f4f8] mt-2">
            <button type="button" className="inline-flex items-center px-5 py-2.5 bg-transparent text-primary font-sans text-[0.88rem] font-semibold border-[1.5px] border-[#dde5f0] rounded-xl cursor-pointer transition-all duration-150 hover:bg-[#f0f7ff]" onClick={onClose}>إلغاء</button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" />جارٍ الحفظ…</> : 'إضافة الكافل'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SponsorManagementPage() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchSponsors = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/sponsors');
      setSponsors(data.sponsors || []);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'تعذّر تحميل البيانات. يرجى تحديث الصفحة.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const filtered = sponsors.filter((s) =>
    !search ||
    s.full_name?.includes(search) ||
    s.email?.includes(search) ||
    s.phone?.includes(search)
  );

  const totalActive = sponsors.reduce((sum, s) => sum + parseInt(s.active_sponsorships || 0), 0);

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto pb-16 font-sans flex flex-col gap-5" dir="rtl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] mb-1">إدارة الكفلاء</h1>
            <p className="text-[0.85rem] text-[#6b7a8d] m-0">
              {loading ? 'جارٍ التحميل…' : `${sponsors.length} كافل · ${totalActive} كفالة نشطة`}
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} />
            <span>إضافة كافل جديد</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute right-3.5 pointer-events-none" size={18} color="#9ca3af" />
          <input
            className="w-full border-[1.5px] border-gray-300 rounded-xl py-2.5 pl-10 pr-10 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 box-border focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)]"
            placeholder="ابحث بالاسم أو البريد أو رقم الهاتف…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute left-2 bg-transparent border-none cursor-pointer text-gray-400 flex items-center justify-center p-1 rounded-full transition-all duration-150 hover:bg-slate-100 hover:text-red-500" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[0.625rem] px-3.5 py-2.5 text-[0.82rem] text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white border border-[#e5eaf0] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(27,94,140,0.05)]">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-slate-50">
                <div className="bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:400%_100%] animate-shimmer rounded-full shrink-0" style={{ width: 40, height: 40 }} />
                <div style={{ flex: 1 }}>
                  <div className="bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:400%_100%] animate-shimmer rounded mb-1.5" style={{ width: '40%', height: 14 }} />
                  <div className="bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:400%_100%] animate-shimmer rounded" style={{ width: '25%', height: 12 }} />
                </div>
                <div className="bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:400%_100%] animate-shimmer rounded-full" style={{ width: 60, height: 24 }} />
                <div className="bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:400%_100%] animate-shimmer rounded" style={{ width: 100, height: 14 }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[320px] gap-3 text-center bg-white border border-[#e5eaf0] rounded-2xl p-8">
            <Handshake size={64} className="mb-2 text-[#cbd5e1]" />
            <h3 className="text-[1.05rem] font-bold text-gray-700 m-0">
              {search ? 'لا توجد نتائج مطابقة' : 'لا يوجد كفلاء مسجّلون بعد'}
            </h3>
            <p className="text-[0.85rem] text-gray-400 m-0">
              {search ? 'جرّب تغيير معايير البحث' : 'ابدأ بإضافة كافل جديد'}
            </p>
            {!search && (
              <Button variant="primary" className="mt-2" onClick={() => setShowCreate(true)}>
                <Plus size={18} /> إضافة كافل جديد
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white border border-[#e5eaf0] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(27,94,140,0.05)]">
            <div className="overflow-x-auto [webkit-overflow-scrolling:touch]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-5 py-3.5 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">اسم الكافل</th>
                    <th className="px-5 py-3.5 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">رقم الهاتف</th>
                    <th className="px-5 py-3.5 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap hidden sm:table-cell">البريد الإلكتروني</th>
                    <th className="px-5 py-3.5 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">الكفالات النشطة</th>
                    <th className="px-5 py-3.5 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap hidden sm:table-cell">أنشأه</th>
                    <th className="px-5 py-3.5 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap hidden sm:table-cell">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="cursor-pointer transition-colors duration-120 hover:bg-[#f8fbff]"
                      onClick={() => router.push(`/sponsors/${s.id}`)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && router.push(`/sponsors/${s.id}`)}
                    >
                      <td className="px-5 py-3 text-[0.83rem] border-b border-slate-50 align-middle last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#0d3d5c] text-white flex items-center justify-center text-[0.9rem] font-bold shrink-0">
                            {s.full_name ? s.full_name.charAt(0) : <User size={16} />}
                          </div>
                          <span className="font-bold text-gray-800">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[0.83rem] border-b border-slate-50 align-middle text-[#6b7a8d] [direction:ltr] text-left last:border-b-0">{s.phone || '—'}</td>
                      <td className="px-5 py-3 text-[0.83rem] border-b border-slate-50 align-middle text-[#6b7a8d] [direction:ltr] text-left hidden sm:table-cell last:border-b-0">{s.email || '—'}</td>
                      <td className="px-5 py-3 text-[0.83rem] border-b border-slate-50 align-middle last:border-b-0">
                        <span className="inline-flex items-center px-3 py-1 bg-[#f0f7ff] border border-blue-200 rounded-full text-[0.75rem] font-bold text-blue-700">
                          {s.active_sponsorships || 0} كفالة
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[0.83rem] border-b border-slate-50 align-middle text-[#6b7a8d] hidden sm:table-cell last:border-b-0">{s.created_by_name || '—'}</td>
                      <td className="px-5 py-3 text-[0.83rem] border-b border-slate-50 align-middle text-[#6b7a8d] hidden sm:table-cell last:border-b-0">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 text-[0.78rem] text-gray-400 border-t border-[#f0f4f8]">
              عرض {filtered.length} من {sponsors.length} كافل
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
