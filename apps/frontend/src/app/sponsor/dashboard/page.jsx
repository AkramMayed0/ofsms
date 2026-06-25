'use client';

/**
 * Route: /sponsor/dashboard
 * APIs:
 *   GET /api/sponsor/me       → sponsor info
 *   GET /api/sponsor/orphans  → list of sponsored orphans
 *   GET /api/ads/sponsor/feed → sponsor announcements feed
 */

import { useEffect, useState } from 'react';
import { Search, AlertTriangle, User, Handshake } from 'lucide-react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import sponsorApi from '@/lib/sponsorApi';
import useSponsorStore from '@/store/useSponsorStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_ENDPOINTS = {
  ORPHANS:       '/sponsor/orphans',
  SPONSOR_FEED:  '/ads/sponsor/feed',
};

const STATUS_CONFIG = {
  under_review:      { label: 'قيد المراجعة', color: '#92400E', bg: '#FEF3C7' },
  under_marketing:   { label: 'تحت التسويق',  color: '#1E40AF', bg: '#EFF6FF' },
  under_sponsorship: { label: 'تحت الكفالة',  color: '#065F46', bg: '#ECFDF5' },
  rejected:          { label: 'مرفوض',        color: '#991B1B', bg: '#FEF2F2' },
  inactive:          { label: 'غير نشط',      color: '#6B7280', bg: '#F3F4F6' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const mapAdToAnnouncement = (ad) => ({
  id: ad.id,
  title: ad.beneficiary_type === 'family'
    ? `طلب كفالة أسرة: ${ad.beneficiary_name}`
    : `طلب كفالة: ${ad.beneficiary_name}`,
  body: ad.beneficiary_type === 'family'
    ? `من سيكفل هذه الأسرة؟ المحافظة: ${ad.governorate_ar || '—'}`
    : `من سيكفل هذا الطفل؟ المحافظة: ${ad.governorate_ar || '—'}`,
  published_at: ad.published_at,
  is_active: true,
});

// ── Main page ─────────────────────────────────────────────────────────────────

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
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearSponsorAuth();
    router.push('/sponsor/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans" dir="rtl">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1100px] mx-auto py-3.5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#0d3d5c]"><Handshake size={32} /></span>
            <div>
              <span className="block text-[1rem] font-extrabold text-[#0d3d5c] leading-none">بوابة الكافل</span>
              <span className="block text-[0.7rem] text-gray-400 mt-0.5">مؤسسة إكرام النعمة الخيرية</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[0.85rem] font-semibold text-gray-700">أهلاً، {sponsor?.name || 'الكافل'}</span>
            <button
              className="bg-transparent border-[1.5px] border-gray-200 rounded-lg py-1.5 px-3.5 font-sans text-[0.78rem] font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-red-600 hover:border-red-300 transition-colors"
              onClick={handleLogout}
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto py-8 px-6 flex flex-col gap-6">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 py-3 px-4 rounded-xl text-[0.875rem]">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* Welcome card */}
        <div className="bg-gradient-to-br from-[#1a4a2e] to-[#2d7a4a] rounded-2xl py-7 px-8 flex items-center justify-between text-white">
          <div>
            <h1 className="text-[1.3rem] font-extrabold m-0 mb-1.5">مرحباً بك في بوابة الكافل</h1>
            <p className="text-[0.83rem] text-white/75 m-0">يمكنك متابعة أيتامك وتقاريرهم الشهرية من هذه الصفحة</p>
          </div>
          <div className="text-center shrink-0">
            <span className="block text-[2.5rem] font-extrabold leading-none">{loading ? '—' : orphans.length}</span>
            <span className="block text-[0.75rem] text-white/70 mt-1 text-center">يتيم تحت كفالتك</span>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-[2fr_1fr] gap-6 max-[768px]:grid-cols-1">

          {/* Orphans section */}
          <section className="bg-white border-[1.5px] border-gray-200 rounded-2xl p-5">
            <h2 className="flex items-center gap-2.5 text-[0.95rem] font-bold text-[#0d3d5c] m-0 mb-4 pb-3 border-b-[1.5px] border-gray-100">
              <span className="text-[#0d3d5c]"><User size={18} /></span>
              أيتامك المكفولون
            </h2>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : orphans.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 px-4 text-gray-400 text-[0.83rem] text-center">
                <Search size={16} />
                <p className="m-0">لا يوجد أيتام مرتبطون بكفالتك حالياً</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orphans.map((orphan) => (
                  <OrphanCard key={orphan.id} orphan={orphan} />
                ))}
              </div>
            )}
          </section>

          {/* Announcements section */}
          <section className="bg-white border-[1.5px] border-gray-200 rounded-2xl p-5">
            <h2 className="flex items-center gap-2.5 text-[0.95rem] font-bold text-[#0d3d5c] m-0 mb-4 pb-3 border-b-[1.5px] border-gray-100">
              <span>📢</span>
              إعلانات المؤسسة
            </h2>

            {loading ? (
              <div className="h-[180px] rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%]" />
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 px-4 text-gray-400 text-[0.83rem] text-center">
                <span className="text-[2rem]">📭</span>
                <p className="m-0">لا توجد إعلانات حالياً</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {announcements.map((ann) => (
                  <div key={ann.id} className="flex gap-3 items-start">
                    <span className="w-2 h-2 rounded-full bg-[#2d7a4a] shrink-0 mt-1.5" />
                    <div>
                      <p className="text-[0.85rem] font-bold text-[#0d3d5c] m-0 mb-1">{ann.title}</p>
                      <p className="text-[0.78rem] text-gray-500 m-0 mb-1 leading-relaxed">{ann.body}</p>
                      <span className="text-[0.68rem] text-gray-400">
                        {new Date(ann.published_at).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ── OrphanCard ────────────────────────────────────────────────────────────────

function OrphanCard({ orphan }) {
  const cfg = STATUS_CONFIG[orphan.status] || STATUS_CONFIG.inactive;
  const age = orphan.date_of_birth
    ? Math.floor((Date.now() - new Date(orphan.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const initial = orphan.full_name?.charAt(0) || '؟';

  return (
    <Link href={`/sponsor/orphans/${orphan.id}`} className="no-underline">
      <div className="flex items-center gap-3.5 bg-gray-50 border-[1.5px] border-gray-200 rounded-[0.875rem] py-3.5 px-4 cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-300 hover:-translate-x-0.5">
        {/* Avatar */}
        <div className="w-11 h-11 bg-white rounded-full border-[1.5px] border-gray-200 flex items-center justify-center shrink-0 text-[1.1rem] font-bold text-[#0d3d5c]">
          {orphan.gender === 'female' ? '👧' : initial}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.9rem] font-bold text-[#0d3d5c] truncate">{orphan.full_name}</span>
            {orphan.is_gifted && (
              <span className="bg-amber-100 text-amber-800 text-[0.65rem] font-bold py-0.5 px-1.5 rounded-full whitespace-nowrap">⭐ موهوب</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[0.73rem] text-gray-400">
            {age !== null && <span>العمر: {age} سنة</span>}
            <span>•</span>
            <span>{orphan.governorate_ar}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[0.68rem] font-bold py-0.5 px-2 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
              {cfg.label}
            </span>
            <span className="text-[0.75rem] font-bold text-[#2d7a4a] mr-auto">
              {parseFloat(orphan.monthly_amount || 0).toLocaleString('ar-YE')} ريال/شهر
            </span>
          </div>
        </div>

        <span className="text-gray-400 text-[0.85rem] shrink-0">←</span>
      </div>
    </Link>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  const shimmer = 'bg-gradient-to-r from-gray-100 to-gray-200 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%]';
  return (
    <div className="flex items-center gap-3.5 bg-gray-50 border-[1.5px] border-gray-200 rounded-[0.875rem] py-3.5 px-4">
      <div className={`w-11 h-11 rounded-full shrink-0 ${shimmer}`} />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className={`h-3.5 w-2/5 rounded ${shimmer}`} />
        <div className={`h-2.5 w-3/5 rounded ${shimmer}`} />
        <div className={`h-2.5 w-[30%] rounded ${shimmer}`} />
      </div>
    </div>
  );
}
