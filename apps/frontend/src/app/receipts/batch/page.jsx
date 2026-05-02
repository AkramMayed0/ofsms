'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ── Components ────────────────────────────────────────────────────────────────

export default function AgentReceiptsBatchPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchBatch = () => {
    setLoading(true);
    api.get('/receipts/my-batch')
      .then(({ data: res }) => setData(res))
      .catch((err) => setError(err.response?.data?.error || 'تعذّر تحميل بيانات الكشف.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBatch();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFileUpload = async (itemId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result.split(',')[1];
      const mimeType = file.type;

      try {
        setUploading(prev => ({ ...prev, [itemId]: true }));
        await api.post('/receipts/biometric', {
          itemId,
          fingerprintBase64: base64String,
          mimeType,
        });
        // Refresh batch to get the new receipt_id
        fetchBatch();
      } catch (err) {
        alert(err.response?.data?.error || 'فشل رفع البصمة');
      } finally {
        setUploading(prev => ({ ...prev, [itemId]: false }));
      }
    };
  };

  const handleConfirmBatch = async () => {
    if (!data?.list_id) return;
    if (!confirm('هل أنت متأكد من تأكيد الكشف؟ لا يمكن التراجع عن هذه الخطوة.')) return;

    setConfirming(true);
    try {
      await api.post('/receipts/batch-confirm', {
        listId: data.list_id,
        notes: notes.trim() || undefined,
      });
      alert('تم تأكيد الكشف بنجاح!');
      router.push('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'فشل تأكيد الكشف');
    } finally {
      setConfirming(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="receipts-page" dir="rtl">
        <h1 className="page-title">رفع بصمات المستفيدين</h1>
        <div className="skeleton-box" style={{ height: 200, marginTop: '2rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="receipts-page" dir="rtl">
        <h1 className="page-title">رفع بصمات المستفيدين</h1>
        <div className="err-banner">⚠ {error}</div>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="receipts-page" dir="rtl">
        <h1 className="page-title">رفع بصمات المستفيدين</h1>
        <div className="empty-state">
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h2>لا يوجد مستفيدين حالياً</h2>
          <p>ليس لديك أي مستفيدين في كشف الصرف الفعّال حالياً، أو لم يتم إصدار الكشف بعد.</p>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const { items, month, year, batch_confirmed_at } = data;
  const totalItems = items.length;
  const confirmedItems = items.filter(i => i.receipt_id).length;
  const isAllConfirmed = confirmedItems === totalItems;
  const progressPct = Math.round((confirmedItems / totalItems) * 100);

  return (
    <div className="receipts-page" dir="rtl">
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          alignSelf: 'flex-start',
          marginBottom: '1rem',
          background: '#f1f5f9',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.5rem 1.2rem',
          fontWeight: 700,
          color: '#0d3d5c',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
        }}
        aria-label="عودة"
      >
        <span aria-hidden="true">←</span> عودة
      </button>
      <div className="header-row">
        <h1 className="page-title">رفع بصمات المستفيدين</h1>
        <div className="batch-badge">
          كشف شهر {month} لعام {year}
        </div>
      </div>

      {batch_confirmed_at && (
        <div className="success-banner">
          ✅ تم تأكيد استلام هذا الكشف في {new Date(batch_confirmed_at).toLocaleDateString('ar-YE')}
        </div>
      )}

      {/* Progress Card */}
      <div className="progress-card">
        <div className="progress-top">
          <span className="progress-lbl">الإنجاز ({confirmedItems} من {totalItems})</span>
          <span className="progress-val">{progressPct}%</span>
        </div>
        <div className="bar-bg">
          <div className="bar-fill" style={{ width: `${progressPct}%`, background: isAllConfirmed ? '#10b981' : '#1B5E8C' }} />
        </div>
      </div>

      {/* List of Beneficiaries */}
      <div className="items-list">
        {items.map((item) => (
          <div key={item.item_id} className={`item-card ${item.receipt_id ? 'confirmed' : ''}`}>
            <div className="item-info">
              <div className="item-name">{item.beneficiary_name}</div>
              <div className="item-sub">
                <span className="item-type">{item.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                <span className="item-amount">المبلغ: <strong>{item.amount}</strong> د.ي</span>
              </div>
            </div>

            <div className="item-action">
              {item.receipt_id ? (
                <div className="status-ok">
                  <span>✅</span> تم رفع البصمة
                </div>
              ) : uploading[item.item_id] ? (
                <div className="status-loading">جاري الرفع...</div>
              ) : (
                <label className="btn-upload">
                  رفع البصمة
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={(e) => handleFileUpload(item.item_id, e)} 
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Section */}
      {!batch_confirmed_at && (
        <div className="confirm-section">
          <h3 className="confirm-title">تأكيد الكشف</h3>
          <p className="confirm-desc">
            بعد رفع بصمات جميع المستفيدين بنجاح، يجب تأكيد الكشف لإرساله للمشرف.
          </p>
          <textarea
            className="notes-input"
            placeholder="أضف ملاحظات (اختياري)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button 
            className="btn-confirm" 
            disabled={!isAllConfirmed || confirming}
            onClick={handleConfirmBatch}
          >
            {confirming ? 'جاري التأكيد...' : 'تأكيد إرسال الكشف'}
          </button>
        </div>
      )}

      <style jsx>{`
        .receipts-page { display:flex; flex-direction:column; gap:1.75rem; font-family:'Cairo','Tajawal',sans-serif; max-width:800px; margin:0 auto; padding-bottom: 3rem; }
        .header-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0; }
        .batch-badge { background:#e0e7ff; color:#3730a3; padding:.4rem 1rem; border-radius:2rem; font-weight:700; font-size:.85rem; }
        
        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; font-weight:700; }
        .success-banner { background:#ecfdf5; border:1px solid #a7f3d0; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#065f46; font-weight:700; }
        
        .skeleton-box { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:1rem; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .empty-state { text-align:center; padding:4rem 2rem; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .empty-state h2 { margin:0; color:#1f2937; }
        .empty-state p { color:#6b7a8d; margin:0; max-width:400px; line-height:1.6; }

        .progress-card { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.75rem; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .progress-top { display:flex; justify-content:space-between; align-items:flex-end; }
        .progress-lbl { font-size:.9rem; font-weight:700; color:#374151; }
        .progress-val { font-size:1.1rem; font-weight:800; color:#1B5E8C; }
        .bar-bg { height:8px; background:#f0f4f8; border-radius:4px; overflow:hidden; }
        .bar-fill { height:100%; border-radius:4px; transition:width .4s ease, background-color .4s ease; }

        .items-list { display:flex; flex-direction:column; gap:.85rem; }
        .item-card { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; transition:border-color .2s; }
        .item-card.confirmed { border-color:#a7f3d0; background:#f0fdf4; }
        .item-info { display:flex; flex-direction:column; gap:.25rem; }
        .item-name { font-size:1rem; font-weight:700; color:#1f2937; }
        .item-sub { display:flex; align-items:center; gap:.75rem; font-size:.8rem; color:#6b7a8d; }
        .item-type { background:#f3f4f6; padding:.15rem .5rem; border-radius:1rem; font-weight:700; color:#4b5563; }
        
        .item-action { flex-shrink:0; }
        .btn-upload { display:inline-block; background:#1B5E8C; color:#fff; padding:.5rem 1rem; border-radius:.5rem; font-size:.85rem; font-weight:700; cursor:pointer; transition:background .15s; text-align:center; }
        .btn-upload:hover { background:#134569; }
        .status-ok { color:#059669; font-weight:700; font-size:.85rem; display:flex; align-items:center; gap:.35rem; }
        .status-loading { color:#f59e0b; font-weight:700; font-size:.85rem; }

        .confirm-section { margin-top:2rem; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
        .confirm-title { margin:0; color:#1f2937; font-size:1.1rem; }
        .confirm-desc { margin:0; color:#6b7a8d; font-size:.85rem; }
        .notes-input { width:100%; padding:.75rem; border:1px solid #d1d5db; border-radius:.5rem; font-family:inherit; min-height:80px; resize:vertical; outline:none; }
        .notes-input:focus { border-color:#1B5E8C; box-shadow:0 0 0 3px rgba(27,94,140,0.1); }
        .btn-confirm { padding:.8rem; background:#10b981; color:#fff; border:none; border-radius:.5rem; font-family:inherit; font-weight:700; font-size:1rem; cursor:pointer; transition:opacity .2s; }
        .btn-confirm:hover:not(:disabled) { background:#059669; }
        .btn-confirm:disabled { background:#9ca3af; cursor:not-allowed; opacity:0.7; }
        .btn-secondary { padding:.6rem 1.2rem; background:#f3f4f6; color:#374151; border:none; border-radius:.5rem; font-weight:700; cursor:pointer; transition:background .2s; }
        .btn-secondary:hover { background:#e5e7eb; }

        @media (max-width: 600px) {
          .item-card { flex-direction:column; align-items:flex-start; }
          .item-action { width:100%; }
          .btn-upload { width:100%; }
        }
      `}</style>
    </div>
  );
}
