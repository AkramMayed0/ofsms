'use client';

/**
 * page.jsx
 * Route:  /marketing-pool  (GM only)
 * Task:   feature/ui-marketing-pool
 *
 * Shows all orphans + families with status = under_marketing.
 * GM can multi-select and assign a sponsor via a slide-in modal.
 *
 * API calls used:
 *   GET  /api/orphans/marketing          → list of approved orphans
 *   GET  /api/families/marketing         → list of approved families
 *   GET  /api/sponsors                   → existing sponsors list
 *   POST /api/sponsors                   → create new sponsor
 *   POST /api/sponsors/:id/sponsorships  → assign beneficiary to sponsor
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Helpers ───────────────────────────────────────────────────────────────────

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};

const today = () => new Date().toISOString().split('T')[0];

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({ selected, sponsors, onClose, onSuccess }) {
  const [tab, setTab] = useState('existing'); // 'existing' | 'new'
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [newSponsor, setNewSponsor] = useState({
    fullName: '', phone: '', email: '', portalPassword: '',
  });
  const [shared, setShared] = useState({
    intermediary: '',
    startDate: today(),
    monthlyAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredSponsors = sponsors.filter((s) =>
    s.full_name?.includes(sponsorSearch) || s.email?.includes(sponsorSearch)
  );

  const handleSubmit = async () => {
    setError('');
    // Validation
    if (tab === 'existing' && !sponsorId) {
      setError('يرجى اختيار كافل'); return;
    }
    if (tab === 'new') {
      if (!newSponsor.fullName.trim()) { setError('اسم الكافل مطلوب'); return; }
      if (!newSponsor.portalPassword || newSponsor.portalPassword.length < 8) {
        setError('كلمة مرور البوابة يجب أن تكون 8 أحرف على الأقل'); return;
      }
    }
    if (!shared.startDate) { setError('تاريخ البداية مطلوب'); return; }
    if (!shared.monthlyAmount || parseFloat(shared.monthlyAmount) <= 0) {
      setError('المبلغ الشهري مطلوب'); return;
    }

    setLoading(true);
    try {
      // Step 1: resolve sponsor ID
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

      // Step 2: assign each selected beneficiary
      for (const item of selected) {
if (!item.agent_id) {
  throw new Error(`لم يتم العثور على مندوب للمستفيد: ${item.name}`);
}
await api.post(`/sponsors/${finalSponsorId}/sponsorships`, {
  beneficiaryType: item.type,
  beneficiaryId: item.id,
  agentId: item.agent_id,
  intermediary: shared.intermediary.trim() || undefined,
  startDate: shared.startDate,
  monthlyAmount: parseFloat(shared.monthlyAmount),
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

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" dir="rtl">
        {/* Header */}
        <div className="modal-head">
          <div>
            <h2 className="modal-title">تعيين كفيل</h2>
            <p className="modal-sub">
              {selected.length} مستفيد مختار
              {' · '}
              {selected.filter(i => i.type === 'orphan').length} يتيم
              {' ، '}
              {selected.filter(i => i.type === 'family').length} أسرة
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`mtab ${tab === 'existing' ? 'mtab-active' : ''}`}
            onClick={() => setTab('existing')}
          >
            🤝 كافل موجود
          </button>
          <button
            className={`mtab ${tab === 'new' ? 'mtab-active' : ''}`}
            onClick={() => setTab('new')}
          >
            ➕ كافل جديد
          </button>
        </div>

        <div className="modal-body">

          {/* Existing sponsor */}
          {tab === 'existing' && (
            <div className="field-group">
              <label className="lbl">اختر الكافل <span className="req">*</span></label>
              <input
                className="inp"
                placeholder="ابحث بالاسم أو البريد…"
                value={sponsorSearch}
                onChange={(e) => setSponsorSearch(e.target.value)}
              />
              <div className="sponsor-list-box">
                {filteredSponsors.length === 0 && (
                  <p className="sponsor-empty">لا يوجد كفلاء مطابقون</p>
                )}
                {filteredSponsors.map((s) => (
                  <div
                    key={s.id}
                    className={`sponsor-option ${sponsorId === s.id ? 'sponsor-selected' : ''}`}
                    onClick={() => setSponsorId(s.id)}
                  >
                    <div className="sponsor-avatar">
                      {s.full_name?.charAt(0) || '؟'}
                    </div>
                    <div>
                      <div className="sponsor-name">{s.full_name}</div>
                      {s.email && <div className="sponsor-email">{s.email}</div>}
                    </div>
                    {sponsorId === s.id && <span className="sponsor-check">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New sponsor */}
          {tab === 'new' && (
            <div className="new-sponsor-grid">
              <div className="fg span2">
                <label className="lbl">اسم الكافل <span className="req">*</span></label>
                <input
                  className="inp"
                  placeholder="الاسم الكامل للكافل"
                  value={newSponsor.fullName}
                  onChange={(e) => setNewSponsor(p => ({ ...p, fullName: e.target.value }))}
                />
              </div>
              <div className="fg">
                <label className="lbl">رقم الهاتف <span className="opt">(اختياري)</span></label>
                <input
                  className="inp ltr"
                  placeholder="+967700000000"
                  value={newSponsor.phone}
                  onChange={(e) => setNewSponsor(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="fg">
                <label className="lbl">البريد الإلكتروني <span className="opt">(اختياري)</span></label>
                <input
                  className="inp ltr"
                  placeholder="sponsor@example.com"
                  value={newSponsor.email}
                  onChange={(e) => setNewSponsor(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="fg span2">
                <label className="lbl">كلمة مرور البوابة <span className="req">*</span></label>
                <input
                  className="inp ltr"
                  type="password"
                  placeholder="8 أحرف على الأقل"
                  value={newSponsor.portalPassword}
                  onChange={(e) => setNewSponsor(p => ({ ...p, portalPassword: e.target.value }))}
                />
                <p className="field-hint">ستُرسَل للكافل للدخول عبر البوابة الخاصة به</p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="section-divider">تفاصيل الكفالة</div>

          {/* Shared sponsorship fields */}
          <div className="shared-grid">
            <div className="fg">
              <label className="lbl">تاريخ البداية <span className="req">*</span></label>
              <input
                className="inp ltr"
                type="date"
                value={shared.startDate}
                onChange={(e) => setShared(p => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div className="fg">
              <label className="lbl">المبلغ الشهري (ر.ي) <span className="req">*</span></label>
              <input
                className="inp ltr"
                type="number"
                min="1"
                placeholder="مثال: 30000"
                value={shared.monthlyAmount}
                onChange={(e) => setShared(p => ({ ...p, monthlyAmount: e.target.value }))}
              />
            </div>
            <div className="fg span2">
              <label className="lbl">الوسيط <span className="opt">(اختياري)</span></label>
              <input
                className="inp"
                placeholder="اسم الوسيط أو الجهة المسهِّلة للكفالة"
                value={shared.intermediary}
                onChange={(e) => setShared(p => ({ ...p, intermediary: e.target.value }))}
              />
            </div>
          </div>

          {/* Selected items preview */}
          <div className="selected-preview">
            <p className="preview-label">المستفيدون المختارون:</p>
            <div className="preview-chips">
              {selected.map((item) => (
                <span key={item.id} className={`preview-chip chip-${item.type}`}>
                  {item.type === 'orphan' ? '👦' : '👨‍👩‍👧'} {item.name}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="modal-error">
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} disabled={loading}>
            إلغاء
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><span className="spin" /> جارٍ التعيين…</>
              : `تعيين الكفيل لـ ${selected.length} مستفيد ←`}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketingPoolPage() {
  const [items, setItems]         = useState([]);   // combined orphans + families
  const [sponsors, setSponsors]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(new Set()); // Set of IDs
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'orphan' | 'family'
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]         = useState(null); // { message, type }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orphansRes, familiesRes, sponsorsRes] = await Promise.all([
        api.get('/orphans/marketing'),
        api.get('/families/marketing'),
        api.get('/sponsors'),
      ]);

      const orphans = (orphansRes.data.orphans || []).map(o => ({
        id: o.id,
        type: 'orphan',
        name: o.full_name,
        age: calcAge(o.date_of_birth),
        governorate: o.governorate_ar || '—',
        agent: o.agent_name || '—',
        agent_id: o.agent_id,
        isGifted: o.is_gifted,
        addedAt: o.created_at,
      }));

const families = (familiesRes.data.families || []).map(f => ({
  id: f.id,
  type: 'family',
  name: f.family_name,
  age: `${f.member_count || '—'} فرد`,
  governorate: f.governorate_ar || '—',
  agent: f.agent_name || '—',
  agent_id: f.agent_id,   // ← this was undefined before the backend fix
  isGifted: false,
  addedAt: f.created_at,
}));

      setItems([...orphans, ...families].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)));
      setSponsors(sponsorsRes.data.sponsors || []);
    } catch {
      setError('تعذّر تحميل قائمة التسويق. يرجى تحديث الصفحة.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtered view
  const filtered = items.filter((item) => {
    const matchSearch = !search ||
      item.name?.includes(search) ||
      item.governorate?.includes(search) ||
      item.agent?.includes(search);
    const matchType = filterType === 'all' || item.type === filterType;
    return matchSearch && matchType;
  });

  // Selection helpers
  const toggleItem = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => i.id)));
    }
  };

  const selectedItems = items.filter(i => selected.has(i.id));

  const handleSuccess = (count) => {
    setShowModal(false);
    setSelected(new Set());
    setToast({ message: `تم تعيين الكفيل بنجاح لـ ${count} مستفيد`, type: 'success' });
    // Remove assigned items from local state
    setItems(prev => prev.filter(i => !selected.has(i.id)));
  };

  const orphanCount = items.filter(i => i.type === 'orphan').length;
  const familyCount = items.filter(i => i.type === 'family').length;

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Page header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">قائمة التسويق</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${items.length} مستفيد بانتظار تعيين كفيل — ${orphanCount} يتيم ، ${familyCount} أسرة`}
            </p>
          </div>
          {selected.size > 0 && (
            <button
              className="btn-primary"
              onClick={() => setShowModal(true)}
            >
              🤝 تعيين كفيل ({selected.size})
            </button>
          )}
        </div>

        {/* Stats bar */}
        {!loading && items.length > 0 && (
          <div className="stats-bar">
            <div className="stat-pill">
              <span className="pill-num">{items.length}</span>
              <span className="pill-lbl">إجمالي</span>
            </div>
            <div className="stat-pill pill-orphan">
              <span className="pill-num">{orphanCount}</span>
              <span className="pill-lbl">أيتام</span>
            </div>
            <div className="stat-pill pill-family">
              <span className="pill-num">{familyCount}</span>
              <span className="pill-lbl">أسر</span>
            </div>
            {selected.size > 0 && (
              <div className="stat-pill pill-selected">
                <span className="pill-num">{selected.size}</span>
                <span className="pill-lbl">مختار</span>
              </div>
            )}
          </div>
        )}

        {/* Search + filter */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-inp"
              placeholder="ابحث بالاسم أو المحافظة أو المندوب…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <div className="type-tabs">
            {[
              { key: 'all', label: 'الكل', emoji: '📋' },
              { key: 'orphan', label: 'أيتام', emoji: '👦' },
              { key: 'family', label: 'أسر', emoji: '👨‍👩‍👧' },
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                className={`ttab ${filterType === key ? 'ttab-active' : ''}`}
                onClick={() => setFilterType(key)}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="err-banner">⚠ {error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="skel-wrap">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skel-row">
                <div className="skel skel-check" />
                <div className="skel skel-name" />
                <div className="skel skel-type" />
                <div className="skel skel-gov" />
                <div className="skel skel-age" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty">
            <div className="empty-ico">🎉</div>
            <h3 className="empty-title">
              {items.length === 0 ? 'لا يوجد مستفيدون بانتظار كفيل' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="empty-sub">
              {items.length === 0
                ? 'جميع الأيتام والأسر المعتمدين تم تعيين كفلاء لهم'
                : 'جرّب تغيير معايير البحث'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            {/* Floating selection bar */}
            {selected.size > 0 && (
              <div className="selection-bar">
                <span className="sel-count">
                  ✓ تم تحديد {selected.size} من {filtered.length}
                </span>
                <div className="sel-actions">
                  <button className="sel-clear" onClick={() => setSelected(new Set())}>
                    إلغاء التحديد
                  </button>
                  <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
                    🤝 تعيين كفيل ←
                  </button>
                </div>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th className="th-check">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      ref={el => {
                        if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length;
                      }}
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
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`trow ${selected.has(item.id) ? 'trow-selected' : ''}`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <td className="td-check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                    </td>
                    <td>
                      <div className="name-cell">
                        <div className={`name-avatar avatar-${item.type}`}>
                          {item.type === 'orphan' ? '👦' : '👨‍👩‍👧'}
                        </div>
                        <div>
                          <div className="name-text">{item.name}</div>
                          {item.isGifted && (
                            <span className="gifted-tag">🌟 موهوب</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge badge-${item.type}`}>
                        {item.type === 'orphan' ? 'يتيم' : 'أسرة'}
                      </span>
                    </td>
                    <td className="cell-muted">{item.governorate}</td>
                    <td className="cell-muted">{item.age}</td>
                    <td className="cell-muted">{item.agent}</td>
                    <td className="cell-muted cell-date">
                      {item.addedAt
                        ? new Date(item.addedAt).toLocaleDateString('ar-YE', { dateStyle: 'medium' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              عرض {filtered.length} من {items.length} مستفيد
              {selected.size > 0 && ` · ${selected.size} مختار`}
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showModal && (
        <AssignModal
          selected={selectedItems}
          sponsors={sponsors}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page { max-width:1200px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; position:relative; }

        /* ── Toast ────────────────────────────────────────────────────── */
        .toast { position:fixed; top:1.5rem; right:50%; transform:translateX(50%); z-index:100; display:flex; align-items:center; gap:.6rem; padding:.8rem 1.5rem; border-radius:.75rem; font-size:.9rem; font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,.15); animation:slideDown .25s ease; }
        .toast-success { background:#ecfdf5; color:#065f46; border:1px solid #6ee7b7; }
        .toast-error   { background:#fef2f2; color:#991b1b; border:1px solid #fca5a5; }
        @keyframes slideDown { from { opacity:0; transform:translateX(50%) translateY(-10px); } to { opacity:1; transform:translateX(50%) translateY(0); } }

        /* ── Header ───────────────────────────────────────────────────── */
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.25rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        /* ── Stats bar ────────────────────────────────────────────────── */
        .stats-bar { display:flex; gap:.6rem; margin-bottom:1.1rem; flex-wrap:wrap; }
        .stat-pill { display:inline-flex; align-items:center; gap:.4rem; padding:.4rem .9rem; background:#fff; border:1.5px solid #e5eaf0; border-radius:2rem; }
        .pill-orphan { border-color:#bfdbfe; background:#eff6ff; }
        .pill-family { border-color:#d9f99d; background:#f7fee7; }
        .pill-selected { border-color:#1B5E8C; background:#f0f7ff; }
        .pill-num { font-size:1rem; font-weight:800; color:#0d3d5c; }
        .pill-lbl { font-size:.75rem; color:#6b7a8d; font-weight:500; }

        /* ── Toolbar ──────────────────────────────────────────────────── */
        .toolbar { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1.1rem; }
        .search-wrap { position:relative; display:flex; align-items:center; }
        .search-icon { position:absolute; right:.85rem; font-size:.9rem; pointer-events:none; }
        .search-inp { width:100%; border:1.5px solid #d1d5db; border-radius:.75rem; padding:.65rem .9rem .65rem 2.5rem; padding-right:2.4rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; }
        .search-inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .search-clear { position:absolute; left:.75rem; background:none; border:none; cursor:pointer; color:#9ca3af; font-size:.85rem; }
        .type-tabs { display:flex; gap:.4rem; }
        .ttab { display:inline-flex; align-items:center; gap:.35rem; padding:.4rem .9rem; border:1.5px solid #e5eaf0; border-radius:2rem; font-size:.8rem; font-weight:600; color:#6b7280; background:#fff; cursor:pointer; transition:all .15s; font-family:'Cairo',sans-serif; }
        .ttab:hover { border-color:#1B5E8C; color:#1B5E8C; }
        .ttab-active { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }

        /* ── Error ────────────────────────────────────────────────────── */
        .err-banner { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.85rem 1rem; border-radius:.75rem; font-size:.85rem; margin-bottom:1rem; }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .skel-wrap { display:flex; flex-direction:column; gap:.5rem; }
        .skel-row { display:flex; gap:1rem; padding:1rem 1.25rem; background:#fff; border:1px solid #e5eaf0; border-radius:.75rem; align-items:center; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:.375rem; }
        .skel-check { width:18px; height:18px; border-radius:4px; }
        .skel-name { width:160px; height:16px; }
        .skel-type { width:55px; height:22px; border-radius:2rem; }
        .skel-gov { width:80px; height:14px; }
        .skel-age { width:60px; height:14px; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        /* ── Empty ────────────────────────────────────────────────────── */
        .empty { display:flex; flex-direction:column; align-items:center; min-height:320px; justify-content:center; text-align:center; gap:.75rem; }
        .empty-ico { font-size:3.5rem; }
        .empty-title { font-size:1.1rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        /* ── Table wrapper ────────────────────────────────────────────── */
        .table-wrap { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05); }

        /* ── Selection bar ────────────────────────────────────────────── */
        .selection-bar { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.25rem; background:linear-gradient(90deg,#f0f7ff,#e8f4ff); border-bottom:1px solid #bfdbfe; gap:1rem; flex-wrap:wrap; }
        .sel-count { font-size:.85rem; font-weight:700; color:#1B5E8C; }
        .sel-actions { display:flex; align-items:center; gap:.6rem; }
        .sel-clear { background:none; border:1.5px solid #93c5fd; border-radius:.5rem; padding:.3rem .7rem; font-size:.78rem; color:#1B5E8C; cursor:pointer; font-family:'Cairo',sans-serif; font-weight:600; }
        .btn-primary-sm { display:inline-flex; align-items:center; gap:.35rem; padding:.4rem .9rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:700; border:none; border-radius:.5rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .btn-primary-sm:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); }

        /* ── Table ────────────────────────────────────────────────────── */
        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th { padding:.85rem 1rem; text-align:right; font-size:.75rem; font-weight:700; color:#6b7a8d; white-space:nowrap; border-bottom:1px solid #e5eaf0; }
        .th-check { width:40px; text-align:center; }
        .td-check { text-align:center; }
        .table td { padding:.9rem 1rem; font-size:.85rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow { cursor:pointer; transition:background .1s; }
        .trow:hover { background:#f8fbff; }
        .trow-selected { background:#f0f7ff !important; }
        .trow:last-child td { border-bottom:none; }

        /* Checkbox */
        .checkbox { width:17px; height:17px; border-radius:4px; accent-color:#1B5E8C; cursor:pointer; }

        .name-cell { display:flex; align-items:center; gap:.65rem; }
        .name-avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
        .avatar-orphan { background:#eff6ff; }
        .avatar-family { background:#f7fee7; }
        .name-text { font-weight:700; color:#1f2937; font-size:.87rem; }
        .gifted-tag { display:inline-block; font-size:.67rem; font-weight:600; color:#f59e0b; background:#fffbeb; border:1px solid #fde68a; border-radius:2rem; padding:.1rem .4rem; margin-top:.1rem; }

        .type-badge { display:inline-flex; padding:.2rem .65rem; border-radius:2rem; font-size:.72rem; font-weight:700; white-space:nowrap; }
        .badge-orphan { color:#1d4ed8; background:#dbeafe; }
        .badge-family  { color:#15803d; background:#dcfce7; }

        .cell-muted { color:#6b7a8d; }
        .cell-date { font-size:.8rem; white-space:nowrap; }

        .table-footer { padding:.75rem 1.25rem; font-size:.78rem; color:#9ca3af; border-top:1px solid #f0f4f8; }

        /* ── Modal ────────────────────────────────────────────────────── */
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:40; animation:fadeIn .2s ease; }
        .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:min(560px,95vw); max-height:90vh; background:#fff; border-radius:1.25rem; z-index:50; display:flex; flex-direction:column; box-shadow:0 8px 40px rgba(0,0,0,.18); animation:popIn .2s ease; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes popIn  { from { opacity:0; transform:translate(-50%,-50%) scale(.95); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }

        .modal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1.5rem 1.5rem 0; }
        .modal-title { font-size:1.15rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .modal-sub { font-size:.8rem; color:#6b7a8d; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.25rem .4rem; border-radius:6px; flex-shrink:0; transition:all .15s; }
        .modal-close:hover { background:#f3f4f6; color:#374151; }

        /* Tabs */
        .modal-tabs { display:flex; gap:.4rem; padding:.75rem 1.5rem 0; }
        .mtab { flex:1; padding:.55rem 1rem; border:1.5px solid #e5eaf0; border-radius:.625rem; font-family:'Cairo',sans-serif; font-size:.83rem; font-weight:600; color:#6b7280; background:#fafafa; cursor:pointer; transition:all .15s; }
        .mtab:hover { border-color:#1B5E8C; color:#1B5E8C; }
        .mtab-active { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }

        /* Body */
        .modal-body { flex:1; overflow-y:auto; padding:1rem 1.5rem; display:flex; flex-direction:column; gap:.9rem; }

        /* Field helpers */
        .field-group { display:flex; flex-direction:column; gap:.3rem; }
        .lbl { font-size:.8rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; }
        .opt { color:#94a3b8; font-weight:400; font-size:.72rem; }
        .inp { width:100%; border:1.5px solid #d1d5db; border-radius:.625rem; padding:.6rem .85rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; }
        .inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .ltr { direction:ltr; text-align:left; }
        .field-hint { font-size:.72rem; color:#94a3b8; margin:.15rem 0 0; }

        /* Sponsor list box */
        .sponsor-list-box { border:1.5px solid #e5eaf0; border-radius:.625rem; max-height:180px; overflow-y:auto; background:#fafafa; }
        .sponsor-empty { font-size:.82rem; color:#9ca3af; text-align:center; padding:1rem; margin:0; }
        .sponsor-option { display:flex; align-items:center; gap:.65rem; padding:.65rem .85rem; cursor:pointer; transition:background .12s; border-bottom:1px solid #f0f4f8; }
        .sponsor-option:last-child { border-bottom:none; }
        .sponsor-option:hover { background:#f0f7ff; }
        .sponsor-selected { background:#eff6ff; }
        .sponsor-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.85rem; font-weight:700; flex-shrink:0; }
        .sponsor-name { font-size:.85rem; font-weight:600; color:#1f2937; }
        .sponsor-email { font-size:.73rem; color:#9ca3af; direction:ltr; text-align:left; }
        .sponsor-check { margin-right:auto; color:#1B5E8C; font-weight:800; }

        /* New sponsor grid */
        .new-sponsor-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .span2 { grid-column:1 / -1; }

        /* Shared grid */
        .shared-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }

        /* Divider */
        .section-divider { font-size:.75rem; font-weight:700; color:#94a3b8; text-align:center; position:relative; }
        .section-divider::before, .section-divider::after { content:''; position:absolute; top:50%; width:38%; height:1px; background:#e5eaf0; }
        .section-divider::before { right:0; }
        .section-divider::after  { left:0; }

        /* Selected preview */
        .selected-preview { background:#f8fafc; border:1.5px solid #e5eaf0; border-radius:.625rem; padding:.75rem .9rem; }
        .preview-label { font-size:.75rem; font-weight:700; color:#94a3b8; margin:0 0 .5rem; }
        .preview-chips { display:flex; flex-wrap:wrap; gap:.35rem; }
        .preview-chip { display:inline-flex; align-items:center; gap:.3rem; padding:.2rem .6rem; border-radius:2rem; font-size:.75rem; font-weight:600; }
        .chip-orphan { background:#dbeafe; color:#1d4ed8; }
        .chip-family  { background:#dcfce7; color:#15803d; }

        /* Modal error */
        .modal-error { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.5rem; padding:.6rem .85rem; font-size:.82rem; color:#b91c1c; font-weight:500; }

        /* Footer */
        .modal-foot { display:flex; justify-content:flex-end; gap:.75rem; padding:1rem 1.5rem; border-top:1px solid #f0f4f8; }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; white-space:nowrap; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-ghost { display:inline-flex; align-items:center; gap:.4rem; padding:.65rem 1.2rem; background:none; color:#6b7280; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #e5eaf0; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-ghost:hover:not(:disabled) { border-color:#1B5E8C; color:#1B5E8C; background:#f0f7ff; }
        .btn-ghost:disabled { opacity:.5; cursor:not-allowed; }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width:768px) {
          .page-top { flex-direction:column; }
          .table th:nth-child(6),
          .table td:nth-child(6),
          .table th:nth-child(7),
          .table td:nth-child(7) { display:none; }
          .new-sponsor-grid, .shared-grid { grid-template-columns:1fr; }
          .span2 { grid-column:1; }
        }
          {/* add this just before the closing </> of AssignModal *
      .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:40; }
      .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:min(560px,95vw); max-height:90vh; background:#fff; border-radius:1.25rem; z-index:50; display:flex; flex-direction:column; box-shadow:0 8px 40px rgba(0,0,0,.18); }
      .modal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1.5rem 1.5rem 0; }
      .modal-title { font-size:1.15rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
      .modal-sub { font-size:.8rem; color:#6b7a8d; margin:0; }
      .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.25rem .4rem; border-radius:6px; }
      .modal-close:hover { background:#f3f4f6; color:#374151; }
      .modal-tabs { display:flex; gap:.4rem; padding:.75rem 1.5rem 0; }
      .mtab { flex:1; padding:.55rem 1rem; border:1.5px solid #e5eaf0; border-radius:.625rem; font-family:'Cairo',sans-serif; font-size:.83rem; font-weight:600; color:#6b7280; background:#fafafa; cursor:pointer; }
      .mtab:hover { border-color:#1B5E8C; color:#1B5E8C; }
      .mtab-active { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }
      .modal-body { flex:1; overflow-y:auto; padding:1rem 1.5rem; display:flex; flex-direction:column; gap:.9rem; }
      .modal-foot { display:flex; justify-content:flex-end; gap:.75rem; padding:1rem 1.5rem; border-top:1px solid #f0f4f8; }
      .field-group { display:flex; flex-direction:column; gap:.3rem; }
      .lbl { font-size:.8rem; font-weight:600; color:#374151; }
      .req { color:#dc2626; } .opt { color:#94a3b8; font-weight:400; font-size:.72rem; }
      .inp { width:100%; border:1.5px solid #d1d5db; border-radius:.625rem; padding:.6rem .85rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; box-sizing:border-box; }
      .inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
      .ltr { direction:ltr; text-align:left; }
      .field-hint { font-size:.72rem; color:#94a3b8; margin:.15rem 0 0; }
      .sponsor-list-box { border:1.5px solid #e5eaf0; border-radius:.625rem; max-height:180px; overflow-y:auto; background:#fafafa; }
      .sponsor-empty { font-size:.82rem; color:#9ca3af; text-align:center; padding:1rem; margin:0; }
      .sponsor-option { display:flex; align-items:center; gap:.65rem; padding:.65rem .85rem; cursor:pointer; transition:background .12s; border-bottom:1px solid #f0f4f8; }
      .sponsor-option:last-child { border-bottom:none; }
      .sponsor-option:hover { background:#f0f7ff; }
      .sponsor-selected { background:#eff6ff; }
      .sponsor-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.85rem; font-weight:700; flex-shrink:0; }
      .sponsor-name { font-size:.85rem; font-weight:600; color:#1f2937; }
      .sponsor-email { font-size:.73rem; color:#9ca3af; }
      .sponsor-check { margin-right:auto; color:#1B5E8C; font-weight:800; }
      .new-sponsor-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
      .fg { display:flex; flex-direction:column; gap:.3rem; }
      .span2 { grid-column:1/-1; }
      .shared-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
      .section-divider { font-size:.75rem; font-weight:700; color:#94a3b8; text-align:center; }
      .selected-preview { background:#f8fafc; border:1.5px solid #e5eaf0; border-radius:.625rem; padding:.75rem .9rem; }
      .preview-label { font-size:.75rem; font-weight:700; color:#94a3b8; margin:0 0 .5rem; }
      .preview-chips { display:flex; flex-wrap:wrap; gap:.35rem; }
      .preview-chip { display:inline-flex; align-items:center; gap:.3rem; padding:.2rem .6rem; border-radius:2rem; font-size:.75rem; font-weight:600; }
      .chip-orphan { background:#dbeafe; color:#1d4ed8; }
      .chip-family { background:#dcfce7; color:#15803d; }
      .modal-error { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.5rem; padding:.6rem .85rem; font-size:.82rem; color:#b91c1c; }
      .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; }
      .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
      .btn-ghost { display:inline-flex; align-items:center; gap:.4rem; padding:.65rem 1.2rem; background:none; color:#6b7280; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #e5eaf0; border-radius:.75rem; cursor:pointer; }
      .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
      @keyframes spin { to { transform:rotate(360deg); } }
    `}
    </style>
    </AppShell>
  );
}
