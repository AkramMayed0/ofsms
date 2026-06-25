'use client';

/**
 * Route: /sponsor/dashboard
 * APIs:
 *   GET /api/sponsor/me       → sponsor info
 *   GET /api/sponsor/orphans  → list of sponsored orphans
 *   GET /api/ads/sponsor/feed → sponsor announcements feed
 */

import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Users, Bell, LogOut, ArrowLeft, Heart, HandHeart, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import sponsorApi from '@/lib/sponsorApi';
import useSponsorStore from '@/store/useSponsorStore';

const API_ENDPOINTS = {
  ORPHANS:       '/sponsor/orphans',
  SPONSOR_FEED:  '/ads/sponsor/feed',
};

const STATUS_CONFIG = {
  under_review:      { label: 'قيد المراجعة', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
  under_marketing:   { label: 'تحت التسويق',  color: 'text-blue-700',  bg: 'bg-blue-100',  border: 'border-blue-200' },
  under_sponsorship: { label: 'تحت الكفالة',  color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  rejected:          { label: 'مرفوض',        color: 'text-rose-700',    bg: 'bg-rose-100',    border: 'border-rose-200' },
  inactive:          { label: 'غير نشط',      color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
};

const mapAdToAnnouncement = (ad) => ({
  id: ad.id,
  title: ad.beneficiary_type === 'family' ? `طلب كفالة أسرة: ${ad.beneficiary_name}` : `طلب كفالة: ${ad.beneficiary_name}`,
  body: ad.beneficiary_type === 'family' ? `من سيكفل هذه الأسرة؟ المحافظة: ${ad.governorate_ar || '—'}` : `من سيكفل هذا الطفل؟ المحافظة: ${ad.governorate_ar || '—'}`,
  published_at: ad.published_at,
});

export default function SponsorDashboard() {
  const router = useRouter();
  const { sponsor, clearSponsorAuth, isAuthenticated } = useSponsorStore();

  const [orphans,       setOrphans]       = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/sponsor/login');
      return;
    }
    Promise.all([
      sponsorApi.get(API_ENDPOINTS.ORPHANS),
      sponsorApi.get(API_ENDPOINTS.SPONSOR_FEED).catch(() => ({ data: { ads: [] } })),
    ])
      .then(([orphansRes, feedRes]) => {
        setOrphans(orphansRes.data.orphans || []);
        setAnnouncements((feedRes.data.ads || []).map(mapAdToAnnouncement));
      })
      .catch(() => setError('تعذّر تحميل البيانات. يرجى المحاولة لاحقاً.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearSponsorAuth();
    router.push('/sponsor/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-emerald-200 selection:text-emerald-900" dir="rtl">
      
      {/* ── Premium Glass Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="text-white" size={22} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">بوابة الكافل</h1>
              <span className="text-xs font-semibold text-slate-500">إكرام النعمة الخيرية</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-500">مرحباً بك</span>
              <span className="text-sm font-bold text-slate-800">{sponsor?.name || 'الكافل الكريم'}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors group px-2 py-1"
            >
              <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:block">تسجيل خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12 flex flex-col gap-8">
        
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={20} /> <span className="font-semibold text-sm">{error}</span>
          </div>
        )}

        {/* ── Hero Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl">
          {/* Mesmerizing Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B2F44] to-[#0A4A3E] z-0" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[100px] rounded-full mix-blend-overlay -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 blur-[100px] rounded-full mix-blend-overlay translate-y-1/3 -translate-x-1/3" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-emerald-300 text-xs font-bold mb-6">
                <HandHeart size={14} /> عطاؤكم يصنع الفارق
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                أهلاً بك في بوابة العطاء،<br/> <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 to-teal-100">{sponsor?.name || 'الكافل الكريم'}</span>
              </h2>
              <p className="text-slate-300 font-medium max-w-lg leading-relaxed text-sm md:text-base">
                من هنا يمكنك متابعة حالة الأيتام المشمولين برعايتك، الاطلاع على تقاريرهم الدورية، ومعرفة أثر كفالتك المباشر في حياتهم.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-w-[200px] shrink-0 text-white shadow-xl">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">إجمالي الأيتام</span>
              <span className="text-5xl font-black tabular-nums bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                {loading ? '—' : orphans.length}
              </span>
              <span className="text-sm font-semibold text-emerald-400 mt-2">في كفالتك حالياً</span>
            </div>
          </div>
        </div>

        {/* ── Dashboard Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Orphans List Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Users className="text-emerald-600" size={24} /> الأيتام المكفولون
              </h3>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <PremiumSkeletonCard key={i} />)}
              </div>
            ) : orphans.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-slate-200/60 border-dashed shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Search size={28} />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">لا يوجد أيتام حالياً</h4>
                <p className="text-sm text-slate-500 max-w-sm">لم يتم ربط أي أيتام بحسابك حتى الآن. سيتم التحديث فور اعتماد الكفالات الجديدة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orphans.map((orphan) => (
                  <PremiumOrphanCard key={orphan.id} orphan={orphan} />
                ))}
              </div>
            )}
          </div>

          {/* Announcements Column */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Bell className="text-amber-500" size={22} fill="currentColor" fillOpacity={0.2} /> إعلانات المؤسسة
              </h3>
            </div>

            {loading ? (
              <div className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center border border-slate-200/60 shadow-sm">
                <span className="text-4xl mb-3 opacity-50">📭</span>
                <p className="text-sm font-semibold text-slate-500">لا توجد إعلانات نشطة حالياً</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="group bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-2xl" />
                    <div className="pr-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[0.65rem] font-bold tracking-wider text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">إعلان جديد</span>
                        <span className="text-[0.7rem] font-semibold text-slate-400">
                          {new Date(ann.published_at).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1.5 leading-tight">{ann.title}</h4>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">{ann.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Premium Orphan Card ──
function PremiumOrphanCard({ orphan }) {
  const cfg = STATUS_CONFIG[orphan.status] || STATUS_CONFIG.inactive;
  const age = orphan.date_of_birth
    ? Math.floor((Date.now() - new Date(orphan.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const initial = orphan.full_name?.charAt(0) || '؟';

  return (
    <Link href={`/sponsor/orphans/${orphan.id}`} className="block outline-none group">
      <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full">
        
        {/* Subtle background glow on hover */}
        <div className="absolute -inset-24 bg-gradient-to-tr from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white rounded-full flex items-center justify-center text-lg font-black text-slate-600 shadow-sm z-10 relative">
                {orphan.gender === 'female' ? '👧' : initial}
              </div>
              {orphan.is_gifted && (
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-900 rounded-full p-0.5 shadow-md border-2 border-white z-20" title="يتيم موهوب">
                  <Heart size={10} fill="currentColor" />
                </div>
              )}
            </div>
            <div>
              <h4 className="text-[0.95rem] font-bold text-slate-800 line-clamp-1">{orphan.full_name}</h4>
              <div className="flex items-center gap-1.5 text-[0.75rem] font-medium text-slate-500 mt-0.5">
                {age !== null && <span>العمر: {age}</span>}
                {age !== null && <span className="w-1 h-1 rounded-full bg-slate-300" />}
                <span>{orphan.governorate_ar}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {cfg.label}
          </span>
          <div className="flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
            <span className="text-[0.8rem] font-bold text-slate-700 group-hover:text-emerald-600">
              {parseFloat(orphan.monthly_amount || 0).toLocaleString('ar-YE')} ر.ي
            </span>
            <ArrowLeft size={16} className="text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Premium Skeleton ──
function PremiumSkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 bg-slate-200 rounded-full w-1/3 animate-pulse" />
        <div className="h-2.5 bg-slate-100 rounded-full w-1/4 animate-pulse" />
      </div>
      <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
    </div>
  );
}
