'use client';

/**
 * Route: /sponsor/orphans/[orphanId]
 * API:   GET /api/sponsor/reports/:orphanId
 *        → { quran_reports: [...], disbursements: [...] }
 */

import { useEffect, useState } from 'react';
import {
  AlertTriangle, User, Handshake,
  CheckCircle2, XCircle, Check,
} from 'lucide-react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import sponsorApi from '@/lib/sponsorApi';
import useSponsorStore from '@/store/useSponsorStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_REPORTS = (id) => `/sponsor/reports/${id}`;

const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const REPORT_STATUS = {
  pending:  { label: 'قيد المراجعة', color: '#92400E', bg: '#FEF3C7', Icon: null },
  approved: { label: 'مقبول',        color: '#065F46', bg: '#ECFDF5', Icon: CheckCircle2 },
  rejected: { label: 'مرفوض',       color: '#991B1B', bg: '#FEF2F2', Icon: XCircle },
};

const DISB_STATUS = {
  draft:               { label: 'مسودة',        color: '#6B7280' },
  supervisor_approved: { label: 'اعتمد المشرف', color: '#1E40AF' },
  finance_approved:    { label: 'اعتمد المالي', color: '#5B21B6' },
  released:            { label: 'مُصدَر',        color: '#065F46' },
  rejected:            { label: 'مرفوض',         color: '#991B1B' },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SponsorOrphanDetail() {
  const { orphanId }                    = useParams();
  const router                          = useRouter();
  const { isAuthenticated, sponsor }    = useSponsorStore();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('quran'); // 'quran' | 'disbursements'

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/sponsor/login'); return; }
    sponsorApi.get(API_REPORTS(orphanId))
      .then(({ data: res }) => setData(res))
      .catch(() => setError('تعذّر تحميل بيانات هذا اليتيم'))
      .finally(() => setLoading(false));
  }, [orphanId]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans" dir="rtl">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="max-w-[900px] mx-auto py-3.5 px-6 flex items-center justify-between">
          <Link href="/sponsor/dashboard" className="text-[0.85rem] font-semibold text-[#2d7a4a] no-underline hover:underline">
            ← العودة للقائمة
          </Link>
          <div className="flex items-center gap-1.5 text-[0.9rem] font-bold text-[#0d3d5c]">
            <Handshake size={32} />
            <span>بوابة الكافل</span>
          </div>
          <span className="text-[0.78rem] text-gray-400">{sponsor?.name || ''}</span>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto py-8 px-6 flex flex-col gap-5">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 py-3 px-4 rounded-xl text-[0.875rem]">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : !data ? null : (
          <>
            {/* Orphan header card */}
            <div className="bg-gradient-to-br from-[#1a4a2e] to-[#2d7a4a] rounded-2xl py-6 px-7 flex items-center gap-5 text-white">
              <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center shrink-0 text-white">
                <User size={18} />
              </div>
              <div>
                <h1 className="text-[1.2rem] font-extrabold m-0 mb-1">تقارير اليتيم</h1>
                <p className="text-[0.8rem] text-white/70 m-0">
                  {data.quran_reports?.length || 0} تقرير حفظ ·{' '}
                  {data.disbursements?.length || 0} دورة صرف
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white border-[1.5px] border-gray-200 rounded-[0.875rem] p-2">
              {[
                { key: 'quran',         label: '📖 تقارير حفظ القرآن',  count: data.quran_reports?.length || 0 },
                { key: 'disbursements', label: '💰 سجل الصرف الشهري',   count: data.disbursements?.length || 0 },
              ].map(({ key, label, count }) => {
                const isActive = tab === key;
                return (
                  <button
                    key={key}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-none rounded-[0.625rem] font-sans text-[0.85rem] font-semibold cursor-pointer transition-all ${isActive ? 'bg-emerald-50 text-[#2d7a4a]' : 'text-gray-500 bg-transparent hover:bg-gray-50'}`}
                    onClick={() => setTab(key)}
                  >
                    {label}
                    <span className={`text-[0.68rem] font-bold py-0 px-1.5 rounded-full ${isActive ? 'bg-[#2d7a4a] text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {tab === 'quran'         && <QuranReportsTab    reports={data.quran_reports || []} />}
            {tab === 'disbursements' && <DisbursementsTab   disbursements={data.disbursements || []} />}
          </>
        )}
      </main>
    </div>
  );
}

// ── QuranReportsTab ───────────────────────────────────────────────────────────

function QuranReportsTab({ reports }) {
  if (!reports.length) {
    return (
      <div className="bg-white border-[1.5px] border-gray-200 rounded-2xl py-12 px-4 text-center text-gray-400 flex flex-col items-center gap-2 text-[0.85rem]">
        <span className="text-[2.5rem]">📖</span>
        <p className="m-0">لا توجد تقارير حفظ بعد</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      {reports.map((r) => {
        const cfg   = REPORT_STATUS[r.status] || REPORT_STATUS.pending;
        const Icon  = cfg.Icon;
        return (
          <div key={r.id} className="bg-white border-[1.5px] border-gray-200 rounded-[0.875rem] py-4 px-4.5 flex flex-col gap-3">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[0.95rem] font-bold text-[#0d3d5c] leading-none">{ARABIC_MONTHS[r.month]}</span>
                <span className="text-[0.72rem] text-gray-400">{r.year}</span>
              </div>
              <span className="text-[0.72rem] font-bold py-0.5 px-2.5 rounded-full flex items-center gap-1" style={{ color: cfg.color, background: cfg.bg }}>
                {Icon && <Icon size={12} />} {cfg.label}
              </span>
            </div>

            {/* Juz count */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[2rem] font-extrabold text-[#2d7a4a] leading-none">{r.juz_memorized}</span>
              <span className="text-[0.72rem] text-gray-400">جزء محفوظ هذا الشهر</span>
            </div>

            {/* Rejection notes */}
            {r.supervisor_notes && r.status === 'rejected' && (
              <div className="flex items-start gap-1.5 bg-red-50 rounded-lg py-2 px-2.5 text-[0.75rem] text-red-800">
                <span>📝</span>
                <span>{r.supervisor_notes}</span>
              </div>
            )}

            {/* Submit date */}
            <div className="text-[0.7rem] text-gray-400 pt-1 border-t border-gray-100">
              {new Date(r.submitted_at).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── DisbursementsTab ──────────────────────────────────────────────────────────

function DisbursementsTab({ disbursements }) {
  if (!disbursements.length) {
    return (
      <div className="bg-white border-[1.5px] border-gray-200 rounded-2xl py-12 px-4 text-center text-gray-400 flex flex-col items-center gap-2 text-[0.85rem]">
        <span className="text-[2.5rem]">💰</span>
        <p className="m-0">لا توجد بيانات صرف بعد</p>
      </div>
    );
  }

  const totalReleased = disbursements
    .filter((d) => d.list_status === 'released' && d.included)
    .reduce((s, d) => s + parseFloat(d.amount), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="bg-emerald-50 border-[1.5px] border-emerald-300 rounded-xl py-3.5 px-4 flex items-center justify-between">
        <span className="text-[0.85rem] font-semibold text-emerald-800">إجمالي المبالغ المُصدَرة:</span>
        <span className="text-[1.1rem] font-extrabold text-emerald-800">{totalReleased.toLocaleString('ar-YE')} ريال</span>
      </div>

      {/* Table */}
      <div className="bg-white border-[1.5px] border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full border-collapse text-[0.8rem]">
          <thead>
            <tr>
              {['الشهر', 'المبلغ', 'حالة الكشف', 'مُدرَج', 'تأكيد الاستلام'].map((h) => (
                <th key={h} className="text-right py-2.5 px-3.5 text-[0.72rem] font-bold text-gray-400 border-b-2 border-gray-100 whitespace-nowrap bg-gray-50">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {disbursements.map((d, i) => {
              const cfg = DISB_STATUS[d.list_status] || DISB_STATUS.draft;
              return (
                <tr key={i} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3.5 text-gray-700">{ARABIC_MONTHS[d.month]} {d.year}</td>
                  <td className="py-3 px-3.5 font-bold text-[#0d3d5c]">{parseFloat(d.amount).toLocaleString('ar-YE')} ريال</td>
                  <td className="py-3 px-3.5">
                    <span className="text-[0.75rem] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </td>
                  <td className="py-3 px-3.5">
                    {d.included
                      ? <span className="bg-emerald-50 text-emerald-800 text-[0.72rem] font-bold py-0.5 px-2 rounded-full flex items-center gap-1 w-fit"><Check size={12} /> نعم</span>
                      : <span className="bg-red-50 text-red-800 text-[0.72rem] font-bold py-0.5 px-2 rounded-full cursor-help" title={d.exclusion_reason}>✗ لا</span>
                    }
                  </td>
                  <td className="py-3 px-3.5">
                    {d.receipt_confirmed_at
                      ? <span className="bg-emerald-50 text-emerald-800 text-[0.72rem] font-bold py-0.5 px-2 rounded-full flex items-center gap-1 w-fit">
                          <Check size={12} /> {new Date(d.receipt_confirmed_at).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' })}
                        </span>
                      : <span className="bg-gray-100 text-gray-500 text-[0.72rem] font-semibold py-0.5 px-2 rounded-full">بانتظار</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── LoadingSkeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const shimmer = 'bg-gradient-to-r from-gray-100 to-gray-200 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%]';
  return (
    <div className="flex flex-col gap-4">
      <div className={`h-24 rounded-2xl ${shimmer}`} />
      <div className={`h-12 rounded-[0.875rem] ${shimmer}`} />
      <div className="grid grid-cols-3 gap-4 max-[640px]:grid-cols-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-[140px] rounded-[0.875rem] ${shimmer}`} />
        ))}
      </div>
    </div>
  );
}
