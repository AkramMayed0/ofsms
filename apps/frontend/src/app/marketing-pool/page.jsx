'use client';

/**
 * page.jsx
 * Route:  /marketing-pool  (GM only)
 *
 * Shows all orphans + families with status = under_marketing.
 * GM selects one or more and assigns them to a sponsor.
 *
 * APIs:
 *   GET  /api/orphans/marketing          → orphans ready for sponsorship
 *   GET  /api/families/marketing         → families ready for sponsorship
 *   GET  /api/sponsors                   → existing sponsors
 *   POST /api/sponsors                   → create new sponsor
 *   POST /api/sponsors/:id/sponsorships  → assign beneficiary
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};
const todayStr = () => new Date().toISOString().split('T')[0];

// ── Modal (self-contained, all styles inline via style prop) ──────────────────
function AssignModal({ selected, sponsors, onClose, onSuccess }) {
  const [tab, setTab] = useState('existing');
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [newSponsor, setNewSponsor] = useState({ fullName: '', phone: '', email: '', portalPassword: '' });
  const [startDate, setStartDate] = useState(todayStr());
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [intermediary, setIntermediary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = sponsors.filter(s =>
    !sponsorSearch ||
    s.full_name?.includes(sponsorSearch) ||
    s.email?.includes(sponsorSearch)
  );

  const handleSubmit = async () => {
    setError('');
    if (tab === 'existing' && !sponsorId) { setError('يرجى اختيار كافل'); return; }
    if (tab === 'new') {
      if (!newSponsor.fullName.trim()) { setError('اسم الكافل مطلوب'); return; }
      if (!newSponsor.portalPassword || newSponsor.portalPassword.length < 8) {
        setError('كلمة مرور البوابة يجب أن تكون 8 أحرف على الأقل'); return;
      }
    }
    if (!startDate) { setError('تاريخ البداية مطلوب'); return; }
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) { setError('المبلغ الشهري مطلوب'); return; }

    setLoading(true);
    try {
      let finalSponsorId = sponsorId;
      if (tab === 'new') {
        const { data } = await api.post('/sponsors', {
          fullName: newSponsor.fullName.trim(),
          phone: newSponsor.phone.trim() || undefined,
          email: newSponsor.email.trim() || undefined,
          portalPassword: newSponsor.portalPassword,
        });
        finalSponsorId = data.sponsor.id;
      }

      for (const item of selected) {
        await api.post(`/sponsors/${finalSponsorId}/sponsorships`, {
          beneficiaryType: item.type,
          beneficiaryId: item.id,
          agentId: item.agent_id,
          intermediary: intermediary.trim() || undefined,
          startDate,
          monthlyAmount: parseFloat(monthlyAmount),
        });
      }
      onSuccess(selected.length);
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ أثناء التعيين'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── All styles via JS objects (avoids styled-jsx cross-component scoping) ──
  const s = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(13,61,92,0.55)',
      backdropFilter: 'blur(3px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', animation: 'none',
    },
    box: {
      background: '#fff', borderRadius: '1.25rem', width: '100%',
      maxWidth: '540px', maxHeight: '90vh', display: 'flex',
      flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
      overflow: 'hidden',
    },
    head: {
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '1.5rem 1.5rem 0', gap: '1rem',
    },
    title: { fontSize: '1.15rem', fontWeight: 800, color: '#0d3d5c', margin: '0 0 .2rem' },
    sub: { fontSize: '.8rem', color: '#6b7a8d', margin: 0 },
    closeBtn: {
      background: 'none', border: 'none', fontSize: '1.2rem', color: '#9ca3af',
      cursor: 'pointer', padding: '.25rem .4rem', borderRadius: '6px', lineHeight: 1,
    },
    tabs: { display: 'flex', gap: '.5rem', padding: '.9rem 1.5rem 0' },
    tab: (active) => ({
      flex: 1, padding: '.55rem 1rem', border: `1.5px solid ${active ? '#1B5E8C' : '#e5eaf0'}`,
      borderRadius: '.625rem', fontFamily: 'Cairo, sans-serif', fontSize: '.83rem',
      fontWeight: 600, color: active ? '#fff' : '#6b7280',
      background: active ? '#1B5E8C' : '#fafafa', cursor: 'pointer', transition: 'all .15s',
    }),
    body: { flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' },
    label: { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' },
    input: {
      width: '100%', border: '1.5px solid #d1d5db', borderRadius: '.625rem',
      padding: '.65rem .9rem', fontSize: '.88rem', fontFamily: 'Cairo, sans-serif',
      color: '#1f2937', background: '#fafafa', outline: 'none', boxSizing: 'border-box',
      transition: 'border-color .15s',
    },
    sponsorBox: {
      border: '1.5px solid #e5eaf0', borderRadius: '.625rem',
      maxHeight: '170px', overflowY: 'auto', background: '#fafafa', marginTop: '.35rem',
    },
    sponsorRow: (active) => ({
      display: 'flex', alignItems: 'center', gap: '.65rem',
      padding: '.6rem .85rem', cursor: 'pointer',
      background: active ? '#eff6ff' : 'transparent',
      borderBottom: '1px solid #f0f4f8', transition: 'background .1s',
    }),
    sponsorAvatar: {
      width: 32, height: 32, borderRadius: '50%',
      background: 'linear-gradient(135deg,#1B5E8C,#0d3d5c)',
      color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '.85rem', fontWeight: 700, flexShrink: 0,
    },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' },
    divider: {
      fontSize: '.72rem', fontWeight: 700, color: '#94a3b8',
      textAlign: 'center', padding: '.25rem 0',
      borderTop: '1px solid #f0f4f8', borderBottom: '1px solid #f0f4f8',
    },
    preview: {
      background: '#f8fafc', border: '1.5px solid #e5eaf0',
      borderRadius: '.625rem', padding: '.75rem .9rem',
    },
    chip: (type) => ({
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      padding: '.2rem .65rem', borderRadius: '2rem', fontSize: '.75rem', fontWeight: 600,
      background: type === 'orphan' ? '#dbeafe' : '#dcfce7',
      color: type === 'orphan' ? '#1d4ed8' : '#15803d',
      margin: '.2rem',
    }),
    errBox: {
      display: 'flex', alignItems: 'center', gap: '.5rem',
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: '.5rem', padding: '.65rem .9rem',
      fontSize: '.82rem', color: '#b91c1c', fontWeight: 500,
    },
    foot: {
      display: 'flex', justifyContent: 'flex-end', gap: '.75rem',
      padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8',
    },
    btnPrimary: (disabled) => ({
      display: 'inline-flex', alignItems: 'center', gap: '.4rem',
      padding: '.7rem 1.5rem',
      background: disabled ? '#94a3b8' : 'linear-gradient(135deg,#1B5E8C,#134569)',
      color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: '.9rem',
      fontWeight: 700, border: 'none', borderRadius: '.75rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 2px 8px rgba(27,94,140,.3)',
    }),
    btnGhost: {
      display: 'inline-flex', alignItems: 'center', gap: '.4rem',
      padding: '.65rem 1.25rem', background: 'none', color: '#6b7280',
      fontFamily: 'Cairo, sans-serif', fontSize: '.88rem', fontWeight: 600,
      border: '1.5px solid #e5eaf0', borderRadius: '.75rem', cursor: 'pointer',
    },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} dir="rtl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.head}>
          <div>
            <h2 style={s.title}>تعيين كافل</h2>
            <p style={s.sub}>
              {selected.length} مستفيد مختار ·{' '}
              {selected.filter(i => i.type === 'orphan').length} يتيم،{' '}
              {selected.filter(i => i.type === 'family').length} أسرة
            </p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'existing')} onClick={() => setTab('existing')}>🤝 كافل موجود</button>
          <button style={s.tab(tab === 'new')} onClick={() => setTab('new')}>➕ كافل جديد</button>
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* Existing sponsor */}
          {tab === 'existing' && (
            <div>
              <label style={s.label}>اختر الكافل <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                style={s.input}
                placeholder="ابحث بالاسم أو البريد…"
                value={sponsorSearch}
                onChange={e => setSponsorSearch(e.target.value)}
              />
              <div style={s.sponsorBox}>
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '.82rem', padding: '1rem', margin: 0 }}>
                    لا يوجد كفلاء مطابقون
                  </p>
                )}
                {filtered.map(sp => (
                  <div
                    key={sp.id}
                    style={s.sponsorRow(sponsorId === sp.id)}
                    onClick={() => setSponsorId(sp.id)}
                  >
                    <div style={s.sponsorAvatar}>{sp.full_name?.charAt(0) || '؟'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1f2937' }}>{sp.full_name}</div>
                      {sp.email && <div style={{ fontSize: '.72rem', color: '#9ca3af', direction: 'ltr', textAlign: 'left' }}>{sp.email}</div>}
                    </div>
                    {sponsorId === sp.id && <span style={{ color: '#1B5E8C', fontWeight: 800 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New sponsor */}
          {tab === 'new' && (
            <div style={s.grid2}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.label}>اسم الكافل <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={s.input} placeholder="الاسم الكامل"
                  value={newSponsor.fullName}
                  onChange={e => setNewSponsor(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>رقم الهاتف</label>
                <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} placeholder="+967700000000"
                  value={newSponsor.phone}
                  onChange={e => setNewSponsor(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>البريد الإلكتروني</label>
                <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} placeholder="email@example.com"
                  value={newSponsor.email}
                  onChange={e => setNewSponsor(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.label}>كلمة مرور البوابة <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="password" placeholder="8 أحرف على الأقل"
                  value={newSponsor.portalPassword}
                  onChange={e => setNewSponsor(p => ({ ...p, portalPassword: e.target.value }))} />
                <p style={{ fontSize: '.72rem', color: '#94a3b8', margin: '.25rem 0 0' }}>ستُرسَل للكافل للدخول عبر البوابة</p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={s.divider}>تفاصيل الكفالة</div>

          {/* Shared fields */}
          <div style={s.grid2}>
            <div>
              <label style={s.label}>تاريخ البداية <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="date"
                value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>المبلغ الشهري (ر.ي) <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="number" min="1" placeholder="30000"
                value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.label}>الوسيط <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 400 }}>(اختياري)</span></label>
              <input style={s.input} placeholder="اسم الوسيط أو الجهة المسهِّلة"
                value={intermediary} onChange={e => setIntermediary(e.target.value)} />
            </div>
          </div>

          {/* Selected preview */}
          <div style={s.preview}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', margin: '0 0 .5rem' }}>المستفيدون المختارون:</p>
            <div>
              {selected.map(item => (
                <span key={item.id} style={s.chip(item.type)}>
                  {item.type === 'orphan' ? '👦' : '👨‍👩‍👧'} {item.name}
                </span>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errBox}>⚠ {error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={s.foot}>
          <button style={s.btnGhost} onClick={onClose} disabled={loading}>إلغاء</button>
          <button style={s.btnPrimary(loading)} onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><Spinner /> جارٍ التعيين…</>
              : `تعيين الكافل لـ ${selected.length} مستفيد ←`
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff',
      borderRadius: '50%', animation: 'mp-spin .7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".3">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, count, color }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '.6rem 1.1rem',
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        fontFamily: "'Cairo', sans-serif",
        minWidth: '80px',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <span style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color }}>
        {count}
      </span>
      <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      <td><div className="skel-cell" style={{ width: '17px' }} /></td>
      {[40, 80, 50, 70, 90, 60].map((w, i) => (
        <td key={i}><div className="skel-cell" style={{ width: `${w}%` }} /></td>
      ))}
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketingPoolPage() {
  const [items, setItems] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [govFilter, setGovFilter] = useState('');
  const [giftedFilter, setGiftedFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [oRes, fRes, sRes, gRes] = await Promise.all([
        api.get('/orphans/marketing'),
        api.get('/families/marketing'),
        api.get('/sponsors'),
        api.get('/governorates').catch(() => ({ data: { data: [] } })),
      ]);

      const orphans = (oRes.data.orphans || []).map(o => ({
        id: o.id,
        type: 'orphan',
        name: o.full_name,
        age: calcAge(o.date_of_birth),
        governorate: o.governorate_ar || '—',
        governorateId: o.governorate_id,
        agent: o.agent_name || '—',
        agent_id: o.agent_id,
        isGifted: o.is_gifted,
        addedAt: o.created_at,
      }));

      const families = (fRes.data.families || []).map(f => ({
        id: f.id,
        type: 'family',
        name: f.family_name,
        age: `${f.member_count || '—'} فرد`,
        governorate: f.governorate_ar || '—',
        governorateId: f.governorate_id,
        agent: f.agent_name || '—',
        agent_id: f.agent_id,
        isGifted: false,
        addedAt: f.created_at,
      }));

      setItems([...orphans, ...families].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)));
      setSponsors(sRes.data.sponsors || []);
      setGovernorates(gRes.data.data || []);
    } catch {
      setError('تعذّر تحميل قائمة التسويق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.name?.includes(search) ||
      item.governorate?.includes(search) ||
      item.agent?.includes(search);
    const matchType = filterType === 'all' || item.type === filterType;
    const matchGov = !govFilter || item.governorate === govFilter;
    const matchGifted = !giftedFilter || String(item.isGifted) === giftedFilter;
    return matchSearch && matchType && matchGov && matchGifted;
  });

  const toggleItem = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => i.id)));
    }
  };

  const selectedItems = items.filter(i => selected.has(i.id));

  const handleSuccess = (count) => {
    const assignedIds = new Set(selected);   // capture before clearing
    setShowModal(false);
    setSelected(new Set());
    setToast({ message: `✅ تم تعيين الكافل بنجاح لـ ${count} مستفيد`, type: 'success' });
    setItems(prev => prev.filter(i => !assignedIds.has(i.id)));
  };

  const orphanCount = items.filter(i => i.type === 'orphan').length;
  const familyCount = items.filter(i => i.type === 'family').length;
  const hasActiveFilters = search || filterType !== 'all' || govFilter || giftedFilter;

  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setGovFilter('');
    setGiftedFilter('');
  };

  return (
    <AppShell>
      <div className="orphans-page" dir="rtl">

        {/* Toast */}
        {toast && (
          <div className="toast">
            {toast.message}
            <button className="toast-close" onClick={() => setToast(null)}>✕</button>
          </div>
        )}

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">مجمع التسويق</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `جميع الحالات بانتظار كافل`}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={load} title="تحديث">
              <IconRefresh />
            </button>
            {selected.size > 0 && (
              <button 
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                🤝 تعيين كافل ({selected.size})
              </button>
            )}
          </div>
        </div>

        {/* ── Stat pills ──────────────────────────────────────────── */}
        {!loading && items.length > 0 && (
          <div className="stat-pills">
            <StatPill label="الإجمالي" count={items.length} color="#1B5E8C" />
            <StatPill label="أيتام" count={orphanCount} color="#3B82F6" />
            <StatPill label="أسر" count={familyCount} color="#10B981" />
            {selected.size > 0 && (
              <StatPill label="مختار" count={selected.size} color="#F59E0B" />
            )}
          </div>
        )}

        {/* ── Filters bar ─────────────────────────────────────────── */}
        <div className="filters-bar">
          {/* Search */}
          <div className="search-wrap">
            <span className="search-icon"><IconSearch /></span>
            <input
              type="text"
              className="search-inp"
              placeholder="ابحث بالاسم أو المحافظة أو المندوب…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Type filter */}
          <div className="filter-select-wrap">
            <span className="filter-icon"><IconFilter /></span>
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">الكل (أيتام + أسر)</option>
              <option value="orphan">الأيتام فقط 👦</option>
              <option value="family">الأسر فقط 👨‍👩‍👧</option>
            </select>
          </div>

          {/* Governorate filter */}
          <div className="filter-select-wrap">
            <span className="filter-icon"><IconFilter /></span>
            <select
              className="filter-select"
              value={govFilter}
              onChange={(e) => setGovFilter(e.target.value)}
            >
              <option value="">جميع المحافظات</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.name_ar}>{g.name_ar}</option>
              ))}
            </select>
          </div>

          {/* Gifted filter */}
          <div className="filter-select-wrap">
            <span className="filter-icon"><IconFilter /></span>
            <select
              className="filter-select"
              value={giftedFilter}
              onChange={(e) => setGiftedFilter(e.target.value)}
            >
              <option value="">الكل (موهوب + عادي)</option>
              <option value="true">الموهوبون فقط ⭐</option>
              <option value="false">غير الموهوبين</option>
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              مسح الفلاتر ✕
            </button>
          )}
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="error-banner" role="alert">
            ⚠ {error}
            <button onClick={load} className="retry-btn">إعادة المحاولة</button>
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="table-card">
          {selected.size > 0 && (
            <div className="sel-bar">
              <span className="sel-text">✓ تم تحديد {selected.size} من {filtered.length}</span>
              <div className="sel-actions">
                <button className="btn-outline" onClick={() => setSelected(new Set())}>
                  إلغاء التحديد
                </button>
              </div>
            </div>
          )}

          <div className="table-scroll">
            <table className="orphans-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center', paddingRight: '1rem', paddingLeft: '0' }}>
                    <input
                      type="checkbox"
                      style={{ width: 17, height: 17, accentColor: '#1B5E8C', cursor: 'pointer' }}
                      checked={selected.size === filtered.length && filtered.length > 0}
                      ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length; }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>المحافظة</th>
                  <th>العمر / الأفراد</th>
                  <th>المندوب</th>
                  <th>تاريخ الاعتماد</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : !error && filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <IconEmpty />
                        <p className="empty-title">
                          {items.length === 0 ? 'لا يوجد مستفيدون بانتظار كافل' : 'لا توجد نتائج مطابقة'}
                        </p>
                        <p className="empty-sub">
                          {items.length === 0 ? 'جميع الحالات المعتمدة تم تعيين كفلاء لها' : 'جرّب تغيير الفلاتر أو مسحها'}
                        </p>
                        {hasActiveFilters && (
                          <button className="btn-clear-filters-sm" onClick={clearFilters}>
                            مسح الفلاتر
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={`data-row ${selected.has(item.id) ? 'selected' : ''}`}
                      onClick={() => toggleItem(item.id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleItem(item.id)}
                      role="button"
                    >
                      <td style={{ textAlign: 'center', paddingRight: '1rem', paddingLeft: '0' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          style={{ width: 17, height: 17, accentColor: '#1B5E8C', cursor: 'pointer' }}
                          checked={selected.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                        />
                      </td>

                      {/* Name */}
                      <td>
                        <div className="name-cell">
                          <div className="avatar-sm">
                            {item.name?.[0] || '؟'}
                          </div>
                          <div className="name-info">
                            <span className="name-text">
                              {item.name}
                              {item.isGifted && (
                                <span className="gifted-tag" title="موهوب">
                                  <IconStar />
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td>
                        <span className={`badge ${item.type}`}>
                          {item.type === 'orphan' ? 'يتيم' : 'أسرة'}
                        </span>
                      </td>

                      {/* Governorate */}
                      <td>
                        <span className="gov-cell">{item.governorate}</span>
                      </td>

                      {/* Age / Members */}
                      <td>
                        <span className="age-cell">{item.age}</span>
                      </td>

                      {/* Agent */}
                      <td>
                        <span className="agent-cell">{item.agent}</span>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="date-cell">
                          {item.addedAt ? new Date(item.addedAt).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="table-footer">
              <span className="result-count">
                {filtered.length === items.length
                  ? `${items.length} مستفيد`
                  : `${filtered.length} من أصل ${items.length} مستفيد`}
                {selected.size > 0 && ` · ${selected.size} مختار`}
              </span>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <AssignModal
            selected={selectedItems}
            sponsors={sponsors}
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </div>

      <style jsx>{`
        .orphans-page {
          max-width: 1100px; margin: 0 auto; padding-bottom: 3rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 1.25rem;
        }

        /* ── Header ─────────────────────────────────────────────── */
        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
        }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub   { font-size: .82rem; color: #9ca3af; margin: 0; }
        .header-actions { display: flex; align-items: center; gap: .75rem; flex-shrink: 0; }

        .btn-refresh {
          display: flex; align-items: center; justify-content: center;
          width: 2.25rem; height: 2.25rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          background: #fff; color: #6b7280; cursor: pointer;
          transition: all .15s;
        }
        .btn-refresh:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: .5rem; padding: .65rem 1.25rem;
          background: linear-gradient(135deg, #1B5E8C, #134569); color: #fff;
          font-family: 'Cairo', sans-serif; font-size: .85rem; font-weight: 700;
          border: none; border-radius: .625rem; cursor: pointer;
          box-shadow: 0 2px 8px rgba(27,94,140,.25); transition: all .15s;
          white-space: nowrap;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(27,94,140,.35);
          background: linear-gradient(135deg, #2E7EB8, #1B5E8C);
        }

        /* ── Stat pills ─────────────────────────────────────────── */
        .stat-pills { display: flex; gap: .6rem; flex-wrap: wrap; }

        /* ── Filters bar ────────────────────────────────────────── */
        .filters-bar {
          display: flex; gap: .65rem; flex-wrap: wrap; align-items: center;
          background: #fff; border: 1px solid #e5eaf0; border-radius: .875rem;
          padding: .875rem 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }

        .search-wrap { position: relative; flex: 1; min-width: 200px; }
        .search-icon {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; display: flex; pointer-events: none;
        }
        .search-inp {
          width: 100%; padding: .55rem 2.25rem .55rem 2rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; color: #1f2937;
          background: #fafafa; outline: none; box-sizing: border-box;
          direction: rtl; transition: border-color .15s, box-shadow .15s;
        }
        .search-inp::placeholder { color: #c4cdd8; }
        .search-inp:focus { border-color: #1B5E8C; box-shadow: 0 0 0 3px rgba(27,94,140,.1); background: #fff; }
        .search-clear {
          position: absolute; left: .6rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #9ca3af; cursor: pointer;
          font-size: .8rem; padding: .2rem;
          transition: color .12s;
        }
        .search-clear:hover { color: #374151; }

        .filter-select-wrap { position: relative; }
        .filter-icon {
          position: absolute; right: .65rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; display: flex; pointer-events: none; z-index: 1;
        }
        .filter-select {
          padding: .55rem 2.1rem .55rem 1.75rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .82rem; color: #374151;
          background: #fafafa; outline: none; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left .6rem center;
          transition: border-color .15s;
        }
        .filter-select:focus { border-color: #1B5E8C; }

        .btn-clear-filters {
          padding: .5rem .875rem;
          background: #FEF2F2; border: 1px solid #FECACA; border-radius: .625rem;
          color: #B91C1C; font-family: 'Cairo', sans-serif; font-size: .78rem;
          font-weight: 600; cursor: pointer; transition: all .12s; white-space: nowrap;
        }
        .btn-clear-filters:hover { background: #FEE2E2; }
        .btn-clear-filters-sm {
          padding: .4rem .8rem; margin-top: 1rem;
          background: #fff; border: 1px solid #e5e7eb; border-radius: .5rem;
          color: #374151; font-family: 'Cairo', sans-serif; font-size: .78rem;
          font-weight: 600; cursor: pointer; transition: all .12s;
        }
        .btn-clear-filters-sm:hover { background: #f9fafb; border-color: #d1d5db; }

        /* ── Error ──────────────────────────────────────────────── */
        .error-banner {
          display: flex; align-items: center; justify-content: space-between;
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .75rem 1rem; border-radius: .75rem; font-size: .875rem;
        }
        .retry-btn {
          background: none; border: 1px solid #fca5a5; border-radius: .5rem;
          color: #b91c1c; padding: .3rem .75rem; cursor: pointer; font-size: .78rem;
          font-family: 'Cairo', sans-serif; font-weight: 600;
        }

        /* ── Table card ─────────────────────────────────────────── */
        .table-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .table-scroll { overflow-x: auto; }

        .orphans-table {
          width: 100%; border-collapse: collapse; font-size: .82rem;
          min-width: 700px;
        }

        .orphans-table thead tr {
          background: #f8fafc; border-bottom: 1.5px solid #e5eaf0;
        }
        .orphans-table th {
          padding: .75rem 1rem; font-size: .72rem; font-weight: 700;
          color: #9ca3af; text-align: right; white-space: nowrap;
          letter-spacing: .04em; text-transform: uppercase;
        }

        /* ── Data rows ──────────────────────────────────────────── */
        .data-row {
          border-bottom: 1px solid #f1f5f9; cursor: pointer;
          transition: background .12s;
        }
        .data-row:last-child { border-bottom: none; }
        .data-row:hover { background: #f8fbff; }
        .data-row.selected { background: #f0f7ff; }
        .data-row:focus { outline: none; background: #f0f7ff; }
        .data-row td { padding: .875rem 1rem; vertical-align: middle; }

        /* ── Name cell ──────────────────────────────────────────── */
        .name-cell { display: flex; align-items: center; gap: .625rem; }
        .avatar-sm {
          width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-size: .78rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .name-info { display: flex; flex-direction: column; }
        .name-text {
          font-size: .875rem; font-weight: 700; color: #0d3d5c;
          display: flex; align-items: center; gap: .3rem;
        }
        .gifted-tag {
          color: #D97706; display: inline-flex; align-items: center;
          flex-shrink: 0;
        }

        /* ── Other cells ────────────────────────────────────────── */
        .age-cell      { font-weight: 600; color: #374151; }
        .gov-cell      { color: #374151; }
        .agent-cell    { color: #6b7280; font-size: .78rem; }
        .date-cell     { color: #9ca3af; font-size: .75rem; white-space: nowrap; }

        .badge {
          display: inline-flex; padding: .2rem .65rem; border-radius: 2rem;
          font-size: .72rem; font-weight: 700;
        }
        .badge.orphan { background: #dbeafe; color: #1d4ed8; }
        .badge.family { background: #dcfce7; color: #15803d; }

        /* ── Table Footer ───────────────────────────────────────── */
        .table-footer {
          padding: .85rem 1.25rem; background: #fff;
          border-top: 1px solid #f0f4f8; display: flex; align-items: center;
        }
        .result-count {
          font-size: .78rem; font-weight: 600; color: #9ca3af;
        }

        /* ── Empty State ────────────────────────────────────────── */
        .empty-state { padding: 4rem 2rem; text-align: center; color: #9ca3af; display: flex; flex-direction: column; align-items: center; }
        .empty-title { font-size: 1rem; font-weight: 700; color: #374151; margin: .75rem 0 .4rem; }
        .empty-sub { font-size: .85rem; margin: 0; }

        /* ── Skeleton ───────────────────────────────────────────── */
        .skeleton-row td { padding: 1rem; border-bottom: 1px solid #f8fafc; }
        .skel-cell {
          height: 16px; border-radius: 4px;
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }

        /* ── Selection Bar ──────────────────────────────────────── */
        .sel-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: .75rem 1.25rem; background: linear-gradient(90deg, #f0f7ff, #e8f4ff);
          border-bottom: 1px solid #bfdbfe; gap: 1rem; flex-wrap: wrap;
        }
        .sel-text { font-size: .85rem; font-weight: 700; color: #1B5E8C; }
        .sel-actions { display: flex; gap: .5rem; align-items: center; }
        .btn-outline {
          background: none; border: 1.5px solid #93c5fd; border-radius: .5rem;
          padding: .3rem .75rem; font-size: .78rem; color: #1B5E8C; cursor: pointer;
          font-family: 'Cairo', sans-serif; font-weight: 600; transition: all .15s;
        }
        .btn-outline:hover { background: #eff6ff; }

        /* ── Toast ──────────────────────────────────────────────── */
        .toast {
          position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%);
          z-index: 2000; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46;
          border-radius: .75rem; padding: .8rem 1.5rem; font-weight: 600; font-size: .9rem;
          box-shadow: 0 4px 20px rgba(0,0,0,.12); animation: slideDown .25s ease;
          display: flex; align-items: center; gap: 1rem;
        }
        .toast-close { background: none; border: none; cursor: pointer; color: #065f46; font-weight: 700; }

        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </AppShell>
  );
}
