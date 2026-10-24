'use client';

/**
 * page.jsx
 * Route:  /sponsors
 *
 * Elevated, friendly Sponsors Management Page.
 * Features:
 *   - Modern card grid view matching the OFSMS design system
 *   - Quick KPI statistics cards at the top
 *   - Search & filters (name, phone, email, sponsor code, sponsorship status)
 *   - All actions open dedicated pop-up modals:
 *       1. إضافة كافل جديد (Create Sponsor Modal)
 *       2. ربط مكفول (Assign/Link Beneficiary Modal)
 *       3. حساب البوابة (Portal Access & Copy Link Modal)
 *       4. تعديل بيانات الكافل (Edit Sponsor Modal)
 *       5. عرض المكفولين والتفاصيل (Sponsor Details Modal)
 *       6. تأكيد الحذف (Delete Confirmation Modal)
 *   - OFSMS blue branding palette (NO green buttons)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Handshake,
  Plus,
  Search,
  X,
  User,
  Users,
  Phone,
  Mail,
  Calendar,
  Link2,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Layers,
  HeartHandshake
} from 'lucide-react';

import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import Spinner from '@/components/ui/Spinner';

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

const formatAmount = (n) =>
  n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

const calcAge = (dob) => {
  if (!dob) return '—';
  const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} سنة`;
};

// Format sponsor display code: e.g. IKN-SP-000001
const getSponsorCode = (sponsor, index) => {
  if (sponsor.portal_token && sponsor.portal_token.startsWith('portal_demo_sponsor_token_')) {
    const num = sponsor.portal_token.replace('portal_demo_sponsor_token_', '');
    return `IKN-SP-${String(num).padStart(6, '0')}`;
  }
  if (sponsor.portal_token && sponsor.portal_token.length >= 6) {
    return `SP-${sponsor.portal_token.substring(0, 6).toUpperCase()}`;
  }
  return `IKN-SP-${String((index ?? 0) + 1).padStart(6, '0')}`;
};

// ── Main Page Component ────────────────────────────────────────────────────────
export default function SponsorManagementPage() {
  const router = useRouter();

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | idle
  const [toast, setToast] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [linkOrphanSponsor, setLinkOrphanSponsor] = useState(null);
  const [portalSponsor, setPortalSponsor] = useState(null);
  const [editSponsor, setEditSponsor] = useState(null);
  const [detailsSponsor, setDetailsSponsor] = useState(null);
  const [deleteConfirmSponsor, setDeleteConfirmSponsor] = useState(null);

  // Fetch sponsors list
  const fetchSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sponsors');
      setSponsors(data.sponsors || []);
    } catch (err) {
      showToast('تعذر تحميل بيانات الكفلاء. يرجى التحديث.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered sponsors
  const filteredSponsors = useMemo(() => {
    return sponsors.filter((s) => {
      const q = search.toLowerCase().trim();
      const code = (s.portal_token || '').toLowerCase();
      const matchSearch =
        !q ||
        s.full_name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        code.includes(q);

      if (!matchSearch) return false;

      const activeCount = parseInt(s.active_sponsorships || 0, 10);
      if (statusFilter === 'active') return activeCount > 0;
      if (statusFilter === 'idle') return activeCount === 0;

      return true;
    });
  }, [sponsors, search, statusFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = sponsors.length;
    const activeSponsorships = sponsors.reduce(
      (sum, s) => sum + parseInt(s.active_sponsorships || 0, 10),
      0
    );
    const activeSponsorsCount = sponsors.filter(
      (s) => parseInt(s.active_sponsorships || 0, 10) > 0
    ).length;
    const idleSponsorsCount = total - activeSponsorsCount;

    return {
      total,
      activeSponsorships,
      activeSponsorsCount,
      idleSponsorsCount,
    };
  }, [sponsors]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto pb-16 font-sans space-y-6" dir="rtl">

        {/* ── Toast Notification ────────────────────────────────────────── */}
        {toast && (
          <div
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[1500] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold text-white transition-all animate-in fade-in slide-in-from-top-3 ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-[#1B5E8C]'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* ── Top Header matching screenshot elevated with our touch ────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white flex items-center justify-center shadow-md shadow-[#1B5E8C]/20 shrink-0">
              <HeartHandshake size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">الكفلاء والداعمون</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1B5E8C] border border-blue-200/80">
                  {sponsors.length} كافل
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                إدارة ملفات الكفلاء، حسابات البوابة الخاصة، وربط الأيتام والأسر بالكفالات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
            >
              <ArrowRight size={15} />
              <span>الرجوع</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] hover:-translate-y-0.5 active:scale-95 transition"
            >
              <Plus size={16} />
              <span>إضافة كافل جديد</span>
            </button>
          </div>
        </div>

        {/* ── Summary KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 transition hover:shadow-md">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center shrink-0">
              <Handshake size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي الكفلاء</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 transition hover:shadow-md">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">الكفالات النشطة</p>
              <h3 className="text-xl sm:text-2xl font-black text-cyan-800 mt-0.5">{stats.activeSponsorships}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 transition hover:shadow-md">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">كفلاء لديهم مكفولون</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5">{stats.activeSponsorsCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 transition hover:shadow-md">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <User size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">كفلاء بانتظار الربط</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-800 mt-0.5">{stats.idleSponsorsCount}</h3>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Bar ───────────────────────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، الهاتف، البريد، أو رمز الكافل..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#1B5E8C] focus:bg-white focus:ring-2 focus:ring-[#1B5E8C]/20 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Status Tabs Filter */}
          <div className="flex items-center gap-1.5 self-end md:self-center">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-[#1B5E8C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({sponsors.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === 'active'
                  ? 'bg-[#1B5E8C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              نشط ومكفول ({stats.activeSponsorsCount})
            </button>
            <button
              onClick={() => setStatusFilter('idle')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === 'idle'
                  ? 'bg-[#1B5E8C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              بانتظار مكفول ({stats.idleSponsorsCount})
            </button>

            <button
              onClick={fetchSponsors}
              title="تحديث البيانات"
              className="p-2 text-slate-400 hover:text-[#1B5E8C] hover:bg-blue-50 rounded-xl transition"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Sponsors Cards Grid (Matching the User's Screenshot) ─────── */}
        {loading && sponsors.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-semibold">جارٍ تحميل قائمة الكفلاء…</p>
          </div>
        ) : filteredSponsors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center mx-auto">
              <Handshake size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا يوجد كفلاء يطابقون خيارات البحث</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              جرّب تغيير كلمات البحث أو أضف كافلاً جديداً إلى المنظومة.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B5E8C] text-white text-xs font-bold hover:bg-[#134569] transition mt-2"
            >
              <Plus size={15} />
              <span>إضافة كافل جديد</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSponsors.map((sponsor, idx) => {
              const activeCount = parseInt(sponsor.active_sponsorships || 0, 10);
              const hasOrphans = activeCount > 0;
              const sponsorCode = getSponsorCode(sponsor, idx);

              return (
                <div
                  key={sponsor.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 flex flex-col overflow-hidden group"
                >
                  {/* Top Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {/* Name & Initial Avatar */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white flex items-center justify-center text-base font-black shrink-0 shadow-sm shadow-[#1B5E8C]/20 group-hover:scale-105 transition-transform">
                          {sponsor.full_name?.charAt(0) || <User size={18} />}
                        </div>
                        <div className="min-w-0">
                          <h3
                            onClick={() => setDetailsSponsor(sponsor)}
                            className="text-base font-black text-slate-900 group-hover:text-[#1B5E8C] transition-colors truncate cursor-pointer"
                            title={sponsor.full_name}
                          >
                            {sponsor.full_name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400 font-bold block mt-0.5">
                            {sponsorCode}
                          </span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>نشط</span>
                      </span>
                    </div>

                    {/* Middle Info: Phone, Email, & Orphan Count */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {sponsor.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone size={13} className="text-[#1B5E8C] shrink-0" />
                          <span className="font-mono ltr text-right">{sponsor.phone}</span>
                        </div>
                      )}

                      {sponsor.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                          <Mail size={13} className="text-[#1B5E8C] shrink-0" />
                          <span className="truncate">{sponsor.email}</span>
                        </div>
                      )}

                      {/* Sponsored Count Highlight */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Heart size={13} className="text-rose-500" />
                          <span>عدد المكفولين:</span>
                        </span>
                        <span
                          className={`font-black text-xs px-2.5 py-0.5 rounded-full ${
                            hasOrphans
                              ? 'bg-blue-50 text-[#1B5E8C] border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {activeCount} مكفول
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons (Exact actions from user screenshot, styled in OFSMS blue, each as a POPUP) */}
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 mt-auto flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* 1. حساب البوابة (Popup) */}
                      <button
                        onClick={() => setPortalSponsor(sponsor)}
                        title="عرض رابط وبيانات حساب البوابة"
                        className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#1B5E8C] border border-slate-200 hover:border-blue-300 text-[11px] font-bold shadow-xs transition"
                      >
                        <Key size={13} className="text-[#1B5E8C]" />
                        <span>حساب البوابة</span>
                      </button>

                      {/* 2. تعديل (Popup) */}
                      <button
                        onClick={() => setEditSponsor(sponsor)}
                        title="تعديل بيانات الكافل"
                        className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#1B5E8C] border border-slate-200 hover:border-blue-300 text-[11px] font-bold shadow-xs transition"
                      >
                        <Edit3 size={13} className="text-slate-500" />
                        <span>تعديل</span>
                      </button>

                      {/* 3. ربط مكفول (Popup) */}
                      <button
                        onClick={() => setLinkOrphanSponsor(sponsor)}
                        title="ربط يتيم أو أسرة بهذا الكافل"
                        className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-white hover:bg-blue-50 text-[#1B5E8C] border border-blue-200 hover:border-[#1B5E8C] text-[11px] font-bold shadow-xs transition"
                      >
                        <Link2 size={13} className="text-[#1B5E8C]" />
                        <span>ربط مكفول</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* View Details / Orphans Button */}
                      <button
                        onClick={() => setDetailsSponsor(sponsor)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-[11px] font-bold shadow-xs transition"
                      >
                        <Eye size={13} />
                        <span>عرض التفاصيل والمكفولين</span>
                      </button>

                      {/* 4. حذف (Popup confirmation) */}
                      <button
                        onClick={() => setDeleteConfirmSponsor(sponsor)}
                        title="حذف الكافل"
                        className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: إضافة كافل جديد (Create Sponsor Modal)
      ════════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <CreateSponsorModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSponsors();
            showToast('تمت إضافة الكافل بنجاح');
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: ربط مكفول (Link Beneficiary Modal)
      ════════════════════════════════════════════════════════════════════════ */}
      {linkOrphanSponsor && (
        <LinkBeneficiaryModal
          sponsor={linkOrphanSponsor}
          onClose={() => setLinkOrphanSponsor(null)}
          onSuccess={() => {
            setLinkOrphanSponsor(null);
            fetchSponsors();
            showToast(`تم ربط المكفول بالكافل ${linkOrphanSponsor.full_name} بنجاح`);
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: حساب البوابة (Portal Access Modal with 1-click Copy)
      ════════════════════════════════════════════════════════════════════════ */}
      {portalSponsor && (
        <PortalAccountModal
          sponsor={portalSponsor}
          onClose={() => setPortalSponsor(null)}
          showToast={showToast}
          onUpdated={fetchSponsors}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: تعديل بيانات الكافل (Edit Sponsor Modal)
      ════════════════════════════════════════════════════════════════════════ */}
      {editSponsor && (
        <EditSponsorModal
          sponsor={editSponsor}
          onClose={() => setEditSponsor(null)}
          onSuccess={() => {
            setEditSponsor(null);
            fetchSponsors();
            showToast('تم تحديث بيانات الكافل بنجاح');
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 5: عرض التفاصيل والمكفولين (Sponsor Details Modal)
      ════════════════════════════════════════════════════════════════════════ */}
      {detailsSponsor && (
        <SponsorDetailsModal
          sponsor={detailsSponsor}
          onClose={() => setDetailsSponsor(null)}
          onOpenLinkOrphan={() => {
            const s = detailsSponsor;
            setDetailsSponsor(null);
            setLinkOrphanSponsor(s);
          }}
          onOpenPortal={() => {
            const s = detailsSponsor;
            setDetailsSponsor(null);
            setPortalSponsor(s);
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 6: تأكيد الحذف (Delete Confirmation Modal)
      ════════════════════════════════════════════════════════════════════════ */}
      {deleteConfirmSponsor && (
        <DeleteSponsorConfirmModal
          sponsor={deleteConfirmSponsor}
          onClose={() => setDeleteConfirmSponsor(null)}
          onSuccess={() => {
            setDeleteConfirmSponsor(null);
            fetchSponsors();
            showToast('تم حذف الكافل بنجاح');
          }}
        />
      )}
    </AppShell>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 1: Create Sponsor Modal
// ─────────────────────────────────────────────────────────────────────────────
function CreateSponsorModal({ onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('الاسم الكامل مطلوب (3 أحرف على الأقل)');
      return;
    }
    if (!portalPassword || portalPassword.length < 8) {
      setError('كلمة مرور البوابة مطلوبة (8 أحرف على الأقل)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/sponsors', {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        portalPassword,
      });
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ أثناء إضافة الكافل'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center font-bold">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">إضافة كافل جديد</h3>
              <p className="text-xs text-slate-500">تسجيل بيانات الكافل وإنشاء حسابه في البوابة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الاسم الكامل <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: فاعل خير / أحمد عبد الله محمد"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1B5E8C] focus:bg-white focus:ring-2 focus:ring-[#1B5E8C]/20 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+967 7XX XXX XXX"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium ltr text-right focus:outline-none focus:border-[#1B5E8C] focus:bg-white focus:ring-2 focus:ring-[#1B5E8C]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sponsor@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium ltr text-right focus:outline-none focus:border-[#1B5E8C] focus:bg-white focus:ring-2 focus:ring-[#1B5E8C]/20 transition"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#1B5E8C]">
              <div className="flex items-center gap-1.5">
                <Key size={15} />
                <span>كلمة مرور بوابة الكافل <span className="text-rose-500">*</span></span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">8 أحرف على الأقل</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-blue-200 rounded-xl focus-within:border-[#1B5E8C] focus-within:ring-2 focus-within:ring-[#1B5E8C]/15 transition">
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={8}
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
                placeholder="8 أحرف أو أرقام على الأقل"
                className="w-full text-xs font-medium focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                title={showPass ? 'إخفاء' : 'عرض'}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              سيستخدمها الكافل لتسجيل الدخول إلى بوابته ومتابعة تقارير أيتامه مباشرة.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>جارٍ الحفظ…</span>
                </>
              ) : (
                <span>إضافة الكافل</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 2: Link Beneficiary (Orphan) Modal
// ─────────────────────────────────────────────────────────────────────────────
function LinkBeneficiaryModal({ sponsor, onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyAmount, setMonthlyAmount] = useState('25000');
  const [intermediary, setIntermediary] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAvailable = async () => {
      setFetching(true);
      setError('');
      try {
        const [oRes, fRes] = await Promise.all([
          api.get('/orphans/marketing'),
          api.get('/families/marketing'),
        ]);
        const orphans = (oRes.data.orphans || []).map((o) => ({
          id: o.id,
          type: 'orphan',
          name: o.full_name,
          age: calcAge(o.date_of_birth),
          governorate: o.governorate_ar || '—',
          agent_id: o.agent_id,
        }));
        const families = (fRes.data.families || []).map((f) => ({
          id: f.id,
          type: 'family',
          name: f.family_name,
          age: `${f.member_count || '—'} فرد`,
          governorate: f.governorate_ar || '—',
          agent_id: f.agent_id,
        }));
        const all = [...orphans, ...families];
        setItems(all);
        setFiltered(all);
      } catch (err) {
        setError('تعذر تحميل قائمة الأيتام المتاحين للكفالة');
      } finally {
        setFetching(false);
      }
    };
    fetchAvailable();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(items);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(items.filter((i) => i.name?.toLowerCase().includes(q) || i.governorate?.includes(q)));
  }, [search, items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('يرجى اختيار يتيم أو أسرة من القائمة');
      return;
    }
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) {
      setError('يرجى تحديد المبلغ الشهري للكفالة');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/sponsors/${sponsor.id}/sponsorships`, {
        beneficiaryType: selectedItem.type,
        beneficiaryId: selectedItem.id,
        agentId: selectedItem.agent_id,
        startDate,
        monthlyAmount: parseFloat(monthlyAmount),
        intermediary: intermediary || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'تعذر ربط المكفول بهذا الكافل'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center font-bold">
              <Link2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">ربط مكفول جديد بالكافل</h3>
              <p className="text-xs text-slate-500">الكافل: <strong className="text-[#1B5E8C]">{sponsor.full_name}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Available Beneficiaries */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اختر اليتيم أو الأسرة <span className="text-rose-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو المحافظة..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:bg-white"
              />
            </div>

            {/* List */}
            <div className="border border-slate-200 rounded-2xl max-h-44 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
              {fetching ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>جارٍ جلب الأيتام المتاحين…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  لا توجد حالات متاحة مطابقة للبحث
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-blue-50/80 border-r-4 border-r-[#1B5E8C]' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1B5E8C] flex items-center justify-center text-xs font-bold">
                          {item.type === 'orphan' ? 'ي' : 'أ'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-500">{item.governorate} · {item.age}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                        {item.type === 'orphan' ? 'يتيم' : 'أسرة'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Preview */}
          {selectedItem && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#1B5E8C]">تم اختيار: {selectedItem.name}</p>
                <p className="text-[11px] text-slate-600">{selectedItem.governorate} · {selectedItem.age}</p>
              </div>
              <CheckCircle2 size={18} className="text-[#1B5E8C]" />
            </div>
          )}

          {/* Financial details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ الشهري (ر.ي) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                placeholder="25000"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1B5E8C] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ بدء الكفالة <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1B5E8C] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوسيط / جهة التنسيق (اختياري)</label>
            <input
              type="text"
              value={intermediary}
              onChange={(e) => setIntermediary(e.target.value)}
              placeholder="مثال: فاعل خير / عبر جمعية شريكة"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1B5E8C] focus:bg-white transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !selectedItem}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>جارٍ الربط…</span>
                </>
              ) : (
                <span>تأكيد ربط الكفالة</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 3: Portal Account Modal (View credentials & 1-click Copy link)
// ─────────────────────────────────────────────────────────────────────────────
function PortalAccountModal({ sponsor, onClose, showToast, onUpdated }) {
  const [copied, setCopied] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(sponsor.portal_password_plain || 'Sponsor@1234');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const portalUrl = `${origin}/sponsor/portal?token=${sponsor.portal_token || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    showToast('تم نسخ رابط بوابة الكافل إلى الحافظة');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(currentPassword);
    setCopiedPass(true);
    showToast('تم نسخ كلمة المرور الحالية إلى الحافظة');
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setSavingPassword(true);
    setError('');
    setPasswordSuccess(false);
    try {
      const { data } = await api.put(`/sponsors/${sponsor.id}`, {
        fullName: sponsor.full_name,
        phone: sponsor.phone,
        email: sponsor.email,
        portalPassword: newPassword,
      });
      const updatedPlain = data?.sponsor?.portal_password_plain || newPassword;
      setCurrentPassword(updatedPlain);
      sponsor.portal_password_plain = updatedPlain;
      setPasswordSuccess(true);
      showToast('تم تغيير كلمة مرور البوابة بنجاح');
      setNewPassword('');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'تعذر تحديث كلمة المرور');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center font-bold">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">حساب بوابة الكافل</h3>
              <p className="text-xs text-slate-500">الكافل: <strong className="text-slate-900">{sponsor.full_name}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Direct Portal Link Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ExternalLink size={14} className="text-[#1B5E8C]" />
                <span>رابط الدخول المباشر للبوابة:</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                مفعل
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="w-full text-xs font-mono text-slate-600 bg-transparent focus:outline-none ltr truncate"
              />
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B5E8C] hover:bg-[#134569] text-white text-xs font-bold shrink-0 transition"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500">
                يمكن إرسال هذا الرابط للكافل عبر واتساب أو الرسائل القصيرة.
              </p>
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1B5E8C] hover:underline"
              >
                <span>فتح البوابة الآن</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Sponsor Token & ID info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px] font-bold">رمز البوابة (Token):</span>
              <span className="font-mono font-bold text-slate-800 break-all">{sponsor.portal_token || '—'}</span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px] font-bold">حالة الكفالات:</span>
              <span className="font-bold text-[#1B5E8C]">{sponsor.active_sponsorships || 0} كفالة نشطة</span>
            </div>
          </div>

          {/* Dual Password Section: View Old Next To Edit New for System Head */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key size={14} className="text-[#1B5E8C]" />
                <span>بيانات كلمة المرور (خاص بإدارة النظام)</span>
              </span>
              <span className="text-[10px] font-bold text-[#1B5E8C] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                صلاحية المدير العام
              </span>
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{error}</p>
            )}

            {passwordSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={15} />
                <span>تم تحديث كلمة المرور بنجاح! تم حفظ التعديل وتحديث كلمة المرور الحالية.</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Box 1 (Right): Current / Old Password */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">كلمة المرور الحالية (القديمة):</label>
                    <span className="text-[10px] text-slate-400">قراءة فقط</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 mt-1 rounded-lg border border-slate-200/90">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      readOnly
                      value={currentPassword}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      title={showCurrentPass ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition"
                    >
                      {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPass}
                      title="نسخ كلمة المرور الحالية"
                      className="p-1 text-[#1B5E8C] hover:bg-blue-50 rounded-md transition"
                    >
                      {copiedPass ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  كلمة المرور المعتمدة حالياً لدخول الكافل إلى بوابته.
                </p>
              </div>

              {/* Box 2 (Left): Edit to New Password */}
              <form onSubmit={handleUpdatePassword} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">تعديل كلمة المرور (الجديدة):</label>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 mt-1 rounded-lg border border-slate-200 focus-within:border-[#1B5E8C] focus-within:ring-2 focus-within:ring-[#1B5E8C]/15 transition">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordSuccess(false);
                      }}
                      placeholder="8 أحرف على الأقل"
                      className="w-full text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      title={showNewPass ? 'إخفاء' : 'عرض'}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  className="w-full mt-2 py-1.5 px-3 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {savingPassword ? <Spinner size="xs" /> : <Key size={13} />}
                  <span>{savingPassword ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور الجديدة'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 4: Edit Sponsor Modal
// ─────────────────────────────────────────────────────────────────────────────
function EditSponsorModal({ sponsor, onClose, onSuccess }) {
  const [fullName, setFullName] = useState(sponsor.full_name || '');
  const [phone, setPhone] = useState(sponsor.phone || '');
  const [email, setEmail] = useState(sponsor.email || '');
  const [portalPassword, setPortalPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPasswordVal = sponsor.portal_password_plain || 'Sponsor@1234';

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(currentPasswordVal);
    setCopiedCurrent(true);
    setTimeout(() => setCopiedCurrent(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('الاسم الكامل مطلوب (3 أحرف على الأقل)');
      return;
    }
    if (portalPassword && portalPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };
      if (portalPassword) {
        payload.portalPassword = portalPassword;
      }
      const { data } = await api.put(`/sponsors/${sponsor.id}`, payload);
      if (data?.sponsor?.portal_password_plain) {
        sponsor.portal_password_plain = data.sponsor.portal_password_plain;
      } else if (portalPassword) {
        sponsor.portal_password_plain = portalPassword;
      }
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تعديل بيانات الكافل'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center font-bold">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">تعديل بيانات الكافل</h3>
              <p className="text-xs text-slate-500">{sponsor.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1B5E8C] focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium ltr text-right focus:outline-none focus:border-[#1B5E8C] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium ltr text-right focus:outline-none focus:border-[#1B5E8C] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Dual Password Box: View Old Password next to Edit New Password */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key size={14} className="text-[#1B5E8C]" />
                <span>إدارة كلمة مرور البوابة (خاص بإدارة النظام)</span>
              </span>
              <span className="text-[10px] font-bold text-[#1B5E8C] bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                صلاحية المدير العام
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Box 1 (Right): Old / Current Password */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">كلمة المرور الحالية (القديمة):</label>
                  <span className="text-[10px] text-slate-400">قراءة فقط</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    readOnly
                    value={currentPasswordVal}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    title={showCurrentPass ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition"
                  >
                    {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCurrent}
                    title="نسخ كلمة المرور الحالية"
                    className="p-1 text-[#1B5E8C] hover:bg-blue-50 rounded-md transition"
                  >
                    {copiedCurrent ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  يمكن للمدير العام نسخها أو إعطاؤها للكافل
                </p>
              </div>

              {/* Box 2 (Left): Edit New Password */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">تعديل كلمة المرور (الجديدة):</label>
                  <span className="text-[10px] text-blue-600 font-medium">اختياري</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:border-[#1B5E8C] focus-within:ring-2 focus-within:ring-[#1B5E8C]/15 transition">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="اتركها فارغة إذا لم ترد التغيير"
                    className="w-full text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    title={showNewPass ? 'إخفاء' : 'عرض'}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                  >
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  اتركها فارغة للإبقاء على القديمة (8 أحرف على الأقل عند التعديل)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition disabled:opacity-50"
            >
              {loading ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 5: Sponsor Details & Sponsored Orphans Modal
// ─────────────────────────────────────────────────────────────────────────────
function SponsorDetailsModal({ sponsor, onClose, onOpenLinkOrphan, onOpenPortal }) {
  const router = useRouter();
  const [details, setDetails] = useState(null);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsPass, setShowDetailsPass] = useState(false);
  const [copiedDetailsPass, setCopiedDetailsPass] = useState(false);

  useEffect(() => {
    const fetchFullDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/sponsors/${sponsor.id}`);
        setDetails(data.sponsor);
        setSponsorships(data.sponsorships || []);
      } catch (err) {
        console.error('Failed to fetch sponsor details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullDetails();
  }, [sponsor.id]);

  const activeSponsorships = sponsorships.filter((s) => s.is_active);
  const totalMonthly = activeSponsorships.reduce((sum, s) => sum + parseFloat(s.monthly_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-[#1B5E8C]/20">
              {sponsor.full_name?.charAt(0) || <User size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">{sponsor.full_name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1B5E8C] border border-blue-200">
                  {sponsor.portal_token ? 'كافل مسجل' : 'فاعل خير'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                {sponsor.phone && <span>الهاتف: {sponsor.phone}</span>}
                {sponsor.email && <span>البريد: {sponsor.email}</span>}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 block">إجمالي المكفولين</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">{activeSponsorships.length} مكفول</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80">
              <span className="text-[11px] font-bold text-blue-500 block">المبلغ الشهري الإجمالي</span>
              <span className="text-lg font-black text-[#1B5E8C] mt-0.5 block">{formatAmount(totalMonthly)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 block">تاريخ التسجيل</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">{formatDate(sponsor.created_at)}</span>
            </div>
          </div>

          {/* Portal Credentials for System Head */}
          <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key size={14} className="text-[#1B5E8C]" />
                <span>بيانات دخول البوابة (خاص بإدارة النظام):</span>
              </span>
              <span className="text-[10px] font-bold text-[#1B5E8C] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                صلاحية المدير العام
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] font-bold">رمز الدخول:</span>
                <span className="font-mono font-bold text-slate-800">{sponsor.portal_token || '—'}</span>
              </div>

              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] font-bold">كلمة المرور الحالية:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800">
                    {showDetailsPass ? (details?.portal_password_plain || sponsor.portal_password_plain || 'Sponsor@1234') : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDetailsPass(!showDetailsPass)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                    title={showDetailsPass ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}
                  >
                    {showDetailsPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(details?.portal_password_plain || sponsor.portal_password_plain || 'Sponsor@1234');
                      setCopiedDetailsPass(true);
                      setTimeout(() => setCopiedDetailsPass(false), 2000);
                    }}
                    className="p-1 text-[#1B5E8C] hover:bg-blue-50 rounded transition"
                    title="نسخ كلمة المرور"
                  >
                    {copiedDetailsPass ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List of Sponsored Orphans */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Heart size={14} className="text-rose-500" />
                <span>قائمة الأيتام والمكفولين ({activeSponsorships.length}):</span>
              </h4>
              <button
                onClick={onOpenLinkOrphan}
                className="text-xs font-bold text-[#1B5E8C] hover:underline flex items-center gap-1"
              >
                <Plus size={13} />
                <span>+ ربط مكفول جديد</span>
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <span>جارٍ تحميل المكفولين…</span>
              </div>
            ) : activeSponsorships.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Users size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">لا يوجد أيتام مربوطون بهذا الكافل حالياً</p>
                <button
                  onClick={onOpenLinkOrphan}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1B5E8C] text-white text-xs font-bold hover:bg-[#134569] transition"
                >
                  <Plus size={13} />
                  <span>ربط مكفول الآن</span>
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {activeSponsorships.map((s) => (
                  <div key={s.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50/70 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center text-xs font-bold">
                        {s.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{s.beneficiary_name}</p>
                        <p className="text-[11px] text-slate-400">
                          المندوب: {s.agent_name || '—'} · بدء الكفالة: {formatDate(s.start_date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-xs font-black text-[#1B5E8C] block">{formatAmount(s.monthly_amount)}</span>
                      <span className="text-[10px] text-slate-400 block">شهرياً</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                onClose();
                router.push(`/sponsors/${sponsor.id}`);
              }}
              className="text-xs font-bold text-slate-600 hover:text-[#1B5E8C] flex items-center gap-1"
            >
              <span>فتح الملف الكامل للكافل</span>
              <ExternalLink size={13} />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPortal}
                className="py-2 px-4 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-slate-700 text-xs font-bold transition"
              >
                حساب البوابة
              </button>
              <button
                onClick={onClose}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 6: Delete Sponsor Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteSponsorConfirmModal({ sponsor, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeCount = parseInt(sponsor.active_sponsorships || 0, 10);

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/sponsors/${sponsor.id}`);
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'تعذر حذف الكافل. تأكد من فك ارتباط المكفولين أولاً.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-base font-black text-slate-900">تأكيد حذف الكافل</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            هل أنت متأكد من رغبتك في حذف الكافل <strong className="text-slate-900">{sponsor.full_name}</strong>؟
          </p>

          {activeCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-right">
              <strong>تنبيه:</strong> هذا الكافل مرتبط حالياً بـ <strong>{activeCount} مكفول</strong>. قد يتطلب حذف الكافل نقل أو إلغاء الكفالات المرتبطة أولاً.
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'جارٍ الحذف…' : 'تأكيد الحذف'}
          </button>
        </div>
      </div>
    </div>
  );
}
