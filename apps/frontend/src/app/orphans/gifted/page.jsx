'use client';

/**
 * page.jsx
 * Route:  /gifted  (GM only)
 * Task:   feature/ui-gifted-orphan-section
 *
 * Shows all orphans marked is_gifted=true in a rich card grid.
 * Each card displays:
 *   - Orphan name, age, governorate, sponsor, base + total monthly value
 *   - Benefits chips: school enrollment, uniform, bag, transport, allowance
 *   - "Edit Benefits" button → opens BenefitsDrawer
 *
 * BenefitsDrawer:
 *   - Full benefits config form (PUT /api/orphans/:id/gifted/config)
 *   - Toggle gifted flag off (PATCH /api/orphans/:id/gifted)
 *
 * API:
 *   GET  /api/orphans/gifted
 *   PUT  /api/orphans/:id/gifted/config
 *   PATCH /api/orphans/:id/gifted  { is_gifted: false }
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Helpers ────────────────────────────────────────────────────────────────────

const calcAge = (dob) => {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const fmt = (n) =>
  n != null && n !== '' ? Number(n).toLocaleString('ar-YE') : '—';

// ── Benefit chip ───────────────────────────────────────────────────────────────

function BenefitChip({ icon, label, active }) {
  return (
    <span
      className="benefit-chip"
      style={{
        background: active ? '#e8f5e9' : '#f5f5f5',
        color: active ? '#2e7d32' : '#9e9e9e',
        border: `1px solid ${active ? '#a5d6a7' : '#e0e0e0'}`,
        textDecoration: active ? 'none' : 'line-through',
        opacity: active ? 1 : 0.65,
      }}
    >
      {icon} {label}
    </span>
  );
}

// ── Orphan Card ────────────────────────────────────────────────────────────────

function OrphanCard({ orphan, onEdit, onRevoke }) {
  const age = calcAge(orphan.date_of_birth);
  const baseAmount = orphan.base_monthly_amount ?? 0;
  const extra = orphan.extra_monthly_amount ?? 0;
  const allowance = orphan.personal_allowance ?? 0;
  const total = Number(baseAmount) + Number(extra) + Number(allowance);

  return (
    <div className="orphan-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-avatar">
          {orphan.full_name?.charAt(0) || '؟'}
        </div>
        <div className="card-identity">
          <h3 className="card-name">{orphan.full_name}</h3>
          <p className="card-meta">
            {age} سنة · {orphan.governorate_ar || '—'}
          </p>
          {orphan.sponsor_name && (
            <p className="card-sponsor">🤝 {orphan.sponsor_name}</p>
          )}
        </div>
        <div className="card-star" title="يتيم موهوب">🌟</div>
      </div>

      {/* Monthly value */}
      <div className="card-value-row">
        <div className="value-block">
          <span className="value-label">المبلغ الأساسي</span>
          <span className="value-num">{fmt(baseAmount)} ر.ي</span>
        </div>
        <div className="value-divider" />
        <div className="value-block">
          <span className="value-label">إجمالي شهري</span>
          <span className="value-num value-total">{fmt(total)} ر.ي</span>
        </div>
      </div>

      {/* Benefits chips */}
      <div className="benefits-row">
        <BenefitChip icon="🏫" label="مدرسة أهلية" active={orphan.school_enrolled} />
        <BenefitChip icon="👕" label="زي مدرسي"   active={orphan.uniform_included} />
        <BenefitChip icon="🎒" label="حقيبة"       active={orphan.bag_included} />
        <BenefitChip icon="🚌" label="مواصلات"    active={orphan.transport_included} />
        {allowance > 0 && (
          <BenefitChip icon="💵" label={`${fmt(allowance)} ر.ي مصروف`} active />
        )}
      </div>

      {/* School name */}
      {orphan.school_name && (
        <p className="school-name">🏫 {orphan.school_name}</p>
      )}

      {/* Config notes */}
      {orphan.config_notes && (
        <p className="config-notes">{orphan.config_notes}</p>
      )}

      {/* Actions */}
      <div className="card-actions">
        <button className="btn-edit" onClick={() => onEdit(orphan)}>
          ✏️ تعديل المزايا
        </button>
        <button className="btn-revoke" onClick={() => onRevoke(orphan)}>
          إلغاء الموهوب
        </button>
      </div>
    </div>
  );
}

