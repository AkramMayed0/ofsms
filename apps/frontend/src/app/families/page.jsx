'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertTriangle, X, Users, Filter } from 'lucide-react';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import { formatDate } from '@/components/disbursements/_constants';
import StatPill from '@/components/families/StatPill';
import StatusBadge, { STATUS_MAP } from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

export default function FamiliesManagementPage() {
  const router = useRouter();

  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGov, setFilterGov] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFamilies = useCallback(() => {
    setLoading(true);
    api.get('/families')
      .then(({ data }) => setFamilies(data.families || []))
      .catch(() => setError('تعذّر تحميل بيانات الأسر.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchFamilies(); }, [fetchFamilies]);

  const filtered = families.filter((f) => {
    const matchSearch = !search ||
      f.family_name?.includes(search) ||
      f.head_of_family?.includes(search) ||
      f.agent_name?.includes(search);
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchGov = filterGov === 'all' || f.governorate_ar === filterGov;
    return matchSearch && matchStatus && matchGov;
  });

  const counts = families.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  const totalMembers = families
    .filter(f => f.status === 'under_sponsorship')
    .reduce((sum, f) => sum + (parseInt(f.member_count) || 0), 0);

  const uniqueGovs = [...new Set(families.map(f => f.governorate_ar).filter(Boolean))];

  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto pb-16 flex flex-col gap-5 relative" dir="rtl">

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap animate-[toastIn_.25s_ease] ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#0d3d5c] text-white'}`}>
            {toast.msg}
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 max-sm:flex-col">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] mb-1">إدارة الأسر المحتاجة</h1>
            <p className="text-sm text-[#6b7a8d] m-0">
              {loading
                ? 'جارٍ التحميل…'
                : `${families.length} أسرة · ${counts.under_review || 0} قيد المراجعة · ${totalMembers} فرد مكفول`}
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push('/families/new')}>
            + تسجيل أسرة جديدة
          </Button>
        </div>

        {!loading && (
          <div className="flex gap-2.5 flex-wrap">
            <StatPill label="تحت الكفالة" count={counts.under_sponsorship || 0} color="#10B981" />
            <StatPill label="تحت التسويق" count={counts.under_marketing || 0} color="#3B82F6" />
            <StatPill label="قيد المراجعة" count={counts.under_review || 0} color="#F59E0B" />
            <StatPill label="الإجمالي" count={families.length} color="#1B5E8C" />
          </div>
        )}

        <div className="flex gap-2.5 flex-wrap items-center bg-white border border-[#e5eaf0] rounded-[0.875rem] px-4 py-3.5 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 flex pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="ابحث باسم الأسرة أو المعيل أو المندوب…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-gray-50 hover:border-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5"
              ><X size={16} /></button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 flex pointer-events-none z-[1]">
              <Filter size={15} />
            </span>
            <Select
              className="py-2 pr-9 pl-7 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-primary/10"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">جميع الحالات</option>
              {Object.entries(STATUS_MAP).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </Select>
          </div>

          {/* Governorate filter */}
          <div>
            <Select
              className="py-2 pr-3.5 pl-7 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-primary/10"
              value={filterGov}
              onChange={(e) => setFilterGov(e.target.value)}
            >
              <option value="all">جميع المحافظات</option>
              {uniqueGovs.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
          </div>

          {/* Clear filters */}
          {(search || filterStatus !== 'all' || filterGov !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterGov('all'); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold cursor-pointer whitespace-nowrap hover:bg-red-100 transition-colors"
            >
              مسح الفلاتر <X size={14} />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="bg-white border border-[#e5eaf0] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(27,94,140,.05)]">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-b-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite] shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-[45%] rounded bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
                  <div className="h-2.5 w-[30%] rounded bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
                </div>
                <div className="w-[90px] h-5 rounded-full bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
                <div className="w-20 h-3 rounded bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center bg-white border border-[#e5eaf0] rounded-2xl p-8">
            <div className="text-gray-300"><Users size={40} /></div>
            <h3 className="text-base font-bold text-gray-700 m-0">
              {families.length === 0 ? 'لا توجد أسر مسجّلة بعد' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-sm text-gray-400 m-0">
              {families.length === 0
                ? 'ابدأ بتسجيل أول أسرة'
                : 'جرّب تغيير معايير البحث أو الفلتر'}
            </p>
            {families.length === 0 && (
              <Button variant="primary" onClick={() => router.push('/families/new')}>
                + تسجيل أسرة جديدة
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white border border-[#e5eaf0] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(27,94,140,.05)]">
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">اسم الأسرة</th>
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">المعيل / رب الأسرة</th>
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">عدد الأفراد</th>
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">المحافظة</th>
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">الحالة</th>
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap max-sm:hidden">المندوب</th>
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap max-sm:hidden">الكافل</th>
                  <th className="px-4 py-3 text-right text-[.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap max-sm:hidden">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    className="cursor-pointer transition-colors duration-100 hover:bg-[#f8fbff] [&:last-child_td]:border-b-0"
                    onClick={() => router.push(`/families/${f.id}`)}
                  >
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center shrink-0"><Users size={16} /></div>
                        <span className="font-bold text-gray-800">{f.family_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle text-[#6b7a8d]">{f.head_of_family || '—'}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle">
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-green-50 border border-green-200 rounded-full text-[.72rem] font-bold text-green-700">{f.member_count || '—'} فرد</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle text-[#6b7a8d]">{f.governorate_ar || '—'}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle text-[#6b7a8d] max-sm:hidden">{f.agent_name || '—'}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle text-[#6b7a8d] max-sm:hidden">{f.sponsor_name || '—'}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-50 align-middle text-[#6b7a8d] max-sm:hidden">{formatDate(f.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="px-4 py-3 text-xs text-gray-400 border-t border-[#f0f4f8]">
              عرض {filtered.length} من {families.length} أسرة ·
              إجمالي الأفراد في الكشف:{' '}
              {filtered.reduce((s, f) => s + (parseInt(f.member_count) || 0), 0)} فرد
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
