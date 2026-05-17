'use client';

/**
 * /orphans/[id]/page.jsx
 * Orphan detail page — all roles can view, GM sees Transfer button.
 *
 * API:
 *   GET  /api/orphans/:id  → orphan + documents + sponsorship info
 *   POST /api/sponsors/transfer (via TransferSponsorModal)
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Handshake, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/api';
import AppShell from '../../../components/AppShell';
import useAuthStore from '../../../store/useAuthStore';
import TransferSponsorModal from '../../../components/TransferSponsorModal';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  under_review:      { label: 'قيد المراجعة',  color: '#F59E0B', bg: '#FEF3C7' },
  under_marketing:   { label: 'تحت التسويق',   color: '#3B82F6', bg: '#EFF6FF' },
  under_sponsorship: { label: 'تحت الكفالة',   color: '#10B981', bg: '#ECFDF5' },
  rejected:          { label: 'مرفوض',         color: '#EF4444', bg: '#FEF2F2' },
  inactive:          { label: 'غير نشط',       color: '#6B7280', bg: '#F3F4F6' },
};

// Derives the two-level registration + placement state from a single status field.
// Level 1: registration (under_review | accepted | rejected)
// Level 2: placement — only present when accepted (under_marketing | under_sponsorship)
function deriveStatusLevels(status) {
  if (status === 'under_review') {
    return {
      registration: { label: 'قيد المراجعة', color: '#F59E0B', bg: '#FEF3C7' },
      placement: null,
    };
  }
  if (status === 'rejected') {
    return {
      registration: { label: 'مرفوض', color: '#EF4444', bg: '#FEF2F2' },
      placement: null,
    };
  }
  if (status === 'under_marketing') {
    return {
      registration: { label: 'مقبول', color: '#10B981', bg: '#ECFDF5' },
      placement: { label: 'تحت التسويق', color: '#3B82F6', bg: '#EFF6FF' },
    };
  }
  if (status === 'under_sponsorship') {
    return {
      registration: { label: 'مقبول', color: '#10B981', bg: '#ECFDF5' },
      placement: { label: 'مكفول', color: '#10B981', bg: '#ECFDF5' },
    };
  }
  return {
    registration: { label: 'غير نشط', color: '#6B7280', bg: '#F3F4F6' },
    placement: null,
  };
}

const GENDER_LABELS = { male: 'ذكر', female: 'أنثى' };
const RELATION_LABELS = {
  uncle: 'عم', maternal_uncle: 'خال', grandfather: 'جد',
  sibling: 'أخ / أخت', other: 'أخرى',
};

const DOC_TYPE_CONFIG = {
  birth_certificate: { label: 'شهادة الميلاد', color: '#2563eb', bg: '#eff6ff' },
  death_certificate: { label: 'شهادة الوفاة',  color: '#dc2626', bg: '#fef2f2' },
  id_card:           { label: 'بطاقة الهوية',   color: '#7c3aed', bg: '#f5f3ff' },
  photo:             { label: 'صورة شخصية',     color: '#059669', bg: '#ecfdf5' },
  other:             { label: 'مستند آخر',      color: '#d97706', bg: '#fffbeb' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconTransfer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const IconBack = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const IconCake = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
    <path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
    <path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>
  </svg>
);

const IconMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || '—'}</span>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="section-card">
      <h3 className="section-title">{title}</h3>
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="skeleton-wrap">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-block" style={{ height: i === 1 ? '120px' : '180px' }} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OrphanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const id = params?.id;

  const [orphan, setOrphan]         = useState(null);
  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [transferOpen, setTransfer] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [deleteToast, setDeleteToast] = useState(false);

  const isGM = user?.role === 'gm';

  const fetchOrphan = () => {
    setLoading(true);
    api.get(`/orphans/${id}`)
      .then(({ data }) => {
        setOrphan(data.orphan);
        setDocuments(data.documents || []);
      })
      .catch(() => setError('تعذّر تحميل بيانات اليتيم'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchOrphan();
  }, [id]);

  const handleTransferSuccess = () => {
    setSuccessMsg('تم نقل الكفالة بنجاح');
    fetchOrphan();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/orphans/${id}`);
      setDeleteConfirm(false);
      setDeleteToast(true);
      setTimeout(() => router.push('/orphans'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر حذف اليتيم');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const statusInfo   = STATUS_CONFIG[orphan?.status] || STATUS_CONFIG.inactive;
  const statusLevels = orphan ? deriveStatusLevels(orphan.status) : null;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const calcAge = (dob) => {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
  };

  return (
    <AppShell>
      <div className="detail-page" dir="rtl">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="page-top">
          <div className="breadcrumb">
            <button className="back-btn" onClick={() => router.back()}>
              <IconBack /> رجوع
            </button>
            <span className="sep">/</span>
            <Link href="/orphans" className="crumb-link">الأيتام</Link>
            <span className="sep">/</span>
            <span className="crumb-current">تفاصيل اليتيم</span>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Transfer button — rightmost (GM only, under sponsorship) */}
            {isGM && orphan?.status === 'under_sponsorship' && (
              <button className="btn-transfer" onClick={() => setTransfer(true)}>
                <IconTransfer /> نقل الكفالة
              </button>
            )}

            {/* Edit + Delete grouped on the left */}
            <div style={{ marginRight: 'auto', display: 'flex', gap: '.5rem' }}>
              {orphan && (isGM || (user?.role === 'agent' && (orphan.status === 'under_review' || orphan.status === 'rejected'))) && (
                <button className="btn-edit" onClick={() => router.push(`/orphans/${id}/edit`)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  تعديل
                </button>
              )}

              {isGM && orphan && (
                <button className="btn-delete" onClick={() => setDeleteConfirm(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  حذف
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Success banner ──────────────────────────────────────── */}
        {successMsg && (
          <div className="success-banner" role="status">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="error-banner" role="alert"><AlertTriangle size={18} /> {error}</div>
        )}

        {loading ? (
          <PageSkeleton />
        ) : orphan ? (
          <>
            {/* ── Hero banner ─────────────────────────────────────── */}
            <div className="hero-card">
              <div className="hero-left">
                <div className="hero-avatar">
                  {orphan.full_name?.[0] || '؟'}
                  {orphan.is_gifted && <span className="hero-gifted-star">⭐</span>}
                </div>
                <div className="hero-identity">
                  <h2 className="hero-name">{orphan.full_name}</h2>
                  <div className="hero-badges">
                    <span
                      className="hero-status-badge"
                      style={{ color: statusInfo.color, background: statusInfo.bg, border: `1px solid ${statusInfo.color}30` }}
                    >
                      <span className="hero-status-dot" style={{ background: statusInfo.color }} />
                      {statusInfo.label}
                    </span>
                    {orphan.is_gifted && (
                      <span className="hero-gifted-badge">⭐ موهوب</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="hero-stats">
                {[
                  { icon: <IconCake />,   label: 'العمر',    value: calcAge(orphan.date_of_birth) },
                  { icon: <IconUser />,   label: 'الجنس',    value: GENDER_LABELS[orphan.gender] || '—' },
                  { icon: <IconMapPin />, label: 'المحافظة', value: orphan.governorate_ar || '—' },
                ].map((s) => (
                  <div key={s.label} className="hero-stat">
                    <span className="hero-stat-icon">{s.icon}</span>
                    <div>
                      <p className="hero-stat-label">{s.label}</p>
                      <p className="hero-stat-value">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-grid">

              {/* ── Left column ──────────────────────────────────────── */}
              <div className="col-main">

                {/* Identity card */}
                <Section title="البيانات الأساسية">
                <div className="info-grid">
                  <InfoRow label="تاريخ الميلاد" value={formatDate(orphan.date_of_birth)} />
                  <InfoRow label="المندوب" value={orphan.agent_name} />
                  <InfoRow label="تاريخ التسجيل" value={formatDate(orphan.created_at)} />
                  <InfoRow label="اسم الوصي" value={orphan.guardian_name} />
                  <InfoRow label="صلة الوصي" value={RELATION_LABELS[orphan.guardian_relation]} />
                </div>

                {orphan.notes && (
                  <div className="notes-box">
                    <span className="notes-label">ملاحظات</span>
                    <p className="notes-text">{orphan.notes}</p>
                  </div>
                )}
              </Section>

              {/* Documents */}
              {documents.length > 0 && (
                <Section title="المستندات المرفقة">
                  <div className="docs-list">
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={`/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="doc-item"
                      >
                        <span className="doc-icon"><IconDoc /></span>
                        <div className="doc-info">
                          <span className="doc-name">{doc.original_name || doc.doc_type}</span>
                          <span
                            className="doc-type-badge"
                            style={{
                              color: (DOC_TYPE_CONFIG[doc.doc_type] || DOC_TYPE_CONFIG.other).color,
                              background: (DOC_TYPE_CONFIG[doc.doc_type] || DOC_TYPE_CONFIG.other).bg,
                            }}
                          >
                            {(DOC_TYPE_CONFIG[doc.doc_type] || DOC_TYPE_CONFIG.other).label}
                          </span>
                        </div>
                        <span className="doc-date">{formatDate(doc.uploaded_at)}</span>
                      </a>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* ── Right column ─────────────────────────────────────── */}
            <div className="col-side">

              {/* Sponsorship + Status card */}
              <Section title="بيانات الكفالة">
                {/* ── Two-level status flow ── */}
                <div className="status-flow">
                  {/* Level 1: registration state */}
                  <div className="status-flow-row">
                    <span className="status-flow-step-label">حالة التسجيل</span>
                    <span
                      className="status-flow-badge"
                      style={{
                        color: statusLevels.registration.color,
                        background: statusLevels.registration.bg,
                        borderColor: statusLevels.registration.color + '40',
                      }}
                    >
                      <span className="status-flow-dot" style={{ background: statusLevels.registration.color }} />
                      {statusLevels.registration.label}
                    </span>
                  </div>

                  {/* Level 2: placement state (only when accepted) */}
                  {statusLevels.placement && (
                    <>
                      <div className="status-flow-connector">
                        <div className="status-flow-line" />
                      </div>
                      <div className="status-flow-row">
                        <span className="status-flow-step-label">حالة الكفالة</span>
                        <span
                          className="status-flow-badge"
                          style={{
                            color: statusLevels.placement.color,
                            background: statusLevels.placement.bg,
                            borderColor: statusLevels.placement.color + '40',
                          }}
                        >
                          <span className="status-flow-dot" style={{ background: statusLevels.placement.color }} />
                          {statusLevels.placement.label}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {orphan.sponsor_name ? (
                  <>
                    <div className="sponsor-highlight">
                      <div className="sponsor-hl-avatar">
                        {orphan.sponsor_name[0]}
                      </div>
                      <div>
                        <p className="sponsor-hl-name">{orphan.sponsor_name}</p>
                        <p className="sponsor-hl-label">الكافل الحالي</p>
                      </div>
                    </div>
                    <div className="info-grid single-col">
                      <InfoRow label="تاريخ بداية الكفالة" value={formatDate(orphan.sponsorship_start)} />
                      <InfoRow
                        label="المبلغ الشهري"
                        value={
                          orphan.monthly_amount
                            ? `${parseFloat(orphan.monthly_amount).toLocaleString('ar-YE')} ريال`
                            : '—'
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className="no-sponsor">
                    <Handshake size={40} strokeWidth={1.5} />
                    <p>لا يوجد كافل مُعيَّن بعد</p>
                    {orphan.status === 'under_marketing' && isGM && (
                      <button className="btn-primary" onClick={() => router.push('/sponsors')}>
                        تعيين كافل
                      </button>
                    )}
                  </div>
                )}
              </Section>
              </div>
            </div>
          </>
        ) : (
          <div className="not-found">
            <span><Search size={16} /></span>
            <p>لم يُعثر على اليتيم</p>
            <button onClick={() => router.back()} className="btn-back-ghost">
              رجوع
            </button>
          </div>
        )}
      </div>

      {/* ── Delete success toast ───────────────────────────────────── */}
      {deleteToast && (
        <div className="modal-backdrop">
          <div className="modal-box" dir="rtl" style={{ textAlign: 'center' }}>
            <div className="modal-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 className="modal-title">تم الحذف بنجاح</h3>
            <p className="modal-body">تم حذف بيانات اليتيم. سيتم تحويلك إلى قائمة الأيتام…</p>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="modal-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
            <h3 className="modal-title">تأكيد الحذف</h3>
            <p className="modal-body">
              هل أنت متأكد من حذف <strong>{orphan?.full_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel-modal" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
                إلغاء
              </button>
              <button className="btn-confirm-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'جارٍ الحذف…' : 'نعم، احذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer Modal ──────────────────────────────────────────── */}
      {orphan && (
        <TransferSponsorModal
          isOpen={transferOpen}
          onClose={() => setTransfer(false)}
          onSuccess={handleTransferSuccess}
          beneficiaryType="orphan"
          beneficiaryId={orphan.id}
          beneficiaryName={orphan.full_name}
          currentSponsor={orphan.sponsor_name}
          agentId={orphan.agent_id}
        />
      )}

      <style jsx>{`
        .detail-page {
          max-width: 1040px; margin: 0 auto; padding-bottom: 3rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 0;
        }

        /* ── Hero banner ───────────────────────────────────────────── */
        .hero-card {
          background: linear-gradient(135deg, #0d3d5c 0%, #1B5E8C 60%, #1e6fa3 100%);
          border-radius: 1.25rem; padding: 1.75rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.25rem;
          box-shadow: 0 4px 20px rgba(13,61,92,.3);
        }
        .hero-left {
          display: flex; align-items: center; gap: 1.25rem;
        }
        .hero-avatar {
          position: relative; width: 4.5rem; height: 4.5rem; border-radius: 50%;
          background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
          border: 2.5px solid rgba(255,255,255,.35);
          color: #fff; font-size: 1.6rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .hero-gifted-star {
          position: absolute; bottom: -4px; right: -4px; font-size: .85rem; line-height: 1;
        }
        .hero-identity { display: flex; flex-direction: column; gap: .5rem; }
        .hero-name {
          font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0;
          text-shadow: 0 1px 4px rgba(0,0,0,.2);
        }
        .hero-badges { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .hero-status-badge {
          display: inline-flex; align-items: center; gap: .35rem;
          padding: .25rem .75rem; border-radius: 999px;
          font-size: .75rem; font-weight: 700; backdrop-filter: blur(4px);
        }
        .hero-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .hero-gifted-badge {
          display: inline-flex; align-items: center; gap: .25rem;
          padding: .25rem .65rem; border-radius: 999px;
          background: rgba(253,230,138,.25); border: 1px solid rgba(253,230,138,.5);
          color: #fde68a; font-size: .75rem; font-weight: 700;
        }
        .hero-stats {
          display: flex; gap: .75rem; flex-wrap: wrap; justify-content: flex-end;
        }
        .hero-stat {
          display: flex; align-items: center; gap: .5rem;
          background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
          border-radius: .75rem; padding: .55rem .85rem;
          backdrop-filter: blur(4px); min-width: 100px;
        }
        .hero-stat-icon { color: rgba(255,255,255,.7); display: flex; flex-shrink: 0; }
        .hero-stat-label { font-size: .62rem; color: rgba(255,255,255,.6); margin: 0; font-weight: 500; }
        .hero-stat-value { font-size: .82rem; color: #fff; margin: 0; font-weight: 700; }
        @media (max-width: 768px) {
          .hero-card { flex-direction: column; align-items: flex-start; padding: 1.25rem; }
          .hero-stats { justify-content: flex-start; }
          .hero-stat { min-width: 80px; }
        }

        /* ── Top bar ────────────────────────────────────────────────── */
        .page-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
        }
        .breadcrumb { display: flex; align-items: center; gap: .5rem; font-size: .82rem; }
        .back-btn {
          display: flex; align-items: center; gap: .3rem;
          background: none; border: none; color: #1B5E8C; cursor: pointer;
          font-family: 'Cairo', sans-serif; font-size: .82rem; font-weight: 600;
          padding: .3rem .5rem; border-radius: .375rem; transition: background .12s;
        }
        .back-btn:hover { background: #f0f7ff; }
        .sep { color: #d1d5db; }
        .crumb-link { color: #1B5E8C; text-decoration: none; font-weight: 600; }
        .crumb-link:hover { text-decoration: underline; }
        .crumb-current { color: #6b7280; }

        .btn-edit {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.1rem;
          background: #fff; color: #D97706;
          border: 1.5px solid #D97706; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
        }
        .btn-edit:hover { background: #fffbeb; transform: translateY(-1px); }

        .btn-transfer {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .65rem 1.25rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; border: none; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 700;
          cursor: pointer; box-shadow: 0 2px 8px rgba(27,94,140,.25);
          transition: all .15s;
        }
        .btn-transfer:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(27,94,140,.35); }

        .btn-delete {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.1rem;
          background: #fff; color: #dc2626;
          border: 1.5px solid #fca5a5; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
        }
        .btn-delete:hover { background: #fef2f2; border-color: #dc2626; transform: translateY(-1px); }

        /* ── Delete modal ───────────────────────────────────────────── */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem;
          animation: fadeIn .15s ease;
        }
        .modal-box {
          background: #fff; border-radius: 1.25rem; padding: 2rem 1.75rem;
          max-width: 420px; width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
          animation: scaleIn .15s ease;
        }
        .modal-icon { display: flex; justify-content: center; margin-bottom: .75rem; }
        .modal-title { font-size: 1.15rem; font-weight: 800; color: #0d3d5c; text-align: center; margin: 0 0 .75rem; }
        .modal-body { font-size: .875rem; color: #6b7280; text-align: center; line-height: 1.7; margin: 0 0 1.5rem; }
        .modal-actions { display: flex; gap: .75rem; justify-content: center; }
        .btn-cancel-modal {
          padding: .65rem 1.5rem; background: none; border: 1.5px solid #d1d5db;
          border-radius: .75rem; color: #374151;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 600;
          cursor: pointer; transition: all .15s;
        }
        .btn-cancel-modal:hover { border-color: #9ca3af; background: #f9fafb; }
        .btn-confirm-delete {
          padding: .65rem 1.5rem;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: #fff; border: none; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 700;
          cursor: pointer; box-shadow: 0 2px 8px rgba(220,38,38,.3);
          transition: all .15s;
        }
        .btn-confirm-delete:disabled { opacity: .65; cursor: not-allowed; }
        .btn-confirm-delete:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(220,38,38,.4); }
        @keyframes scaleIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:none; } }

        /* ── Banners ────────────────────────────────────────────────── */
        .success-banner {
          background: #ecfdf5; border: 1px solid #bbf7d0; color: #15803d;
          padding: .75rem 1rem; border-radius: .75rem; font-size: .875rem;
          font-weight: 600; margin-bottom: 1rem;
          animation: slideDown .2s ease;
        }
        .error-banner {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .75rem 1rem; border-radius: .75rem; font-size: .875rem;
          margin-bottom: 1rem;
        }
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px);} to {opacity:1; transform:none;} }

        /* ── Grid ───────────────────────────────────────────────────── */
        .content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.25rem; }
        @media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } }
        .col-main { display: flex; flex-direction: column; gap: 1.25rem; }
        .col-side { display: flex; flex-direction: column; gap: 1.25rem; }

        /* ── Section card ───────────────────────────────────────────── */
        .section-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1.1rem;
          padding: 1.35rem 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,.05);
        }
        .section-title {
          font-size: .82rem; font-weight: 800; color: #0d3d5c;
          margin: 0 0 1.1rem; padding-bottom: .75rem;
          border-bottom: 1.5px solid #f0f4f8;
          border-right: 3px solid #1B5E8C; padding-right: .65rem;
          letter-spacing: .01em;
        }

        /* ── Identity header ────────────────────────────────────────── */
        .identity-header {
          display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;
        }
        .avatar {
          position: relative; width: 3.5rem; height: 3.5rem; border-radius: 50%;
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c);
          color: #fff; font-size: 1.3rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .gifted-star {
          position: absolute; bottom: -4px; right: -4px;
          font-size: .8rem; line-height: 1;
        }
        .orphan-name { font-size: 1.15rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .35rem; }
        .status-badge {
          display: inline-block; padding: .2rem .6rem; border-radius: 999px;
          font-size: .72rem; font-weight: 700;
        }
        .gifted-badge {
          display: inline-block; margin-right: .4rem;
          padding: .2rem .6rem; border-radius: 999px;
          font-size: .72rem; font-weight: 700;
          background: #FEF3C7; color: #D97706;
        }

        /* ── Info grid ──────────────────────────────────────────────── */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
        .info-grid.single-col { grid-template-columns: 1fr; }
        .info-row {
          display: flex; flex-direction: column; gap: .25rem;
          background: #f8fafc; border: 1px solid #eef2f7;
          border-radius: .625rem; padding: .6rem .75rem; min-width: 0;
        }
        .info-label { font-size: .68rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; word-break: break-word; }
        .info-value { font-size: .875rem; color: #0d3d5c; font-weight: 700; overflow-wrap: anywhere; word-break: break-word; min-width: 0; }

        /* ── Notes ──────────────────────────────────────────────────── */
        .notes-box { margin-top: 1rem; background: #f9fafb; border-radius: .625rem; padding: .75rem; }
        .notes-label { font-size: .72rem; color: #9ca3af; font-weight: 600; display: block; margin-bottom: .3rem; }
        .notes-text { font-size: .85rem; color: #374151; margin: 0; line-height: 1.7; }

        /* ── Documents ──────────────────────────────────────────────── */
        .docs-list { display: flex; flex-direction: column; gap: .4rem; }
        .doc-item {
          display: flex; align-items: center; gap: .75rem;
          padding: .65rem .875rem; border: 1px solid #e5e7eb; border-radius: .625rem;
          text-decoration: none; transition: all .15s; background: #fafafa;
        }
        .doc-item:hover { border-color: #1B5E8C; background: #f0f7ff; }
        .doc-icon { color: #6b7280; display: flex; flex-shrink: 0; }
        .doc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .1rem; }
        .doc-name { font-size: .82rem; font-weight: 600; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .doc-type-badge {
          display: inline-block; padding: .15rem .5rem; border-radius: 999px;
          font-size: .68rem; font-weight: 700;
        }
        .doc-date { font-size: .72rem; color: #9ca3af; flex-shrink: 0; }

        /* ── Sponsor highlight ──────────────────────────────────────── */
        .sponsor-highlight {
          display: flex; align-items: center; gap: .875rem;
          background: linear-gradient(135deg, #0d3d5c, #1B5E8C);
          border-radius: .875rem; padding: 1rem 1.1rem; margin-bottom: 1rem;
        }
        .sponsor-hl-avatar {
          width: 2.75rem; height: 2.75rem; border-radius: 50%;
          background: rgba(255,255,255,.2); border: 2px solid rgba(255,255,255,.35);
          color: #fff; font-size: 1.05rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sponsor-hl-name { font-size: .95rem; font-weight: 800; color: #fff; margin: 0; }
        .sponsor-hl-label { font-size: .7rem; color: rgba(255,255,255,.65); margin: .15rem 0 0; }

        .no-sponsor {
          text-align: center; padding: 1.5rem;
          display: flex; flex-direction: column; align-items: center; gap: .5rem;
          color: #9ca3af;
        }
        .no-sponsor span { font-size: 1.8rem; }
        .no-sponsor p { font-size: .82rem; margin: 0; }
        .assign-link {
          color: #1B5E8C; font-size: .82rem; font-weight: 700; text-decoration: none;
          margin-top: .25rem;
        }
        .assign-link:hover { text-decoration: underline; }

        /* ── Two-level status flow ──────────────────────────────────── */
        .status-flow {
          display: flex; flex-direction: column; gap: 0; margin-bottom: .875rem;
        }
        .status-flow-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: .75rem; padding: .6rem .75rem;
          background: #f8fafc; border: 1px solid #eef2f7; border-radius: .625rem;
        }
        .status-flow-step-label {
          font-size: .72rem; color: #94a3b8; font-weight: 600;
          text-transform: uppercase; letter-spacing: .04em; white-space: nowrap;
        }
        .status-flow-badge {
          display: inline-flex; align-items: center; gap: .35rem;
          padding: .3rem .8rem; border-radius: 999px; border: 1px solid;
          font-size: .8rem; font-weight: 700;
        }
        .status-flow-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          animation: pulse 2s infinite;
        }
        .status-flow-connector {
          display: flex; justify-content: flex-end; padding: 0 1.25rem;
        }
        .status-flow-line {
          width: 2px; height: 14px; background: #e2e8f0; border-radius: 1px;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }

        /* ── Skeleton ───────────────────────────────────────────────── */
        .skeleton-wrap { display: flex; flex-direction: column; gap: 1rem; }
        .skeleton-block {
          border-radius: 1rem;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        /* ── Not found ──────────────────────────────────────────────── */
        .not-found {
          text-align: center; padding: 4rem; color: #9ca3af;
          display: flex; flex-direction: column; align-items: center; gap: .75rem;
        }
        .not-found span { font-size: 2.5rem; }
        .not-found p { font-size: .9rem; }
        .btn-back-ghost {
          color: #1B5E8C; background: none; border: 1.5px solid #1B5E8C;
          border-radius: .625rem; padding: .5rem 1.25rem;
          font-family: 'Cairo', sans-serif; font-weight: 600; cursor: pointer;
          font-size: .875rem; transition: background .12s;
        }
        .btn-back-ghost:hover { background: #f0f7ff; }
      `}</style>
    </AppShell>
  );
}
