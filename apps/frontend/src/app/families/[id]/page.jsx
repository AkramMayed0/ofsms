'use client';

/**
 * /families/[id]/page.jsx
 * Family detail page — all roles can view, GM sees Transfer button.
 *
 * API:
 *   GET  /api/families/:id  → family + documents + sponsorship info
 *   POST /api/sponsors/transfer (via TransferSponsorModal)
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Handshake, Search, AlertTriangle, Users, CheckCircle2, Check, X, Plus, User } from 'lucide-react';
import api from '../../../lib/api';
import AppShell from '../../../components/AppShell';
import useAuthStore from '../../../store/useAuthStore';
import TransferSponsorModal from '../../../components/TransferSponsorModal';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  under_review: { label: 'قيد المراجعة', color: '#F59E0B', bg: '#FEF3C7' },
  under_marketing: { label: 'تحت التسويق', color: '#3B82F6', bg: '#EFF6FF' },
  under_sponsorship: { label: 'تحت الكفالة', color: '#10B981', bg: '#ECFDF5' },
  rejected: { label: 'مرفوض', color: '#EF4444', bg: '#FEF2F2' },
  inactive: { label: 'غير نشط', color: '#6B7280', bg: '#F3F4F6' },
};

const DOC_TYPE_CONFIG = {
  guardian_id: { label: 'بطاقة المعيل', color: '#7c3aed', bg: '#f5f3ff' },
  other: { label: 'مستند آخر', color: '#d97706', bg: '#fffbeb' },
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

const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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

// ── Assign Sponsor Modal ──────────────────────────────────────────────────────
function AssignSponsorModal({ isOpen, onClose, onSuccess, familyName, familyId, agentId }) {
  const [tab, setTab] = useState('existing');
  const [sponsors, setSponsors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [newSponsor, setNewSponsor] = useState({ fullName: '', phone: '', email: '', portalPassword: '' });
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [intermediary, setIntermediary] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setSponsorId(''); setSponsorSearch(''); setError('');
    setNewSponsor({ fullName: '', phone: '', email: '', portalPassword: '' });
    setStartDate(new Date().toISOString().split('T')[0]);
    setMonthlyAmount(''); setIntermediary(''); setTab('existing');
    setFetching(true);
    api.get('/sponsors')
      .then(({ data }) => { setSponsors(data.sponsors || []); setFiltered(data.sponsors || []); })
      .catch(() => setError('تعذّر تحميل قائمة الكفلاء'))
      .finally(() => setFetching(false));
  }, [isOpen]);

  useEffect(() => {
    if (!sponsorSearch.trim()) { setFiltered(sponsors); return; }
    const q = sponsorSearch.toLowerCase();
    setFiltered(sponsors.filter(s =>
      s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q)
    ));
  }, [sponsorSearch, sponsors]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleSubmit = async () => {
    setError('');
    if (tab === 'existing' && !sponsorId) { setError('يرجى اختيار كافل'); return; }
    if (tab === 'new') {
      if (!newSponsor.fullName.trim()) { setError('اسم الكافل مطلوب'); return; }
      if (!newSponsor.portalPassword || newSponsor.portalPassword.length < 8) {
        setError('كلمة مرور البوابة يجب أن تكون 8 أحرف على الأقل'); return;
      }
    }
    if (!startDate) { setError('تاريخ البداية مطلوب'); return; }
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) { setError('المبلغ الشهري مطلوب'); return; }

    setLoading(true);
    try {
      let finalSponsorId = sponsorId;
      if (tab === 'new') {
        const { data } = await api.post('/sponsors', {
          fullName: newSponsor.fullName.trim(),
          phone: newSponsor.phone.trim() || undefined,
          email: newSponsor.email.trim() || undefined,
          portalPassword: newSponsor.portalPassword,
        });
        finalSponsorId = data.sponsor.id;
      }
      await api.post(`/sponsors/${finalSponsorId}/sponsorships`, {
        beneficiaryType: 'family',
        beneficiaryId: familyId,
        agentId,
        intermediary: intermediary.trim() || undefined,
        startDate,
        monthlyAmount: parseFloat(monthlyAmount),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'حدث خطأ أثناء التعيين');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(13,61,92,0.55)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn .18s ease' },
    box: { background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(13,61,92,.25)', overflow: 'hidden', animation: 'slideUp .22s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Cairo','Tajawal',sans-serif" },
    head: { display: 'flex', alignItems: 'center', gap: '.875rem', padding: '1.25rem 1.5rem', borderBottom: '1.5px solid #f0f4f8', flexShrink: 0 },
    headerIcon: { width: '2.5rem', height: '2.5rem', borderRadius: '.75rem', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    title: { fontSize: '1rem', fontWeight: 700, color: '#0d3d5c', margin: 0 },
    sub: { fontSize: '.78rem', color: '#6b7280', margin: '.1rem 0 0' },
    closeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '.5rem', border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', flexShrink: 0, transition: 'background .12s' },
    tabs: { display: 'flex', gap: '.5rem', padding: '.9rem 1.5rem 0' },
    tab: (active) => ({ flex: 1, padding: '.55rem 1rem', border: `1.5px solid ${active ? '#059669' : '#e5eaf0'}`, borderRadius: '.625rem', fontFamily: "Cairo,sans-serif", fontSize: '.83rem', fontWeight: 600, color: active ? '#fff' : '#6b7280', background: active ? '#059669' : '#fafafa', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }),
    body: { flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' },
    label: { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' },
    input: { width: '100%', border: '1.5px solid #d1d5db', borderRadius: '.625rem', padding: '.65rem .9rem', fontSize: '.88rem', fontFamily: "Cairo,sans-serif", color: '#1f2937', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' },
    sponsorBox: { border: '1.5px solid #e5eaf0', borderRadius: '.625rem', maxHeight: '170px', overflowY: 'auto', background: '#fafafa', marginTop: '.35rem' },
    sponsorRow: (active) => ({ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.6rem .85rem', cursor: 'pointer', background: active ? '#ecfdf5' : 'transparent', borderBottom: '1px solid #f0f4f8', transition: 'background .1s', border: 'none', width: '100%', fontFamily: "Cairo,sans-serif", textAlign: 'right' }),
    sponsorAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 700, flexShrink: 0 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' },
    divider: { fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', padding: '.25rem 0', borderTop: '1px solid #f0f4f8', borderBottom: '1px solid #f0f4f8' },
    errBox: { display: 'flex', alignItems: 'center', gap: '.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '.5rem', padding: '.65rem .9rem', fontSize: '.82rem', color: '#b91c1c', fontWeight: 500 },
    foot: { display: 'flex', justifyContent: 'flex-end', gap: '.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8' },
    btnPrimary: (disabled) => ({ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.7rem 1.5rem', background: disabled ? '#94a3b8' : 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontFamily: "Cairo,sans-serif", fontSize: '.9rem', fontWeight: 700, border: 'none', borderRadius: '.75rem', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 2px 8px rgba(5,150,105,.3)' }),
    btnGhost: { display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.65rem 1.25rem', background: 'none', color: '#6b7280', fontFamily: "Cairo,sans-serif", fontSize: '.88rem', fontWeight: 600, border: '1.5px solid #e5eaf0', borderRadius: '.75rem', cursor: 'pointer' },
  };

  return (
    <div style={s.overlay} ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }} role="dialog" aria-modal="true">
      <div style={s.box} dir="rtl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={s.head}>
          <div style={s.headerIcon}><Handshake size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>تعيين كافل</h2>
            <p style={s.sub}>الأسرة: <strong style={{ color: '#059669' }}>{familyName}</strong></p>
          </div>
          <button style={s.closeBtn} onClick={onClose} disabled={loading}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'existing')} onClick={() => setTab('existing')}><Handshake size={16} /> كافل موجود</button>
          <button style={s.tab(tab === 'new')} onClick={() => setTab('new')}><Plus size={16} /> كافل جديد</button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {tab === 'existing' && (
            <div>
              <label style={s.label}>اختر الكافل <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={s.input} placeholder="ابحث بالاسم أو البريد أو الهاتف…" value={sponsorSearch} onChange={e => setSponsorSearch(e.target.value)} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              <div style={s.sponsorBox}>
                {fetching ? (
                  [1,2,3].map(i => <div key={i} style={{ height: 52, margin: '0.4rem', borderRadius: '.5rem', background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)
                ) : filtered.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '.82rem', padding: '1rem', margin: 0 }}>لا يوجد كفلاء مطابقون</p>
                ) : filtered.map(sp => (
                  <button key={sp.id} style={s.sponsorRow(sponsorId === sp.id)} onClick={() => setSponsorId(sp.id)}>
                    <div style={s.sponsorAvatar}>{sp.full_name?.charAt(0) || '؟'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1f2937' }}>{sp.full_name}</div>
                      {sp.email && <div style={{ fontSize: '.72rem', color: '#9ca3af', direction: 'ltr', textAlign: 'left' }}>{sp.email}</div>}
                    </div>
                    {sponsorId === sp.id && <span style={{ color: '#059669', fontWeight: 800 }}><Check size={16} /></span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'new' && (
            <div style={s.grid2}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.label}>اسم الكافل <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={s.input} placeholder="الاسم الكامل" value={newSponsor.fullName} onChange={e => setNewSponsor(p => ({ ...p, fullName: e.target.value }))} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div>
                <label style={s.label}>رقم الهاتف</label>
                <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} placeholder="+967700000000" value={newSponsor.phone} onChange={e => setNewSponsor(p => ({ ...p, phone: e.target.value }))} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div>
                <label style={s.label}>البريد الإلكتروني</label>
                <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} placeholder="email@example.com" value={newSponsor.email} onChange={e => setNewSponsor(p => ({ ...p, email: e.target.value }))} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.label}>كلمة مرور البوابة <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="password" placeholder="8 أحرف على الأقل" value={newSponsor.portalPassword} onChange={e => setNewSponsor(p => ({ ...p, portalPassword: e.target.value }))} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                <p style={{ fontSize: '.72rem', color: '#94a3b8', margin: '.25rem 0 0' }}>ستُرسَل للكافل للدخول عبر البوابة</p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={s.divider}>تفاصيل الكفالة</div>

          {/* Shared fields */}
          <div style={s.grid2}>
            <div>
              <label style={s.label}>تاريخ البداية <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div>
              <label style={s.label}>المبلغ الشهري (ر.ي) <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="number" min="1" placeholder="30000" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.label}>الوسيط <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 400 }}>(اختياري)</span></label>
              <input style={s.input} placeholder="اسم الوسيط أو الجهة المسهِّلة" value={intermediary} onChange={e => setIntermediary(e.target.value)} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
          </div>

          {error && <div style={s.errBox}><AlertTriangle size={18} /> {error}</div>}
        </div>

        {/* Footer */}
        <div style={s.foot}>
          <button style={s.btnGhost} onClick={onClose} disabled={loading}>إلغاء</button>
          <button style={s.btnPrimary(loading)} onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />جارٍ التعيين…</>
            ) : (
              <>تعيين الكافل <Check size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FamilyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const id = params?.id;

  const [family, setFamily] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transferOpen, setTransfer] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isGM = user?.role === 'gm';

  const fetchFamily = () => {
    setLoading(true);
    api.get(`/families/${id}`)
      .then(({ data }) => {
        setFamily(data.family);
        setDocuments(data.documents || []);
      })
      .catch(() => setError('تعذّر تحميل بيانات الأسرة'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchFamily();
  }, [id]);

  const handleTransferSuccess = () => {
    setSuccessMsg('تم نقل الكفالة بنجاح');
    fetchFamily();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAssignSuccess = () => {
    setSuccessMsg('تم تعيين الكافل بنجاح ✓');
    fetchFamily();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/families/${id}`);
      router.push('/families');
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر حذف الأسرة');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const statusInfo = STATUS_CONFIG[family?.status] || STATUS_CONFIG.inactive;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

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
            <Link href="/families" className="crumb-link">الأسر</Link>
            <span className="sep">/</span>
            <span className="crumb-current">تفاصيل الأسرة</span>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Transfer button — rightmost (GM only, under sponsorship) */}
            {isGM && family?.status === 'under_sponsorship' && (
              <button className="btn-transfer" onClick={() => setTransfer(true)}>
                <IconTransfer /> نقل الكفالة
              </button>
            )}

            {/* Edit + Delete grouped on the left */}
            <div style={{ marginRight: 'auto', display: 'flex', gap: '.5rem' }}>
              {family && (isGM || (user?.role === 'agent' && (family.status === 'under_review' || family.status === 'rejected'))) && (
                <button className="btn-edit" onClick={() => router.push(`/families/${id}/edit`)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  تعديل
                </button>
              )}

              {isGM && family && (
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
        ) : family ? (
          <>
            {/* ── Hero banner ─────────────────────────────────────── */}
            <div className="hero-card">
              <div className="hero-left">
                <div className="hero-avatar">
                  {family.family_name?.[0] || '؟'}
                </div>
                <div className="hero-identity">
                  <h2 className="hero-name">{family.family_name}</h2>
                  <div className="hero-badges">
                    <span
                      className="hero-status-badge"
                      style={{ color: statusInfo.color, background: statusInfo.bg, border: `1px solid ${statusInfo.color}30` }}
                    >
                      <span className="hero-status-dot" style={{ background: statusInfo.color }} />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hero-stats">
                {[
                  { icon: <IconUsers />, label: 'عدد الأفراد', value: family.member_count ? `${family.member_count} أفراد` : '—' },
                  { icon: <IconUser />, label: 'المعيل', value: family.head_of_family || '—' },
                  { icon: <IconMapPin />, label: 'المحافظة', value: family.governorate_ar || '—' },
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
                    <InfoRow label="رب الأسرة / المعيل" value={family.head_of_family} />
                    <InfoRow label="المندوب" value={family.agent_name} />
                    <InfoRow label="عدد الأفراد" value={family.member_count ? `${family.member_count} أفراد` : '—'} />
                    <InfoRow label="تاريخ التسجيل" value={formatDate(family.created_at)} />
                    <InfoRow label="المحافظة" value={family.governorate_ar} />
                  </div>

                  {family.notes && (
                    <div className="notes-box">
                      <span className="notes-label">ملاحظات</span>
                      <p className="notes-text">{family.notes}</p>
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
                  <div
                    className="status-card-inner"
                    style={{ borderColor: statusInfo.color, background: statusInfo.bg }}
                  >
                    <span className="status-dot" style={{ background: statusInfo.color }} />
                    <span style={{ color: statusInfo.color, fontWeight: 700 }}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {family.sponsor_name ? (
                    <>
                      <div className="sponsor-highlight">
                        <div className="sponsor-hl-avatar">
                          {family.sponsor_name[0]}
                        </div>
                        <div>
                          <p className="sponsor-hl-name">{family.sponsor_name}</p>
                          <p className="sponsor-hl-label">الكافل الحالي</p>
                        </div>
                      </div>
                      <div className="info-grid single-col">
                        <InfoRow label="تاريخ بداية الكفالة" value={formatDate(family.sponsorship_start)} />
                        <InfoRow
                          label="المبلغ الشهري"
                          value={
                            family.monthly_amount
                              ? `${parseFloat(family.monthly_amount).toLocaleString('ar-YE')} ريال`
                              : '—'
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="no-sponsor">
                      <Handshake size={40} strokeWidth={1.5} />
                      <p>لا يوجد كافل مُعيَّن بعد</p>
                      {family.status === 'under_marketing' && isGM && (
                        <button className="btn-primary" onClick={() => setAssignOpen(true)}>
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
            <p>لم يُعثر على الأسرة</p>
            <button onClick={() => router.back()} className="btn-back-ghost">
              رجوع
            </button>
          </div>
        )}
      </div>

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
              هل أنت متأكد من حذف أسرة <strong>{family?.family_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
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
      {family && (
        <TransferSponsorModal
          isOpen={transferOpen}
          onClose={() => setTransfer(false)}
          onSuccess={handleTransferSuccess}
          beneficiaryType="family"
          beneficiaryId={family.id}
          beneficiaryName={family.family_name}
          currentSponsor={family.sponsor_name}
          agentId={family.agent_id}
        />
      )}

      {/* ── Assign Sponsor Modal ─────────────────────────────────────── */}
      {family && (
        <AssignSponsorModal
          isOpen={assignOpen}
          onClose={() => setAssignOpen(false)}
          onSuccess={handleAssignSuccess}
          familyName={family.family_name}
          familyId={family.id}
          agentId={family.agent_id}
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

        .btn-primary {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .65rem 1.25rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; border: none; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 700;
          cursor: pointer; box-shadow: 0 2px 8px rgba(27,94,140,.25);
          transition: all .15s;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(27,94,140,.35); }

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
        .status-badge {
          display: inline-block; padding: .2rem .6rem; border-radius: 999px;
          font-size: .72rem; font-weight: 700;
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

        /* ── Status card ────────────────────────────────────────────── */
        .status-card-inner {
          display: flex; align-items: center; justify-content: center; gap: .65rem;
          padding: 1rem; border-radius: .75rem; border: 2px solid;
          font-size: .95rem; font-weight: 800; margin-bottom: .875rem;
          letter-spacing: .01em;
        }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .btn-change-status {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: .65rem 1rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-family: 'Cairo', sans-serif; font-size: .82rem; font-weight: 700;
          text-decoration: none; border-radius: .75rem;
          box-shadow: 0 2px 8px rgba(27,94,140,.25); transition: all .15s;
        }
        .btn-change-status:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(27,94,140,.35); }

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
