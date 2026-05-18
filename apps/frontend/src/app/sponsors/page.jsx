'use client';

/**
 * page.jsx
 * Route:  /sponsors  (GM only)
 * Task:   feature/ui-sponsor-management
 *
 * List all sponsors with orphan/family counts and monthly totals.
 * Click row → navigates to full sponsor detail page.
 * Create sponsor button → modal form.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import { 
  Search, 
  Plus, 
  X, 
  User, 
  AlertTriangle, 
  ArrowLeft, 
  Handshake 
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

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
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-body">
          {apiErr && (
            <div className="err-banner">
              <AlertTriangle size={16} /> 
              <span>{apiErr}</span>
            </div>
          )}

          <div className="fg">
            <label className="lbl">الاسم الكامل <span className="req">*</span></label>
            <input className={`inp ${errors.fullName ? 'inp-err' : ''}`}
              placeholder="اسم الكافل كاملاً"
              {...register('fullName', { 
                required: 'الاسم مطلوب', 
                minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                pattern: { value: /^[\p{L}\s'-]+$/u, message: 'الاسم يجب أن يحتوي على أحرف فقط' }
              })}
            />
            {errors.fullName && <p className="ferr">{errors.fullName.message}</p>}
          </div>

          <div className="fg">
            <label className="lbl">رقم الهاتف <span className="opt">(اختياري)</span></label>
            <input className="inp ltr" placeholder="+967 7XX XXX XXX" {...register('phone')} />
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
        .modal-close { background:none; border:none; display:flex; align-items:center; justify-content:center; color:#9ca3af; cursor:pointer; padding:.35rem; border-radius:6px; transition:all .15s; }
        .modal-close:hover { background:#f3f4f6; color:#ef4444; }
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
        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.625rem; padding:.65rem .85rem; font-size:.82rem; color:#b91c1c; font-weight:500; display:flex; align-items:center; gap:.5rem; }
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

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SponsorManagementPage() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

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
            <Plus size={18} />
            <span>إضافة كافل جديد</span>
          </button>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <Search className="search-icon" size={18} color="#9ca3af" />
          <input
            className="search-inp"
            placeholder="ابحث بالاسم أو البريد أو رقم الهاتف…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="err-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

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
            <Handshake size={64} className="empty-icon" color="#cbd5e1" />
            <h3 className="empty-title">
              {search ? 'لا توجد نتائج مطابقة' : 'لا يوجد كفلاء مسجّلون بعد'}
            </h3>
            <p className="empty-sub">
              {search ? 'جرّب تغيير معايير البحث' : 'ابدأ بإضافة كافل جديد'}
            </p>
            {!search && (
              <button className="btn-primary mt-2" onClick={() => setShowCreate(true)}>
                <Plus size={18} /> إضافة كافل جديد
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>اسم الكافل</th>
                  <th>رقم الهاتف</th>
                  <th>البريد الإلكتروني</th>
                  <th>الكفالات النشطة</th>
                  <th>أنشأه</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="trow"
                    onClick={() => router.push(`/sponsors/${s.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/sponsors/${s.id}`)}
                  >
                    <td>
                      <div className="name-cell">
                        <div className="avatar">
                          {s.full_name ? s.full_name.charAt(0) : <User size={16} />}
                        </div>
                        <span className="name-text">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="muted ltr">{s.phone || '—'}</td>
                    <td className="muted ltr">{s.email || '—'}</td>
                    <td>
                      <span className="count-badge">
                        {s.active_sponsorships || 0} كفالة
                      </span>
                    </td>
                    <td className="muted">{s.created_by_name || '—'}</td>
                    <td className="muted">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="table-footer">
              عرض {filtered.length} من {sponsors.length} كافل
            </div>
          </div>
        )}
      </div>

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
        :global(.search-icon) { position:absolute; right:.85rem; pointer-events:none; }
        .search-inp { width:100%; border:1.5px solid #d1d5db; border-radius:.75rem; padding:.65rem .9rem .65rem 2.5rem; padding-right:2.5rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; }
        .search-inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .search-clear { position:absolute; left:.5rem; background:none; border:none; cursor:pointer; color:#9ca3af; display:flex; align-items:center; justify-content:center; padding:.25rem; border-radius:50%; transition:all .15s;}
        .search-clear:hover { background:#f1f5f9; color:#ef4444;}

        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; font-weight:500; display:flex; align-items:center; gap:.5rem; }

        .table-wrap { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
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
        .view-btn { display:inline-flex; align-items:center; gap:.3rem; background:none; border:1.5px solid #e5eaf0; border-radius:.5rem; padding:.3rem .7rem; font-size:.78rem; font-weight:600; color:#1B5E8C; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; white-space:nowrap; }
        .view-btn:hover { background:#f0f7ff; border-color:#1B5E8C; }
        .table-footer { padding:.75rem 1.1rem; font-size:.78rem; color:#9ca3af; border-top:1px solid #f0f4f8; }

        .skel-row { display:flex; align-items:center; gap:1rem; padding:.85rem 1.1rem; border-bottom:1px solid #f8fafc; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:400% 100%; animation:shimmer 1.4s ease-in-out infinite; border-radius:4px; }
        @keyframes shimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }

        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:320px; gap:.75rem; text-align:center; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem; }
        .empty-title { font-size:1.05rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }
        .mt-2 { margin-top: .5rem; }

        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }

        @media (max-width: 768px) {
          .page-top { flex-direction:column; }
        }
        @media (max-width: 640px) {
          /* keep: col1 (name), col2 (phone), col4 (sponsorships) */
          .table th:nth-child(3), .table td:nth-child(3),
          .table th:nth-child(5), .table td:nth-child(5),
          .table th:nth-child(6), .table td:nth-child(6) { display:none; }
        }
      `}</style>
    </AppShell>
  );
}
