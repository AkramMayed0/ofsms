'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

const formatAmount = (n) =>
  n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function FingerprintUploader({ item, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('يُقبل فقط PNG أو JPEG');
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

  if (item.biometric_confirmed_at) {
    return (
      <span style={{ color: '#059669', fontWeight: 700, fontSize: '.82rem' }}>
        ✅ تم التأكيد
      </span>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: '.5rem 1rem', background: '#1B5E8C', color: '#fff',
          border: 'none', borderRadius: '.5rem', cursor: 'pointer',
          fontFamily: 'Cairo', fontSize: '.82rem', fontWeight: 700,
          opacity: uploading ? .6 : 1,
        }}
      >
        {uploading ? 'جارٍ الرفع…' : '📷 رفع البصمة'}
      </button>
      {error && <p style={{ color: '#dc2626', fontSize: '.75rem', margin: '.25rem 0 0' }}>{error}</p>}
    </div>
  );
}

export default function AgentReceiptsBatchPage() {
  const router = useRouter();
  // ✅ THE FIX: read listId from the URL query string, not a route param
  const searchParams = useSearchParams();
  const listId = searchParams.get('listId');

  const [listDetail, setListDetail] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!listId) return;
    setLoading(true);
    try {
      const [detailRes, summaryRes] = await Promise.all([
        api.get(`/disbursements/${listId}`),
        api.get(`/receipts/summary/${listId}`),
      ]);
      setListDetail(detailRes.data);
      setSummary(summaryRes.data.summary);
    } catch {
      setError('تعذّر تحميل بيانات الكشف');
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!listId) {
    return (
      <AppShell>
        <div dir="rtl" style={{ textAlign: 'center', padding: '4rem', fontFamily: 'Cairo' }}>
          <p style={{ fontSize: '1.1rem', color: '#374151', fontWeight: 700 }}>
            لم يتم تحديد كشف الصرف
          </p>
          <button onClick={() => router.push('/disbursements')}
            style={{ marginTop: '1rem', padding: '.7rem 1.5rem', background: '#1B5E8C', color: '#fff', border: 'none', borderRadius: '.75rem', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700 }}>
            ← العودة لكشوف الصرف
          </button>
        </div>
      </AppShell>
    );
  }

  const items = (listDetail?.items || []).filter((i) => i.included);
  const confirmed = Number(summary?.confirmed_items ?? 0);
  const total = Number(summary?.total_items ?? items.length);
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  const handleUploaded = (itemId) => {
    setListDetail((prev) => prev ? {
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, biometric_confirmed_at: new Date().toISOString() } : i
      ),
    } : prev);
    setSummary((prev) => prev ? {
      ...prev,
      confirmed_items: Number(prev.confirmed_items) + 1,
      pending_items: Number(prev.pending_items) - 1,
    } : prev);
  };

  return (
    <AppShell>
      <div dir="rtl" style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'Cairo, Tajawal, sans-serif', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
        
        <div>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#1B5E8C', fontFamily: 'Cairo', fontWeight: 600, cursor: 'pointer', marginBottom: '.5rem' }}>
            ← رجوع
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d3d5c', margin: 0 }}>
            رفع بصمات الاستلام — {listDetail?.month}/{listDetail?.year}
          </h1>
          <p style={{ color: '#6b7a8d', fontSize: '.83rem', margin: '.25rem 0 0' }}>
            التقط بصمة كل مستفيد بعد تسليم المبلغ يدوياً
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '.75rem', padding: '.85rem 1rem', color: '#b91c1c', fontSize: '.85rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* Progress */}
        {!loading && total > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5eaf0', borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#374151' }}>
                {pct === 100 ? '🎉 اكتملت جميع البصمات!' : `${confirmed} من ${total} مستفيد`}
              </span>
              <span style={{ fontWeight: 800, color: pct === 100 ? '#10b981' : '#1B5E8C' }}>{pct}%</span>
            </div>
            <div style={{ height: 10, background: '#f0f4f8', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : '#1B5E8C', borderRadius: 5, transition: 'width .4s' }} />
            </div>
          </div>
        )}

        {/* Items */}
        {loading ? (
          <p style={{ color: '#9ca3af', textAlign: 'center' }}>جارٍ التحميل…</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontWeight: 600 }}>
            لا توجد بنود مشمولة في هذا الكشف
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {items.map((item) => (
              <div key={item.id} style={{
                background: item.biometric_confirmed_at ? '#f0fdf4' : '#fff',
                border: `1px solid ${item.biometric_confirmed_at ? '#a7f3d0' : '#e5eaf0'}`,
                borderRadius: '1rem', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {item.beneficiary_type === 'orphan' ? '👦' : '👨‍👩‍👧'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '.9rem' }}>
                    {item.beneficiary_name}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#6b7a8d', marginTop: '.2rem' }}>
                    {item.governorate_ar} · <span style={{ fontWeight: 700, color: '#1B5E8C' }}>{formatAmount(item.amount)}</span>
                  </div>
                </div>
                <FingerprintUploader item={item} onUploaded={handleUploaded} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}