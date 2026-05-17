'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import { 
  ArrowRight, 
  Phone, 
  Mail, 
  Calendar, 
  Copy, 
  Link as LinkIcon,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Briefcase,
  Handshake,
  Check,
  X,
  AlertTriangle,
  Pencil,
  Trash2
} from 'lucide-react';

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';
const formatAmount = (n) => n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};

// ── AssignBeneficiaryModal ─────────────────────────────────────────────────────

function AssignBeneficiaryModal({ sponsor, onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [intermediary, setIntermediary] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  useEffect(() => {
    setFetching(true);
    Promise.all([
      api.get('/orphans/marketing'),
      api.get('/families/marketing'),
    ]).then(([oRes, fRes]) => {
      const orphans = (oRes.data.orphans || []).map(o => ({
        id: o.id, type: 'orphan', name: o.full_name,
        age: calcAge(o.date_of_birth), governorate: o.governorate_ar || '—',
        agent_id: o.agent_id,
      }));
      const families = (fRes.data.families || []).map(f => ({
        id: f.id, type: 'family', name: f.family_name,
        age: `${f.member_count || '—'} فرد`, governorate: f.governorate_ar || '—',
        agent_id: f.agent_id,
      }));
      const all = [...orphans, ...families];
      setItems(all);
      setFiltered(all);
    }).catch(() => setError('تعذّر تحميل قائمة المستفيدين'))
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(items); return; }
    const q = search.toLowerCase();
    setFiltered(items.filter(i => i.name?.toLowerCase().includes(q) || i.governorate?.includes(q)));
  }, [search, items]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (item) => {
    setSelectedId(item.id);
    setSelectedItem(item);
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedId) { setError('يرجى اختيار مستفيد'); return; }
    if (!startDate) { setError('تاريخ البداية مطلوب'); return; }
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) { setError('المبلغ الشهري مطلوب'); return; }

    setLoading(true);
    try {
      await api.post(`/sponsors/${sponsor.id}/sponsorships`, {
        beneficiaryType: selectedItem.type,
        beneficiaryId: selectedId,
        agentId: selectedItem.agent_id,
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

  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(13,61,92,0.55)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn .18s ease' },
    box: { background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(13,61,92,.25)', overflow: 'hidden', animation: 'slideUp .22s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Cairo','Tajawal',sans-serif" },
    head: { display: 'flex', alignItems: 'center', gap: '.875rem', padding: '1.25rem 1.5rem', borderBottom: '1.5px solid #f0f4f8', flexShrink: 0 },
    headerIcon: { width: '2.5rem', height: '2.5rem', borderRadius: '.75rem', background: 'linear-gradient(135deg,#1B5E8C,#134569)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    title: { fontSize: '1rem', fontWeight: 700, color: '#0d3d5c', margin: 0 },
    sub: { fontSize: '.78rem', color: '#6b7280', margin: '.1rem 0 0' },
    closeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '.5rem', border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', flexShrink: 0 },
    body: { flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' },
    label: { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' },
    input: { width: '100%', border: '1.5px solid #d1d5db', borderRadius: '.625rem', padding: '.65rem .9rem', fontSize: '.88rem', fontFamily: "Cairo,sans-serif", color: '#1f2937', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' },
    listBox: { border: '1.5px solid #e5eaf0', borderRadius: '.625rem', maxHeight: '200px', overflowY: 'auto', background: '#fafafa', marginTop: '.35rem' },
    row: (active) => ({ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.6rem .85rem', cursor: 'pointer', background: active ? '#f0f7ff' : 'transparent', borderBottom: '1px solid #f0f4f8', transition: 'background .1s', border: 'none', width: '100%', fontFamily: "Cairo,sans-serif", textAlign: 'right' }),
    avatar: (type) => ({ width: 32, height: 32, borderRadius: '50%', background: type === 'orphan' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }),
    badge: (type) => ({ display: 'inline-flex', padding: '.15rem .5rem', borderRadius: '2rem', fontSize: '.65rem', fontWeight: 700, background: type === 'orphan' ? '#dbeafe' : '#dcfce7', color: type === 'orphan' ? '#1d4ed8' : '#15803d', marginRight: '.4rem' }),
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' },
    divider: { fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', padding: '.25rem 0', borderTop: '1px solid #f0f4f8', borderBottom: '1px solid #f0f4f8' },
    errBox: { display: 'flex', alignItems: 'center', gap: '.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '.5rem', padding: '.65rem .9rem', fontSize: '.82rem', color: '#b91c1c', fontWeight: 500 },
    foot: { display: 'flex', justifyContent: 'flex-end', gap: '.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8' },
    btnPrimary: (disabled) => ({ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.7rem 1.5rem', background: disabled ? '#94a3b8' : 'linear-gradient(135deg,#1B5E8C,#134569)', color: '#fff', fontFamily: "Cairo,sans-serif", fontSize: '.9rem', fontWeight: 700, border: 'none', borderRadius: '.75rem', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 2px 8px rgba(27,94,140,.3)' }),
    btnGhost: { display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.65rem 1.25rem', background: 'none', color: '#6b7280', fontFamily: "Cairo,sans-serif", fontSize: '.88rem', fontWeight: 600, border: '1.5px solid #e5eaf0', borderRadius: '.75rem', cursor: 'pointer' },
  };

  return (
    <div style={s.overlay} ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }} role="dialog" aria-modal="true">
      <div style={s.box} dir="rtl" onClick={e => e.stopPropagation()}>
        <div style={s.head}>
          <div style={s.headerIcon}><Handshake size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>تعيين مستفيد</h2>
            <p style={s.sub}>الكافل: <strong style={{ color: '#1B5E8C' }}>{sponsor.full_name}</strong></p>
          </div>
          <button style={s.closeBtn} onClick={onClose} disabled={loading}><X size={18} /></button>
        </div>

        <div style={s.body}>
          <div>
            <label style={s.label}>اختر المستفيد <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={s.input} placeholder="ابحث بالاسم أو المحافظة…" value={search} onChange={e => setSearch(e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            <div style={s.listBox}>
              {fetching ? (
                [1,2,3].map(i => <div key={i} style={{ height: 52, margin: '0.4rem', borderRadius: '.5rem', background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)
              ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '.82rem', padding: '1rem', margin: 0 }}>لا يوجد مستفيدون بانتظار كافل</p>
              ) : filtered.map(item => (
                <button key={item.id} style={s.row(selectedId === item.id)} onClick={() => handleSelect(item)}>
                  <div style={s.avatar(item.type)}>
                    {item.type === 'orphan' ? <User size={14} /> : <Users size={14} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                      {item.name}
                      <span style={s.badge(item.type)}>{item.type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                    </div>
                    <div style={{ fontSize: '.72rem', color: '#9ca3af' }}>{item.governorate} · {item.age}</div>
                  </div>
                  {selectedId === item.id && <span style={{ color: '#1B5E8C', fontWeight: 800 }}><Check size={16} /></span>}
                </button>
              ))}
            </div>
          </div>

          <div style={s.divider}>تفاصيل الكفالة</div>

          <div style={s.grid2}>
            <div>
              <label style={s.label}>تاريخ البداية <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div>
              <label style={s.label}>المبلغ الشهري (ر.ي) <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={{ ...s.input, direction: 'ltr', textAlign: 'left' }} type="number" min="1" placeholder="30000" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.label}>الوسيط <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 400 }}>(اختياري)</span></label>
              <input style={s.input} placeholder="اسم الوسيط أو الجهة المسهِّلة" value={intermediary} onChange={e => setIntermediary(e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
          </div>

          {error && <div style={s.errBox}><AlertTriangle size={18} /> {error}</div>}
        </div>

        <div style={s.foot}>
          <button style={s.btnGhost} onClick={onClose} disabled={loading}>إلغاء</button>
          <button style={s.btnPrimary(loading)} onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />جارٍ التعيين…</>
            ) : (
              <>تعيين المستفيد <Check size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditSponsorModal ──────────────────────────────────────────────────────────

function EditSponsorModal({ sponsor, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fullName: sponsor.full_name || '',
    phone: sponsor.phone || '',
    email: sponsor.email || '',
    portalPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      setError('الاسم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    if (form.portalPassword && form.portalPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/sponsors/${sponsor.id}`, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        portalPassword: form.portalPassword || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ أثناء التحديث'
      );
    } finally {
      setSaving(false);
    }
  };

  const ms = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(13,61,92,0.55)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn .18s ease' },
    box: { background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(13,61,92,.25)', overflow: 'hidden', animation: 'slideUp .22s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Cairo','Tajawal',sans-serif" },
    head: { display: 'flex', alignItems: 'center', gap: '.875rem', padding: '1.25rem 1.5rem', borderBottom: '1.5px solid #f0f4f8' },
    headerIcon: { width: '2.5rem', height: '2.5rem', borderRadius: '.75rem', background: 'linear-gradient(135deg,#1B5E8C,#134569)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    title: { fontSize: '1rem', fontWeight: 700, color: '#0d3d5c', margin: 0 },
    closeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '.5rem', border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', marginRight: 'auto' },
    body: { padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
    label: { display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#374151', marginBottom: '.3rem' },
    input: { width: '100%', border: '1.5px solid #d1d5db', borderRadius: '.625rem', padding: '.65rem .9rem', fontSize: '.88rem', fontFamily: "Cairo,sans-serif", color: '#1f2937', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' },
    hint: { fontSize: '.72rem', color: '#94a3b8', margin: '.2rem 0 0' },
    errBox: { display: 'flex', alignItems: 'center', gap: '.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '.5rem', padding: '.65rem .9rem', fontSize: '.82rem', color: '#b91c1c', fontWeight: 500 },
    foot: { display: 'flex', justifyContent: 'flex-end', gap: '.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8' },
    btnPrimary: (disabled) => ({ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.7rem 1.5rem', background: disabled ? '#94a3b8' : 'linear-gradient(135deg,#1B5E8C,#134569)', color: '#fff', fontFamily: "Cairo,sans-serif", fontSize: '.9rem', fontWeight: 700, border: 'none', borderRadius: '.75rem', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 2px 8px rgba(27,94,140,.3)' }),
    btnGhost: { display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.65rem 1.25rem', background: 'none', color: '#6b7280', fontFamily: "Cairo,sans-serif", fontSize: '.88rem', fontWeight: 600, border: '1.5px solid #e5eaf0', borderRadius: '.75rem', cursor: 'pointer' },
  };

  return (
    <div style={ms.overlay} ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }} role="dialog" aria-modal="true">
      <div style={ms.box} dir="rtl" onClick={e => e.stopPropagation()}>
        <div style={ms.head}>
          <div style={ms.headerIcon}><Pencil size={20} /></div>
          <div style={{ flex: 1 }}>
            <h2 style={ms.title}>تعديل بيانات الكافل</h2>
          </div>
          <button style={ms.closeBtn} onClick={onClose} disabled={saving}><X size={18} /></button>
        </div>

        <div style={ms.body}>
          <div>
            <label style={ms.label}>الاسم الكامل <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={ms.input} placeholder="اسم الكافل كاملاً" value={form.fullName} onChange={e => handleChange('fullName', e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
          </div>
          <div>
            <label style={ms.label}>رقم الهاتف</label>
            <input style={{ ...ms.input, direction: 'ltr', textAlign: 'left' }} placeholder="+967 7XX XXX XXX" value={form.phone} onChange={e => handleChange('phone', e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
          </div>
          <div>
            <label style={ms.label}>البريد الإلكتروني</label>
            <input style={{ ...ms.input, direction: 'ltr', textAlign: 'left' }} type="email" placeholder="sponsor@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
          </div>
          <div>
            <label style={ms.label}>كلمة مرور البوابة</label>
            <input style={{ ...ms.input, direction: 'ltr', textAlign: 'left' }} type="password" placeholder="أحرف على الأقل 8" value={form.portalPassword} onChange={e => handleChange('portalPassword', e.target.value)} onFocus={e => e.target.style.borderColor = '#1B5E8C'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            <p style={ms.hint}>سيستخدمها الكافل للدخول إلى بوابته الخاصة · اتركه فارغاً للحفاظ على الحالية</p>
          </div>

          {error && <div style={ms.errBox}><AlertTriangle size={16} /> {error}</div>}
        </div>

        <div style={ms.foot}>
          <button style={ms.btnGhost} onClick={onClose} disabled={saving}>إلغاء</button>
          <button style={ms.btnPrimary(saving)} onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />جارٍ الحفظ…</>
            ) : (
              <>حفظ التعديلات <Check size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DeleteConfirmModal ────────────────────────────────────────────────────────

function DeleteConfirmModal({ sponsor, onClose, onSuccess }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/sponsors/${sponsor.id}`);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء الحذف');
      setDeleting(false);
    }
  };

  const ds = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(13,61,92,0.55)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn .18s ease' },
    box: { background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(13,61,92,.25)', overflow: 'hidden', animation: 'slideUp .22s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Cairo','Tajawal',sans-serif", textAlign: 'center' },
    body: { padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
    iconWrap: { width: '4rem', height: '4rem', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: '1.15rem', fontWeight: 800, color: '#1f2937', margin: 0 },
    desc: { fontSize: '.88rem', color: '#6b7280', margin: 0, lineHeight: 1.6 },
    name: { fontWeight: 800, color: '#dc2626' },
    errBox: { display: 'flex', alignItems: 'center', gap: '.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '.5rem', padding: '.65rem .9rem', fontSize: '.82rem', color: '#b91c1c', fontWeight: 500, width: '100%', textAlign: 'right' },
    foot: { display: 'flex', justifyContent: 'center', gap: '.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8' },
    btnDanger: (disabled) => ({ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.7rem 1.5rem', background: disabled ? '#f87171' : '#dc2626', color: '#fff', fontFamily: "Cairo,sans-serif", fontSize: '.9rem', fontWeight: 700, border: 'none', borderRadius: '.75rem', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,.25)', transition: 'all .15s' }),
    btnGhost: { display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.65rem 1.25rem', background: 'none', color: '#6b7280', fontFamily: "Cairo,sans-serif", fontSize: '.88rem', fontWeight: 600, border: '1.5px solid #e5eaf0', borderRadius: '.75rem', cursor: 'pointer' },
  };

  return (
    <div style={ds.overlay} ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }} role="dialog" aria-modal="true">
      <div style={ds.box} dir="rtl" onClick={e => e.stopPropagation()}>
        <div style={ds.body}>
          <div style={ds.iconWrap}><Trash2 size={28} /></div>
          <h2 style={ds.title}>حذف الكافل</h2>
          <p style={ds.desc}>
            هل أنت متأكد أنك تريد حذف الكافل <span style={ds.name}>{sponsor.full_name}</span>؟
            <br />هذا الإجراء لا يمكن التراجع عنه.
          </p>
          {error && <div style={ds.errBox}><AlertTriangle size={16} /> {error}</div>}
        </div>
        <div style={ds.foot}>
          <button style={ds.btnGhost} onClick={onClose} disabled={deleting}>إلغاء</button>
          <button style={ds.btnDanger(deleting)} onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />جارٍ الحذف…</>
            ) : (
              <><Trash2 size={16} /> تأكيد الحذف</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SponsorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sponsorId = params?.id;

  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchSponsor = useCallback(() => {
    if (!sponsorId) return;
    setLoading(true);
    api.get(`/sponsors/${sponsorId}`)
      .then(({ data }) => setSponsor(data))
      .catch(() => setError('تعذّر تحميل بيانات الكافل.'))
      .finally(() => setLoading(false));
  }, [sponsorId]);

  useEffect(() => {
    fetchSponsor();
  }, [fetchSponsor]);

  if (loading) {
    return (
      <AppShell>
        <div className="page-container skel-loading">
          <div className="skel skel-header"></div>
          <div className="skel skel-card"></div>
          <div className="skel skel-card"></div>
        </div>
        <style jsx>{`
          .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
          .skel { background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 1rem; }
          .skel-header { height: 40px; width: 300px; }
          .skel-card { height: 200px; width: 100%; }
          @keyframes shimmer { to { background-position: -200% 0; } }
        `}</style>
      </AppShell>
    );
  }

  if (error || !sponsor) {
    return (
      <AppShell>
        <div className="page-container error-state" dir="rtl">
          <XCircle size={48} className="error-icon" />
          <h2>{error || 'لم يتم العثور على الكافل'}</h2>
          <button onClick={() => router.back()} className="btn-ghost">العودة للسابق</button>
        </div>
        <style jsx>{`
          .page-container { padding: 4rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .error-icon { color: #ef4444; }
          .btn-ghost { padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; background: transparent; cursor: pointer; font-family: inherit; font-weight: 600; color: #374151; transition: all 0.2s; }
          .btn-ghost:hover { background: #f3f4f6; }
        `}</style>
      </AppShell>
    );
  }

  const sponsorData = sponsor?.sponsor || {};
  const sponsorships = sponsor?.sponsorships || [];
  const totalMonthly = sponsorships
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + parseFloat(s.monthly_amount || 0), 0);

  return (
    <AppShell>
      <div className="page" dir="rtl">
        {/* Header Actions */}
        <div className="header-actions">
          <button onClick={() => router.push('/sponsors')} className="btn-back">
            <ArrowRight size={18} />
            <span>العودة للكفلاء</span>
          </button>
          <div className="header-btns">
            <button className="btn-edit" onClick={() => setShowEdit(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>تعديل</span>
            </button>
            <button className="btn-delete" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} />
              <span>حذف</span>
            </button>
          </div>
        </div>

        {/* Top Grid: Profile & Stats */}
        <div className="top-grid">
          {/* Profile Card */}
          <div className="card profile-card">
            <div className="profile-header">
              <div className="avatar-large">{sponsorData.full_name?.charAt(0) || <User />}</div>
              <div className="profile-titles">
                <h1 className="sponsor-name">{sponsorData.full_name}</h1>
                <p className="sponsor-id">رقم التعريف: {sponsorData.id}</p>
              </div>
            </div>
            
            <div className="contact-info">
              {sponsorData.phone && (
                <div className="info-row">
                  <div className="info-icon"><Phone size={16} /></div>
                  <span className="info-text ltr" dir="ltr">{sponsorData.phone}</span>
                </div>
              )}
              {sponsorData.email && (
                <div className="info-row">
                  <div className="info-icon"><Mail size={16} /></div>
                  <span className="info-text">{sponsorData.email}</span>
                </div>
              )}
              <div className="info-row">
                <div className="info-icon"><Calendar size={16} /></div>
                <span className="info-text">تاريخ التسجيل: {formatDate(sponsorData.created_at)}</span>
              </div>
              <div className="info-row">
                <div className="info-icon"><User size={16} /></div>
                <span className="info-text">بواسطة: {sponsorData.created_by_name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Stats & Portal Column */}
          <div className="stats-column">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper active-spon"><CheckCircle2 size={24} /></div>
                <div className="stat-content">
                  <span className="stat-label">كفالة نشطة</span>
                  <span className="stat-value">{sponsorData.active_sponsorships || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper total-amt"><Briefcase size={24} /></div>
                <div className="stat-content">
                  <span className="stat-label">إجمالي شهري</span>
                  <span className="stat-value text-primary">{formatAmount(totalMonthly)}</span>
                </div>
              </div>
            </div>

            <div className="card portal-card">
              <div className="portal-header">
                <LinkIcon size={18} className="portal-icon" />
                <h3 className="portal-title">رابط البوابة الخاصة بالكافل</h3>
              </div>
              <p className="portal-desc">يمكنك مشاركة هذا الرابط مع الكافل ليتمكن من متابعة كفالاته وتقاريره.</p>
              <div className="portal-action">
                <div className="token-display" dir="ltr">
                  {`${window.location.origin}/sponsor/portal?token=${sponsorData.portal_token?.substring(0,8)}...`}
                </div>
                <button 
                  onClick={() => {
                    if (!sponsorData.portal_token) return;
                    navigator.clipboard.writeText(`${window.location.origin}/sponsor/portal?token=${sponsorData.portal_token}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} 
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                >
                  <Copy size={16} />
                  <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              {/* Password display */}
              <div className="password-section">
                <div className="password-label">كلمة مرور البوابة</div>
                <div className="password-row">
                  <div className="password-display" dir="ltr">
                    {sponsorData.portal_password_plain || '••••••••'}
                  </div>
                  <button className="btn-change-pass" onClick={() => setShowEdit(true)}>
                    <Pencil size={14} />
                    <span>تغيير</span>
                  </button>
                </div>
                {!sponsorData.portal_password_plain && (
                  <p className="password-hint">كلمة المرور غير متاحة للعرض (تم إنشاؤها قبل التحديث)</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sponsorships Section */}
        <div className="card sponsorships-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>الكفالات التابعة له</h2>
              <span className="badge">{sponsorships.length} كفالة</span>
            </div>
            <button 
              className="btn-assign"
              onClick={() => setShowAssign(true)}
            >
              <Handshake size={16} />
              <span>تعيين مستفيد</span>
            </button>
          </div>

          {sponsorships.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap"><Briefcase size={40} /></div>
              <h3>لا توجد كفالات مسجّلة</h3>
              <p>لم يتم إضافة أي كفالات لهذا الكافل حتى الآن.</p>
            </div>
          ) : (
            <div className="spon-table-container">
              <table className="spon-table">
                <thead>
                  <tr>
                    <th>المستفيد</th>
                    <th>النوع</th>
                    <th>المندوب</th>
                    <th>المبلغ الشهري</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsorships.map(s => (
                    <tr key={s.id} className={!s.is_active ? 'inactive-row' : ''}>
                      <td>
                        <div className="beneficiary-cell">
                          <div className="ben-icon">
                            {s.beneficiary_type === 'orphan' ? <User size={18} /> : <Users size={18} />}
                          </div>
                          <span>{s.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                        </div>
                      </td>
                      <td>
                         <span className="type-badge">{s.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                      </td>
                      <td className="text-muted">{s.agent_name || '—'}</td>
                      <td><span className="amount-text">{formatAmount(s.monthly_amount)}</span></td>
                      <td>
                        {s.is_active ? (
                          <span className="status-badge active">نشطة</span>
                        ) : (
                          <span className="status-badge inactive">منتهية</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Beneficiary Modal */}
      {showAssign && (
        <AssignBeneficiaryModal
          sponsor={sponsorData}
          onClose={() => setShowAssign(false)}
          onSuccess={() => {
            setToast('تم تعيين المستفيد بنجاح ✓');
            fetchSponsor();
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}

      {/* Edit Sponsor Modal */}
      {showEdit && (
        <EditSponsorModal
          sponsor={sponsorData}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setToast('تم تحديث بيانات الكافل بنجاح ✓');
            fetchSponsor();
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDelete && (
        <DeleteConfirmModal
          sponsor={sponsorData}
          onClose={() => setShowDelete(false)}
          onSuccess={() => {
            router.push('/sponsors');
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} /> {toast}
          <button className="toast-close" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}

      <style jsx>{`
        .page { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem 4rem; font-family: 'Cairo', 'Tajawal', sans-serif; display: flex; flex-direction: column; gap: 1.5rem; }
        
        .header-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .header-btns { display: flex; gap: 0.5rem; }
        .btn-back { display: inline-flex; align-items: center; gap: 0.5rem; background: none; border: none; color: #6b7a8d; font-family: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 0.5rem; transition: all 0.2s; }
        .btn-back:hover { background: #f0f4f8; color: #1B5E8C; }
        .btn-edit {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.1rem;
          background: #fff; color: #D97706;
          border: 1.5px solid #D97706; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
        }
        .btn-edit:hover { background: #fffbeb; transform: translateY(-1px); }
        .btn-delete {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.1rem;
          background: #fff; color: #dc2626;
          border: 1.5px solid #fca5a5; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
        }
        .btn-delete:hover { background: #fef2f2; border-color: #dc2626; transform: translateY(-1px); }

        @media (max-width: 480px) {
          .header-btns { width: 100%; display: flex; }
          .btn-edit, .btn-delete { flex: 1; justify-content: center; }
        }
        
        .top-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
        @media (max-width: 860px) { .top-grid { grid-template-columns: 1fr; } }
        
        .card { background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem; box-shadow: 0 4px 15px rgba(27, 94, 140, 0.03); overflow: hidden; padding: 1.5rem; }
        
        .profile-card { display: flex; flex-direction: column; gap: 1.5rem; }
        .profile-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #f0f4f8; padding-bottom: 1.25rem; }
        .avatar-large { width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #1B5E8C, #0d3d5c); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; flex-shrink: 0; box-shadow: 0 4px 10px rgba(27, 94, 140, 0.2); }
        .profile-titles { display: flex; flex-direction: column; gap: 0.2rem; }
        .sponsor-name { font-size: 1.4rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .sponsor-id { font-size: 0.85rem; color: #94a3b8; margin: 0; }
        
        .contact-info { display: flex; flex-direction: column; gap: 0.85rem; }
        .info-row { display: flex; align-items: center; gap: 0.75rem; }
        .info-icon { width: 32px; height: 32px; border-radius: 50%; background: #f0f7ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .info-text { font-size: 0.95rem; color: #475569; font-weight: 500; }
        .ltr { direction: ltr; text-align: left; }
        
        .stats-column { display: flex; flex-direction: column; gap: 1.5rem; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr; } }
        .stat-card { background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 15px rgba(27, 94, 140, 0.03); }
        .stat-icon-wrapper { width: 48px; height: 48px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-icon-wrapper.active-spon { background: #ecfdf5; color: #10b981; }
        .stat-icon-wrapper.total-amt { background: #eff6ff; color: #3b82f6; }
        .stat-content { display: flex; flex-direction: column; gap: 0.2rem; }
        .stat-label { font-size: 0.85rem; color: #6b7a8d; font-weight: 600; }
        .stat-value { font-size: 1.4rem; font-weight: 800; color: #1f2937; }
        .text-primary { color: #1B5E8C; }
        
        .portal-card { background: linear-gradient(to left, #ffffff, #f8fbff); border-color: #bfdbfe; }
        .portal-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .portal-icon { color: #2563eb; }
        .portal-title { font-size: 1.05rem; font-weight: 800; color: #1e3a8a; margin: 0; }
        .portal-desc { font-size: 0.85rem; color: #64748b; margin: 0 0 1.25rem; }
        .portal-action { display: flex; gap: 0.5rem; align-items: stretch; }
        .token-display { flex: 1; background: #fff; border: 1.5px dashed #bfdbfe; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.85rem; color: #475569; display: flex; align-items: center; user-select: all; }
        .btn-copy { display: inline-flex; align-items: center; gap: 0.4rem; background: #2563eb; color: #fff; border: none; border-radius: 0.75rem; padding: 0 1.25rem; font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-copy:hover { background: #1d4ed8; }
        .btn-copy.copied { background: #10b981; }
        
        .password-section { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1.5px dashed #bfdbfe; }
        .password-label { font-size: 0.82rem; font-weight: 700; color: #374151; margin-bottom: 0.5rem; }
        .password-row { display: flex; gap: 0.5rem; align-items: stretch; }
        .password-display { flex: 1; background: #fff; border: 1.5px solid #e5eaf0; border-radius: 0.75rem; padding: 0.7rem 1rem; font-size: 0.95rem; color: #1f2937; font-weight: 600; font-family: 'Courier New', monospace; display: flex; align-items: center; letter-spacing: 0.05em; }
        .btn-change-pass { display: inline-flex; align-items: center; gap: 0.35rem; background: linear-gradient(135deg, #1B5E8C, #134569); color: #fff; border: none; border-radius: 0.75rem; padding: 0 1rem; font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-change-pass:hover { background: linear-gradient(135deg, #2E7EB8, #1B5E8C); transform: translateY(-1px); }
        .password-hint { font-size: 0.72rem; color: #94a3b8; margin: 0.4rem 0 0; font-style: italic; }
        
        .sponsorships-section { display: flex; flex-direction: column; gap: 1rem; padding: 0; }
        .section-header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 1.5rem 0; }
        .section-header h2 { font-size: 1.25rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .badge { background: #f0f7ff; color: #2563eb; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 700; }
        .btn-assign { display: inline-flex; align-items: center; gap: 0.4rem; background: linear-gradient(135deg, #1B5E8C, #134569); color: #fff; border: none; border-radius: 0.625rem; padding: 0.6rem 1rem; font-family: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(27, 94, 140, 0.25); white-space: nowrap; }
        .btn-assign:hover { background: linear-gradient(135deg, #2E7EB8, #1B5E8C); transform: translateY(-1px); }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem 1.5rem; text-align: center; }
        .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: #f8fafc; color: #cbd5e1; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
        .empty-state h3 { font-size: 1.1rem; font-weight: 700; color: #475569; margin: 0; }
        .empty-state p { font-size: 0.9rem; color: #94a3b8; margin: 0; }
        
        .spon-table-container { overflow-x: auto; padding-bottom: 1rem; }
        .spon-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .spon-table th { padding: 1rem 1.5rem; text-align: right; font-size: 0.85rem; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .spon-table td { padding: 1rem 1.5rem; font-size: 0.95rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .spon-table tbody tr { transition: background 0.15s; }
        .spon-table tbody tr:hover { background: #f8fafc; }
        .inactive-row { opacity: 0.7; }
        .beneficiary-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; color: #1e293b; }
        .ben-icon { width: 36px; height: 36px; border-radius: 50%; background: #f0f4f8; color: #64748b; display: flex; align-items: center; justify-content: center; }
        .type-badge { font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 0.5rem; background: #f1f5f9; color: #475569; }
        .amount-text { font-weight: 800; color: #1B5E8C; }
        .status-badge { display: inline-flex; font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.75rem; border-radius: 2rem; }
        .status-badge.active { background: #ecfdf5; color: #059669; }
        .status-badge.inactive { background: #f3f4f6; color: #6b7280; }
        .text-muted { color: #64748b; }

        /* Toast */
        .toast { position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%); z-index: 2000; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; border-radius: 0.75rem; padding: 0.8rem 1.5rem; font-weight: 600; font-size: 0.9rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12); display: flex; align-items: center; gap: 1rem; animation: slideDown 0.25s ease; }
        .toast-close { background: none; border: none; cursor: pointer; color: #065f46; font-weight: 700; display: flex; }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>
    </AppShell>
  );
}
