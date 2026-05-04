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

const GENDER_LABELS = { male: 'ذكر', female: 'أنثى' };
const RELATION_LABELS = {
  uncle: 'عم', maternal_uncle: 'خال', grandfather: 'جد',
  sibling: 'أخ / أخت', other: 'أخرى',
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

  const handleTransferSuccess = (data) => {
    setSuccessMsg('تم نقل الكفالة بنجاح ✓');
    fetchOrphan(); // refresh orphan data to show new sponsor
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const statusInfo = STATUS_CONFIG[orphan?.status] || STATUS_CONFIG.inactive;

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

          {/* Transfer button — GM only, only if under sponsorship */}
          {isGM && orphan?.status === 'under_sponsorship' && (
            <button className="btn-transfer" onClick={() => setTransfer(true)}>
              <IconTransfer /> نقل الكفالة
            </button>
          )}
        </div>

        {/* ── Success banner ──────────────────────────────────────── */}
        {successMsg && (
          <div className="success-banner" role="status">
            ✅ {successMsg}
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="error-banner" role="alert">⚠ {error}</div>
        )}

        {loading ? (
          <PageSkeleton />
        ) : orphan ? (
          <div className="content-grid">

            {/* ── Left column ──────────────────────────────────────── */}
            <div className="col-main">

              {/* Identity card */}
              <Section title="البيانات الأساسية">
                <div className="identity-header">
                  <div className="avatar">
                    {orphan.full_name?.[0] || '؟'}
                    {orphan.is_gifted && <span className="gifted-star">⭐</span>}
                  </div>
                  <div>
                    <h2 className="orphan-name">{orphan.full_name}</h2>
                    <span
                      className="status-badge"
                      style={{ color: statusInfo.color, background: statusInfo.bg }}
                    >
                      {statusInfo.label}
                    </span>
                    {orphan.is_gifted && (
                      <span className="gifted-badge">موهوب</span>
                    )}
                  </div>
                </div>

                <div className="info-grid">
                  <InfoRow label="تاريخ الميلاد" value={formatDate(orphan.date_of_birth)} />
                  <InfoRow label="العمر" value={calcAge(orphan.date_of_birth)} />
                  <InfoRow label="الجنس" value={GENDER_LABELS[orphan.gender]} />
                  <InfoRow label="المحافظة" value={orphan.governorate_ar} />
                  <InfoRow label="المندوب" value={orphan.agent_name} />
                  <InfoRow label="تاريخ التسجيل" value={formatDate(orphan.created_at)} />
                </div>

                {orphan.notes && (
                  <div className="notes-box">
                    <span className="notes-label">ملاحظات</span>
                    <p className="notes-text">{orphan.notes}</p>
                  </div>
                )}
              </Section>

              {/* Guardian section */}
              <Section title="بيانات الوصي">
                <div className="info-grid">
                  <InfoRow label="اسم الوصي" value={orphan.guardian_name} />
                  <InfoRow label="صلة الوصي" value={RELATION_LABELS[orphan.guardian_relation]} />
                </div>
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
                          <span className="doc-type">{doc.doc_type}</span>
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

              {/* Sponsorship card */}
              <Section title="بيانات الكفالة">
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

                    {/* GM: Transfer button (alternate — inside card) */}
                    {isGM && (
                      <button
                        className="btn-transfer-inline"
                        onClick={() => setTransfer(true)}
                      >
                        <IconTransfer /> نقل إلى كافل آخر
                      </button>
                    )}
                  </>
                ) : (
                  <div className="no-sponsor">
                    <span>🤝</span>
                    <p>لا يوجد كافل مُعيَّن بعد</p>
                    {orphan.status === 'under_marketing' && isGM && (
                      <Link href="/sponsors" className="assign-link">
                        تعيين كافل →
                      </Link>
                    )}
                  </div>
                )}
              </Section>

              {/* Quick status card */}
              <Section title="الحالة الحالية">
                <div
                  className="status-card-inner"
                  style={{ borderColor: statusInfo.color, background: statusInfo.bg }}
                >
                  <span className="status-dot" style={{ background: statusInfo.color }} />
                  <span style={{ color: statusInfo.color, fontWeight: 700 }}>
                    {statusInfo.label}
                  </span>
                </div>

                {isGM && orphan.status !== 'under_sponsorship' && (
                  <Link
                    href={`/orphans/${id}/status`}
                    className="btn-change-status"
                  >
                    تغيير الحالة
                  </Link>
                )}
              </Section>
            </div>
          </div>
        ) : (
          <div className="not-found">
            <span>🔍</span>
            <p>لم يُعثر على اليتيم</p>
            <button onClick={() => router.back()} className="btn-back-ghost">
              رجوع
            </button>
          </div>
        )}
      </div>

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
          max-width: 1000px; margin: 0 auto; padding-bottom: 3rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
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
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .section-title {
          font-size: .85rem; font-weight: 700; color: #1B5E8C;
          margin: 0 0 1rem; padding-bottom: .75rem;
          border-bottom: 1.5px solid #f0f4f8;
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
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem .5rem; }
        .info-grid.single-col { grid-template-columns: 1fr; }
        .info-row { display: flex; flex-direction: column; gap: .15rem; }
        .info-label { font-size: .72rem; color: #9ca3af; font-weight: 500; }
        .info-value { font-size: .875rem; color: #1f2937; font-weight: 600; }

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
        .doc-type { font-size: .7rem; color: #9ca3af; }
        .doc-date { font-size: .72rem; color: #9ca3af; flex-shrink: 0; }

        /* ── Sponsor highlight ──────────────────────────────────────── */
        .sponsor-highlight {
          display: flex; align-items: center; gap: .75rem;
          background: linear-gradient(135deg, #f0f7ff, #f8fbff);
          border: 1.5px solid #bfdbfe; border-radius: .75rem;
          padding: .875rem; margin-bottom: 1rem;
        }
        .sponsor-hl-avatar {
          width: 2.25rem; height: 2.25rem; border-radius: 50%;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-size: .9rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sponsor-hl-name { font-size: .9rem; font-weight: 700; color: #0d3d5c; margin: 0; }
        .sponsor-hl-label { font-size: .72rem; color: #9ca3af; margin: .1rem 0 0; }

        .btn-transfer-inline {
          display: flex; align-items: center; gap: .5rem; justify-content: center;
          width: 100%; margin-top: 1rem;
          padding: .6rem 1rem; background: none;
          border: 1.5px dashed #1B5E8C; border-radius: .625rem;
          color: #1B5E8C; font-family: 'Cairo', sans-serif; font-size: .82rem;
          font-weight: 700; cursor: pointer; transition: all .15s;
        }
        .btn-transfer-inline:hover { background: #f0f7ff; border-style: solid; }

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

        /* ── Status card ────────────────────────────────────────────── */
        .status-card-inner {
          display: flex; align-items: center; gap: .6rem;
          padding: .75rem 1rem; border-radius: .625rem; border: 1.5px solid;
          font-size: .875rem; margin-bottom: .75rem;
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .btn-change-status {
          display: block; text-align: center;
          color: #1B5E8C; font-size: .8rem; font-weight: 600;
          text-decoration: none; padding: .4rem;
          border-radius: .5rem; transition: background .12s;
        }
        .btn-change-status:hover { background: #f0f7ff; }

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
