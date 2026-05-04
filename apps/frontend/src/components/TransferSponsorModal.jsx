'use client';

/**
 * TransferSponsorModal.jsx
 * Reusable modal for GM to transfer an orphan or family from one sponsor to another.
 *
 * Props:
 *   isOpen          {boolean}   - controls visibility
 *   onClose         {function}  - called when modal dismissed
 *   onSuccess       {function}  - called with updated data after successful transfer
 *   beneficiaryType {'orphan'|'family'}
 *   beneficiaryId   {string}    - UUID
 *   beneficiaryName {string}    - display name
 *   currentSponsor  {string}    - current sponsor's name (display only)
 *   agentId         {string}    - UUID of the assigned agent
 *
 * API: POST /api/sponsors/transfer
 */

import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconTransfer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export default function TransferSponsorModal({
  isOpen,
  onClose,
  onSuccess,
  beneficiaryType = 'orphan',
  beneficiaryId,
  beneficiaryName,
  currentSponsor,
  agentId,
}) {
  const [sponsors, setSponsors]           = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedSponsor, setSelected]    = useState(null);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [endReason, setEndReason]         = useState('');
  const [step, setStep]                   = useState(1); // 1 = pick sponsor, 2 = confirm
  const [loading, setLoading]             = useState(false);
  const [fetchingSponsors, setFetching]   = useState(false);
  const [error, setError]                 = useState('');
  const searchRef = useRef(null);
  const overlayRef = useRef(null);

  // Load sponsors list when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelected(null);
    setSearchQuery('');
    setMonthlyAmount('');
    setEndReason('');
    setError('');

    setFetching(true);
    api.get('/sponsors')
      .then(({ data }) => {
        setSponsors(data.sponsors || []);
        setFiltered(data.sponsors || []);
      })
      .catch(() => setError('تعذّر تحميل قائمة الكفلاء'))
      .finally(() => setFetching(false));

    // Focus search after paint
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  // Filter sponsors by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(sponsors);
    } else {
      const q = searchQuery.toLowerCase();
      setFiltered(
        sponsors.filter(
          (s) =>
            s.full_name?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.phone?.includes(q)
        )
      );
    }
  }, [searchQuery, sponsors]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handleSelectSponsor = (sponsor) => {
    setSelected(sponsor);
    setStep(2);
    setError('');
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedSponsor) return;
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) {
      setError('يرجى إدخال المبلغ الشهري');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/sponsors/transfer', {
        beneficiaryType,
        beneficiaryId,
        newSponsorId: selectedSponsor.id,
        agentId,
        monthlyAmount: parseFloat(monthlyAmount),
        endReason: endReason.trim() || 'transferred',
      });

      onSuccess?.(data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ أثناء نقل الكفالة'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeLabel = beneficiaryType === 'orphan' ? 'اليتيم' : 'الأسرة';

  return (
    <div className="overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog"
      aria-modal="true" aria-label="نقل الكفالة">

      <div className="modal" dir="rtl">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="modal-header">
          <div className="header-icon">
            <IconTransfer />
          </div>
          <div className="header-text">
            <h2 className="modal-title">نقل الكفالة</h2>
            <p className="modal-sub">
              {typeLabel}: <strong>{beneficiaryName}</strong>
            </p>
          </div>
          <button className="close-btn" onClick={handleClose} aria-label="إغلاق" disabled={loading}>
            <IconX />
          </button>
        </div>

        {/* ── Step indicator ─────────────────────────────────────────── */}
        <div className="steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <span className="step-num">١</span>
            <span className="step-lbl">اختيار الكافل</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">٢</span>
            <span className="step-lbl">تأكيد النقل</span>
          </div>
        </div>

        {/* ── Error banner ───────────────────────────────────────────── */}
        {error && (
          <div className="error-banner" role="alert">
            ⚠ {error}
          </div>
        )}

        {/* ════════════════════ STEP 1: Pick sponsor ═════════════════ */}
        {step === 1 && (
          <div className="step-content">
            {/* Current sponsor badge */}
            {currentSponsor && (
              <div className="current-sponsor">
                <span className="cs-label">الكافل الحالي</span>
                <span className="cs-name">{currentSponsor}</span>
              </div>
            )}

            {/* Search */}
            <div className="search-wrap">
              <span className="search-ico"><IconSearch /></span>
              <input
                ref={searchRef}
                type="text"
                className="search-inp"
                placeholder="ابحث باسم الكافل أو البريد أو الهاتف…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sponsors list */}
            <div className="sponsors-list">
              {fetchingSponsors ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="sponsor-skeleton" />
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <span>🔍</span>
                  <p>لا يوجد كفلاء مطابقون</p>
                </div>
              ) : (
                filtered.map((sponsor) => {
                  const isCurrent = sponsor.full_name === currentSponsor;
                  return (
                    <button
                      key={sponsor.id}
                      className={`sponsor-row ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => !isCurrent && handleSelectSponsor(sponsor)}
                      disabled={isCurrent}
                    >
                      <div className="sponsor-avatar">
                        {sponsor.full_name?.[0] || '؟'}
                      </div>
                      <div className="sponsor-info">
                        <span className="sponsor-name">{sponsor.full_name}</span>
                        <span className="sponsor-meta">
                          {sponsor.email && <span>{sponsor.email}</span>}
                          {sponsor.phone && <span>{sponsor.phone}</span>}
                          <span className="sponsorship-count">
                            {sponsor.active_sponsorships ?? 0} كفالة نشطة
                          </span>
                        </span>
                      </div>
                      {isCurrent ? (
                        <span className="current-badge">الكافل الحالي</span>
                      ) : (
                        <span className="select-arrow"><IconArrowRight /></span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ STEP 2: Confirm ══════════════════════ */}
        {step === 2 && selectedSponsor && (
          <div className="step-content">

            {/* Transfer summary card */}
            <div className="transfer-summary">
              <div className="transfer-party">
                <span className="party-label">من</span>
                <span className="party-name">{currentSponsor || 'غير معروف'}</span>
              </div>
              <div className="transfer-arrow">
                <IconArrowRight />
              </div>
              <div className="transfer-party highlight">
                <span className="party-label">إلى</span>
                <span className="party-name">{selectedSponsor.full_name}</span>
                {selectedSponsor.email && (
                  <span className="party-email">{selectedSponsor.email}</span>
                )}
              </div>
            </div>

            {/* Beneficiary info */}
            <div className="beneficiary-chip">
              <IconUser />
              <span>{typeLabel}: {beneficiaryName}</span>
            </div>

            {/* Monthly amount */}
            <div className="field-group">
              <label className="field-lbl">
                المبلغ الشهري الجديد (ريال) <span className="req">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                className="field-inp ltr"
                placeholder="مثال: 5000"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                autoFocus
              />
            </div>

            {/* End reason */}
            <div className="field-group">
              <label className="field-lbl">
                سبب النقل <span className="opt">(اختياري)</span>
              </label>
              <input
                type="text"
                className="field-inp"
                placeholder="مثال: طلب الكافل القديم إنهاء الكفالة"
                value={endReason}
                onChange={(e) => setEndReason(e.target.value)}
              />
            </div>

            {/* Warning note */}
            <div className="warning-note">
              ⚠ سيتم إنهاء الكفالة الحالية وإنشاء كفالة جديدة فوراً. هذا الإجراء لا يمكن التراجع عنه.
            </div>

            {/* Actions */}
            <div className="confirm-actions">
              <button className="btn-back" onClick={handleBack} disabled={loading}>
                ← رجوع
              </button>
              <button
                className="btn-confirm"
                onClick={handleSubmit}
                disabled={loading || !monthlyAmount || parseFloat(monthlyAmount) <= 0}
                aria-busy={loading}
              >
                {loading ? (
                  <><span className="spin" />جارٍ النقل…</>
                ) : (
                  <>تأكيد النقل ✓</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ── Overlay ────────────────────────────────────────────────── */
        .overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(13, 61, 92, 0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: fadeIn .18s ease;
        }

        /* ── Modal ──────────────────────────────────────────────────── */
        .modal {
          width: 100%; max-width: 520px; max-height: 90vh;
          background: #fff; border-radius: 1.25rem;
          box-shadow: 0 20px 60px rgba(13, 61, 92, 0.25), 0 4px 16px rgba(0,0,0,.12);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: slideUp .22s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'Cairo', 'Tajawal', sans-serif;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(.97); } to { opacity: 1; transform: none; } }

        /* ── Header ────────────────────────────────────────────────── */
        .modal-header {
          display: flex; align-items: center; gap: .875rem;
          padding: 1.25rem 1.5rem; border-bottom: 1.5px solid #f0f4f8;
          flex-shrink: 0;
        }
        .header-icon {
          width: 2.5rem; height: 2.5rem; border-radius: .75rem;
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c);
          color: #fff; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .header-text { flex: 1; min-width: 0; }
        .modal-title { font-size: 1rem; font-weight: 700; color: #0d3d5c; margin: 0; }
        .modal-sub { font-size: .78rem; color: #6b7280; margin: .1rem 0 0; }
        .modal-sub strong { color: #1B5E8C; }
        .close-btn {
          display: flex; align-items: center; justify-content: center;
          width: 2rem; height: 2rem; border-radius: .5rem; border: none;
          background: none; color: #9ca3af; cursor: pointer; flex-shrink: 0;
          transition: background .12s, color .12s;
        }
        .close-btn:hover { background: #f3f4f6; color: #374151; }

        /* ── Steps ──────────────────────────────────────────────────── */
        .steps {
          display: flex; align-items: center; gap: .5rem;
          padding: .85rem 1.5rem; background: #fafafa;
          border-bottom: 1px solid #f0f4f8; flex-shrink: 0;
          font-size: .78rem; font-weight: 600;
        }
        .step { display: flex; align-items: center; gap: .4rem; color: #c4cdd8; }
        .step.active { color: #1B5E8C; }
        .step.done { color: #10B981; }
        .step-num {
          width: 20px; height: 20px; border-radius: 50%; font-size: .68rem;
          display: flex; align-items: center; justify-content: center;
          background: #e5e7eb; color: #9ca3af; font-weight: 700;
          transition: background .2s, color .2s;
        }
        .step.active .step-num { background: #1B5E8C; color: #fff; }
        .step.done .step-num { background: #10B981; color: #fff; }
        .step-line { flex: 1; height: 1.5px; background: #e5e7eb; }

        /* ── Error ──────────────────────────────────────────────────── */
        .error-banner {
          margin: 0 1.5rem; margin-top: 1rem;
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          font-size: .82rem; font-weight: 500; padding: .65rem .875rem;
          border-radius: .625rem; flex-shrink: 0;
          animation: fadeIn .15s ease;
        }

        /* ── Step content ───────────────────────────────────────────── */
        .step-content {
          padding: 1.25rem 1.5rem 1.5rem;
          overflow-y: auto; flex: 1;
          display: flex; flex-direction: column; gap: 1rem;
        }

        /* ── Current sponsor ────────────────────────────────────────── */
        .current-sponsor {
          display: flex; align-items: center; gap: .6rem;
          background: #f0f7ff; border: 1px solid #bfdbfe;
          border-radius: .625rem; padding: .6rem .875rem;
          font-size: .82rem;
        }
        .cs-label { color: #6b7280; font-weight: 500; flex-shrink: 0; }
        .cs-name { font-weight: 700; color: #1B5E8C; }

        /* ── Search ─────────────────────────────────────────────────── */
        .search-wrap { position: relative; }
        .search-ico {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; display: flex; pointer-events: none;
        }
        .search-inp {
          width: 100%; padding: .65rem .75rem .65rem 2.25rem;
          border: 1.5px solid #d1d5db; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem;
          color: #1f2937; background: #fafafa; outline: none;
          box-sizing: border-box; transition: border-color .15s, box-shadow .15s;
          direction: rtl; text-align: right;
        }
        .search-inp::placeholder { color: #c4cdd8; }
        .search-inp:focus { border-color: #1B5E8C; box-shadow: 0 0 0 3px rgba(27,94,140,.1); background: #fff; }

        /* ── Sponsors list ──────────────────────────────────────────── */
        .sponsors-list { display: flex; flex-direction: column; gap: .4rem; }
        .sponsor-skeleton {
          height: 62px; border-radius: .75rem;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .empty-state {
          text-align: center; padding: 2rem; color: #9ca3af;
          display: flex; flex-direction: column; align-items: center; gap: .5rem;
          font-size: .82rem;
        }
        .empty-state span { font-size: 1.8rem; }

        .sponsor-row {
          display: flex; align-items: center; gap: .875rem;
          padding: .75rem .875rem; border: 1.5px solid #e5e7eb;
          border-radius: .75rem; background: #fff;
          cursor: pointer; text-align: right; width: 100%;
          transition: all .15s; font-family: 'Cairo', sans-serif;
        }
        .sponsor-row:not(.is-current):hover {
          border-color: #1B5E8C; background: #f0f7ff; transform: translateX(-2px);
        }
        .sponsor-row.is-current { opacity: .55; cursor: not-allowed; background: #f9fafb; }

        .sponsor-avatar {
          width: 2.25rem; height: 2.25rem; border-radius: 50%;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-size: .9rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .sponsor-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .1rem; }
        .sponsor-name { font-size: .88rem; font-weight: 700; color: #1f2937; }
        .sponsor-meta { display: flex; gap: .5rem; flex-wrap: wrap; font-size: .72rem; color: #9ca3af; }
        .sponsorship-count { color: #10B981; font-weight: 600; }

        .current-badge {
          font-size: .7rem; font-weight: 700; color: #6b7280;
          background: #f3f4f6; padding: .2rem .5rem; border-radius: 999px;
          flex-shrink: 0;
        }
        .select-arrow { color: #c4cdd8; display: flex; align-items: center; flex-shrink: 0; }
        .sponsor-row:hover .select-arrow { color: #1B5E8C; }

        /* ── Transfer summary ───────────────────────────────────────── */
        .transfer-summary {
          display: flex; align-items: center; gap: .875rem;
          background: linear-gradient(135deg, #f0f7ff, #f8fbff);
          border: 1.5px solid #bfdbfe; border-radius: .875rem;
          padding: 1.1rem 1.25rem;
        }
        .transfer-party { flex: 1; display: flex; flex-direction: column; gap: .15rem; }
        .transfer-party.highlight { background: none; }
        .party-label { font-size: .7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; }
        .party-name { font-size: .92rem; font-weight: 700; color: #0d3d5c; }
        .transfer-party.highlight .party-name { color: #1B5E8C; }
        .party-email { font-size: .72rem; color: #9ca3af; }
        .transfer-arrow { color: #1B5E8C; display: flex; align-items: center; flex-shrink: 0; }

        /* ── Beneficiary chip ───────────────────────────────────────── */
        .beneficiary-chip {
          display: inline-flex; align-items: center; gap: .4rem;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          color: #15803d; font-size: .8rem; font-weight: 600;
          padding: .35rem .75rem; border-radius: 999px; align-self: flex-start;
        }

        /* ── Field ──────────────────────────────────────────────────── */
        .field-group { display: flex; flex-direction: column; gap: .35rem; }
        .field-lbl { font-size: .82rem; font-weight: 600; color: #374151; }
        .req { color: #dc2626; }
        .opt { color: #9ca3af; font-weight: 400; font-size: .75rem; }
        .field-inp {
          width: 100%; padding: .65rem .875rem;
          border: 1.5px solid #d1d5db; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem;
          color: #1f2937; background: #fafafa; outline: none;
          box-sizing: border-box; transition: border-color .15s, box-shadow .15s;
        }
        .field-inp:focus { border-color: #1B5E8C; box-shadow: 0 0 0 3px rgba(27,94,140,.1); background: #fff; }
        .ltr { direction: ltr; text-align: left; }

        /* ── Warning ────────────────────────────────────────────────── */
        .warning-note {
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: .625rem; padding: .7rem .875rem;
          font-size: .78rem; color: #92400e; line-height: 1.6;
        }

        /* ── Confirm actions ────────────────────────────────────────── */
        .confirm-actions {
          display: flex; gap: .75rem; justify-content: flex-end;
          padding-top: .25rem;
        }
        .btn-back {
          padding: .65rem 1.25rem; background: none;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 600;
          color: #6b7280; cursor: pointer; transition: all .15s;
        }
        .btn-back:hover:not(:disabled) { border-color: #9ca3af; color: #374151; }
        .btn-back:disabled { opacity: .5; cursor: not-allowed; }

        .btn-confirm {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .7rem 1.5rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; border: none; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .9rem; font-weight: 700;
          cursor: pointer; box-shadow: 0 2px 8px rgba(27,94,140,.25);
          transition: all .15s;
        }
        .btn-confirm:hover:not(:disabled) {
          background: linear-gradient(135deg, #2E7EB8, #1B5E8C);
          box-shadow: 0 4px 14px rgba(27,94,140,.35); transform: translateY(-1px);
        }
        .btn-confirm:disabled { opacity: .6; cursor: not-allowed; }
        .spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
