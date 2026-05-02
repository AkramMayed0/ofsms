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
  const [tab, setTab]           = useState('existing');
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [newSponsor, setNewSponsor] = useState({ fullName: '', phone: '', email: '', portalPassword: '' });
  const [startDate, setStartDate]   = useState(todayStr());
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [intermediary, setIntermediary]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
    if (!startDate)     { setError('تاريخ البداية مطلوب'); return; }
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) { setError('المبلغ الشهري مطلوب'); return; }

    setLoading(true);
    try {
      let finalSponsorId = sponsorId;
      if (tab === 'new') {
        const { data } = await api.post('/sponsors', {
          fullName:       newSponsor.fullName.trim(),
          phone:          newSponsor.phone.trim()  || undefined,
          email:          newSponsor.email.trim()  || undefined,
          portalPassword: newSponsor.portalPassword,
        });
        finalSponsorId = data.sponsor.id;
      }

      for (const item of selected) {
        await api.post(`/sponsors/${finalSponsorId}/sponsorships`, {
          beneficiaryType: item.type,
          beneficiaryId:   item.id,
          agentId:         item.agent_id,
          intermediary:    intermediary.trim() || undefined,
          startDate,
          monthlyAmount:   parseFloat(monthlyAmount),
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
    sub:   { fontSize: '.8rem', color: '#6b7a8d', margin: 0 },
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
          <button style={s.tab(tab === 'new')}      onClick={() => setTab('new')}>➕ كافل جديد</button>
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
export default function MarketingPoolPage() {
  const [items, setItems]       = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [toast, setToast]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [oRes, fRes, sRes] = await Promise.all([
        api.get('/orphans/marketing'),
        api.get('/families/marketing'),
        api.get('/sponsors'),
      ]);

      const orphans = (oRes.data.orphans || []).map(o => ({
        id:          o.id,
        type:        'orphan',
        name:        o.full_name,
        age:         calcAge(o.date_of_birth),
        governorate: o.governorate_ar || '—',
        agent:       o.agent_name    || '—',
        agent_id:    o.agent_id,
        isGifted:    o.is_gifted,
        addedAt:     o.created_at,
      }));

      const families = (fRes.data.families || []).map(f => ({
        id:          f.id,
        type:        'family',
        name:        f.family_name,
        age:         `${f.member_count || '—'} فرد`,
        governorate: f.governorate_ar || '—',
        agent:       f.agent_name    || '—',
        agent_id:    f.agent_id,
        isGifted:    false,
        addedAt:     f.created_at,
      }));

      setItems([...orphans, ...families].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)));
      setSponsors(sRes.data.sponsors || []);
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
    return matchSearch && matchType;
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

  return (
    <AppShell>
      <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '4rem', fontFamily: "'Cairo','Tajawal',sans-serif" }}>

        {/* Keyframes injected globally via a style tag */}
        <style>{`
          @keyframes mp-spin { to { transform: rotate(360deg); } }
          @keyframes mp-slide { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
          .mp-row:hover { background: #f8fbff !important; }
          .mp-row-sel { background: #f0f7ff !important; }
          .mp-sponsor-row:hover { background: #f0f7ff !important; }
          .mp-tab:hover { border-color: #1B5E8C !important; color: #1B5E8C !important; }
          .mp-input:focus { border-color: #1B5E8C !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(27,94,140,.1) !important; }
          .mp-filter-tab:hover { border-color: #1B5E8C; color: #1B5E8C; }
        `}</style>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 2000, background: '#ecfdf5', border: '1px solid #6ee7b7',
            color: '#065f46', borderRadius: '.75rem', padding: '.8rem 1.5rem',
            fontWeight: 600, fontSize: '.9rem', boxShadow: '0 4px 20px rgba(0,0,0,.12)',
            animation: 'mp-slide .25s ease',
          }}>
            {toast.message}
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', marginRight: '1rem', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
            >✕</button>
          </div>
        )}

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d3d5c', margin: '0 0 .2rem' }}>قائمة التسويق</h1>
            <p style={{ fontSize: '.85rem', color: '#6b7a8d', margin: 0 }}>
              {loading ? 'جارٍ التحميل…' : `${items.length} مستفيد بانتظار كافل — ${orphanCount} يتيم، ${familyCount} أسرة`}
            </p>
          </div>
          {selected.size > 0 && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                padding: '.75rem 1.5rem',
                background: 'linear-gradient(135deg,#1B5E8C,#134569)',
                color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: '.9rem',
                fontWeight: 700, border: 'none', borderRadius: '.75rem', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(27,94,140,.35)',
              }}
            >
              🤝 تعيين كافل ({selected.size})
            </button>
          )}
        </div>

        {/* Stats pills */}
        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { num: items.length,   label: 'إجمالي',  bg: '#fff',    border: '#e5eaf0', color: '#0d3d5c' },
              { num: orphanCount,    label: 'أيتام',   bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
              { num: familyCount,    label: 'أسر',     bg: '#f7fee7', border: '#d9f99d', color: '#15803d' },
              ...(selected.size > 0 ? [{ num: selected.size, label: 'مختار', bg: '#f0f7ff', border: '#1B5E8C', color: '#1B5E8C' }] : []),
            ].map((p, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                padding: '.4rem .9rem', background: p.bg,
                border: `1.5px solid ${p.border}`, borderRadius: '2rem',
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: p.color }}>{p.num}</span>
                <span style={{ fontSize: '.75rem', color: '#6b7a8d', fontWeight: 500 }}>{p.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{ position: 'absolute', right: '.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
            <input
              className="mp-input"
              style={{
                width: '100%', border: '1.5px solid #d1d5db', borderRadius: '.75rem',
                padding: '.65rem .9rem .65rem 2.5rem', paddingRight: '2.4rem',
                fontSize: '.88rem', fontFamily: 'Cairo, sans-serif', background: '#fafafa',
                outline: 'none', boxSizing: 'border-box', color: '#1f2937',
              }}
              placeholder="ابحث بالاسم أو المحافظة أو المندوب…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '.85rem' }}>✕</button>
            )}
          </div>
          {/* Type filter */}
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {[
              { key: 'all',    label: 'الكل', emoji: '📋' },
              { key: 'orphan', label: 'أيتام', emoji: '👦' },
              { key: 'family', label: 'أسر',   emoji: '👨‍👩‍👧' },
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                className="mp-filter-tab"
                onClick={() => setFilterType(key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                  padding: '.4rem .9rem',
                  border: `1.5px solid ${filterType === key ? '#1B5E8C' : '#e5eaf0'}`,
                  borderRadius: '2rem', fontSize: '.8rem', fontWeight: 600,
                  color: filterType === key ? '#fff' : '#6b7280',
                  background: filterType === key ? '#1B5E8C' : '#fff',
                  cursor: 'pointer', fontFamily: 'Cairo, sans-serif', transition: 'all .15s',
                }}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '.85rem 1rem', borderRadius: '.75rem', fontSize: '.875rem', marginBottom: '1rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                height: 56, borderRadius: '.75rem',
                background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                backgroundSize: '200% 100%', animation: 'mp-spin 1.4s infinite',
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ background: '#fff', border: '1.5px solid #e5eaf0', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>{items.length === 0 ? '🎉' : '🔍'}</div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '0 0 .4rem' }}>
              {items.length === 0 ? 'لا يوجد مستفيدون بانتظار كافل' : 'لا توجد نتائج مطابقة'}
            </p>
            <p style={{ fontSize: '.85rem', margin: 0 }}>
              {items.length === 0 ? 'جميع الحالات المعتمدة تم تعيين كفلاء لها' : 'جرّب تغيير معايير البحث'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5eaf0', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(27,94,140,.05)' }}>

            {/* Selection bar */}
            {selected.size > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '.75rem 1.25rem',
                background: 'linear-gradient(90deg,#f0f7ff,#e8f4ff)',
                borderBottom: '1px solid #bfdbfe', gap: '1rem', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#1B5E8C' }}>
                  ✓ تم تحديد {selected.size} من {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelected(new Set())}
                    style={{ background: 'none', border: '1.5px solid #93c5fd', borderRadius: '.5rem', padding: '.3rem .75rem', fontSize: '.78rem', color: '#1B5E8C', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                  >
                    إلغاء التحديد
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                      padding: '.4rem .9rem',
                      background: 'linear-gradient(135deg,#1B5E8C,#134569)',
                      color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: '.82rem',
                      fontWeight: 700, border: 'none', borderRadius: '.5rem', cursor: 'pointer',
                    }}
                  >
                    🤝 تعيين كافل ←
                  </button>
                </div>
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ width: 44, padding: '.85rem 1rem', textAlign: 'center', borderBottom: '1px solid #e5eaf0' }}>
                    <input
                      type="checkbox"
                      style={{ width: 17, height: 17, accentColor: '#1B5E8C', cursor: 'pointer' }}
                      checked={selected.size === filtered.length && filtered.length > 0}
                      ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length; }}
                      onChange={toggleAll}
                    />
                  </th>
                  {['الاسم', 'النوع', 'المحافظة', 'العمر / الأفراد', 'المندوب', 'تاريخ الاعتماد'].map(h => (
                    <th key={h} style={{ padding: '.85rem 1rem', textAlign: 'right', fontSize: '.75rem', fontWeight: 700, color: '#6b7a8d', whiteSpace: 'nowrap', borderBottom: '1px solid #e5eaf0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    className={`mp-row ${selected.has(item.id) ? 'mp-row-sel' : ''}`}
                    style={{ cursor: 'pointer', transition: 'background .1s' }}
                    onClick={() => toggleItem(item.id)}
                  >
                    <td style={{ textAlign: 'center', padding: '.9rem 1rem', borderBottom: '1px solid #f8fafc' }}
                      onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        style={{ width: 17, height: 17, accentColor: '#1B5E8C', cursor: 'pointer' }}
                        checked={selected.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                    </td>
                    <td style={{ padding: '.9rem 1rem', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                          background: item.type === 'orphan' ? '#eff6ff' : '#f7fee7',
                        }}>
                          {item.type === 'orphan' ? '👦' : '👨‍👩‍👧'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '.87rem' }}>{item.name}</div>
                          {item.isGifted && (
                            <span style={{ fontSize: '.67rem', fontWeight: 600, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '2rem', padding: '.1rem .4rem' }}>
                              🌟 موهوب
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '.9rem 1rem', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{
                        display: 'inline-flex', padding: '.2rem .65rem', borderRadius: '2rem',
                        fontSize: '.72rem', fontWeight: 700,
                        background: item.type === 'orphan' ? '#dbeafe' : '#dcfce7',
                        color:      item.type === 'orphan' ? '#1d4ed8' : '#15803d',
                      }}>
                        {item.type === 'orphan' ? 'يتيم' : 'أسرة'}
                      </span>
                    </td>
                    <td style={{ padding: '.9rem 1rem', borderBottom: '1px solid #f8fafc', color: '#6b7a8d', fontSize: '.85rem' }}>{item.governorate}</td>
                    <td style={{ padding: '.9rem 1rem', borderBottom: '1px solid #f8fafc', color: '#6b7a8d', fontSize: '.85rem' }}>{item.age}</td>
                    <td style={{ padding: '.9rem 1rem', borderBottom: '1px solid #f8fafc', color: '#6b7a8d', fontSize: '.85rem' }}>{item.agent}</td>
                    <td style={{ padding: '.9rem 1rem', borderBottom: '1px solid #f8fafc', color: '#6b7a8d', fontSize: '.8rem', whiteSpace: 'nowrap' }}>
                      {item.addedAt ? new Date(item.addedAt).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ padding: '.75rem 1.25rem', fontSize: '.78rem', color: '#9ca3af', borderTop: '1px solid #f0f4f8' }}>
              عرض {filtered.length} من {items.length} مستفيد
              {selected.size > 0 && ` · ${selected.size} مختار`}
            </div>
          </div>
        )}

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
    </AppShell>
  );
}
