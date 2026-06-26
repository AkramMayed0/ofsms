'use client';

/**
 * page.jsx
 * Route:  /my-orphans  (Agent only)
 * Task:   feature/ui-agent-my-orphans
 *
 * Shows the agent's assigned orphans in a searchable, filterable table.
 * Clicking a row opens a slide-in detail drawer with full orphan info.
 * Links to /orphans/new for registration.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X, User, CheckCircle2, FileText } from 'lucide-react';
import SearchField from '@/components/ui/SearchField';

import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import Button from '@/components/ui/Button';
import StatusBadge, { STATUS_MAP } from '@/components/ui/StatusBadge';

const GENDER_MAP = { male: 'ذكر', female: 'أنثى' };

const RELATION_MAP = {
  uncle:          'عم',
  maternal_uncle: 'خال',
  grandfather:    'جد',
  sibling:        'أخ / أخت',
  other:          'أخرى',
};

const ALL_STATUSES = Object.keys(STATUS_MAP);

// ── Helpers ────────────────────────────────────────────────────────────────────

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

const calcAge = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / MS_PER_YEAR)} سنة`;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' });
};



// ── DetailDrawer ───────────────────────────────────────────────────────────────

function DetailDrawer({ orphan, onClose }) {
  const [docs, setDocs]       = useState([]);
  const [docsLoading, setDL]  = useState(true);

  useEffect(() => {
    if (!orphan) return;
    async function fetchDocs() {
      setDL(true);
      try {
        const { data } = await api.get(`/orphans/${orphan.id}`);
        setDocs(data.documents || []);
      } catch (err) {
        console.error(`Failed to fetch documents for orphan ID ${orphan.id}:`, err);
        setDocs([]);
      } finally {
        setDL(false);
      }
    }
    fetchDocs();
  }, [orphan?.id]);

  if (!orphan) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/35 z-40 animate-fadeIn" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed top-0 left-0 w-[420px] max-w-[95vw] h-screen bg-white z-50 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.12)] animate-slideInLeft" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[#f0f4f8]">
          <div>
            <h2 className="text-[1.15rem] font-extrabold text-[#0d3d5c] mb-2">{orphan.full_name}</h2>
            <StatusBadge status={orphan.status} />
          </div>
          <button className="bg-transparent border-none text-[1.1rem] text-gray-400 cursor-pointer px-1.5 py-1 rounded-[6px] transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 flex-shrink-0" onClick={onClose} aria-label="إغلاق"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Info grid */}
          <div className="info-section">
            <h3 className="text-[0.78rem] font-bold text-slate-400 uppercase tracking-[0.06em] mb-3">البيانات الأساسية</h3>
            <div className="flex flex-col gap-2">
              <InfoRow label="العمر"        value={calcAge(orphan.date_of_birth)} />
              <InfoRow label="تاريخ الميلاد" value={formatDate(orphan.date_of_birth)} />
              <InfoRow label="الجنس"        value={GENDER_MAP[orphan.gender] || '—'} />
              <InfoRow label="المحافظة"     value={orphan.governorate_ar || '—'} />
              <InfoRow label="اسم الوصي"   value={orphan.guardian_name || '—'} />
              <InfoRow label="صلة الوصي"   value={RELATION_MAP[orphan.guardian_relation] || '—'} />
              <InfoRow label="تاريخ التسجيل" value={formatDate(orphan.created_at)} />
              {orphan.is_gifted && <InfoRow label="موهوب" value={<span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> نعم</span>} highlight />}
            </div>
          </div>

          {/* Sponsorship info */}
          {orphan.status === 'under_sponsorship' && (
            <div className="info-section">
              <h3 className="text-[0.78rem] font-bold text-slate-400 uppercase tracking-[0.06em] mb-3">بيانات الكفالة</h3>
              <div className="flex flex-col gap-2">
                <InfoRow label="اسم الكافل"    value={orphan.sponsor_name || '—'} />
                <InfoRow label="المبلغ الشهري" value={orphan.monthly_amount ? `${orphan.monthly_amount.toLocaleString('ar-YE')} ر.ي` : '—'} />
                <InfoRow label="تاريخ البداية" value={formatDate(orphan.sponsorship_start)} />
              </div>
            </div>
          )}

          {/* Rejection notes */}
          {orphan.status === 'rejected' && orphan.notes && (
            <div className="flex gap-3 bg-red-50 border border-red-200 rounded-[0.75rem] p-4">
              <span className="text-[1.1rem] flex-shrink-0 text-red-600"><AlertTriangle size={18} /></span>
              <div>
                <strong className="block text-[0.85rem] font-bold text-red-700 mb-1">سبب الرفض</strong>
                <p className="text-[0.82rem] text-red-600 m-0 leading-relaxed">{orphan.notes}</p>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="info-section">
            <h3 className="text-[0.78rem] font-bold text-slate-400 uppercase tracking-[0.06em] mb-3">المستندات المرفوعة</h3>
            {docsLoading ? (
              <p className="text-[0.83rem] text-slate-400 m-0">جارٍ التحميل…</p>
            ) : docs.length === 0 ? (
              <p className="text-[0.83rem] text-slate-400 m-0">لا توجد مستندات مرفوعة</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-2.5 py-2 bg-slate-50 border border-[#e5eaf0] rounded-[0.5rem] text-[0.78rem]">
                    <span><FileText size={16} /></span>
                    <span className="flex-1 text-gray-700 font-medium overflow-hidden text-ellipsis whitespace-nowrap [direction:ltr] text-left">{d.original_name || d.doc_type}</span>
                    <span className="text-slate-400 flex-shrink-0">{formatDate(d.uploaded_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#f0f4f8] flex gap-3 justify-end">
          {orphan.status === 'rejected' && (
            <a href={`/orphans/${orphan.id}/edit`} className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white text-[.82rem] font-bold rounded-lg no-underline hover:from-[#2E7EB8] hover:to-[#1B5E8C] transition-all">
              تعديل وإعادة الإرسال
            </a>
          )}
          <Button variant="outline" className="rounded-[0.625rem] text-[0.82rem]" onClick={onClose}>إغلاق</Button>
        </div>
      </aside>
    </>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-50 min-w-0">
      <span className="text-[0.8rem] text-slate-500 font-medium min-w-0">{label}</span>
      <span className={`text-[0.83rem] min-w-0 overflow-wrap-anywhere break-all text-left ${highlight ? 'text-emerald-500 font-bold' : 'text-gray-800 font-semibold'}`}>{value}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function MyOrphansPage() {
  const router = useRouter();

  const [orphans,   setOrphans]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState(null); // orphan for drawer
  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch orphans
  useEffect(() => {
    async function fetchOrphans() {
      setLoading(true);
      try {
        const { data } = await api.get('/orphans');
        setOrphans(data.orphans || []);
      } catch (err) {
        console.error('Failed to fetch assigned orphans:', err);
        setError('تعذّر تحميل البيانات. يرجى تحديث الصفحة.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrphans();
  }, []);

  // Filter + search
  const filtered = orphans.filter((o) => {
    const matchSearch = !search ||
      o.full_name?.includes(search) ||
      o.governorate_ar?.includes(search) ||
      o.guardian_name?.includes(search);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Status counts for filter tabs
  const counts = orphans.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto pb-16 font-sans px-4 md:px-0" dir="rtl">

        {/* Page header */}
        <div className="flex justify-between gap-4 mb-6 md:flex-row flex-col items-start">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] mb-1">أيتامي</h1>
            <p className="text-[0.85rem] text-[#6b7a8d] m-0">
              {loading ? 'جارٍ التحميل…' : `${orphans.length} يتيم مسجّل`}
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push('/orphans/new')}>
            + تسجيل يتيم جديد
          </Button>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col gap-3 mb-5">
          <SearchField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="ابحث بالاسم أو المحافظة أو الوصي…"
            inputClassName="rounded-[0.75rem] border-gray-300 pl-10 pr-9.5 text-[0.88rem] focus:ring-4 focus:ring-primary/10"
          />

          {/* Status filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] rounded-full text-[0.78rem] font-semibold cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary ${filterStatus === 'all' ? 'border-primary bg-primary text-white' : 'border-[#e5eaf0] text-gray-500 bg-white'}`}
              onClick={() => setFilterStatus('all')}
            >
              الكل <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[0.7rem] font-bold ${filterStatus === 'all' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>{orphans.length}</span>
            </button>
            {ALL_STATUSES.map((s) => counts[s] ? (
              <button
                key={s}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] rounded-full text-[0.78rem] font-semibold cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary ${filterStatus === s ? 'border-primary bg-primary text-white' : 'border-[#e5eaf0] text-gray-500 bg-white'}`}
                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              >
                {STATUS_MAP[s].label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[0.7rem] font-bold ${filterStatus === s ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts[s]}</span>
              </button>
            ) : null)}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-[0.75rem] px-4 py-3.5 text-[0.85rem] text-red-700 font-medium mb-4">
            <span><AlertTriangle size={18} /></span> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-2">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex gap-4 px-5 py-4 bg-white border border-[#e5eaf0] rounded-[0.75rem] items-center">
                <div className="animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded-[0.375rem] w-40 h-4" />
                <div className="animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded-[0.375rem] w-20 h-3.5" />
                <div className="animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded-full w-[90px] h-6" />
                <div className="animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded-[0.375rem] w-[100px] h-3.5 mr-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
            <div className="text-[3.5rem] text-gray-300"><User size={18} /></div>
            <h3 className="text-[1.1rem] font-bold text-gray-700 m-0">
              {search || filterStatus !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا يوجد أيتام مسجّلون بعد'}
            </h3>
            <p className="text-[0.85rem] text-gray-400 m-0">
              {search || filterStatus !== 'all'
                ? 'جرّب تغيير معايير البحث أو الفلتر'
                : 'ابدأ بتسجيل يتيم جديد'}
            </p>
            {!search && filterStatus === 'all' && (
              <Button variant="primary" onClick={() => router.push('/orphans/new')}>
                + تسجيل يتيم جديد
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white border border-[#e5eaf0] rounded-[1rem] overflow-hidden shadow-[0_1px_4px_rgba(27,94,140,0.05)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3.5 text-right text-[0.75rem] font-bold text-slate-500 whitespace-nowrap border-b border-[#e5eaf0]">الاسم الكامل</th>
                  <th className="px-5 py-3.5 text-right text-[0.75rem] font-bold text-slate-500 whitespace-nowrap border-b border-[#e5eaf0]">المحافظة</th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-right text-[0.75rem] font-bold text-slate-500 whitespace-nowrap border-b border-[#e5eaf0]">العمر</th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-right text-[0.75rem] font-bold text-slate-500 whitespace-nowrap border-b border-[#e5eaf0]">الجنس</th>
                  <th className="px-5 py-3.5 text-right text-[0.75rem] font-bold text-slate-500 whitespace-nowrap border-b border-[#e5eaf0]">الحالة</th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-right text-[0.75rem] font-bold text-slate-500 whitespace-nowrap border-b border-[#e5eaf0]">تاريخ التسجيل</th>
                  <th className="px-5 py-3.5 text-right text-[0.75rem] font-bold text-slate-500 whitespace-nowrap border-b border-[#e5eaf0]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition-colors duration-120 hover:bg-[#f8fbff] focus:outline focus:outline-2 focus:outline-primary focus:-outline-offset-2"
                    onClick={() => setSelected(o)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelected(o)}
                    aria-label={`عرض تفاصيل ${o.full_name}`}
                  >
                    <td className="px-5 py-3.5 text-[0.85rem] border-b border-slate-50 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-[0.9rem] font-bold flex-shrink-0">
                          {o.full_name?.charAt(0) || '؟'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{o.full_name}</div>
                          {o.is_gifted && (
                            <span className="inline-block text-[0.68rem] font-semibold text-amber-500 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mt-0.5">🌟 موهوب</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] border-b border-slate-50 align-middle text-slate-500">{o.governorate_ar || '—'}</td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-[0.85rem] border-b border-slate-50 align-middle text-slate-500">{calcAge(o.date_of_birth)}</td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-[0.85rem] border-b border-slate-50 align-middle text-slate-500">{GENDER_MAP[o.gender] || '—'}</td>
                    <td className="px-5 py-3.5 text-[0.85rem] border-b border-slate-50 align-middle"><StatusBadge status={o.status} /></td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-[0.85rem] border-b border-slate-50 align-middle text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3.5 text-[0.85rem] border-b border-slate-50 align-middle">
                      <button className="bg-transparent border-[1.5px] border-[#e5eaf0] rounded-[0.5rem] px-3 py-1 text-[0.78rem] font-semibold text-primary cursor-pointer transition-all duration-150 hover:bg-[#f0f7ff] hover:border-primary whitespace-nowrap" onClick={(e) => { e.stopPropagation(); setSelected(o); }}>
                        عرض ←
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Result count */}
            <div className="px-5 py-3 text-[0.78rem] text-gray-400 border-t border-[#f0f4f8] text-left">
              عرض {filtered.length} من {orphans.length} يتيم
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <DetailDrawer orphan={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
