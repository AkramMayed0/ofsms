'use client';

/**
 * Route: /governorates  (GM only)
 */

import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import ExportButtons from '../../components/ExportButtons';

const STATUS = {
  under_review:      { label: 'قيد المراجعة',  color: '#92400E', bg: '#FEF3C7' },
  under_marketing:   { label: 'تحت التسويق',   color: '#1E40AF', bg: '#EFF6FF' },
  under_sponsorship: { label: 'تحت الكفالة',   color: '#065F46', bg: '#ECFDF5' },
  rejected:          { label: 'مرفوض',         color: '#991B1B', bg: '#FEF2F2' },
  inactive:          { label: 'غير نشط',       color: '#6B7280', bg: '#F3F4F6' },
};

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
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

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/gm'),
      api.get('/governorates'),
    ])
      .then(([dashRes, govsRes]) => {
        const stats = dashRes.data.orphans_per_governorate || [];
        const govs  = govsRes.data.data || [];
        const merged = govs.map(g => {
          const stat = stats.find(s => s.governorate_ar === g.name_ar);
          return { id: g.id, name: g.name_ar, nameEn: g.name_en, count: stat ? parseInt(stat.count) : 0 };
        }).sort((a, b) => b.count - a.count);
        setGovStats(merged);
      })
      .catch(() => setErrorLeft('تعذّر تحميل بيانات المحافظات'))
      .finally(() => setLoadingLeft(false));
  }, []);

  const selectGovernorate = useCallback((gov) => {
    if (selected?.id === gov.id) return;
    setSelected(gov);
    setOrphans([]);
    setSearch('');
    setStatusFilter('all');
    setErrorRight('');
    setLoadingRight(true);
    api.get(`/governorates/${gov.id}/orphans`)
      .then(({ data }) => setOrphans(data.orphans || []))
      .catch(() => setErrorRight(`تعذّر تحميل أيتام ${gov.name}`))
      .finally(() => setLoadingRight(false));
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
      <div dir="rtl" style={{ fontFamily:"'Cairo','Tajawal',sans-serif", height:'calc(100vh - 80px)', display:'flex', flexDirection:'column', gap:'1rem' }}>

        <style>{`
          @keyframes gv-spin { to { transform: rotate(360deg); } }
          @keyframes gv-fade { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:none; } }
          @keyframes gv-bar  { from { width: 0 } }
          .gv-gov-row:hover  { background: #f0f7ff !important; border-color: #93c5fd !important; }
          .gv-gov-active     { background: #eff6ff !important; border-color: #1B5E8C !important; }
          .gv-orphan-row:hover td { background: #f8fbff !important; }
          .gv-input:focus    { border-color: #1B5E8C !important; box-shadow: 0 0 0 3px rgba(27,94,140,.1) !important; background: #fff !important; }
          .gv-filter:hover   { border-color: #1B5E8C; color: #1B5E8C; }
        `}</style>

        {/* Page title */}
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#0d3d5c', margin:'0 0 .2rem' }}>تحليلات المحافظات</h1>
          <p style={{ fontSize:'.83rem', color:'#6b7a8d', margin:0 }}>
            {loadingLeft ? 'جارٍ التحميل…' : `${govStats.filter(g => g.count > 0).length} محافظة بها أيتام · ${govStats.reduce((s,g) => s + g.count, 0)} يتيم إجمالي`}
          </p>
        </div>

        {/* Two-panel layout */}
        <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'1rem', flex:1, minHeight:0 }}>

          {/* LEFT panel */}
          <div style={{ background:'#fff', border:'1.5px solid #e5eaf0', borderRadius:'1rem', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.1rem .75rem', borderBottom:'1px solid #f0f4f8', flexShrink:0 }}>
              <h2 style={{ fontSize:'.88rem', fontWeight:700, color:'#1B5E8C', margin:0 }}>
                📍 المحافظات ({govStats.length})
              </h2>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'.5rem .6rem' }}>
              {loadingLeft ? <LeftSkeleton /> : errorLeft ? (
                <p style={{ color:'#b91c1c', fontSize:'.82rem', padding:'1rem', textAlign:'center' }}>⚠ {errorLeft}</p>
              ) : govStats.map(gov => (
                <div
                  key={gov.id}
                  className={`gv-gov-row ${selected?.id === gov.id ? 'gv-gov-active' : ''}`}
                  onClick={() => gov.count > 0 && selectGovernorate(gov)}
                  style={{ display:'flex', flexDirection:'column', gap:'.35rem', padding:'.65rem .85rem', borderRadius:'.75rem', marginBottom:'.3rem', border:'1.5px solid transparent', cursor: gov.count > 0 ? 'pointer' : 'default', opacity: gov.count === 0 ? 0.45 : 1, transition:'all .15s' }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                      {selected?.id === gov.id && <span style={{ color:'#1B5E8C', fontWeight:800, fontSize:'.8rem' }}>▶</span>}
                      <span style={{ fontSize:'.85rem', fontWeight:600, color:'#1f2937' }}>{gov.name}</span>
                    </div>
                    <span style={{ fontSize:'.72rem', fontWeight:800, minWidth:'1.6rem', textAlign:'center', padding:'.15rem .5rem', borderRadius:'2rem', background: gov.count > 0 ? '#1B5E8C' : '#e5e7eb', color: gov.count > 0 ? '#fff' : '#9ca3af' }}>
                      {gov.count}
                    </span>
                  </div>
                  <div style={{ height:5, background:'#f0f4f8', borderRadius:'999px', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:'999px', width:`${(gov.count / maxCount) * 100}%`, background: selected?.id === gov.id ? 'linear-gradient(90deg,#1B5E8C,#2E7EB8)' : 'linear-gradient(90deg,#93c5fd,#60a5fa)', animation:'gv-bar .6s ease both' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT panel */}
          <div style={{ background:'#fff', border:'1.5px solid #e5eaf0', borderRadius:'1rem', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {!selected ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', color:'#9ca3af', padding:'2rem', textAlign:'center' }}>
                <div style={{ fontSize:'3.5rem' }}>🗺️</div>
                <div>
                  <p style={{ fontSize:'1rem', fontWeight:700, color:'#374151', margin:'0 0 .4rem' }}>اختر محافظة من القائمة</p>
                  <p style={{ fontSize:'.82rem', margin:0 }}>سيظهر هنا جدول الأيتام المسجلين في المحافظة المختارة</p>
                </div>
              </div>
            ) : (
              <>
                {/* Right header */}
                <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f0f4f8', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem', marginBottom:'.75rem' }}>
                    <div>
                      <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0d3d5c', margin:'0 0 .15rem' }}>📍 {selected.name}</h2>
                      <p style={{ fontSize:'.78rem', color:'#9ca3af', margin:0 }}>
                        {loadingRight ? 'جارٍ التحميل…' : `${orphans.length} يتيم مسجل`}
                      </p>
                    </div>
                    {/* Status chips */}
                    {!loadingRight && orphans.length > 0 && (
                      <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center' }}>
                        {Object.entries(statusCounts).map(([status, count]) => {
                          const cfg = STATUS[status];
                          if (!cfg) return null;
                          return (
                            <span key={status} style={{ fontSize:'.68rem', fontWeight:700, padding:'.2rem .6rem', borderRadius:'2rem', background:cfg.bg, color:cfg.color }}>
                              {cfg.label}: {count}
                            </span>
                          );
                        })}
                        {/* ── Export buttons ── */}
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
                    <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', alignItems:'center' }}>
                      <div style={{ position:'relative', flex:1, minWidth:180 }}>
                        <span style={{ position:'absolute', right:'.75rem', top:'50%', transform:'translateY(-50%)', fontSize:'.85rem', pointerEvents:'none' }}>🔍</span>
                        <input
                          className="gv-input"
                          style={{ width:'100%', border:'1.5px solid #d1d5db', borderRadius:'.625rem', padding:'.55rem .85rem .55rem 2rem', paddingRight:'2.2rem', fontSize:'.82rem', fontFamily:'Cairo,sans-serif', background:'#fafafa', outline:'none', boxSizing:'border-box' }}
                          placeholder="ابحث بالاسم أو الكافل أو المندوب…"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                          <button onClick={() => setSearch('')} style={{ position:'absolute', left:'.6rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'.8rem' }}>✕</button>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap' }}>
                        {[{ key:'all', label:'الكل' }, ...Object.entries(STATUS).map(([k,v]) => ({ key:k, label:v.label }))].map(({ key, label }) => (
                          <button key={key} className="gv-filter"
                            onClick={() => setStatusFilter(key)}
                            style={{ padding:'.3rem .7rem', border:`1.5px solid ${statusFilter === key ? '#1B5E8C' : '#e5eaf0'}`, borderRadius:'2rem', fontSize:'.72rem', fontWeight:600, color: statusFilter === key ? '#fff' : '#6b7280', background: statusFilter === key ? '#1B5E8C' : '#fff', cursor:'pointer', fontFamily:'Cairo,sans-serif', transition:'all .15s' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div style={{ flex:1, overflowY:'auto' }}>
                  {loadingRight ? <RightSkeleton /> : errorRight ? (
                    <div style={{ padding:'2rem', textAlign:'center', color:'#b91c1c', fontSize:'.85rem' }}>⚠ {errorRight}</div>
                  ) : filteredOrphans.length === 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.5rem', padding:'3rem 2rem', color:'#9ca3af', textAlign:'center' }}>
                      <span style={{ fontSize:'2.5rem' }}>{orphans.length === 0 ? '🏜️' : '🔍'}</span>
                      <p style={{ fontWeight:700, color:'#374151', margin:'0 0 .25rem', fontSize:'.9rem' }}>
                        {orphans.length === 0 ? 'لا يوجد أيتام في هذه المحافظة' : 'لا توجد نتائج مطابقة'}
                      </p>
                      <p style={{ fontSize:'.8rem', margin:0 }}>
                        {orphans.length === 0 ? 'لم يُسجَّل أي يتيم بعد' : 'جرّب تغيير معايير البحث'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ animation:'gv-fade .25s ease' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.8rem' }}>
                        <thead>
                          <tr style={{ background:'#f8fafc', position:'sticky', top:0, zIndex:1 }}>
                            {['#','الاسم','العمر','الحالة','الكافل','المندوب','تاريخ التسجيل'].map(h => (
                              <th key={h} style={{ padding:'.75rem .9rem', textAlign:'right', fontSize:'.72rem', fontWeight:700, color:'#6b7a8d', whiteSpace:'nowrap', borderBottom:'2px solid #e5eaf0' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrphans.map((o, idx) => {
                            const cfg = STATUS[o.status] || STATUS.inactive;
                            return (
                              <tr key={o.id} className="gv-orphan-row">
                                <td style={{ padding:'.75rem .9rem', color:'#9ca3af', borderBottom:'1px solid #f8fafc', fontSize:'.72rem' }}>{idx + 1}</td>
                                <td style={{ padding:'.75rem .9rem', borderBottom:'1px solid #f8fafc' }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                                    <span style={{ fontSize:'1rem' }}>{o.gender === 'female' ? '👧' : '👦'}</span>
                                    <div>
                                      <div style={{ fontWeight:700, color:'#0d3d5c', fontSize:'.85rem' }}>{o.full_name}</div>
                                      {o.is_gifted && <span style={{ fontSize:'.63rem', fontWeight:700, color:'#f59e0b' }}>🌟 موهوب</span>}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding:'.75rem .9rem', borderBottom:'1px solid #f8fafc', color:'#6b7a8d', whiteSpace:'nowrap' }}>{calcAge(o.date_of_birth)}</td>
                                <td style={{ padding:'.75rem .9rem', borderBottom:'1px solid #f8fafc' }}>
                                  <span style={{ fontSize:'.7rem', fontWeight:700, padding:'.2rem .6rem', borderRadius:'2rem', background:cfg.bg, color:cfg.color, whiteSpace:'nowrap' }}>{cfg.label}</span>
                                </td>
                                <td style={{ padding:'.75rem .9rem', borderBottom:'1px solid #f8fafc', color: o.sponsor_name ? '#065F46' : '#9ca3af', fontSize:'.8rem', fontWeight: o.sponsor_name ? 600 : 400 }}>
                                  {o.sponsor_name || 'بدون كافل'}
                                </td>
                                <td style={{ padding:'.75rem .9rem', borderBottom:'1px solid #f8fafc', color:'#6b7a8d', fontSize:'.8rem' }}>{o.agent_name || '—'}</td>
                                <td style={{ padding:'.75rem .9rem', borderBottom:'1px solid #f8fafc', color:'#9ca3af', fontSize:'.75rem', whiteSpace:'nowrap' }}>
                                  {o.created_at ? new Date(o.created_at).toLocaleDateString('ar-YE', { dateStyle:'medium' }) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div style={{ padding:'.65rem 1rem', fontSize:'.75rem', color:'#9ca3af', borderTop:'1px solid #f0f4f8', background:'#fafafa' }}>
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
    <div style={{ display:'flex', flexDirection:'column', gap:'.4rem', padding:'.25rem' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ height:52, borderRadius:'.75rem', background:'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize:'200% 100%', animation:'gv-spin 1.4s infinite' }} />
      ))}
    </div>
  );
}

function RightSkeleton() {
  return (
    <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'.5rem' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ height:44, borderRadius:'.625rem', background:'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize:'200% 100%', animation:'gv-spin 1.4s infinite' }} />
      ))}
    </div>
  );
}
