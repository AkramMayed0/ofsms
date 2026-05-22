'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Pencil, Trash2, RefreshCw, AlertTriangle, X, Eye, EyeOff, User, Users } from 'lucide-react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';
import PrimaryButton from '@/components/ui/PrimaryButton';

// ── SkeletonCard ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="sk-card">
      <div className="sk-icon" />
      <div className="sk-body">
        <div className="sk-line" style={{ width: '55%' }} />
        <div className="sk-line" style={{ width: '80%', height: 10 }} />
        <div className="sk-line" style={{ width: '35%', height: 10 }} />
      </div>
    </div>
  );
}

// ── AnnouncementCard ──────────────────────────────────────────────────────────
function AnnouncementCard({ ann, isGM, togglingId, onEdit, onDelete, onToggle }) {
  const isToggling = togglingId === ann.id;

  return (
    <div className={`card ${ann.is_active ? '' : 'card-inactive'}`}>

      {/* ── Gradient header section ── */}
      <div className={`card-header ${ann.is_active ? 'card-header-active' : 'card-header-inactive'}`}>
        <div className="card-header-icon">
          <Megaphone size={20} />
        </div>
        <h3 className="card-title">{ann.title}</h3>
        <span className={`badge ${ann.is_active ? 'badge-active' : 'badge-inactive'}`}>
          {ann.is_active ? <><Eye size={11} /> نشط</> : <><EyeOff size={11} /> مخفي</>}
        </span>
      </div>

      {/* ── Body section ── */}
      <div className="card-body-wrap">
        <p className="card-body">{ann.body}</p>
      </div>

      {/* ── Footer bar ── */}
      <div className="card-footer">
        <div className="card-meta-group">
          {ann.created_by_name && (
            <span className="card-meta-chip">
              {ann.created_by_name}
            </span>
          )}
          <span className="card-meta-date">{fmtDate(ann.published_at)}</span>
        </div>

        {isGM && (
          <div className="card-actions">
            <button className="btn-icon btn-del" onClick={() => onDelete(ann)} title="حذف">
              <Trash2 size={14} />
            </button>
            <button className="btn-icon btn-edit" onClick={() => onEdit(ann)} title="تعديل">
              <Pencil size={14} />
            </button>
            <button
              className={`toggle ${ann.is_active ? 'toggle-on' : 'toggle-off'} ${isToggling ? 'toggle-busy' : ''}`}
              onClick={() => onToggle(ann)}
              disabled={isToggling}
              title={ann.is_active ? 'إخفاء الإعلان' : 'إظهار الإعلان'}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function SponsorAdCard({ ad, isGM, deletingAdId, onDelete }) {
  const isOrphan = ad.beneficiary_type === 'orphan';
  const isDeleting = deletingAdId === ad.id;

  return (
    <div className="ad-card">
      <div className="ad-main">
        <div className="ad-avatar">
          {isOrphan ? <User size={18} /> : <Users size={18} />}
        </div>
        <div className="ad-content">
          <div className="ad-title-row">
            <h3 className="ad-title">
              {isOrphan ? 'طلب كفالة يتيم' : 'طلب كفالة أسرة'}: {ad.beneficiary_name || '—'}
            </h3>
            <span className={`sponsor-badge ${ad.is_sponsored ? 'sponsor-badge-done' : 'sponsor-badge-wait'}`}>
              {ad.is_sponsored ? 'Sponsored' : 'Awaiting Sponsor'}
            </span>
          </div>
          <p className="ad-body">
            {isOrphan ? 'من سيكفل هذا الطفل؟' : 'من سيكفل هذه الأسرة؟'}
          </p>
          <div className="ad-meta">
            <span>{ad.governorate_ar || '—'}</span>
            <span>{ad.agent_name || '—'}</span>
            {!isOrphan && <span>{ad.member_count || '—'} أفراد</span>}
            <span>{fmtDate(ad.published_at)}</span>
          </div>
        </div>
      </div>

      {isGM && ad.is_sponsored && (
        <button className="ad-delete" onClick={() => onDelete(ad)} disabled={isDeleting}>
          <Trash2 size={14} /> {isDeleting ? 'جارٍ الحذف…' : 'Delete Ad'}
        </button>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const isGM = user?.role === 'gm';

  // data
  const [announcements, setAnnouncements] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  // feedback
  const [toast, setToast] = useState(null); // { msg, type }

  // modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, obj = edit
  const [form, setForm]             = useState({ title: '', body: '' });
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // toggle loading per-row
  const [togglingId, setTogglingId] = useState(null);
  const [deletingAdId, setDeletingAdId] = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Data fetch ───────────────────────────────────────────────────────────
  const fetchAnnouncements = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/announcements'),
      isGM ? api.get('/ads') : Promise.resolve({ data: { ads: [] } }),
    ])
      .then(([annRes, adsRes]) => {
        setAnnouncements(annRes.data.announcements || []);
        setAds(adsRes.data.ads || []);
      })
      .catch(() => setError('تعذّر تحميل الإعلانات.'))
      .finally(() => setLoading(false));
  }, [isGM]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: '', body: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (ann) => {
    setEditTarget(ann);
    setForm({ title: ann.title, body: ann.body });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setFormError('');
  };

  // ── Save (create / edit) ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setFormError('العنوان والنص كلاهما مطلوبان.');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.patch(`/announcements/${editTarget.id}`, {
          title: form.title.trim(),
          body: form.body.trim(),
        });
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editTarget.id ? data.announcement : a))
        );
        showToast('تم تحديث الإعلان');
      } else {
        const { data } = await api.post('/announcements', {
          title: form.title.trim(),
          body: form.body.trim(),
        });
        setAnnouncements((prev) => [data.announcement, ...prev]);
        showToast('تم نشر الإعلان');
      }
      closeModal();
    } catch {
      setFormError('حدث خطأ. يرجى المحاولة مجدداً.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle is_active ─────────────────────────────────────────────────────
  const handleToggle = async (ann) => {
    setTogglingId(ann.id);
    try {
      const { data } = await api.patch(`/announcements/${ann.id}`, {
        isActive: !ann.is_active,
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? data.announcement : a))
      );
    } catch {
      showToast('فشل تغيير الحالة.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${deleteTarget.id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast('تم حذف الإعلان');
    } catch {
      showToast('فشل الحذف. يرجى المحاولة مجدداً.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAd = async (ad) => {
    setDeletingAdId(ad.id);
    try {
      await api.delete(`/ads/${ad.id}`);
      setAds((prev) => prev.filter((item) => item.id !== ad.id));
      showToast('تم حذف الإعلان من صفحة الإعلانات');
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل حذف الإعلان.', 'error');
    } finally {
      setDeletingAdId('');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* ── Page header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">الإعلانات</h1>
            <p className="page-sub">
              {loading ? '…' : `${announcements.length + ads.length} إعلان`}
            </p>
          </div>
          <div className="header-actions">
            {isGM && (
              <PrimaryButton onClick={openCreate}>
                <Plus size={16} /> إعلان جديد
              </PrimaryButton>
            )}
            <button className="btn-refresh" onClick={fetchAnnouncements} title="تحديث">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && !loading && (
          <div className="err-banner">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* ── Skeleton loader ── */}
        {loading && (
          <div className="list">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && announcements.length === 0 && ads.length === 0 && (
          <div className="empty-state">
            <Megaphone size={40} strokeWidth={1.5} />
            <p className="empty-title">لا توجد إعلانات</p>
            <p className="empty-sub">
              {isGM ? 'اضغط «إعلان جديد» لنشر أول إعلان.' : 'لا توجد إعلانات نشطة حالياً.'}
            </p>
          </div>
        )}

        {/* ── Announcements list ── */}
        {!loading && ads.length > 0 && (
          <div className="list">
            {ads.map((ad) => (
              <SponsorAdCard
                key={ad.id}
                ad={ad}
                isGM={isGM}
                deletingAdId={deletingAdId}
                onDelete={handleDeleteAd}
              />
            ))}
          </div>
        )}

        {!loading && announcements.length > 0 && (
          <div className="list">
            {announcements.map((ann) => (
              <AnnouncementCard
                key={ann.id}
                ann={ann}
                isGM={isGM}
                togglingId={togglingId}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* ── Create / Edit modal ── */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>

              {/* header */}
              <div className="modal-header">
                <div className="modal-icon"><Megaphone size={18} /></div>
                <div>
                  <h3 className="modal-title">
                    {editTarget ? 'تعديل الإعلان' : 'إعلان جديد'}
                  </h3>
                  <p className="modal-sub">
                    {editTarget ? 'عدّل العنوان أو النص ثم احفظ.' : 'سيُرسَل إشعار لجميع المستخدمين.'}
                  </p>
                </div>
                <button className="modal-close" onClick={closeModal}><X size={16} /></button>
              </div>

              {/* title input */}
              <div className="modal-body">
                <label className="field-label">العنوان <span className="req">*</span></label>
                <input
                  className="field-input"
                  placeholder="عنوان الإعلان…"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={120}
                  autoFocus
                />

                {/* body textarea */}
                <label className="field-label" style={{ marginTop: '0.9rem' }}>
                  النص <span className="req">*</span>
                </label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="اكتب نص الإعلان هنا…"
                  rows={5}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                />

                {/* inline form error */}
                {formError && (
                  <p className="form-err"><AlertTriangle size={13} /> {formError}</p>
                )}
              </div>

              {/* footer */}
              <div className="modal-footer">
                <button className="btn-ghost" onClick={closeModal} disabled={saving}>إلغاء</button>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><span className="spin" /> جارٍ الحفظ…</>
                    : editTarget ? 'حفظ التعديلات' : 'نشر الإعلان'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Delete confirm modal ── */}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modal-header-danger">
                <div className="modal-icon modal-icon-danger"><Trash2 size={18} /></div>
                <div>
                  <h3 className="modal-title" style={{ color: '#b91c1c' }}>حذف الإعلان</h3>
                  <p className="modal-sub">«{deleteTarget.title}»</p>
                </div>
                <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <p className="delete-msg">سيُحذف هذا الإعلان نهائياً ولن يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>إلغاء</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <><span className="spin" /> جارٍ الحذف…</> : <><Trash2 size={14} /> تأكيد الحذف</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Toast ── */}
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'toast-err' : 'toast-ok'}`}>
            {toast.msg}
          </div>
        )}

      </div>

      <style jsx global>{`
        .page {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          padding-bottom: 3rem;
        }
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .page-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #0d3d5c;
          margin: 0 0 0.2rem;
        }
        .page-sub { font-size: 0.82rem; color: #9ca3af; margin: 0; }
        .header-actions { display: flex; align-items: center; gap: 0.5rem; }
        .btn-refresh {
          display: flex; align-items: center; justify-content: center;
          width: 2.25rem; height: 2.25rem;
          border: 1.5px solid #e5e7eb; border-radius: 0.625rem;
          background: #fff; color: #6b7280; cursor: pointer; transition: all 0.15s;
        }
        .btn-refresh:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }
        .btn-icon {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 7px;
          border: 1.5px solid transparent; cursor: pointer;
          transition: all 0.13s; background: transparent;
        }
        .btn-edit { color: #1B5E8C; border-color: #bfdbfe; }
        .btn-edit:hover { background: #eff6ff; border-color: #93c5fd; }
        .btn-del { color: #dc2626; border-color: #fecaca; }
        .btn-del:hover { background: #fef2f2; border-color: #f87171; }
        .list { display: flex; flex-direction: column; gap: 1rem; }

        /* ── card shell ── */
        .card {
          display: flex;
          flex-direction: column;
          border-radius: 1.125rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,.06);
          border: 1.5px solid #e5eaf0;
          border-right: 4px solid transparent;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .card:hover {
          box-shadow: 0 8px 28px rgba(13,61,92,.13);
          transform: translateY(-2px);
        }
        .card:not(.card-inactive) { border-right-color: #1B5E8C; }
        .card-inactive { opacity: 0.5; filter: grayscale(30%); }

        .ad-card {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          background: #fff; border: 1.5px solid #dbeafe; border-right: 4px solid #0f766e;
          border-radius: 1.125rem; padding: 1rem 1.2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,.06);
        }
        .ad-main { display: flex; align-items: flex-start; gap: .85rem; min-width: 0; }
        .ad-avatar {
          width: 42px; height: 42px; border-radius: 12px; background: #ecfdf5; color: #0f766e;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ad-content { min-width: 0; display: flex; flex-direction: column; gap: .35rem; }
        .ad-title-row { display: flex; align-items: center; gap: .55rem; flex-wrap: wrap; }
        .ad-title { margin: 0; font-size: .98rem; font-weight: 900; color: #0d3d5c; }
        .ad-body { margin: 0; font-size: .86rem; color: #475569; }
        .ad-meta { display: flex; flex-wrap: wrap; gap: .45rem; color: #94a3b8; font-size: .74rem; }
        .sponsor-badge {
          width: fit-content; border-radius: 999px; padding: .22rem .6rem;
          font-size: .7rem; font-weight: 900;
        }
        .sponsor-badge-done { background: #dcfce7; color: #166534; }
        .sponsor-badge-wait { background: #dbeafe; color: #1d4ed8; }
        .ad-delete {
          display: inline-flex; align-items: center; gap: .35rem;
          border: 1px solid #fecaca; border-radius: .65rem; background: #fef2f2; color: #b91c1c;
          padding: .48rem .75rem; font-family: 'Cairo', sans-serif; font-size: .78rem; font-weight: 800;
          cursor: pointer; flex-shrink: 0;
        }
        .ad-delete:disabled { opacity: .6; cursor: not-allowed; }
        @media (max-width: 640px) {
          .ad-card { align-items: stretch; flex-direction: column; }
          .ad-delete { justify-content: center; }
        }

        /* ── card header ── */
        .card-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem 1.25rem;
        }
        .card-header-active {
          background: linear-gradient(135deg, #0d3d5c 0%, #1B5E8C 100%);
        }
        .card-header-inactive {
          background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
        }
        .card-header-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        /* title */
        .card-title {
          flex: 1; margin: 0;
          font-size: 1.2rem; font-weight: 900;
          color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          letter-spacing: -0.01em;
        }

        /* badge */
        .badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          font-size: 0.68rem; font-weight: 700;
          padding: 0.25rem 0.65rem; border-radius: 999px;
          white-space: nowrap; flex-shrink: 0;
        }
        .badge-active   { background: rgba(255,255,255,0.22); color: #fff; }
        .badge-inactive { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.75); }

        /* body */
        .card-body-wrap {
          background: #fff;
          padding: 1.35rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .card-body {
          margin: 0;
          font-size: 0.9rem; color: #374151; line-height: 1.9;
          display: -webkit-box;
          -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
        }

        /* footer */
        .card-footer {
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 0.75rem; flex-wrap: wrap;
          padding: 0.65rem 1.25rem;
          background: #f8fafc;
        }
        .card-meta-group {
          display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
        }
        .card-meta-chip {
          font-size: 0.75rem; font-weight: 700;
          color: #1B5E8C;
          background: #eff6ff;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
        }
        .card-meta-date { font-size: 0.75rem; color: #9ca3af; }

        /* actions */
        .card-actions { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
        .btn-icon {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 8px;
          border: 1.5px solid transparent; cursor: pointer;
          transition: all 0.13s; background: transparent;
        }
        .btn-edit { color: #1B5E8C; border-color: #bfdbfe; }
        .btn-edit:hover { background: #eff6ff; border-color: #93c5fd; }
        .btn-del  { color: #dc2626; border-color: #fecaca; }
        .btn-del:hover  { background: #fef2f2; border-color: #f87171; }

        /* toggle */
        .toggle {
          position: relative; width: 38px; height: 22px;
          border: none; border-radius: 999px; cursor: pointer;
          transition: background 0.2s; flex-shrink: 0; padding: 0;
        }
        .toggle-on   { background: #16a34a; }
        .toggle-off  { background: #d1d5db; }
        .toggle-busy { opacity: 0.5; cursor: not-allowed; }
        .toggle-thumb {
          position: absolute; top: 3px;
          width: 16px; height: 16px;
          background: #fff; border-radius: 50%;
          transition: right 0.2s, left 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.25);
        }
        .toggle-on  .toggle-thumb { right: 3px; left: auto; }
        .toggle-off .toggle-thumb { left: 3px; right: auto; }

        /* modal overlay */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(13,61,92,0.45);
          backdrop-filter: blur(4px);
          z-index: 400;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          direction: rtl;
          animation: fadeIn 0.18s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-box {
          background: #fff; border: 1px solid #e5eaf0;
          border-radius: 1.25rem; width: 100%; max-width: 480px;
          box-shadow: 0 32px 80px rgba(13,61,92,0.22);
          overflow: hidden;
          animation: slideUp 0.22s cubic-bezier(.22,1,.36,1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: none; }
        }
        .modal-header {
          display: flex; align-items: flex-start; gap: 0.875rem;
          padding: 1.25rem 1.5rem;
          background: #f0f7ff; border-bottom: 1px solid #bfdbfe;
        }
        .modal-header-danger { background: #fef2f2; border-bottom-color: #fecaca; }
        .modal-icon { color: #1B5E8C; flex-shrink: 0; margin-top: 2px; }
        .modal-icon-danger { color: #dc2626; }
        .modal-title { font-size: 1rem; font-weight: 800; color: #0d3d5c; margin: 0 0 0.15rem; }
        .modal-sub   { font-size: 0.78rem; color: #6b7280; margin: 0; }
        .modal-close {
          margin-right: auto; width: 28px; height: 28px;
          background: rgba(0,0,0,0.06); border: none; border-radius: 7px;
          color: #6b7280; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          flex-shrink: 0; transition: background 0.12s;
        }
        .modal-close:hover { background: rgba(0,0,0,0.12); }
        .modal-body {
          padding: 1.25rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.35rem;
        }
        .field-label {
          display: block; font-size: 0.8rem;
          font-weight: 700; color: #374151;
        }
        .req { color: #dc2626; }
        .field-input {
          width: 100%; box-sizing: border-box;
          border: 1.5px solid #e5eaf0; border-radius: 0.75rem;
          padding: 0.65rem 0.9rem;
          font-size: 0.88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input:focus {
          border-color: #1B5E8C;
          box-shadow: 0 0 0 3px rgba(27,94,140,.1);
          background: #fff;
        }
        .field-textarea { resize: vertical; min-height: 110px; }
        .form-err {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.78rem; color: #dc2626;
          margin-top: 0.4rem;
        }
        .modal-footer {
          display: flex; gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1.5px solid #e5eaf0;
          background: #fff;
        }
        .btn-ghost {
          flex: 1; padding: 0.7rem;
          background: none; border: 1.5px solid #e5eaf0; border-radius: 0.75rem;
          font-family: 'Cairo', sans-serif; font-size: 0.85rem; font-weight: 600;
          color: #6b7280; cursor: pointer; transition: all 0.15s;
        }
        .btn-ghost:hover:not(:disabled) { border-color: #9ca3af; color: #374151; }
        .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-save {
          flex: 2; padding: 0.7rem;
          background: linear-gradient(135deg, #0d3d5c, #1B5E8C);
          color: #fff; font-family: 'Cairo', sans-serif;
          font-size: 0.88rem; font-weight: 700;
          border: none; border-radius: 0.75rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          box-shadow: 0 2px 8px rgba(13,61,92,.25);
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(13,61,92,.35); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-danger {
          flex: 2; padding: 0.7rem;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: #fff; font-family: 'Cairo', sans-serif;
          font-size: 0.88rem; font-weight: 700;
          border: none; border-radius: 0.75rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          box-shadow: 0 2px 8px rgba(220,38,38,.25);
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .btn-danger:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(220,38,38,.35); }
        .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff; border-radius: 50%;
          animation: spinning .6s linear infinite; flex-shrink: 0;
        }
        @keyframes spinning { to { transform: rotate(360deg); } }

        /* skeleton */
        .sk-card {
          display: flex; align-items: center; gap: 0.85rem;
          background: #fff; border: 1.5px solid #e5eaf0;
          border-radius: 1rem; padding: 1rem 1.25rem;
        }
        .sk-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
        }
        .sk-body { flex: 1; display: flex; flex-direction: column; gap: 0.45rem; }
        .sk-line  { height: 13px; border-radius: 6px; }
        .sk-icon, .sk-line {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* empty state */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.4rem; padding: 4rem 1rem; text-align: center;
          color: #9ca3af;
        }
        .empty-title { font-size: 0.95rem; color: #374151; font-weight: 700; margin: 0.5rem 0 0; }
        .empty-sub   { font-size: 0.82rem; color: #9ca3af; margin: 0; }

        /* error banner */
        .err-banner {
          display: flex; align-items: center; gap: 0.5rem;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #b91c1c; padding: 0.75rem 1rem;
          border-radius: 0.75rem; font-size: 0.85rem;
        }

        /* toast */
        .toast {
          position: fixed; bottom: 2rem; left: 50%;
          transform: translateX(-50%);
          padding: 0.75rem 1.5rem; border-radius: 999px;
          font-size: 0.85rem; font-weight: 600;
          z-index: 500; white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,.15);
          animation: toastIn 0.25s ease;
        }
        .toast-ok  { background: #0d3d5c; color: #fff; }
        .toast-err { background: #dc2626; color: #fff; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
