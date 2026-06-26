'use client';

/**
 * Route: /governorates  (GM only)
 */

import { useEffect, useState, useCallback } from 'react';
import { Search, AlertTriangle, X, User, MapPin, Map, Users, Star, ArrowRight } from 'lucide-react';
import SearchField from '@/components/ui/SearchField';

import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import ExportButtons from '../../components/ExportButtons';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const STATUS = {
  under_review:      { label: 'قيد المراجعة',  color: '#92400E', bg: '#FEF3C7', textClass: 'text-amber-800', bgClass: 'bg-amber-50', borderClass: 'border-amber-200' },
  under_marketing:   { label: 'تحت التسويق',   color: '#1E40AF', bg: '#EFF6FF', textClass: 'text-blue-800', bgClass: 'bg-blue-50', borderClass: 'border-blue-200' },
  under_sponsorship: { label: 'تحت الكفالة',   color: '#065F46', bg: '#ECFDF5', textClass: 'text-emerald-800', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200' },
  rejected:          { label: 'مرفوض',         color: '#991B1B', bg: '#FEF2F2', textClass: 'text-red-800', bgClass: 'bg-red-50', borderClass: 'border-red-200' },
  inactive:          { label: 'غير نشط',       color: '#6B7280', bg: '#F3F4F6', textClass: 'text-gray-800', bgClass: 'bg-gray-50', borderClass: 'border-gray-200' },
};

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / MS_PER_YEAR)} سنة`;
};

export default function GovernoratesPage() {
  const [govStats, setGovStats]           = useState([]);
  const [selected, setSelected]           = useState(null);
  const [orphans, setOrphans]             = useState([]);
  const [loadingLeft, setLoadingLeft]     = useState(true);
  const [loadingRight, setLoadingRight]   = useState(false);
  const [errorLeft, setErrorLeft]         = useState('');
  const [errorRight, setErrorRight]       = useState('');
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [isMobile, setIsMobile]           = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, govsRes] = await Promise.all([
          api.get('/dashboard/gm'),
          api.get('/governorates'),
        ]);
        const stats = dashRes.data.orphans_per_governorate || [];
        const govs  = govsRes.data.data || [];
        const merged = govs.map(g => {
          const stat = stats.find(s => s.governorate_ar === g.name_ar);
          return { id: g.id, name: g.name_ar, nameEn: g.name_en, count: stat ? parseInt(stat.count) : 0 };
        }).sort((a, b) => b.count - a.count);
        setGovStats(merged);
      } catch (err) {
        console.error('Failed to load initial governorate data:', err);
        setErrorLeft('تعذّر تحميل بيانات المحافظات');
      } finally {
        setLoadingLeft(false);
      }
    }
    loadData();
  }, []);

  const selectGovernorate = useCallback(async (gov) => {
    if (selected?.id === gov.id) return;
    setSelected(gov);
    setOrphans([]);
    setSearch('');
    setStatusFilter('all');
    setErrorRight('');
    setLoadingRight(true);
    try {
      const { data } = await api.get(`/governorates/${gov.id}/orphans`);
      setOrphans(data.orphans || []);
    } catch (err) {
      console.error(`Failed to load orphans for governorate ${gov.name} (ID: ${gov.id}):`, err);
      setErrorRight(`تعذّر تحميل أيتام ${gov.name}`);
    } finally {
      setLoadingRight(false);
    }
  }, [selected]);

  const maxCount = Math.max(...govStats.map(g => g.count), 1);

  const filteredOrphans = orphans.filter(o => {
    const matchSearch = !search ||
      o.full_name?.includes(search) ||
      o.agent_name?.includes(search) ||
      o.sponsor_name?.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = orphans.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <div dir="rtl" className="font-sans min-h-[calc(100vh-80px)] flex flex-col gap-4">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#0d3d5c] mb-1">تحليلات المحافظات</h1>
          <p className="text-[0.83rem] text-[#6b7a8d] m-0">
            {loadingLeft ? 'جارٍ التحميل…' : `${govStats.filter(g => g.count > 0).length} محافظة بها أيتام · ${govStats.reduce((s,g) => s + g.count, 0)} يتيم إجمالي`}
          </p>
        </div>

        {/* Two-panel layout */}
        <div className={`grid gap-4 flex-1 ${isMobile ? 'grid-cols-1 min-h-auto' : 'grid-cols-[320px_1fr] min-h-0'}`}>

          {/* LEFT panel — hidden on mobile when a governorate is selected */}
          <div className={`bg-white border-[1.5px] border-[#e5eaf0] rounded-[1rem] flex-col overflow-hidden ${isMobile && selected ? 'hidden' : 'flex'} ${isMobile ? 'min-h-[400px]' : 'min-h-0'}`}>
            <div className="px-[1.1rem] pt-4 pb-3 border-b border-[#f0f4f8] flex-shrink-0">
              <h2 className="text-[0.88rem] font-bold text-primary m-0 flex items-center gap-1.5">
                <MapPin size={15} /> المحافظات ({govStats.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-2.5 py-2">
              {loadingLeft ? <LeftSkeleton /> : errorLeft ? (
                <p className="text-[#b91c1c] text-[0.82rem] p-4 text-center"><AlertTriangle size={18} /> {errorLeft}</p>
              ) : govStats.map(gov => (
                <div
                  key={gov.id}
                  onClick={() => gov.count > 0 && selectGovernorate(gov)}
                  className={`flex flex-col gap-1 px-3.5 py-2.5 rounded-[0.75rem] mb-1.5 border-[1.5px] border-transparent transition-all duration-150 ${gov.count > 0 ? 'cursor-pointer hover:bg-[#f0f7ff] hover:border-[#93c5fd]' : 'cursor-default opacity-45'} ${selected?.id === gov.id ? 'bg-[#eff6ff] border-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selected?.id === gov.id && <span className="text-primary font-extrabold text-[0.8rem]">▶</span>}
                      <span className="text-[0.85rem] font-semibold text-gray-800">{gov.name}</span>
                    </div>
                    <span className={`text-[0.72rem] font-extrabold min-w-[1.6rem] text-center px-2 py-0.5 rounded-full ${gov.count > 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {gov.count}
                    </span>
                  </div>
                  <div className="h-1 bg-[#f0f4f8] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full animate-gvBar ${selected?.id === gov.id ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-gradient-to-r from-blue-300 to-blue-400'}`}
                      style={{ width: `${(gov.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT panel — hidden on mobile when nothing is selected */}
          <div className={`bg-white border-[1.5px] border-[#e5eaf0] rounded-[1rem] flex-col overflow-hidden ${isMobile && !selected ? 'hidden' : 'flex'} ${isMobile ? 'min-h-[400px]' : 'min-h-0'} ${isMobile && selected ? 'animate-gvSlideIn' : ''}`}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8 text-center">
                <Map size={52} strokeWidth={1.2} className="text-gray-300" />
                <div>
                  <p className="text-base font-bold text-gray-700 mb-1.5">اختر محافظة من القائمة</p>
                  <p className="text-[0.82rem] m-0">سيظهر هنا جدول الأيتام المسجلين في المحافظة المختارة</p>
                </div>
              </div>
            ) : (
              <>
                {/* Right header */}
                <div className="px-5 py-4 border-b border-[#f0f4f8] flex-shrink-0">
                  {/* Mobile back button */}
                  {isMobile && (
                    <button
                      onClick={() => setSelected(null)}
                      className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 border-[1.5px] border-[#e5eaf0] rounded-[0.625rem] bg-slate-50 text-primary text-[0.8rem] font-bold cursor-pointer transition-colors duration-150 hover:bg-[#f0f7ff]"
                    >
                      <ArrowRight size={15} /> العودة للمحافظات
                    </button>
                  )}
                  <div className={`flex justify-between gap-3 mb-3 ${isMobile ? 'flex-col items-stretch' : 'flex-row items-start'}`}>
                    <div>
                      <h2 className={`font-extrabold text-[#0d3d5c] mb-0.5 flex items-center gap-1.5 ${isMobile ? 'text-base' : 'text-[1.1rem]'}`}><MapPin size={16} /> {selected.name}</h2>
                      <p className="text-[0.78rem] text-gray-400 m-0">
                        {loadingRight ? 'جارٍ التحميل…' : `${orphans.length} يتيم مسجل`}
                      </p>
                    </div>
                    {/* Status chips + export */}
                    {!loadingRight && orphans.length > 0 && (
                      <div className={`flex gap-1.5 flex-wrap items-center ${isMobile ? 'justify-start' : 'justify-end'}`}>
                        {Object.entries(statusCounts).map(([status, count]) => {
                          const cfg = STATUS[status];
                          if (!cfg) return null;
                          return (
                            <span key={status} className={`text-[0.68rem] font-bold px-2.5 py-0.8 rounded-full border-[1.5px] ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}>
                              {cfg.label}: {count}
                            </span>
                          );
                        })}
                        <ExportButtons
                          pdfUrl={`/reports/governorate/${selected.id}/pdf`}
                          excelUrl={`/reports/governorate/${selected.id}/excel`}
                          filename={`أيتام-${selected.name}`}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Toolbar */}
                  {!loadingRight && orphans.length > 0 && (
                    <div className={`flex gap-2.5 flex-wrap ${isMobile ? 'flex-col items-stretch' : 'flex-row items-center'}`}>
                      <SearchField
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onClear={() => setSearch('')}
                        placeholder="ابحث بالاسم أو الكافل أو المندوب…"
                        className={`flex-1 ${isMobile ? 'min-w-0' : 'min-w-[180px]'}`}
                        inputClassName="py-2 border-gray-300 text-[0.82rem] focus:ring-4 focus:ring-primary/10"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {[{ key:'all', label:'الكل' }, ...Object.entries(STATUS).map(([k,v]) => ({ key:k, label:v.label }))].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`px-3 py-1.5 border-[1.5px] rounded-full text-[0.72rem] font-semibold cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary ${statusFilter === key ? 'border-primary text-white bg-primary' : 'border-[#e5eaf0] text-gray-500 bg-white'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                  {loadingRight ? <RightSkeleton /> : errorRight ? (
                    <div className="p-8 text-center text-[#b91c1c] text-[0.85rem]"><AlertTriangle size={18} /> {errorRight}</div>
                  ) : filteredOrphans.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 px-8 text-gray-400 text-center">
                      {orphans.length === 0 ? <Users size={40} strokeWidth={1.2} className="text-gray-300" /> : <Search size={28} className="text-gray-300" />}
                      <p className="font-bold text-gray-700 mb-1 text-[0.9rem]">
                        {orphans.length === 0 ? 'لا يوجد أيتام في هذه المحافظة' : 'لا توجد نتائج مطابقة'}
                      </p>
                      <p className="text-[0.8rem] m-0">
                        {orphans.length === 0 ? 'لم يُسجَّل أي يتيم بعد' : 'جرّب تغيير معايير البحث'}
                      </p>
                    </div>
                  ) : (
                    <div className="animate-gvFade">
                      <div className="overflow-x-auto [webkit-overflow-scrolling:touch]">
                      <table className={`w-full border-collapse text-[0.8rem] ${isMobile ? 'min-w-0' : 'min-w-[600px]'}`}>
                        <thead>
                          <tr className="bg-slate-50 sticky top-0 z-10">
                            {['#','الاسم','العمر','الحالة','الكافل', ...(!isMobile ? ['المندوب','تاريخ التسجيل'] : [])].map(h => (
                              <th key={h} className="px-3.5 py-3 text-right text-[0.72rem] font-bold text-slate-500 whitespace-nowrap border-b-2 border-[#e5eaf0]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrphans.map((o, idx) => {
                            const cfg = STATUS[o.status] || STATUS.inactive;
                            return (
                              <tr key={o.id} className="hover:bg-sky-50/20 transition-colors">
                                <td className="px-3.5 py-3 text-gray-400 border-b border-slate-50 text-[0.72rem]">{idx + 1}</td>
                                <td className="px-3.5 py-3 border-b border-slate-50">
                                  <div className="flex items-center gap-2">
                                    <User size={17} className={`flex-shrink-0 ${o.gender === 'female' ? 'text-pink-600' : 'text-primary'}`} />
                                    <div>
                                      <div className="font-bold text-[#0d3d5c] text-[0.85rem]">{o.full_name}</div>
                                      {o.is_gifted && <span className="text-[0.63rem] font-bold text-amber-500 inline-flex items-center gap-1"><Star size={10} fill="#f59e0b" /> موهوب</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3.5 py-3 border-b border-slate-50 text-slate-500 whitespace-nowrap">{calcAge(o.date_of_birth)}</td>
                                <td className="px-3.5 py-3 border-b border-slate-50">
                                  <span className={`text-[0.7rem] font-bold px-2.5 py-0.8 rounded-full border-[1.5px] ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} whitespace-nowrap`}>{cfg.label}</span>
                                </td>
                                <td className={`px-3.5 py-3 border-b border-slate-50 text-[0.8rem] ${o.sponsor_name ? 'text-emerald-800 font-semibold' : 'text-gray-400 font-normal'}`}>
                                  {o.sponsor_name || 'بدون كافل'}
                                </td>
                                {!isMobile && <>
                                  <td className="px-3.5 py-3 border-b border-slate-50 text-slate-500 text-[0.8rem]">{o.agent_name || '—'}</td>
                                  <td className="px-3.5 py-3 border-b border-slate-50 text-gray-400 text-[0.75rem] whitespace-nowrap">
                                    {o.created_at ? new Date(o.created_at).toLocaleDateString('ar-YE', { dateStyle:'medium' }) : '—'}
                                  </td>
                                </>}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                      <div className="px-4 py-2.5 text-[0.75rem] text-gray-400 border-t border-[#f0f4f8] bg-gray-50">
                        عرض {filteredOrphans.length} من {orphans.length} يتيم في {selected.name}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LeftSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 p-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-[52px] rounded-[0.75rem] animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%]" />
      ))}
    </div>
  );
}

function RightSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-11 rounded-[0.625rem] animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%]" />
      ))}
    </div>
  );
}
