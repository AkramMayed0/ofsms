'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../components/AppShell';
import api from '../../../lib/api';

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  under_review:      { label: 'قيد المراجعة',  color: '#F59E0B', bg: '#FEF3C7' },
  under_marketing:   { label: 'تحت التسويق',   color: '#3B82F6', bg: '#EFF6FF' },
  under_sponsorship: { label: 'تحت الكفالة',   color: '#10B981', bg: '#ECFDF5' },
  rejected:          { label: 'مرفوض',         color: '#EF4444', bg: '#FEF2F2' },
  inactive:          { label: 'غير نشط',       color: '#6B7280', bg: '#F3F4F6' },
};

const REPORT_CONFIG = {
  pending:  { label: 'معلّق',  color: '#F59E0B', bg: '#FEF3C7' },
  approved: { label: 'معتمد', color: '#10B981', bg: '#ECFDF5' },
  rejected: { label: 'مرفوض', color: '#EF4444', bg: '#FEF2F2' },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, loading }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      style={{ borderRightColor: accent, borderRightWidth: '4px' }}
    >
      <p
        className="text-3xl font-bold"
        style={{ color: accent }}
      >
        {loading ? '—' : value ?? 0}
      </p>
      <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

// ── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-bold text-gray-700 border-b pb-3 mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ h = 'h-32' }) {
  return (
    <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AgentDashboardPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/dashboard/agent')
      .then(res  => setData(res.data))
      .catch(()  => setError('تعذّر تحميل لوحة التحكم. يرجى المحاولة مجدداً'))
      .finally(() => setLoading(false));
  }, []);

  const { meta, my_orphans, pending_reports,
          submission_statuses, rejected_registrations } = data || {};

  return (
    <AppShell>
      <div dir="rtl" className="space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            لوحة تحكم المندوب
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString('ar-YE', {
              weekday: 'long', day: 'numeric',
              month: 'long',  year: 'numeric',
            })}
          </p>
        </div>

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200
                          text-red-700 rounded-xl p-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Stat Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="إجمالي الأيتام"
            value={meta?.total_orphans}
            accent="#1B5E8C"
            loading={loading}
          />
          <StatCard
            label="تحت الكفالة"
            value={meta?.under_sponsorship}
            accent="#10B981"
            loading={loading}
          />
          <StatCard
            label="تقارير معلّقة"
            value={meta?.pending_reports_count}
            accent="#F59E0B"
            loading={loading}
          />
          <StatCard
            label="طلبات مرفوضة"
            value={meta?.rejected_count}
            accent="#EF4444"
            loading={loading}
          />
        </div>

        {/* ── Pending Reports Alert ──────────────────────────────────── */}
        {!loading && pending_reports?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300
                          rounded-xl p-4">
            <p className="font-bold text-yellow-800 mb-2">
              ⚠️ أيتام لم يُرفع تقرير حفظهم هذا الشهر
              ({meta?.current_month}/{meta?.current_year})
            </p>
            <ul className="space-y-1">
              {pending_reports.map(o => (
                <li key={o.orphan_id} className="text-yellow-700 text-sm">
                  • {o.full_name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Rejected Registrations Alert ──────────────────────────── */}
        {!loading && rejected_registrations?.length > 0 && (
          <div className="bg-red-50 border border-red-300
                          rounded-xl p-4">
            <p className="font-bold text-red-800 mb-2">
              ❌ طلبات تسجيل مرفوضة — تحتاج إلى تصحيح وإعادة إرسال
            </p>
            <ul className="space-y-1">
              {rejected_registrations.map(o => (
                <li key={o.id} className="text-red-700 text-sm">
                  • {o.full_name}
                  {o.notes && (
                    <span className="text-red-400 mr-2">
                      — {o.notes}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── My Orphans Table ──────────────────────────────────────── */}
        <Section title="قائمة أيتامي">
          {loading ? <Skeleton h="h-40" /> :
           !my_orphans?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">
              لا يوجد أيتام مسجلون بعد
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="text-gray-400 text-xs border-b">
                    <th className="pb-3 font-semibold">الاسم</th>
                    <th className="pb-3 font-semibold">المحافظة</th>
                    <th className="pb-3 font-semibold">الحالة</th>
                    <th className="pb-3 font-semibold text-center">
                      موهوب
                    </th>
                    <th className="pb-3 font-semibold">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {my_orphans.map(o => {
                    const s = STATUS_CONFIG[o.status]
                              || STATUS_CONFIG.inactive;
                    return (
                      <tr
                        key={o.id}
                        className="border-b last:border-0
                                   hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 font-medium text-gray-800">
                          {o.full_name}
                        </td>
                        <td className="py-3 text-gray-500">
                          {o.governorate_ar ?? '—'}
                        </td>
                        <td className="py-3">
                          <span
                            className="px-2 py-1 rounded-full
                                       text-xs font-semibold"
                            style={{
                              color:      s.color,
                              background: s.bg,
                            }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {o.is_gifted ? '🌟' : '—'}
                        </td>
                        <td className="py-3 text-gray-400 text-xs">
                          {new Date(o.created_at)
                            .toLocaleDateString('ar-YE')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── Submission Statuses ───────────────────────────────────── */}
        <Section
          title={`تقارير الحفظ — ${meta?.current_month ?? ''}/${meta?.current_year ?? ''}`}
        >
          {loading ? <Skeleton h="h-28" /> :
           !submission_statuses?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">
              لا توجد تقارير مُرسَلة هذا الشهر
            </p>
          ) : (
            <div className="space-y-2">
              {submission_statuses.map(r => {
                const s = REPORT_CONFIG[r.status]
                          || REPORT_CONFIG.pending;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between
                               bg-gray-50 rounded-lg p-3 border
                               border-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {r.full_name}
                      </p>
                      {r.supervisor_notes && (
                        <p className="text-xs text-red-500 mt-1">
                          ملاحظة المشرف: {r.supervisor_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="px-2 py-1 rounded-full
                                   text-xs font-semibold"
                        style={{ color: s.color, background: s.bg }}
                      >
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {r.juz_memorized} جزء
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

      </div>
    </AppShell>
  );
}
