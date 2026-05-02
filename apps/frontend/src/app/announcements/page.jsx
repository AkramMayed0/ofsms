'use client';

/**
 * page.jsx
 * Route:  /announcements  (GM only)
 * Task:   feature/ui-announcements-gm
 *
 * Features:
 *   - List all announcements (GM sees active + inactive)
 *   - Create new announcement via modal
 *   - Edit existing announcement via modal
 *   - Toggle is_active (publish / unpublish)
 *   - Delete (soft) announcement
 *
 * API:
 *   GET    /api/announcements          → all announcements (GM sees all)
 *   POST   /api/announcements          → create
 *   PATCH  /api/announcements/:id      → update (title, body, isActive)
 *   DELETE /api/announcements/:id      → soft delete (sets is_active = false)
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('ar-YE', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

// ── AnnouncementModal (create & edit) ─────────────────────────────────────────

function AnnouncementModal({ mode, announcement, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: isEdit
      ? { title: announcement.title, body: announcement.body }
      : { title: '', body: '' },
  });

  useEffect(() => {
    if (isEdit && announcement) {
      reset({ title: announcement.title, body: announcement.body });
    }
  }, [announcement?.id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setApiErr('');
    try {
      if (isEdit) {
        await api.patch(`/announcements/${announcement.id}`, {
          title: data.title.trim(),
          body: data.body.trim(),
        });
      } else {
        await api.post('/announcements', {
          title: data.title.trim(),
          body: data.body.trim(),
        });
      }
      onSaved();
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
          <h2 className="modal-title">
            {isEdit ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-body">
          {apiErr && <div className="err-banner">⚠ {apiErr}</div>}

          {/* Title */}
          <div className="fg">
            <label className="lbl">
              عنوان الإعلان <span className="req">*</span>
            </label>
            <input
              className={`inp ${errors.title ? 'inp-err' : ''}`}
              placeholder="مثال: أيتام بانتظار كفيل — مارس 2026"
              {...register('title', {
                required: 'العنوان مطلوب',
                minLength: { value: 3, message: 'العنوان يجب أن يكون 3 أحرف على الأقل' },
              })}
            />
            {errors.title && <p className="ferr">{errors.title.message}</p>}
          </div>

          {/* Body */}
          <div className="fg">
            <label className="lbl">
              نص الإعلان <span className="req">*</span>
            </label>
            <textarea
              className={`inp ta ${errors.body ? 'inp-err' : ''}`}
              rows={5}
              placeholder="اكتب تفاصيل الإعلان هنا…"
              {...register('body', {
                required: 'نص الإعلان مطلوب',
                minLength: { value: 10, message: 'النص يجب أن يكون 10 أحرف على الأقل' },
              })}
            />
            {errors.body && <p className="ferr">{errors.body.message}</p>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              إلغاء
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? <><span className="spin" />جارٍ الحفظ…</>
                : isEdit ? 'حفظ التعديلات' : 'نشر الإعلان'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:50; animation:fadeIn .2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal {
          position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
          width:520px; max-width:95vw; background:#fff; border-radius:1.25rem;
          z-index:51; box-shadow:0 20px 60px rgba(0,0,0,.2);
          animation:slideUp .22s ease; font-family:'Cairo','Tajawal',sans-serif;
        }
        @keyframes slideUp { from{opacity:0;transform:translate(-50%,-46%)} to{opacity:1;transform:translate(-50%,-50%)} }
        .modal-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; }
        .modal-title { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.2rem .35rem; border-radius:6px; }
        .modal-close:hover { background:#f3f4f6; color:#374151; }
        .modal-body { display:flex; flex-direction:column; gap:1rem; padding:1.5rem; }
        .modal-foot { display:flex; gap:.75rem; justify-content:flex-end; padding-top:.5rem; border-top:1px solid #f0f4f8; margin-top:.5rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; }
        .inp { width:100%; border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; }
        .inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color:#dc2626!important; }
        .ta { resize:vertical; min-height:120px; }
        .ferr { font-size:.77rem; color:#dc2626; margin:0; }
        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.625rem; padding:.65rem .85rem; font-size:.82rem; color:#b91c1c; font-weight:500; }
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-ghost { display:inline-flex; align-items:center; padding:.7rem 1.25rem; background:none; color:#6b7280; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #e5eaf0; border-radius:.75rem; cursor:pointer; }
        .btn-ghost:hover:not(:disabled) { border-color:#9ca3af; color:#374151; }
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}

// ── DeleteConfirmModal ─────────────────────────────────────────────────────────

function DeleteConfirmModal({ announcement, onClose, onConfirm, loading }) {
  if (!announcement) return null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal modal-sm" dir="rtl">
        <div className="modal-head">
          <h2 className="modal-title">حذف الإعلان</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-msg">
            هل أنت متأكد من حذف إعلان <strong>"{announcement.title}"</strong>؟
            سيُخفى الإعلان عن جميع الكفلاء.
          </p>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
            <button className="btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? <><span className="spin" />جارٍ الحذف…</> : 'نعم، احذف'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:50; }
        .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:440px; max-width:95vw; background:#fff; border-radius:1.25rem; z-index:51; box-shadow:0 20px 60px rgba(0,0,0,.2); font-family:'Cairo','Tajawal',sans-serif; animation:slideUp .22s ease; }
        .modal-sm { width:400px; }
        @keyframes slideUp { from{opacity:0;transform:translate(-50%,-46%)} to{opacity:1;transform:translate(-50%,-50%)} }
        .modal-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; }
        .modal-title { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; }
        .modal-body { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
        .modal-foot { display:flex; gap:.75rem; justify-content:flex-end; border-top:1px solid #f0f4f8; padding-top:1rem; margin-top:.25rem; }
        .delete-msg { font-size:.88rem; color:#374151; line-height:1.7; margin:0; }
        .btn-ghost { padding:.65rem 1.25rem; background:none; color:#6b7280; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #e5eaf0; border-radius:.75rem; cursor:pointer; }
        .btn-danger { display:inline-flex; align-items:center; gap:.4rem; padding:.65rem 1.4rem; background:#dc2626; color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; }
        .btn-danger:hover:not(:disabled) { background:#b91c1c; }
        .btn-danger:disabled { opacity:.65; cursor:not-allowed; }
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}

// ── AnnouncementCard ───────────────────────────────────────────────────────────

function AnnouncementCard({ announcement, onEdit, onDelete, onToggle, toggling }) {
  return (
    <div className={`ann-card ${!announcement.is_active ? 'ann-inactive' : ''}`}>
      {/* Header */}
      <div className="ann-head">
        <div className="ann-title-row">
          <h3 className="ann-title">{announcement.title}</h3>
          <span className={`status-dot ${announcement.is_active ? 'dot-active' : 'dot-inactive'}`} />
        </div>
        <span className="ann-date">
          📅 {formatDate(announcement.published_at)}
          {announcement.created_by_name && ` · ${announcement.created_by_name}`}
        </span>
      </div>

      {/* Body */}
      <p className="ann-body">{announcement.body}</p>

      {/* Footer actions */}
      <div className="ann-footer">
        <div className="ann-status">
          <span className={`status-badge ${announcement.is_active ? 'badge-active' : 'badge-inactive'}`}>
            {announcement.is_active ? '🟢 منشور' : '⚪ مخفي'}
          </span>
        </div>

        <div className="ann-actions">
          <button
            className={`toggle-btn ${announcement.is_active ? 'toggle-hide' : 'toggle-show'}`}
            onClick={() => onToggle(announcement)}
            disabled={toggling === announcement.id}
            title={announcement.is_active ? 'إخفاء الإعلان' : 'نشر الإعلان'}
          >
            {toggling === announcement.id
              ? '⏳'
              : announcement.is_active ? '🙈 إخفاء' : '👁 نشر'}
          </button>

          <button className="action-btn" onClick={() => onEdit(announcement)} title="تعديل">
            ✏️ تعديل
          </button>

          <button
            className="action-btn action-btn-del"
            onClick={() => onDelete(announcement)}
            title="حذف"
          >
            🗑️ حذف
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [filter,        setFilter]        = useState('all'); // 'all' | 'active' | 'inactive'
  const [toast,         setToast]         = useState(null);

  // Modals
  const [showCreate,  setShowCreate]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [delTarget,   setDelTarget]   = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const [toggling,    setToggling]    = useState(null); // id being toggled

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAnnouncements = useCallback(() => {
    setLoading(true);
    api.get('/announcements')
      .then(({ data }) => setAnnouncements(data.announcements || []))
      .catch(() => setError('تعذّر تحميل الإعلانات.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // Filter
  const filtered = announcements.filter((a) => {
    if (filter === 'active')   return a.is_active;
    if (filter === 'inactive') return !a.is_active;
    return true;
  });

  const activeCount   = announcements.filter(a => a.is_active).length;
  const inactiveCount = announcements.filter(a => !a.is_active).length;

  // Toggle publish / unpublish
  const handleToggle = async (ann) => {
    setToggling(ann.id);
    try {
      await api.patch(`/announcements/${ann.id}`, { isActive: !ann.is_active });
      setAnnouncements(prev =>
        prev.map(a => a.id === ann.id ? { ...a, is_active: !a.is_active } : a)
      );
      showToast(ann.is_active ? 'تم إخفاء الإعلان' : 'تم نشر الإعلان ✅');
    } catch {
      showToast('فشل تغيير حالة الإعلان', 'error');
    } finally {
      setToggling(null);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${delTarget.id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== delTarget.id));
      setDelTarget(null);
      showToast('تم حذف الإعلان');
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل الحذف', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Toast */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </div>
        )}

        {/* Modals */}
        {showCreate && (
          <AnnouncementModal
            mode="create"
            onClose={() => setShowCreate(false)}
            onSaved={() => { fetchAnnouncements(); showToast('تم نشر الإعلان بنجاح ✅'); }}
          />
        )}
        {editTarget && (
          <AnnouncementModal
            mode="edit"
            announcement={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={() => { fetchAnnouncements(); showToast('تم تحديث الإعلان'); }}
          />
        )}
        <DeleteConfirmModal
          announcement={delTarget}
          onClose={() => setDelTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />

        {/* Page header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">الإعلانات</h1>
            <p className="page-sub">
              {loading
                ? 'جارٍ التحميل…'
                : `${announcements.length} إعلان · ${activeCount} منشور · ${inactiveCount} مخفي`}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + إنشاء إعلان
          </button>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {[
            { key: 'all',      label: 'الكل',    count: announcements.length },
            { key: 'active',   label: 'المنشورة', count: activeCount },
            { key: 'inactive', label: 'المخفية',  count: inactiveCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`ftab ${filter === key ? 'ftab-active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} <span className="ftab-count">{count}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="err-banner">⚠ {error}</div>}

        {/* Skeleton */}
        {loading && (
          <div className="cards-grid">
            {[1,2,3].map(i => (
              <div key={i} className="skel-card">
                <div className="skel" style={{ width: '60%', height: 18, marginBottom: 8 }} />
                <div className="skel" style={{ width: '30%', height: 12, marginBottom: 16 }} />
                <div className="skel" style={{ width: '100%', height: 14, marginBottom: 6 }} />
                <div className="skel" style={{ width: '80%', height: 14 }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: '3rem' }}>📢</div>
            <h3 className="empty-title">
              {filter !== 'all' ? 'لا توجد إعلانات بهذه الحالة' : 'لا توجد إعلانات بعد'}
            </h3>
            <p className="empty-sub">
              {filter === 'all' ? 'ابدأ بإنشاء أول إعلان' : 'جرّب تغيير الفلتر'}
            </p>
            {filter === 'all' && (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                + إنشاء إعلان
              </button>
            )}
          </div>
        )}

        {/* Cards grid */}
        {!loading && filtered.length > 0 && (
          <div className="cards-grid">
            {filtered.map((ann) => (
              <AnnouncementCard
                key={ann.id}
                announcement={ann}
                onEdit={setEditTarget}
                onDelete={setDelTarget}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page { max-width:1100px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; display:flex; flex-direction:column; gap:1.25rem; position:relative; }

        /* ── Toast ────────────────────────────────────────────────────── */
        .toast { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); z-index:200; padding:.75rem 1.5rem; border-radius:2rem; font-size:.88rem; font-weight:600; white-space:nowrap; box-shadow:0 4px 20px rgba(0,0,0,.15); animation:toastIn .25s ease; }
        .toast-success { background:#0d3d5c; color:#fff; }
        .toast-error   { background:#dc2626; color:#fff; }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

        /* ── Header ───────────────────────────────────────────────────── */
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        /* ── Filter tabs ──────────────────────────────────────────────── */
        .filter-tabs { display:flex; gap:.4rem; flex-wrap:wrap; }
        .ftab { display:inline-flex; align-items:center; gap:.35rem; padding:.4rem .85rem; border:1.5px solid #e5eaf0; border-radius:2rem; font-size:.78rem; font-weight:600; color:#6b7280; background:#fff; cursor:pointer; transition:all .15s; font-family:'Cairo',sans-serif; }
        .ftab:hover { border-color:#1B5E8C; color:#1B5E8C; }
        .ftab-active { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }
        .ftab-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 4px; border-radius:2rem; background:rgba(0,0,0,.12); color:inherit; font-size:.7rem; font-weight:700; }

        /* ── Error ────────────────────────────────────────────────────── */
        .err-banner { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.85rem 1rem; border-radius:.75rem; font-size:.85rem; }

        /* ── Cards grid ───────────────────────────────────────────────── */
        .cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:1.25rem; }
        @media(max-width:640px){ .cards-grid{ grid-template-columns:1fr; } }

        /* ── Announcement card ────────────────────────────────────────── */
        .ann-card { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:1.5rem; display:flex; flex-direction:column; gap:.85rem; box-shadow:0 1px 4px rgba(27,94,140,.05); transition:box-shadow .15s,transform .15s; }
        .ann-card:hover { box-shadow:0 4px 16px rgba(27,94,140,.1); transform:translateY(-1px); }
        .ann-inactive { opacity:.65; }

        .ann-head { display:flex; flex-direction:column; gap:.3rem; }
        .ann-title-row { display:flex; align-items:center; gap:.6rem; }
        .ann-title { font-size:.95rem; font-weight:800; color:#0d3d5c; margin:0; flex:1; }
        .status-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .dot-active { background:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.2); }
        .dot-inactive { background:#d1d5db; }
        .ann-date { font-size:.75rem; color:#9ca3af; }

        .ann-body { font-size:.85rem; color:#374151; line-height:1.75; margin:0; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }

        .ann-footer { display:flex; align-items:center; justify-content:space-between; gap:.75rem; flex-wrap:wrap; border-top:1px solid #f0f4f8; padding-top:.85rem; margin-top:.15rem; }
        .status-badge { font-size:.73rem; font-weight:700; padding:.25rem .7rem; border-radius:2rem; }
        .badge-active { background:#ecfdf5; color:#065f46; border:1px solid #6ee7b7; }
        .badge-inactive { background:#f9fafb; color:#6b7280; border:1px solid #e5e7eb; }

        .ann-actions { display:flex; gap:.4rem; }
        .toggle-btn { display:inline-flex; align-items:center; gap:.3rem; padding:.3rem .75rem; border-radius:2rem; font-size:.75rem; font-weight:700; font-family:'Cairo',sans-serif; cursor:pointer; transition:all .15s; }
        .toggle-hide { background:#fef3c7; color:#92400e; border:1.5px solid #fde68a; }
        .toggle-hide:hover { background:#fde68a; }
        .toggle-show { background:#d1fae5; color:#065f46; border:1.5px solid #6ee7b7; }
        .toggle-show:hover { background:#a7f3d0; }
        .toggle-btn:disabled { opacity:.5; cursor:not-allowed; }

        .action-btn { background:none; border:1.5px solid #e5eaf0; border-radius:.5rem; padding:.3rem .6rem; font-size:.78rem; cursor:pointer; transition:all .15s; font-family:'Cairo',sans-serif; font-weight:600; color:#374151; }
        .action-btn:hover { background:#f0f7ff; border-color:#1B5E8C; color:#1B5E8C; }
        .action-btn-del:hover { background:#fef2f2; border-color:#fca5a5; color:#dc2626; }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .skel-card { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:1.5rem; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        @keyframes shimmer { to{background-position:-200% 0} }

        /* ── Empty ────────────────────────────────────────────────────── */
        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:320px; gap:.75rem; text-align:center; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem; }
        .empty-title { font-size:1.05rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
      `}</style>
    </AppShell>
  );
}