'use client';

/**
 * apps/frontend/src/app/receipts/batch/page.jsx
 * Route:  /receipts/batch          → shows agent's released lists to pick from
 *         /receipts/batch?listId=X → shows items for that specific list
 *
 * Agent only.
 * Workflow:
 *   1. Agent lands on this page → sees all released lists assigned to them
 *   2. Clicks a list → sees each beneficiary with a "رفع البصمة" button
 *   3. Captures fingerprint image → uploads via POST /api/receipts/biometric
 *   4. Progress bar updates as each item is confirmed
 *
 * API:
 *   GET  /api/disbursements/agent/released   → agent's released lists
 *   GET  /api/disbursements/:id              → list detail + items
 *   GET  /api/receipts/summary/:id           → confirmed count
 *   POST /api/receipts/biometric             → upload fingerprint
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, User, Users, Handshake, CheckCircle2 } from 'lucide-react';

import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTHS_AR = ['','يناير','فبراير','مارس','أبريل','مايو','يونيو',
                      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const formatAmount = (n) =>
  n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── FingerprintUploader ────────────────────────────────────────────────────────

function FingerprintUploader({ item, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('يُقبل PNG أو JPEG فقط');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('الحجم الأقصى 3 ميغابايت');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const base64 = await fileToBase64(file);
      await api.post('/receipts/biometric', {
        itemId: item.id,
        fingerprintBase64: base64,
        mimeType: file.type,
      });
      onUploaded(item.id);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفع البصمة');
    } finally {
      setUploading(false);
    }
  };

  // Already confirmed
  if (item.biometric_confirmed_at) {
    return (
      <div className="confirmed-wrap">
        <span className="confirmed-badge"><CheckCircle2 size={16} /> تم التأكيد</span>
        <span className="confirmed-date">
          {new Date(item.biometric_confirmed_at).toLocaleDateString('ar-YE', { dateStyle: 'short' })}
        </span>
      </div>
    );
  }

  return (
    <div className="uploader-wrap">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        className={`upload-btn ${uploading ? 'uploading' : ''}`}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading
          ? <><span className="spin" aria-hidden /> جارٍ الرفع…</>
          : '📷 رفع البصمة'}
      </button>
      {error && <p className="upload-err">{error}</p>}
    </div>
  );
}

// ── ListPicker — shows all released lists for the agent ───────────────────────

function ListPicker({ onSelect }) {
  const [lists,   setLists]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/disbursements/agent/released')
      .then(({ data }) => setLists(data.lists || []))
      .catch(() => setError('تعذّر تحميل الكشوف. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="picker-wrap">
        <p className="picker-hint">جارٍ تحميل كشوفك…</p>
        <div className="picker-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skel-card">
              <div className="skel" style={{ width: 100, height: 18 }} />
              <div className="skel" style={{ width: 70, height: 14, marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="err-banner"><AlertTriangle size={18} /> {error}</div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="picker-empty">
        <span style={{ fontSize: '3rem' }}>📋</span>
        <h3>لا توجد كشوف صرف جاهزة</h3>
        <p>ستظهر هنا الكشوف الشهرية بعد أن يصدرها المدير العام ويصبح بإمكانك رفع بصمات الاستلام.</p>
      </div>
    );
  }

  return (
    <div className="picker-wrap">
      <p className="picker-hint">اختر كشف الصرف الذي تريد رفع بصمات استلامه:</p>
      <div className="picker-list">
        {lists.map((list) => {
          const confirmed = Number(list.confirmed_items ?? 0);
          const total     = Number(list.total_items ?? 0);
          const pct       = total > 0 ? Math.round((confirmed / total) * 100) : 0;
          const done      = pct === 100 && total > 0;

          return (
            <button
              key={list.id}
              className={`picker-card ${done ? 'picker-card-done' : ''}`}
              onClick={() => onSelect(list.id)}
            >
              <div className="picker-card-left">
                <span className="picker-month">
                  {MONTHS_AR[list.month]} {list.year}
                </span>
                <span className="picker-progress-text">
                  {done
                    ? '🎉 اكتمل'
                    : `${confirmed} من ${total} بصمة`}
                </span>
              </div>
              <div className="picker-card-right">
                <div className="picker-bar-bg">
                  <div
                    className="picker-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: done ? '#10b981' : '#1B5E8C',
                    }}
                  />
                </div>
                <span className="picker-pct" style={{ color: done ? '#10b981' : '#1B5E8C' }}>
                  {pct}%
                </span>
                <span className="picker-arrow">←</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── BatchView — shows items for a specific list ────────────────────────────────

function BatchView({ listId, onBack }) {
  const [listDetail, setListDetail] = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detailRes, summaryRes] = await Promise.all([
        api.get(`/disbursements/${listId}`),
        api.get(`/receipts/summary/${listId}`),
      ]);
      setListDetail(detailRes.data);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUploaded = (itemId) => {
    setListDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId
            ? { ...i, biometric_confirmed_at: new Date().toISOString() }
            : i
        ),
      };
    });
    setSummary((prev) =>
      prev ? {
        ...prev,
        confirmed_items: Number(prev.confirmed_items) + 1,
        pending_items:   Number(prev.pending_items) - 1,
      } : prev
    );
  };

  // Only show items assigned to this agent
  const items = (listDetail?.items || []).filter((i) => i.included);

  const confirmed = Number(summary?.confirmed_items ?? 0);
  const total     = Number(summary?.total_items ?? items.length);
  const pct       = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const allDone   = pct === 100 && total > 0;

  const month = listDetail?.month;
  const year  = listDetail?.year;

  return (
    <div className="batch-view">

      {/* Back + title */}
      <div className="batch-header">
        <button className="back-btn" onClick={onBack}>← رجوع</button>
        <div>
          <h2 className="batch-title">
            بصمات الاستلام
            {month && year && (
              <span className="period-badge">{MONTHS_AR[month]} {year}</span>
            )}
          </h2>
          <p className="batch-sub">التقط بصمة كل مستفيد بعد تسليم المبلغ يدوياً</p>
        </div>
      </div>

      {error && <div className="err-banner"><AlertTriangle size={18} /> {error}</div>}

      {/* Progress bar */}
      {!loading && total > 0 && (
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">
              {allDone ? '🎉 اكتملت جميع البصمات!' : `${confirmed} من ${total} مستفيد`}
            </span>
            <span
              className="progress-pct"
              style={{ color: allDone ? '#10b981' : '#1B5E8C' }}
            >
              {pct}%
            </span>
          </div>
          <div className="progress-bg">
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                background: allDone
                  ? 'linear-gradient(90deg,#10b981,#059669)'
                  : 'linear-gradient(90deg,#1B5E8C,#2E7EB8)',
              }}
            />
          </div>
          {allDone && (
            <p className="progress-done">
              <CheckCircle2 size={16} /> رائع! تم رفع جميع بصمات هذا الكشف بنجاح.
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="items-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="item-card sk-card">
              <div className="skel" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="skel" style={{ width: '55%', height: 14, marginBottom: 6 }} />
                <div className="skel" style={{ width: '30%', height: 12 }} />
              </div>
              <div className="skel" style={{ width: 110, height: 36, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && !error && (
        <div className="batch-empty">
          <span style={{ fontSize: '2.5rem' }}>📋</span>
          <p>لا توجد بنود مشمولة في هذا الكشف باسمك</p>
        </div>
      )}

      {/* Items */}
      {!loading && items.length > 0 && (
        <div className="items-list">
          {items.map((item) => (
            <div
              key={item.id}
              className={`item-card ${item.biometric_confirmed_at ? 'item-done' : ''}`}
            >
              {/* Avatar */}
              <div className="item-avatar">
                {item.beneficiary_type === 'orphan' ? '<User size={18} />' : '<Users size={18} />'}
              </div>

              {/* Info */}
              <div className="item-info">
                <div className="item-name">{item.beneficiary_name}</div>
                <div className="item-meta">
                  <span>{item.governorate_ar || '—'}</span>
                  <span className="item-amount">{formatAmount(item.amount)}</span>
                  {item.sponsor_name && (
                    <span className="item-sponsor"><Handshake size={32} /> {item.sponsor_name}</span>
                  )}
                </div>
              </div>

              {/* Upload */}
              <FingerprintUploader item={item} onUploaded={handleUploaded} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentReceiptsBatchPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const listId       = searchParams.get('listId');

  const selectList = (id) => {
    router.push(`/receipts/batch?listId=${id}`);
  };

  const goBack = () => {
    router.push('/receipts/batch');
  };

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Page heading (always visible) */}
        {!listId && (
          <div className="page-top">
            <h1 className="page-title">رفع بصمات الاستلام</h1>
            <p className="page-sub">
              اختر كشف الصرف ثم التقط بصمة كل مستفيد بعد تسليم المبلغ
            </p>
          </div>
        )}

        {/* Either list picker or batch view */}
        {listId
          ? <BatchView listId={listId} onBack={goBack} />
          : <ListPicker onSelect={selectList} />
        }
      </div>

      <style jsx>{`
        /* ── Page shell ────────────────────────────────────────────────── */
        .page {
          max-width: 760px; margin: 0 auto; padding-bottom: 4rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 1.25rem;
        }
        .page-top { }
        .page-title { font-size: 1.55rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .25rem; }
        .page-sub { font-size: .83rem; color: #6b7a8d; margin: 0; }

        /* ── Error banner ──────────────────────────────────────────────── */
        .err-banner {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .85rem 1rem; border-radius: .75rem; font-size: .85rem;
        }

        /* ── List picker ───────────────────────────────────────────────── */
        .picker-wrap { display: flex; flex-direction: column; gap: 1rem; }
        .picker-hint { font-size: .88rem; color: #6b7a8d; margin: 0; font-weight: 600; }

        .picker-list { display: flex; flex-direction: column; gap: .75rem; }
        .picker-card {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          background: #fff; border: 1.5px solid #e5eaf0; border-radius: 1rem;
          padding: 1.1rem 1.4rem; cursor: pointer; text-align: right;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          transition: all .15s; width: 100%;
        }
        .picker-card:hover { border-color: #1B5E8C; box-shadow: 0 4px 16px rgba(27,94,140,.1); transform: translateY(-1px); }
        .picker-card-done { border-color: #a7f3d0; background: #f0fdf4; }
        .picker-card-done:hover { border-color: #34d399; }

        .picker-card-left { display: flex; flex-direction: column; gap: .2rem; align-items: flex-start; }
        .picker-month { font-size: 1rem; font-weight: 800; color: #0d3d5c; }
        .picker-progress-text { font-size: .75rem; color: #6b7a8d; font-weight: 500; }

        .picker-card-right {
          display: flex; align-items: center; gap: .65rem; flex-shrink: 0;
        }
        .picker-bar-bg {
          width: 100px; height: 7px; background: #f0f4f8; border-radius: 4px; overflow: hidden;
        }
        .picker-bar-fill { height: 100%; border-radius: 4px; transition: width .4s; }
        .picker-pct { font-size: .82rem; font-weight: 800; min-width: 35px; text-align: left; }
        .picker-arrow { font-size: .85rem; color: #9ca3af; }

        /* Picker empty */
        .picker-empty {
          display: flex; flex-direction: column; align-items: center; gap: .75rem;
          min-height: 280px; justify-content: center; text-align: center;
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem; padding: 2.5rem;
        }
        .picker-empty h3 { font-size: 1.05rem; font-weight: 700; color: #374151; margin: 0; }
        .picker-empty p  { font-size: .83rem; color: #9ca3af; margin: 0; max-width: 340px; line-height: 1.7; }

        /* Picker skeleton */
        .picker-skeleton { display: flex; flex-direction: column; gap: .75rem; }
        .skel-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 1.1rem 1.4rem; display: flex; flex-direction: column; gap: .4rem;
        }

        /* ── Batch view ────────────────────────────────────────────────── */
        .batch-view { display: flex; flex-direction: column; gap: 1.25rem; }
        .batch-header { display: flex; align-items: flex-start; gap: .75rem; }
        .back-btn {
          background: none; border: none; font-family: 'Cairo', sans-serif;
          font-size: .82rem; font-weight: 600; color: #1B5E8C; cursor: pointer;
          padding: 0; margin-top: .3rem; white-space: nowrap; flex-shrink: 0;
        }
        .back-btn:hover { text-decoration: underline; }
        .batch-title {
          font-size: 1.45rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .25rem;
          display: flex; align-items: center; gap: .6rem; flex-wrap: wrap;
        }
        .period-badge {
          font-size: .78rem; font-weight: 700; color: #1d4ed8;
          background: #dbeafe; border: 1px solid #bfdbfe;
          border-radius: .5rem; padding: .2rem .6rem;
        }
        .batch-sub { font-size: .82rem; color: #6b7a8d; margin: 0; }

        /* Progress */
        .progress-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 1.25rem 1.5rem;
        }
        .progress-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: .65rem;
        }
        .progress-label { font-size: .88rem; font-weight: 700; color: #374151; }
        .progress-pct   { font-size: 1.1rem; font-weight: 800; }
        .progress-bg    { height: 10px; background: #f0f4f8; border-radius: 5px; overflow: hidden; }
        .progress-fill  { height: 100%; border-radius: 5px; transition: width .4s ease; }
        .progress-done  { font-size: .82rem; color: #059669; margin: .65rem 0 0; font-weight: 600; }

        /* Items list */
        .items-list { display: flex; flex-direction: column; gap: .75rem; }
        .item-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem;
          transition: border-color .15s, background .15s;
        }
        .item-done { border-color: #a7f3d0; background: #f0fdf4; }
        .sk-card   { pointer-events: none; }

        .item-avatar {
          width: 42px; height: 42px; border-radius: 50%; background: #f0f4f8;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; flex-shrink: 0;
        }
        .item-info { flex: 1; min-width: 0; }
        .item-name   { font-size: .9rem; font-weight: 700; color: #1f2937; }
        .item-meta   {
          display: flex; gap: .5rem; font-size: .75rem; color: #6b7a8d;
          margin-top: .2rem; flex-wrap: wrap; align-items: center;
        }
        .item-amount  { font-weight: 700; color: #1B5E8C; }
        .item-sponsor { color: #6b7280; }

        /* Uploader */
        .uploader-wrap  { display: flex; flex-direction: column; align-items: flex-end; gap: .3rem; flex-shrink: 0; }
        .confirmed-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: .15rem; flex-shrink: 0; }
        .confirmed-badge {
          font-size: .8rem; font-weight: 700; color: #059669;
          background: #ecfdf5; border: 1px solid #6ee7b7;
          border-radius: .5rem; padding: .35rem .75rem; white-space: nowrap;
        }
        .confirmed-date { font-size: .68rem; color: #9ca3af; }
        .upload-btn {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .55rem 1rem; background: #1B5E8C; color: #fff;
          font-family: 'Cairo', sans-serif; font-size: .82rem; font-weight: 700;
          border: none; border-radius: .625rem; cursor: pointer; transition: background .15s;
          white-space: nowrap;
        }
        .upload-btn:hover:not(:disabled) { background: #134569; }
        .upload-btn.uploading, .upload-btn:disabled { opacity: .65; cursor: not-allowed; }
        .upload-err { font-size: .72rem; color: #dc2626; margin: 0; }

        /* Batch empty */
        .batch-empty {
          display: flex; flex-direction: column; align-items: center; gap: .5rem;
          min-height: 200px; justify-content: center; text-align: center;
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          padding: 2rem; font-size: .9rem; color: #9ca3af; font-weight: 600;
        }

        /* Skeleton */
        .skel {
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Spinner */
        .spin {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .item-card     { flex-wrap: wrap; }
          .uploader-wrap { align-items: flex-start; }
          .picker-bar-bg { width: 70px; }
        }
      `}</style>
    </AppShell>
  );
}