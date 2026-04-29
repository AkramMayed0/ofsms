'use client';

/**
 * page.jsx
 * Route:  /sponsors  (GM only)
 * Task:   feature/ui-sponsor-management
 *
 * List all sponsors with orphan/family counts and monthly totals.
 * Click row → slide-in drawer with full portfolio table.
 * Create sponsor button → modal form.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate   = (iso) => iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';
const formatAmount = (n)   => n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

// ── Beneficiary type label ─────────────────────────────────────────────────────

const typeLabel = (t) => t === 'orphan' ? 'يتيم' : 'أسرة';

// ── CreateSponsorModal ─────────────────────────────────────────────────────────

function CreateSponsorModal({ onClose, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { fullName: '', phone: '', email: '', portalPassword: '' },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    setApiErr('');
    try {
      await api.post('/sponsors', data);
      onCreated();
      onClose();
    } catch (err) {
      setApiErr(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ. يرجى المحاولة مجدداً'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" dir="rtl">
        <div className="modal-head">
          <h2 className="modal-title">إضافة كافل جديد</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-body">
          {apiErr && <div className="err-banner">⚠ {apiErr}</div>}

          <div className="fg">
            <label className="lbl">الاسم الكامل <span className="req">*</span></label>
            <input className={`inp ${errors.fullName ? 'inp-err' : ''}`}
              placeholder="اسم الكافل كاملاً"
              {...register('fullName', { required: 'الاسم مطلوب', minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' } })}
            />
            {errors.fullName && <p className="ferr">{errors.fullName.message}</p>}
          </div>

          <div className="fg">
            <label className="lbl">رقم الهاتف <span className="opt">(اختياري)</span></label>
            <input className="inp" placeholder="+967 7XX XXX XXX" {...register('phone')} />
          </div>

          <div className="fg">
            <label className="lbl">البريد الإلكتروني <span className="opt">(اختياري)</span></label>
            <input className="inp ltr" type="email" placeholder="sponsor@example.com"
              {...register('email', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد إلكتروني غير صحيح' }
              })}
            />
            {errors.email && <p className="ferr">{errors.email.message}</p>}
          </div>

          <div className="fg">
            <label className="lbl">كلمة مرور البوابة <span className="req">*</span></label>
            <input className={`inp ltr ${errors.portalPassword ? 'inp-err' : ''}`}
              type="password" placeholder="8 أحرف على الأقل"
              {...register('portalPassword', {
                required: 'كلمة المرور مطلوبة',
                minLength: { value: 8, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
              })}
            />
            {errors.portalPassword && <p className="ferr">{errors.portalPassword.message}</p>}
            <p className="field-hint">سيستخدمها الكافل للدخول إلى بوابته الخاصة</p>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><span className="spin" />جارٍ الحفظ…</> : 'إضافة الكافل'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:50; animation:fadeIn .2s ease; }
        .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:460px; max-width:95vw; background:#fff; border-radius:1.25rem; z-index:51; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:slideUp .25s ease; font-family:'Cairo','Tajawal',sans-serif; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translate(-50%,-45%); } to { opacity:1; transform:translate(-50%,-50%); } }
        .modal-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; }
        .modal-title { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.2rem .35rem; border-radius:6px; }
        .modal-close:hover { background:#f3f4f6; color:#374151; }
        .modal-body { display:flex; flex-direction:column; gap:1rem; padding:1.5rem; }
        .modal-foot { display:flex; gap:.75rem; justify-content:flex-end; padding-top:.5rem; border-top:1px solid #f0f4f8; margin-top:.5rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; }
        .opt { color:#94a3b8; font-weight:400; font-size:.75rem; }
        .inp { border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; width:100%; box-sizing:border-box; }
        .inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color:#dc2626!important; }
        .ltr { direction:ltr; text-align:left; }
        .ferr { font-size:.77rem; color:#dc2626; margin:0; }
        .field-hint { font-size:.72rem; color:#94a3b8; margin:0; }
        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.625rem; padding:.65rem .85rem; font-size:.82rem; color:#b91c1c; font-weight:500; }
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-ghost { display:inline-flex; align-items:center; padding:.7rem 1.25rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-ghost:hover { background:#f0f7ff; }
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── SponsorDrawer ──────────────────────────────────────────────────────────────

function SponsorDrawer({ sponsor, onClose }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sponsor) return;
    setLoading(true);
    api.get(`/sponsors/${sponsor.id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [sponsor?.id]);

  if (!sponsor) return null;

  const sponsorships = detail?.sponsorships || [];
  const totalMonthly = sponsorships
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + parseFloat(s.monthly_amount || 0), 0);

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" dir="rtl">
        <div className="drawer-head">
          <div>
            <div className="drawer-avatar">{sponsor.full_name?.charAt(0) || '؟'}</div>
            <div>
              <h2 className="drawer-name">{sponsor.full_name}</h2>
              <div className="drawer-meta">
                {sponsor.phone && <span>📞 {sponsor.phone}</span>}
                {sponsor.email && <span>✉ {sponsor.email}</span>}
              </div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Summary strip */}
        <div className="drawer-summary">
          <div className="summary-item">
            <span className="summary-val">{sponsor.active_sponsorships || 0}</span>
            <span className="summary-lbl">كفالة نشطة</span>
          </div>
          <div className="summary-div" />
          <div className="summary-item">
            <span className="summary-val">{formatAmount(totalMonthly)}</span>
            <span className="summary-lbl">إجمالي شهري</span>
          </div>
          <div className="summary-div" />
          <div className="summary-item">
            <span className="summary-val">{formatDate(sponsor.created_at)}</span>
            <span className="summary-lbl">تاريخ التسجيل</span>
          </div>
        </div>

        {/* Portal token */}
        <div className="portal-section">
          <span className="portal-label">🔗 رابط البوابة الخاصة</span>
          <div className="portal-token">
            <span className="token-text" dir="ltr">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/sponsor/portal?token=${sponsor.portal_token}`}
            </span>
            <button className="copy-btn" onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/sponsor/portal?token=${sponsor.portal_token}`
              );
            }}>نسخ</button>
          </div>
        </div>

        {/* Sponsorships table */}
        <div className="drawer-body">
          <h3 className="drawer-section-title">
            كفالاته ({sponsorships.length})
          </h3>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {[1,2,3].map(i => (
                <div key={i} className="skel-row">
                  <div className="skel" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel" style={{ width: '55%', height: 12, marginBottom: 5 }} />
                    <div className="skel" style={{ width: '35%', height: 11 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : sponsorships.length === 0 ? (
            <div className="drawer-empty">
              <span>🤝</span>
              <p>لا توجد كفالات مسجّلة بعد</p>
            </div>
          ) : (
            <div className="spon-list">
              {sponsorships.map((s) => (
                <div key={s.id} className={`spon-item ${!s.is_active ? 'spon-inactive' : ''}`}>
                  <div className="spon-avatar" style={{ opacity: s.is_active ? 1 : 0.45 }}>
                    {s.beneficiary_type === 'orphan' ? '👦' : '👨‍👩‍👧'}
                  </div>
                  <div className="spon-info">
                    <div className="spon-type">
                      <span className="type-tag">{typeLabel(s.beneficiary_type)}</span>
                      {!s.is_active && <span className="inactive-tag">منتهية</span>}
                    </div>
                    <div className="spon-agent">المندوب: {s.agent_name || '—'}</div>
                  </div>
                  <div className="spon-amount">
                    <span className="amount-val">{formatAmount(s.monthly_amount)}</span>
                    <span className="amount-lbl">/ شهر</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <button className="btn-ghost-sm" onClick={onClose}>إغلاق</button>
        </div>
      </aside>

      <style jsx>{`
        .backdrop { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:40; animation:fadeIn .2s ease; }
        .drawer { position:fixed; top:0; left:0; width:440px; max-width:95vw; height:100vh; background:#fff; z-index:50; display:flex; flex-direction:column; box-shadow:-4px 0 24px rgba(0,0,0,.12); animation:slideIn .25s ease; font-family:'Cairo','Tajawal',sans-serif; overflow:hidden; }
        @keyframes slideIn { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .drawer-head { display:flex; align-items:flex-start; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; gap:1rem; }
        .drawer-head > div:first-child { display:flex; align-items:center; gap:.85rem; min-width:0; }
        .drawer-avatar { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:700; flex-shrink:0; }
        .drawer-name { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0 0 .25rem; }
        .drawer-meta { display:flex; flex-direction:column; gap:.15rem; font-size:.75rem; color:#6b7a8d; }
        .drawer-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.25rem .4rem; border-radius:6px; flex-shrink:0; }
        .drawer-close:hover { background:#f3f4f6; color:#374151; }

        .drawer-summary { display:flex; align-items:center; padding:1rem 1.5rem; background:#f8fafc; border-bottom:1px solid #e5eaf0; gap:1rem; }
        .summary-item { display:flex; flex-direction:column; align-items:center; gap:.2rem; flex:1; }
        .summary-val { font-size:.92rem; font-weight:800; color:#0d3d5c; font-family:'Cairo',sans-serif; }
        .summary-lbl { font-size:.68rem; color:#94a3b8; font-weight:600; }
        .summary-div { width:1px; height:32px; background:#e5eaf0; flex-shrink:0; }

        .portal-section { padding:.85rem 1.5rem; background:#f0f7ff; border-bottom:1px solid #dbeafe; }
        .portal-label { font-size:.75rem; font-weight:700; color:#1B5E8C; display:block; margin-bottom:.4rem; }
        .portal-token { display:flex; align-items:center; gap:.5rem; background:#fff; border:1px solid #bfdbfe; border-radius:.5rem; padding:.4rem .65rem; }
        .token-text { flex:1; font-size:.68rem; color:#374151; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .copy-btn { flex-shrink:0; background:#1B5E8C; color:#fff; border:none; border-radius:.375rem; padding:.25rem .6rem; font-size:.72rem; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; transition:background .15s; }
        .copy-btn:hover { background:#134569; }

        .drawer-body { flex:1; overflow-y:auto; padding:1.25rem 1.5rem; }
        .drawer-section-title { font-size:.82rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; margin:0 0 .85rem; }
        .drawer-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:2rem; text-align:center; }
        .drawer-empty span { font-size:2rem; }
        .drawer-empty p { font-size:.83rem; color:#94a3b8; margin:0; font-weight:600; }

        .spon-list { display:flex; flex-direction:column; gap:.4rem; }
        .spon-item { display:flex; align-items:center; gap:.75rem; padding:.65rem .5rem; border-radius:.625rem; transition:background .12s; }
        .spon-item:hover { background:#f8fbff; }
        .spon-inactive { opacity:.6; }
        .spon-avatar { width:36px; height:36px; border-radius:50%; background:#f0f4f8; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
        .spon-info { flex:1; min-width:0; }
        .spon-type { display:flex; gap:.35rem; align-items:center; margin-bottom:.2rem; }
        .type-tag { font-size:.7rem; font-weight:700; padding:.1rem .45rem; border-radius:2rem; background:#eff6ff; color:#3b82f6; }
        .inactive-tag { font-size:.7rem; font-weight:700; padding:.1rem .45rem; border-radius:2rem; background:#f3f4f6; color:#9ca3af; }
        .spon-agent { font-size:.72rem; color:#94a3b8; }
        .spon-amount { text-align:left; flex-shrink:0; }
        .amount-val { display:block; font-size:.85rem; font-weight:800; color:#1B5E8C; font-family:'Cairo',sans-serif; }
        .amount-lbl { font-size:.68rem; color:#94a3b8; }

        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        .skel-row { display:flex; align-items:center; gap:.75rem; padding:.5rem 0; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .drawer-foot { padding:1rem 1.5rem; border-top:1px solid #f0f4f8; display:flex; justify-content:flex-end; }
        .btn-ghost-sm { display:inline-flex; align-items:center; padding:.55rem 1.1rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.625rem; cursor:pointer; transition:all .15s; }
        .btn-ghost-sm:hover { background:#f0f7ff; border-color:#1B5E8C; }
      `}</style>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SponsorManagementPage() {
  const [sponsors,       setSponsors]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [search,         setSearch]         = useState('');
  const [selected,       setSelected]       = useState(null);
  const [showCreate,     setShowCreate]     = useState(false);

  const fetchSponsors = () => {
    setLoading(true);
    api.get('/sponsors')
      .then(({ data }) => setSponsors(data.sponsors || []))
      .catch(() => setError('تعذّر تحميل البيانات. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSponsors(); }, []);

  const filtered = sponsors.filter((s) =>
    !search ||
    s.full_name?.includes(search) ||
    s.email?.includes(search) ||
    s.phone?.includes(search)
  );

  const totalActive = sponsors.reduce((sum, s) => sum + parseInt(s.active_sponsorships || 0), 0);

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">إدارة الكفلاء</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${sponsors.length} كافل · ${totalActive} كفالة نشطة`}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + إضافة كافل جديد
          </button>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-inp"
            placeholder="ابحث بالاسم أو البريد أو رقم الهاتف…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>

        {error && <div className="err-banner">⚠ {error}</div>}

        {/* Loading skeleton */}
        {loading && (
          <div className="table-wrap">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skel-row">
                <div className="skel" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ width: '40%', height: 14, marginBottom: 6 }} />
                  <div className="skel" style={{ width: '25%', height: 12 }} />
                </div>
                <div className="skel" style={{ width: 60, height: 24, borderRadius: '2rem' }} />
                <div className="skel" style={{ width: 100, height: 14 }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: '3rem' }}>🤝</div>
            <h3 className="empty-title">
              {search ? 'لا توجد نتائج مطابقة' : 'لا يوجد كفلاء مسجّلون بعد'}
            </h3>
            <p className="empty-sub">
              {search ? 'جرّب تغيير معايير البحث' : 'ابدأ بإضافة كافل جديد'}
            </p>
            {!search && (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                + إضافة كافل جديد
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>اسم الكافل</th>
                  <th>رقم الهاتف</th>
                  <th>البريد الإلكتروني</th>
                  <th>الكفالات النشطة</th>
                  <th>أنشأه</th>
                  <th>تاريخ التسجيل</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="trow"
                    onClick={() => setSelected(s)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelected(s)}
                  >
                    <td>
                      <div className="name-cell">
                        <div className="avatar">{s.full_name?.charAt(0) || '؟'}</div>
                        <span className="name-text">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="muted">{s.phone || '—'}</td>
                    <td className="muted ltr">{s.email || '—'}</td>
                    <td>
                      <span className="count-badge">
                        {s.active_sponsorships || 0} كفالة
                      </span>
                    </td>
                    <td className="muted">{s.created_by_name || '—'}</td>
                    <td className="muted">{formatDate(s.created_at)}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                      >
                        عرض الملف ←
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              عرض {filtered.length} من {sponsors.length} كافل
            </div>
          </div>
        )}
      </div>

      {/* Sponsor drawer */}
      <SponsorDrawer sponsor={selected} onClose={() => setSelected(null)} />

      {/* Create modal */}
      {showCreate && (
        <CreateSponsorModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchSponsors}
        />
      )}

      <style jsx>{`
        .page { max-width:1100px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; display:flex; flex-direction:column; gap:1.25rem; }
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        .search-wrap { position:relative; display:flex; align-items:center; }
        .search-icon { position:absolute; right:.85rem; font-size:.9rem; pointer-events:none; }
        .search-inp { width:100%; border:1.5px solid #d1d5db; border-radius:.75rem; padding:.65rem .9rem .65rem 2.5rem; padding-right:2.4rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; }
        .search-inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .search-clear { position:absolute; left:.75rem; background:none; border:none; cursor:pointer; color:#9ca3af; font-size:.85rem; }

        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; font-weight:500; }

        .table-wrap { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th { padding:.8rem 1.1rem; text-align:right; font-size:.72rem; font-weight:700; color:#6b7a8d; border-bottom:1px solid #e5eaf0; white-space:nowrap; }
        .table td { padding:.85rem 1.1rem; font-size:.83rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow { cursor:pointer; transition:background .12s; }
        .trow:hover { background:#f8fbff; }
        .trow:last-child td { border-bottom:none; }
        .name-cell { display:flex; align-items:center; gap:.7rem; }
        .avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.9rem; font-weight:700; flex-shrink:0; }
        .name-text { font-weight:700; color:#1f2937; }
        .muted { color:#6b7a8d; }
        .ltr { direction:ltr; text-align:left; }
        .count-badge { display:inline-flex; align-items:center; padding:.25rem .75rem; background:#f0f7ff; border:1px solid #bfdbfe; border-radius:2rem; font-size:.75rem; font-weight:700; color:#1d4ed8; }
        .view-btn { background:none; border:1.5px solid #e5eaf0; border-radius:.5rem; padding:.3rem .7rem; font-size:.78rem; font-weight:600; color:#1B5E8C; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; white-space:nowrap; }
        .view-btn:hover { background:#f0f7ff; border-color:#1B5E8C; }
        .table-footer { padding:.75rem 1.1rem; font-size:.78rem; color:#9ca3af; border-top:1px solid #f0f4f8; }

        .skel-row { display:flex; align-items:center; gap:1rem; padding:.85rem 1.1rem; border-bottom:1px solid #f8fafc; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:320px; gap:.75rem; text-align:center; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem; }
        .empty-title { font-size:1.05rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }

        @media (max-width: 768px) {
          .page-top { flex-direction:column; }
          .table th:nth-child(3), .table td:nth-child(3),
          .table th:nth-child(5), .table td:nth-child(5) { display:none; }
        }
      `}</style>
    </AppShell>
  );
}