// ── Benefits Drawer ────────────────────────────────────────────────────────────

function BenefitsDrawer({ orphan, onClose, onSaved }) {
  const [form, setForm] = useState({
    extraMonthlyAmount: orphan?.extra_monthly_amount ?? 0,
    schoolName: orphan?.school_name ?? '',
    schoolEnrolled: orphan?.school_enrolled ?? false,
    uniformIncluded: orphan?.uniform_included ?? false,
    bagIncluded: orphan?.bag_included ?? false,
    transportIncluded: orphan?.transport_included ?? false,
    personalAllowance: orphan?.personal_allowance ?? 0,
    notes: orphan?.config_notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync when orphan changes (re-open with different orphan)
  useEffect(() => {
    if (!orphan) return;
    setForm({
      extraMonthlyAmount: orphan.extra_monthly_amount ?? 0,
      schoolName: orphan.school_name ?? '',
      schoolEnrolled: orphan.school_enrolled ?? false,
      uniformIncluded: orphan.uniform_included ?? false,
      bagIncluded: orphan.bag_included ?? false,
      transportIncluded: orphan.transport_included ?? false,
      personalAllowance: orphan.personal_allowance ?? 0,
      notes: orphan.config_notes ?? '',
    });
    setError('');
  }, [orphan?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/orphans/${orphan.id}/gifted/config`, {
        extraMonthlyAmount: Number(form.extraMonthlyAmount) || 0,
        schoolName: form.schoolName || null,
        schoolEnrolled: form.schoolEnrolled,
        uniformIncluded: form.uniformIncluded,
        bagIncluded: form.bagIncluded,
        transportIncluded: form.transportIncluded,
        personalAllowance: Number(form.personalAllowance) || 0,
        notes: form.notes || null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الحفظ. يرجى المحاولة مجدداً');
    } finally {
      setSaving(false);
    }
  };

  if (!orphan) return null;

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" dir="rtl">

        {/* Drawer header */}
        <div className="drawer-head">
          <div>
            <p className="drawer-suptitle">تعديل مزايا اليتيم الموهوب</p>
            <h2 className="drawer-name">{orphan.full_name}</h2>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className="drawer-body">

          {/* Extra monthly amount */}
          <div className="field-group">
            <label className="field-label">المبلغ الإضافي الشهري (ر.ي)</label>
            <input
              type="number"
              min="0"
              className="field-input ltr"
              value={form.extraMonthlyAmount}
              onChange={(e) => set('extraMonthlyAmount', e.target.value)}
            />
            <p className="field-hint">يُضاف إلى مبلغ الكفالة الأساسي</p>
          </div>

          {/* Personal allowance */}
          <div className="field-group">
            <label className="field-label">المصروف الشخصي الشهري (ر.ي)</label>
            <input
              type="number"
              min="0"
              className="field-input ltr"
              value={form.personalAllowance}
              onChange={(e) => set('personalAllowance', e.target.value)}
            />
          </div>

          {/* School enrollment */}
          <div className="toggle-section">
            <p className="toggle-title">الالتزامات التعليمية</p>

            <label className="toggle-row">
              <div className="toggle-info">
                <span className="toggle-icon">🏫</span>
                <div>
                  <span className="toggle-label">مسجّل في مدرسة أهلية</span>
                  <span className="toggle-sub">يشترط التسجيل للحصول على الكفالة المحسّنة</span>
                </div>
              </div>
              <div
                className={`toggle-switch ${form.schoolEnrolled ? 'on' : ''}`}
                onClick={() => set('schoolEnrolled', !form.schoolEnrolled)}
                role="switch"
                aria-checked={form.schoolEnrolled}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && set('schoolEnrolled', !form.schoolEnrolled)}
              />
            </label>

            {form.schoolEnrolled && (
              <div className="field-group" style={{ marginTop: '0.75rem' }}>
                <label className="field-label">اسم المدرسة</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="مثال: مدرسة النور الأهلية"
                  value={form.schoolName}
                  onChange={(e) => set('schoolName', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* In-kind benefits */}
          <div className="toggle-section">
            <p className="toggle-title">المزايا العينية</p>

            {[
              { key: 'uniformIncluded',   icon: '👕', label: 'زي مدرسي',  sub: 'يتم توفير الزي في بداية العام' },
              { key: 'bagIncluded',       icon: '🎒', label: 'حقيبة مدرسية', sub: 'حقيبة في بداية العام الدراسي' },
              { key: 'transportIncluded', icon: '🚌', label: 'مواصلات',   sub: 'تأمين وسيلة نقل للمدرسة' },
            ].map(({ key, icon, label, sub }) => (
              <label key={key} className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-icon">{icon}</span>
                  <div>
                    <span className="toggle-label">{label}</span>
                    <span className="toggle-sub">{sub}</span>
                  </div>
                </div>
                <div
                  className={`toggle-switch ${form[key] ? 'on' : ''}`}
                  onClick={() => set(key, !form[key])}
                  role="switch"
                  aria-checked={form[key]}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && set(key, !form[key])}
                />
              </label>
            ))}
          </div>

          {/* Notes */}
          <div className="field-group">
            <label className="field-label">ملاحظات إضافية <span className="opt">(اختياري)</span></label>
            <textarea
              className="field-input field-ta"
              rows={3}
              placeholder="أي تفاصيل إضافية خاصة بهذا اليتيم…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {/* Monthly total preview */}
          <div className="total-preview">
            <span className="total-label">الإجمالي الشهري المتوقع</span>
            <span className="total-value">
              {fmt(
                Number(orphan.base_monthly_amount || 0) +
                Number(form.extraMonthlyAmount || 0) +
                Number(form.personalAllowance || 0)
              )}{' '}
              ر.ي
            </span>
          </div>

          {error && (
            <div className="drawer-error">⚠ {error}</div>
          )}
        </div>

        {/* Drawer footer */}
        <div className="drawer-foot">
          <button className="btn-ghost-sm" onClick={onClose} disabled={saving}>
            إلغاء
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving} aria-busy={saving}>
            {saving ? <><span className="spin" aria-hidden />جارٍ الحفظ…</> : 'حفظ المزايا'}
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Revoke Confirm Modal ───────────────────────────────────────────────────────

function RevokeModal({ orphan, onClose, onConfirm, loading }) {
  if (!orphan) return null;
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="revoke-modal" dir="rtl">
        <div className="revoke-icon">⚠️</div>
        <h3 className="revoke-title">إلغاء تصنيف الموهوب</h3>
        <p className="revoke-body">
          هل أنت متأكد من إلغاء تصنيف <strong>{orphan.full_name}</strong> كيتيم موهوب؟
          سيُزال من هذه القائمة وتُحذف مزاياه الخاصة.
        </p>
        <div className="revoke-actions">
          <button className="btn-ghost-sm" onClick={onClose} disabled={loading}>تراجع</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'جارٍ الإلغاء…' : 'نعم، إلغاء التصنيف'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🌟</div>
      <h3 className="empty-title">لا يوجد أيتام موهوبون بعد</h3>
      <p className="empty-sub">
        يمكنك تصنيف يتيم كموهوب من صفحة إدارة الأيتام أو عند تسجيل يتيم جديد.
      </p>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────────

function StatsBar({ orphans }) {
  const totalMonthly = orphans.reduce((s, o) => s + Number(o.total_monthly_value || 0), 0);
  const enrolled = orphans.filter((o) => o.school_enrolled).length;
  const withTransport = orphans.filter((o) => o.transport_included).length;

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-num">{orphans.length}</span>
        <span className="stat-lbl">إجمالي الموهوبين</span>
      </div>
      <div className="stat-sep" />
      <div className="stat-item">
        <span className="stat-num">{fmt(totalMonthly)}</span>
        <span className="stat-lbl">إجمالي الصرف الشهري (ر.ي)</span>
      </div>
      <div className="stat-sep" />
      <div className="stat-item">
        <span className="stat-num">{enrolled}</span>
        <span className="stat-lbl">مسجّلون في مدارس أهلية</span>
      </div>
      <div className="stat-sep" />
      <div className="stat-item">
        <span className="stat-num">{withTransport}</span>
        <span className="stat-lbl">يحصلون على مواصلات</span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function GiftedOrphansPage() {
  const [orphans, setOrphans]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [editTarget, setEditTarget] = useState(null);   // orphan being edited
  const [revokeTarget, setRevokeTarget] = useState(null); // orphan being revoked
  const [revoking, setRevoking]     = useState(false);
  const [search, setSearch]         = useState('');
  const [toast, setToast]           = useState('');

  const fetchOrphans = useCallback(() => {
    setLoading(true);
    api.get('/orphans/gifted')
      .then(({ data }) => setOrphans(data.orphans || []))
      .catch(() => setError('تعذّر تحميل البيانات. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrphans(); }, [fetchOrphans]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaved = () => {
    setEditTarget(null);
    fetchOrphans();
    showToast('✅ تم حفظ مزايا اليتيم بنجاح');
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api.patch(`/orphans/${revokeTarget.id}/gifted`, { is_gifted: false });
      setRevokeTarget(null);
      fetchOrphans();
      showToast('تم إلغاء تصنيف الموهوب');
    } catch {
      // keep modal open so user can retry
    } finally {
      setRevoking(false);
    }
  };

  const filtered = orphans.filter((o) =>
    !search ||
    o.full_name?.includes(search) ||
    o.governorate_ar?.includes(search) ||
    o.sponsor_name?.includes(search)
  );

  return (
    <AppShell>
      <div className="gifted-page" dir="rtl">

        {/* Page header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">
              <span className="title-star">🌟</span> الأيتام الموهوبون
            </h1>
            <p className="page-sub">
              إدارة كفالات الأيتام المتميزين ومتابعة مزاياهم التعليمية والمالية
            </p>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && orphans.length > 0 && <StatsBar orphans={orphans} />}

        {/* Search */}
        {orphans.length > 0 && (
          <div className="search-row">
            <div className="search-wrap">
              <span className="search-ico">🔍</span>
              <input
                className="search-inp"
                placeholder="ابحث بالاسم أو المحافظة أو الكافل…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
            <span className="search-count">
              {filtered.length} من {orphans.length}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="err-banner">⚠ {error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="card-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skel skel-avatar" />
                <div className="skel skel-name" />
                <div className="skel skel-meta" />
                <div className="skel skel-chips" />
                <div className="skel skel-btn" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orphans.length === 0 && <EmptyState />}

        {/* No results from search */}
        {!loading && orphans.length > 0 && filtered.length === 0 && (
          <div className="no-results">
            <span>🔍</span>
            <p>لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}

        {/* Card grid */}
        {!loading && filtered.length > 0 && (
          <div className="card-grid">
            {filtered.map((o) => (
              <OrphanCard
                key={o.id}
                orphan={o}
                onEdit={setEditTarget}
                onRevoke={setRevokeTarget}
              />
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="toast" role="status">{toast}</div>
        )}

      </div>

      {/* Benefits Drawer */}
      {editTarget && (
        <BenefitsDrawer
          orphan={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Revoke Modal */}
      <RevokeModal
        orphan={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        loading={revoking}
      />

      <style jsx>{`
        /* ── Page layout ─────────────────────────────────────────────── */
        .gifted-page {
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 4rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .page-title {
          font-size: 1.7rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .3rem;
          display: flex; align-items: center; gap: .5rem;
        }
        .title-star { font-size: 1.4rem; }
        .page-sub { font-size: .85rem; color: #6b7a8d; margin: 0; }

        /* ── Stats bar ───────────────────────────────────────────────── */
        .stats-bar {
          display: flex; align-items: center; flex-wrap: wrap; gap: 0;
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          overflow: hidden;
        }
        .stat-item {
          flex: 1; min-width: 120px; padding: 1rem 1.5rem;
          display: flex; flex-direction: column; gap: .2rem; align-items: center;
        }
        .stat-num { font-size: 1.5rem; font-weight: 800; color: #1B5E8C; }
        .stat-lbl { font-size: .72rem; color: #6b7280; font-weight: 500; white-space: nowrap; }
        .stat-sep { width: 1px; align-self: stretch; background: #f0f4f8; margin: .5rem 0; }

        /* ── Search ──────────────────────────────────────────────────── */
        .search-row { display: flex; align-items: center; gap: 1rem; }
        .search-wrap { position: relative; flex: 1; display: flex; align-items: center; }
        .search-ico { position: absolute; right: .85rem; font-size: .9rem; pointer-events: none; }
        .search-inp {
          width: 100%; border: 1.5px solid #d1d5db; border-radius: .75rem;
          padding: .65rem .9rem .65rem 2.5rem; padding-right: 2.4rem;
          font-size: .88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .search-inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .search-clear {
          position: absolute; left: .75rem; background: none; border: none;
          cursor: pointer; color: #9ca3af; font-size: .85rem;
        }
        .search-count { font-size: .8rem; color: #9ca3af; white-space: nowrap; }

        /* ── Card grid ───────────────────────────────────────────────── */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        /* ── Orphan card ─────────────────────────────────────────────── */
        .orphan-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem;
          padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
          box-shadow: 0 1px 4px rgba(27,94,140,.05);
          transition: box-shadow .2s, transform .2s;
          position: relative; overflow: hidden;
        }
        .orphan-card::before {
          content: '';
          position: absolute; top: 0; right: 0; left: 0; height: 3px;
          background: linear-gradient(90deg, #F0A500, #1B5E8C);
        }
        .orphan-card:hover {
          box-shadow: 0 6px 24px rgba(27,94,140,.12);
          transform: translateY(-2px);
        }

        .card-header { display: flex; align-items: flex-start; gap: .85rem; }
        .card-avatar {
          width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #F0A500, #f59e0b);
          color: #fff; font-size: 1.2rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .card-identity { flex: 1; min-width: 0; }
        .card-name { font-size: 1rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .card-meta { font-size: .78rem; color: #6b7280; margin: 0 0 .15rem; }
        .card-sponsor { font-size: .75rem; color: #1B5E8C; margin: 0; font-weight: 600; }
        .card-star { font-size: 1.3rem; flex-shrink: 0; }

        /* Value row */
        .card-value-row {
          display: flex; align-items: center; gap: 1rem;
          background: #f8fbff; border: 1px solid #dbeafe; border-radius: .75rem; padding: .85rem 1rem;
        }
        .value-block { flex: 1; display: flex; flex-direction: column; gap: .15rem; align-items: center; }
        .value-label { font-size: .72rem; color: #6b7280; font-weight: 500; }
        .value-num { font-size: 1rem; font-weight: 700; color: #1B5E8C; }
        .value-total { color: #2e7d32; font-size: 1.1rem; }
        .value-divider { width: 1px; align-self: stretch; background: #dbeafe; }

        /* Benefits chips */
        .benefits-row { display: flex; flex-wrap: wrap; gap: .4rem; }
        .benefit-chip {
          display: inline-flex; align-items: center; gap: .3rem;
          font-size: .72rem; font-weight: 600; padding: .25rem .6rem; border-radius: 2rem;
        }

        /* School name */
        .school-name { font-size: .78rem; color: #374151; margin: 0; background: #f0f7ff; border-radius: .5rem; padding: .35rem .65rem; }
        .config-notes { font-size: .78rem; color: #6b7280; margin: 0; font-style: italic; }

        /* Card actions */
        .card-actions { display: flex; gap: .6rem; margin-top: auto; }
        .btn-edit {
          flex: 1; padding: .6rem; background: #1B5E8C; color: #fff;
          font-family: 'Cairo', sans-serif; font-size: .83rem; font-weight: 700;
          border: none; border-radius: .625rem; cursor: pointer; transition: background .15s;
        }
        .btn-edit:hover { background: #134569; }
        .btn-revoke {
          padding: .6rem .85rem; background: none; color: #9ca3af;
          font-family: 'Cairo', sans-serif; font-size: .78rem; font-weight: 600;
          border: 1.5px solid #e5eaf0; border-radius: .625rem; cursor: pointer; transition: all .15s;
        }
        .btn-revoke:hover { color: #dc2626; border-color: #fecaca; background: #fff8f8; }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .skeleton-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem;
          padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
        }
        .skel {
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: .5rem;
        }
        .skel-avatar { width: 48px; height: 48px; border-radius: 50%; }
        .skel-name   { height: 18px; width: 60%; }
        .skel-meta   { height: 14px; width: 40%; }
        .skel-chips  { height: 28px; width: 80%; }
        .skel-btn    { height: 38px; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ── Empty / no results ───────────────────────────────────────── */
        .empty-state, .no-results {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 300px; gap: .75rem; text-align: center;
        }
        .empty-icon { font-size: 4rem; }
        .empty-title { font-size: 1.15rem; font-weight: 700; color: #374151; margin: 0; }
        .empty-sub { font-size: .85rem; color: #9ca3af; margin: 0; max-width: 360px; line-height: 1.7; }
        .no-results { font-size: .88rem; color: #9ca3af; flex-direction: row; min-height: 120px; }
        .no-results span { font-size: 1.5rem; }

        /* ── Error banner ─────────────────────────────────────────────── */
        .err-banner {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .85rem 1rem; border-radius: .75rem; font-size: .85rem;
        }

        /* ── Toast ────────────────────────────────────────────────────── */
        .toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          background: #0d3d5c; color: #fff; padding: .75rem 1.5rem;
          border-radius: 2rem; font-size: .88rem; font-weight: 600;
          box-shadow: 0 4px 20px rgba(0,0,0,.2); z-index: 100;
          animation: toastIn .25s ease;
        }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        /* ── Backdrop ─────────────────────────────────────────────────── */
        .backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 40;
          animation: fadeIn .2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Benefits Drawer ─────────────────────────────────────────── */
        .drawer {
          position: fixed; top: 0; left: 0; width: 440px; max-width: 95vw;
          height: 100vh; background: #fff; z-index: 50;
          display: flex; flex-direction: column;
          box-shadow: -4px 0 32px rgba(0,0,0,.15);
          animation: slideIn .25s ease;
        }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

        .drawer-head {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
          padding: 1.5rem; border-bottom: 1px solid #f0f4f8;
        }
        .drawer-suptitle { font-size: .72rem; font-weight: 700; color: #F0A500; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 .3rem; }
        .drawer-name { font-size: 1.15rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .drawer-close {
          background: none; border: none; font-size: 1rem; color: #9ca3af;
          cursor: pointer; padding: .25rem .4rem; border-radius: 6px; transition: all .15s; flex-shrink: 0;
        }
        .drawer-close:hover { background: #f3f4f6; color: #374151; }

        .drawer-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

        /* Field group */
        .field-group { display: flex; flex-direction: column; gap: .35rem; }
        .field-label { font-size: .82rem; font-weight: 600; color: #374151; }
        .field-input {
          border: 1.5px solid #d1d5db; border-radius: .625rem; padding: .65rem .9rem;
          font-size: .88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none; transition: border-color .15s, box-shadow .15s;
        }
        .field-input:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .field-hint { font-size: .73rem; color: #9ca3af; margin: 0; }
        .field-ta { resize: vertical; min-height: 80px; }
        .opt { color: #9ca3af; font-weight: 400; font-size: .75rem; }
        .ltr { direction: ltr; text-align: left; }

        /* Toggle section */
        .toggle-section {
          background: #fafbfc; border: 1px solid #e5eaf0; border-radius: .875rem; padding: 1rem;
          display: flex; flex-direction: column; gap: .75rem;
        }
        .toggle-title { font-size: .75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0; }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; cursor: pointer; }
        .toggle-info { display: flex; align-items: center; gap: .65rem; }
        .toggle-icon { font-size: 1.2rem; flex-shrink: 0; }
        .toggle-label { display: block; font-size: .85rem; font-weight: 600; color: #374151; }
        .toggle-sub { display: block; font-size: .73rem; color: #9ca3af; }
        .toggle-switch {
          width: 44px; height: 24px; border-radius: 12px; background: #d1d5db;
          position: relative; transition: background .2s; flex-shrink: 0; cursor: pointer;
        }
        .toggle-switch::after {
          content: ''; position: absolute; top: 2px; right: 2px;
          width: 20px; height: 20px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.2); transition: transform .2s;
        }
        .toggle-switch.on { background: #1B5E8C; }
        .toggle-switch.on::after { transform: translateX(-20px); }

        /* Total preview */
        .total-preview {
          display: flex; align-items: center; justify-content: space-between;
          background: linear-gradient(135deg, #f0f7ff, #e8f5e9);
          border: 1px solid #c8e6c9; border-radius: .875rem; padding: 1rem 1.25rem;
        }
        .total-label { font-size: .85rem; font-weight: 600; color: #374151; }
        .total-value { font-size: 1.2rem; font-weight: 800; color: #2e7d32; }

        /* Drawer error */
        .drawer-error {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .65rem .85rem; border-radius: .625rem; font-size: .82rem;
        }

        .drawer-foot {
          display: flex; gap: .75rem; justify-content: flex-end;
          padding: 1rem 1.5rem; border-top: 1px solid #f0f4f8;
        }

        /* ── Revoke modal ─────────────────────────────────────────────── */
        .revoke-modal {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          z-index: 50; background: #fff; border-radius: 1.25rem; padding: 2rem;
          max-width: 420px; width: 90vw; text-align: center;
          box-shadow: 0 8px 40px rgba(0,0,0,.18);
          animation: popIn .2s ease;
        }
        @keyframes popIn { from { opacity: 0; transform: translate(-50%, -52%) scale(.97); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        .revoke-icon { font-size: 2.5rem; margin-bottom: .75rem; }
        .revoke-title { font-size: 1.1rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .75rem; }
        .revoke-body { font-size: .88rem; color: #6b7280; margin: 0 0 1.5rem; line-height: 1.7; }
        .revoke-actions { display: flex; gap: .75rem; justify-content: center; }

        /* ── Shared buttons ───────────────────────────────────────────── */
        .btn-ghost-sm {
          padding: .6rem 1.25rem; background: none; color: #1B5E8C;
          font-family: 'Cairo', sans-serif; font-size: .85rem; font-weight: 600;
          border: 1.5px solid #dde5f0; border-radius: .625rem; cursor: pointer; transition: all .15s;
        }
        .btn-ghost-sm:hover { background: #f0f7ff; border-color: #1B5E8C; }
        .btn-ghost-sm:disabled { opacity: .5; cursor: not-allowed; }

        .btn-save {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .65rem 1.5rem; background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-family: 'Cairo', sans-serif; font-size: .88rem; font-weight: 700;
          border: none; border-radius: .625rem; cursor: pointer; transition: all .15s;
          box-shadow: 0 2px 8px rgba(27,94,140,.25);
        }
        .btn-save:hover:not(:disabled) { background: linear-gradient(135deg, #2E7EB8, #1B5E8C); }
        .btn-save:disabled { opacity: .65; cursor: not-allowed; }

        .btn-danger {
          padding: .6rem 1.25rem; background: #dc2626; color: #fff;
          font-family: 'Cairo', sans-serif; font-size: .85rem; font-weight: 700;
          border: none; border-radius: .625rem; cursor: pointer; transition: background .15s;
        }
        .btn-danger:hover:not(:disabled) { background: #b91c1c; }
        .btn-danger:disabled { opacity: .65; cursor: not-allowed; }

        .spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .stats-bar { flex-direction: column; }
          .stat-sep { width: 100%; height: 1px; align-self: auto; margin: 0; }
          .card-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </AppShell>
  );
}
