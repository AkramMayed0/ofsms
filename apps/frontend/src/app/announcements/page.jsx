'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Pencil, Trash2, RefreshCw, AlertTriangle, X, Eye, EyeOff, User, Users } from 'lucide-react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

// ── Constants ─────────────────────────────────────────────────────────────────
const TOAST_DURATION   = 3000; // ms
const SKELETON_COUNT   = 4;
const TITLE_MAX_LENGTH = 120;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ── SkeletonCard ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3.5 bg-white border-[1.5px] border-gray-200 rounded-2xl p-4 px-5">
      <div className="w-[38px] h-[38px] rounded-[10px] flex-shrink-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer" />
      <div className="flex-1 flex flex-col gap-[7px]">
        <div className="h-[13px] rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer" style={{ width: '55%' }} />
        <div className="h-[10px] rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer" style={{ width: '80%' }} />
        <div className="h-[10px] rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer" style={{ width: '35%' }} />
      </div>
    </div>
  );
}

// ── AnnouncementCard ──────────────────────────────────────────────────────────
function AnnouncementCard({ ann, isGM, togglingId, onEdit, onDelete, onToggle }) {
  const isToggling = togglingId === ann.id;

  return (
    <div className={`flex flex-col rounded-[1.125rem] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,.06)] border-[1.5px] border-[#e5eaf0] border-r-4 transition-[box-shadow,transform] duration-[180ms] hover:shadow-[0_8px_28px_rgba(13,61,92,.13)] hover:-translate-y-0.5 ${ann.is_active ? 'border-r-primary' : 'opacity-50 grayscale-[30%] border-r-transparent'}`}>

      {/* ── Gradient header section ── */}
      <div className={`flex items-center gap-3.5 px-5 py-4 ${ann.is_active ? 'bg-gradient-to-br from-[#0d3d5c] to-primary' : 'bg-gradient-to-br from-gray-500 to-gray-400'}`}>
        <div className="w-[42px] h-[42px] rounded-xl bg-white/[.18] flex items-center justify-center text-white flex-shrink-0">
          <Megaphone size={20} />
        </div>
        <h3 className="flex-1 m-0 text-xl font-black text-white truncate tracking-tight">{ann.title}</h3>
        <span className={`inline-flex items-center gap-1 text-[0.68rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${ann.is_active ? 'bg-white/[.22] text-white' : 'bg-white/[.15] text-white/75'}`}>
          {ann.is_active ? <><Eye size={11} /> نشط</> : <><EyeOff size={11} /> مخفي</>}
        </span>
      </div>

      {/* ── Body section ── */}
      <div className="bg-white px-5 py-[1.35rem] border-b border-slate-100">
        <p className="m-0 text-sm text-gray-700 leading-[1.9] line-clamp-4">{ann.body}</p>
      </div>

      {/* ── Footer bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-[0.65rem] bg-slate-50">
        <div className="flex items-center gap-2 flex-wrap">
          {ann.created_by_name && (
            <span className="text-xs font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
              {ann.created_by_name}
            </span>
          )}
          <span className="text-xs text-gray-400">{fmtDate(ann.published_at)}</span>
        </div>

        {isGM && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              className="flex items-center justify-center w-7 h-7 rounded-lg border-[1.5px] border-red-200 text-red-600 bg-transparent cursor-pointer transition-all duration-[130ms] hover:bg-red-50 hover:border-red-300"
              onClick={() => onDelete(ann)}
              title="حذف"
            >
              <Trash2 size={14} />
            </button>
            <button
              className="flex items-center justify-center w-7 h-7 rounded-lg border-[1.5px] border-blue-200 text-primary bg-transparent cursor-pointer transition-all duration-[130ms] hover:bg-blue-50 hover:border-blue-300"
              onClick={() => onEdit(ann)}
              title="تعديل"
            >
              <Pencil size={14} />
            </button>
            <button
              className={`relative w-[38px] h-[22px] border-none rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0 p-0 ${ann.is_active ? 'bg-green-600' : 'bg-gray-300'} ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => onToggle(ann)}
              disabled={isToggling}
              title={ann.is_active ? 'إخفاء الإعلان' : 'إظهار الإعلان'}
            >
              <span
                className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-[right,left] duration-200 ${ann.is_active ? 'right-[3px] left-auto' : 'left-[3px] right-auto'}`}
              />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

// ── SponsorAdCard ─────────────────────────────────────────────────────────────
function SponsorAdCard({ ad, isGM, deletingAdId, onDelete }) {
  const isOrphan = ad.beneficiary_type === 'orphan';
  const isDeleting = deletingAdId === ad.id;

  return (
    <div className="flex items-center justify-between gap-4 bg-white border-[1.5px] border-blue-100 border-r-4 border-r-teal-600 rounded-[1.125rem] px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,.06)] max-sm:flex-col max-sm:items-stretch">
      <div className="flex items-start gap-[0.85rem] min-w-0">
        <div className="w-[42px] h-[42px] rounded-xl bg-emerald-50 text-teal-600 flex items-center justify-center flex-shrink-0">
          {isOrphan ? <User size={18} /> : <Users size={18} />}
        </div>
        <div className="min-w-0 flex flex-col gap-[0.35rem]">
          <div className="flex items-center gap-[0.55rem] flex-wrap">
            <h3 className="m-0 text-[0.98rem] font-black text-[#0d3d5c]">
              {isOrphan ? 'طلب كفالة يتيم' : 'طلب كفالة أسرة'}: {ad.beneficiary_name || '—'}
            </h3>
            <span className={`w-fit rounded-full px-[0.6rem] py-[0.22rem] text-[0.7rem] font-black ${ad.is_sponsored ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-700'}`}>
              {ad.is_sponsored ? 'مكفول' : 'في انتظار الكفيل'}
            </span>
          </div>
          <p className="m-0 text-sm text-slate-600">
            {isOrphan ? 'من سيكفل هذا الطفل؟' : 'من سيكفل هذه الأسرة؟'}
          </p>
          <div className="flex flex-wrap gap-[0.45rem] text-slate-400 text-[0.74rem]">
            <span>{ad.governorate_ar || '—'}</span>
            <span>{ad.agent_name || '—'}</span>
            {!isOrphan && <span>{ad.member_count || '—'} أفراد</span>}
            <span>{fmtDate(ad.published_at)}</span>
          </div>
        </div>
      </div>

      {isGM && ad.is_sponsored && (
        <button
          className="inline-flex items-center gap-[0.35rem] border border-red-200 rounded-[0.65rem] bg-red-50 text-red-700 px-3 py-[0.48rem] font-sans text-[0.78rem] font-extrabold cursor-pointer flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed max-sm:justify-center"
          onClick={() => onDelete(ad)}
          disabled={isDeleting}
        >
          <Trash2 size={14} /> {isDeleting ? 'جارٍ الحذف…' : 'حذف الإعلان'}
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const isGM = user?.role === 'gm';

  // data
  const [announcements, setAnnouncements] = useState([]);
  const [ads, setAds]                     = useState([]);
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
  const [togglingId, setTogglingId]     = useState(null);
  const [deletingAdId, setDeletingAdId] = useState(null);

  const totalCount = announcements.length + ads.length;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), TOAST_DURATION);
  };

  // ── Data fetch ───────────────────────────────────────────────────────────
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [annRes, adsRes] = await Promise.all([
        api.get('/announcements'),
        isGM ? api.get('/ads') : Promise.resolve({ data: { ads: [] } }),
      ]);
      setAnnouncements(annRes.data.announcements || []);
      setAds(adsRes.data.ads || []);
    } catch (err) {
      console.error('[AnnouncementsPage] fetch failed:', err);
      setError('تعذّر تحميل الإعلانات.');
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      console.error('[AnnouncementsPage] save failed:', err);
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
    } catch (err) {
      console.error('[AnnouncementsPage] toggle failed:', err);
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
    } catch (err) {
      console.error('[AnnouncementsPage] delete failed:', err);
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
      console.error('[AnnouncementsPage] delete ad failed:', err);
      showToast('فشل حذف الإعلان.', 'error');
    } finally {
      setDeletingAdId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="max-w-[860px] mx-auto flex flex-col gap-4 font-sans pb-12" dir="rtl">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.6rem] font-black text-[#0d3d5c] m-0 mb-1">الإعلانات</h1>
            <p className="text-[0.82rem] text-gray-400 m-0">
              {loading ? '…' : `${totalCount} إعلان`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isGM && (
              <Button variant="primary" onClick={openCreate}>
                <Plus size={16} /> إعلان جديد
              </Button>
            )}
            <button
              className="flex items-center justify-center w-9 h-9 border-[1.5px] border-gray-200 rounded-[0.625rem] bg-white text-gray-500 cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary hover:bg-blue-50"
              onClick={fetchAnnouncements}
              title="تحديث"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && !loading && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* ── Skeleton loader ── */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && announcements.length === 0 && ads.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 py-16 px-4 text-center text-gray-400">
            <Megaphone size={40} strokeWidth={1.5} />
            <p className="text-[0.95rem] text-gray-700 font-bold mt-2 mb-0">لا توجد إعلانات</p>
            <p className="text-[0.82rem] text-gray-400 m-0">
              {isGM ? 'اضغط «إعلان جديد» لنشر أول إعلان.' : 'لا توجد إعلانات نشطة حالياً.'}
            </p>
          </div>
        )}

        {/* ── Sponsor ads list ── */}
        {!loading && ads.length > 0 && (
          <div className="flex flex-col gap-4">
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

        {/* ── Announcements list ── */}
        {!loading && announcements.length > 0 && (
          <div className="flex flex-col gap-4">
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
          <div
            className="fixed inset-0 bg-[rgba(13,61,92,0.45)] backdrop-blur-[4px] z-[400] flex items-center justify-center p-4 font-sans direction-rtl animate-fadeIn"
            onClick={closeModal}
          >
            <div
              className="bg-white border border-[#e5eaf0] rounded-[1.25rem] w-full max-w-[480px] shadow-[0_32px_80px_rgba(13,61,92,0.22)] overflow-hidden animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <div className="flex items-start gap-3.5 px-6 py-5 bg-blue-50 border-b border-blue-200">
                <div className="text-primary flex-shrink-0 mt-0.5"><Megaphone size={18} /></div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0d3d5c] m-0 mb-0.5">
                    {editTarget ? 'تعديل الإعلان' : 'إعلان جديد'}
                  </h3>
                  <p className="text-[0.78rem] text-gray-500 m-0">
                    {editTarget ? 'عدّل العنوان أو النص ثم احفظ.' : 'سيُرسَل إشعار لجميع المستخدمين.'}
                  </p>
                </div>
                <button
                  className="mr-auto w-7 h-7 bg-black/[.06] border-none rounded-[7px] text-gray-500 cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors duration-[120ms] hover:bg-black/[.12]"
                  onClick={closeModal}
                >
                  <X size={16} />
                </button>
              </div>

              {/* body */}
              <div className="px-6 py-5 flex flex-col gap-1.5">
                <label className="block text-[0.8rem] font-bold text-gray-700">
                  العنوان <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full box-border border-[1.5px] border-[#e5eaf0] rounded-xl px-3.5 py-[0.65rem] text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(27,94,140,.1)] focus:bg-white"
                  placeholder="عنوان الإعلان…"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={TITLE_MAX_LENGTH}
                  autoFocus
                />

                <label className="block text-[0.8rem] font-bold text-gray-700 mt-4">
                  النص <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="w-full box-border border-[1.5px] border-[#e5eaf0] rounded-xl px-3.5 py-[0.65rem] text-[0.88rem] font-sans text-gray-800 bg-gray-50 outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(27,94,140,.1)] focus:bg-white resize-y min-h-[110px]"
                  placeholder="اكتب نص الإعلان هنا…"
                  rows={5}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                />

                {formError && (
                  <p className="flex items-center gap-1.5 text-[0.78rem] text-red-600 mt-1.5">
                    <AlertTriangle size={13} /> {formError}
                  </p>
                )}
              </div>

              {/* footer */}
              <div className="flex gap-3 px-6 py-4 border-t-[1.5px] border-[#e5eaf0] bg-white">
                <button
                  className="flex-1 py-[0.7rem] bg-transparent border-[1.5px] border-gray-200 rounded-xl font-sans text-[0.85rem] font-semibold text-gray-500 cursor-pointer transition-all duration-150 hover:not-disabled:border-gray-400 hover:not-disabled:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={closeModal}
                  disabled={saving}
                >
                  إلغاء
                </button>
                <button
                  className="flex-[2] py-[0.7rem] bg-gradient-to-br from-[#0d3d5c] to-primary text-white font-sans text-[0.88rem] font-bold border-none rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(13,61,92,.25)] transition-[transform,box-shadow] duration-[120ms] hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_14px_rgba(13,61,92,.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <><Spinner size="sm" variant="whiteMuted" /> جارٍ الحفظ…</>
                    : editTarget ? 'حفظ التعديلات' : 'نشر الإعلان'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Delete confirm modal ── */}
        {deleteTarget && (
          <div
            className="fixed inset-0 bg-[rgba(13,61,92,0.45)] backdrop-blur-[4px] z-[400] flex items-center justify-center p-4 font-sans animate-fadeIn"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="bg-white border border-[#e5eaf0] rounded-[1.25rem] w-full max-w-[480px] shadow-[0_32px_80px_rgba(13,61,92,0.22)] overflow-hidden animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5 px-6 py-5 bg-red-50 border-b border-red-200">
                <div className="text-red-600 flex-shrink-0 mt-0.5"><Trash2 size={18} /></div>
                <div>
                  <h3 className="text-base font-extrabold text-red-700 m-0 mb-0.5">حذف الإعلان</h3>
                  <p className="text-[0.78rem] text-gray-500 m-0">«{deleteTarget.title}»</p>
                </div>
                <button
                  className="mr-auto w-7 h-7 bg-black/[.06] border-none rounded-[7px] text-gray-500 cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors duration-[120ms] hover:bg-black/[.12]"
                  onClick={() => setDeleteTarget(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 m-0">سيُحذف هذا الإعلان نهائياً ولن يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t-[1.5px] border-[#e5eaf0] bg-white">
                <button
                  className="flex-1 py-[0.7rem] bg-transparent border-[1.5px] border-gray-200 rounded-xl font-sans text-[0.85rem] font-semibold text-gray-500 cursor-pointer transition-all duration-150 hover:not-disabled:border-gray-400 hover:not-disabled:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  إلغاء
                </button>
                <button
                  className="flex-[2] py-[0.7rem] bg-gradient-to-br from-red-600 to-red-700 text-white font-sans text-[0.88rem] font-bold border-none rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(220,38,38,.25)] transition-[transform,box-shadow] duration-[120ms] hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_14px_rgba(220,38,38,.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? <><Spinner size="sm" variant="whiteMuted" /> جارٍ الحذف…</>
                    : <><Trash2 size={14} /> تأكيد الحذف</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Toast ── */}
        {toast && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-[0.85rem] font-semibold z-[500] whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,.15)] animate-toastIn ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#0d3d5c] text-white'}`}>
            {toast.msg}
          </div>
        )}

      </div>
    </AppShell>
  );
}
