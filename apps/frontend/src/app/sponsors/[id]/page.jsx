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
        <div className="skeleton-wrap" dir="rtl">
          {[120, 80, 200].map((h, i) => (
            <div key={i} className="skeleton-block" style={{ height: h }} />
          ))}
        </div>
        <style jsx>{`
          .skeleton-wrap { max-width: 1040px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; padding-bottom: 3rem; }
          .skeleton-block { border-radius: 1rem; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        `}</style>
      </AppShell>
    );
  }

  if (error || !sponsor) {
    return (
      <AppShell>
        <div className="not-found" dir="rtl">
          <XCircle size={48} style={{ color: '#ef4444' }} />
          <p>{error || 'لم يتم العثور على الكافل'}</p>
          <button onClick={() => router.back()} className="btn-back-ghost">رجوع</button>
        </div>
        <style jsx>{`
          .not-found { text-align: center; padding: 4rem; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: .75rem; }
          .not-found p { font-size: .9rem; color: #6b7280; }
          .btn-back-ghost { color: #1B5E8C; background: none; border: 1.5px solid #1B5E8C; border-radius: .625rem; padding: .5rem 1.25rem; font-family: 'Cairo', sans-serif; font-weight: 600; cursor: pointer; font-size: .875rem; }
          .btn-back-ghost:hover { background: #f0f7ff; }
        `}</style>
      </AppShell>
    );
  }

  const sponsorData = sponsor?.sponsor || {};
  const sponsorships = sponsor?.sponsorships || [];
  const activeSponsorships = sponsorships.filter(s => s.is_active);
  const totalMonthly = activeSponsorships.reduce((sum, s) => sum + parseFloat(s.monthly_amount || 0), 0);

  return (
    <AppShell>
      <div className="detail-page" dir="rtl">
        {/* Page top bar */}
        <div className="page-top">
          <div className="breadcrumb">
            <button className="back-btn" onClick={() => router.push('/sponsors')}>
              <ArrowRight size={15} /> رجوع
            </button>
            <span className="sep">/</span>
            <span className="crumb-link" style={{ cursor: 'pointer', color: '#1B5E8C', fontWeight: 600 }} onClick={() => router.push('/sponsors')}>الكفلاء</span>
            <span className="sep">/</span>
            <span className="crumb-current">تفاصيل الكافل</span>
          </div>
          <div className="top-actions">
            <button className="btn-edit" onClick={() => setShowEdit(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              تعديل
            </button>
            <button className="btn-delete" onClick={() => setShowDelete(true)}>
              <Trash2 size={15} /> حذف
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="hero-card">
          <div className="hero-left">
            <div className="hero-avatar">{sponsorData.full_name?.charAt(0) || '؟'}</div>
            <div className="hero-identity">
              <h2 className="hero-name">{sponsorData.full_name}</h2>
              <div className="hero-badges">
                <span className="hero-stat-chip"><CheckCircle2 size={13} /> {activeSponsorships.length} كفالة نشطة</span>
                <span className="hero-stat-chip"><Briefcase size={13} /> {formatAmount(totalMonthly)} / شهر</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* col-main */}
          <div className="col-main">
            <div className="section-card">
              <h3 className="section-title">بيانات التواصل</h3>
              <div className="info-grid single-col">
                {sponsorData.phone && (
                  <div className="info-row"><span className="info-label">الهاتف</span><span className="info-value" dir="ltr">{sponsorData.phone}</span></div>
                )}
                {sponsorData.email && (
                  <div className="info-row"><span className="info-label">البريد الإلكتروني</span><span className="info-value">{sponsorData.email}</span></div>
                )}
                <div className="info-row"><span className="info-label">تاريخ التسجيل</span><span className="info-value">{formatDate(sponsorData.created_at)}</span></div>
                <div className="info-row"><span className="info-label">بواسطة</span><span className="info-value">{sponsorData.created_by_name || '—'}</span></div>
              </div>
            </div>
          </div>

          {/* col-side */}
          <div className="col-side">
            <div className="section-card">
              <h3 className="section-title">بوابة الكافل</h3>
              <p className="portal-desc">شارك هذا الرابط مع الكافل ليتابع كفالاته وتقاريره.</p>
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
              <div className="password-section">
                <div className="password-label">كلمة مرور البوابة</div>
                <div className="password-row">
                  <div className="password-display" dir="ltr">
                    {sponsorData.portal_password_plain || '••••••••'}
                  </div>
                  <button className="btn-change-pass" onClick={() => setShowEdit(true)}>
                    <Pencil size={14} /> تغيير
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
        <div className="section-card">
          <div className="section-top-row">
            <h3 className="section-title">الكفالات التابعة له <span className="count-badge">{sponsorships.length}</span></h3>
            <button className="btn-assign" onClick={() => setShowAssign(true)}>
              <Handshake size={16} /> تعيين مستفيد
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
                          <span>{s.beneficiary_name || '—'}</span>
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
        </div>{/* end section-card sponsorships */}
      </div>{/* end .detail-page */}

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
        .detail-page { max-width: 1100px; margin: 0 auto; padding: 0 0 3rem; font-family: 'Cairo', 'Tajawal', sans-serif; display: flex; flex-direction: column; gap: 0.85rem; box-sizing: border-box; width: 100%; }

        .page-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
        @media (max-width: 480px) { .page-top { flex-direction: column; align-items: flex-start; } }
        .top-actions { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
        .back-btn { display: inline-flex; align-items: center; gap: 0.35rem; background: none; border: none; color: #6b7a8d; font-family: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; padding: 0.3rem 0.5rem; border-radius: 0.5rem; transition: all 0.15s; }
        .back-btn:hover { background: #f0f4f8; color: #1B5E8C; }
        .sep { color: #cbd5e1; font-size: 0.75rem; }
        .crumb-link { color: #1B5E8C; font-weight: 600; }
        .crumb-link:hover { text-decoration: underline; }
        .crumb-current { color: #94a3b8; font-weight: 500; }
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
        
        .hero-card { background: linear-gradient(135deg, #0d2f47 0%, #1a4f72 60%, #22669a 100%); border-radius: 1.25rem; padding: 0.9rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 20px rgba(27,94,140,.2); box-sizing: border-box; width: 100%; overflow: hidden; }
        .hero-left { display: flex; align-items: center; gap: 1rem; min-width: 0; flex: 1; }
        .hero-avatar { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,.15); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; flex-shrink: 0; border: 2px solid rgba(255,255,255,.25); }
        .hero-identity { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; overflow: hidden; }
        .hero-name { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hero-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .hero-stat-chip { display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,.15); color: rgba(255,255,255,.9); border: 1px solid rgba(255,255,255,.2); border-radius: 2rem; padding: 0.2rem 0.65rem; font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
        @media (max-width: 480px) { .hero-name { font-size: 1rem; } .hero-avatar { width: 46px; height: 46px; font-size: 1.2rem; } }

        .top-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
        @media (max-width: 860px) { .top-grid { grid-template-columns: 1fr; } }
        
        .content-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 1.25rem; }
        @media (max-width: 860px) { .content-grid { grid-template-columns: 1fr; } }
        .col-main { display: flex; flex-direction: column; gap: 1.25rem; }
        .col-side { display: flex; flex-direction: column; gap: 1.25rem; }

        .section-card { background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem; box-shadow: 0 2px 10px rgba(27,94,140,.04); padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
        .section-title { font-size: 0.88rem; font-weight: 800; color: #0d3d5c; margin: 0; display: flex; align-items: center; gap: 0.5rem; }

        .info-grid { display: flex; flex-direction: column; gap: 0; padding: 0 0.25rem; }
        .single-col .info-row { border-bottom: 1px solid #f8fafc; padding: 0.35rem 0; }
        .single-col .info-row:last-child { border-bottom: none; }
        .info-row { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
        .info-label { font-size: 0.78rem; color: #6b7a8d; font-weight: 500; white-space: nowrap; flex-shrink: 0; }
        .info-value { font-size: 0.82rem; color: #1f2937; font-weight: 600; word-break: break-word; overflow-wrap: break-word; text-align: left; max-width: 100%; }
        .ltr { direction: ltr; text-align: left; }
        .text-primary { color: #1B5E8C; }
        
        .portal-card { background: linear-gradient(to left, #ffffff, #f8fbff); border-color: #bfdbfe; }
        .portal-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .portal-icon { color: #2563eb; }
        .portal-title { font-size: 1.05rem; font-weight: 800; color: #1e3a8a; margin: 0; }
        .portal-desc { font-size: 0.78rem; color: #64748b; margin: 0 0 0.6rem; }
        .portal-action { display: flex; gap: 0.5rem; align-items: stretch; flex-wrap: wrap; }
        .token-display { flex: 1; min-width: 0; background: #fff; border: 1.5px dashed #bfdbfe; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.85rem; color: #475569; display: flex; align-items: center; user-select: all; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .btn-copy { display: inline-flex; align-items: center; gap: 0.4rem; background: #2563eb; color: #fff; border: none; border-radius: 0.75rem; padding: 0 1.25rem; font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-copy:hover { background: #1d4ed8; }
        .btn-copy.copied { background: #10b981; }
        
        .password-section { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1.5px dashed #bfdbfe; }
        .password-label { font-size: 0.82rem; font-weight: 700; color: #374151; margin-bottom: 0.5rem; }
        .password-row { display: flex; gap: 0.5rem; align-items: stretch; }
        .password-display { flex: 1; min-width: 0; background: #fff; border: 1.5px solid #e5eaf0; border-radius: 0.75rem; padding: 0.7rem 1rem; font-size: 0.95rem; color: #1f2937; font-weight: 600; font-family: 'Courier New', monospace; display: flex; align-items: center; letter-spacing: 0.05em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .btn-change-pass { display: inline-flex; align-items: center; gap: 0.35rem; background: linear-gradient(135deg, #1B5E8C, #134569); color: #fff; border: none; border-radius: 0.75rem; padding: 0 1rem; font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-change-pass:hover { background: linear-gradient(135deg, #2E7EB8, #1B5E8C); transform: translateY(-1px); }
        .password-hint { font-size: 0.72rem; color: #94a3b8; margin: 0.4rem 0 0; font-style: italic; }
        
        .section-top-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
        .count-badge { background: #f0f7ff; color: #2563eb; padding: 0.2rem 0.65rem; border-radius: 2rem; font-size: 0.78rem; font-weight: 700; margin-right: 0.35rem; }
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

        /* 360px and below */
        @media (max-width: 360px) {
          .detail-page { gap: 0.55rem; }

          .page-top { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .breadcrumb { font-size: 0.75rem; flex-wrap: wrap; gap: 0.3rem; }
          .page-top > div { width: 100%; }
          .btn-edit, .btn-delete { flex: 1; justify-content: center; font-size: 0.8rem; padding: 0.55rem 0.75rem; }

          .hero-card { padding: 0.7rem 0.75rem; gap: 0.6rem; }
          .hero-avatar { width: 40px; height: 40px; font-size: 1rem; }
          .hero-name { font-size: 0.88rem; }
          .hero-stat-chip { font-size: 0.68rem; padding: 0.15rem 0.45rem; }

          .section-card { padding: 0.65rem 0.75rem; border-radius: 1rem; }
          .section-title { font-size: 0.82rem; }

          .info-label { font-size: 0.73rem; }
          .info-value { font-size: 0.78rem; }

          .portal-desc { font-size: 0.74rem; }
          .portal-action { flex-direction: column; }
          .token-display { white-space: normal; word-break: break-all; font-size: 0.75rem; padding: 0.6rem 0.75rem; min-width: 0; }
          .btn-copy { justify-content: center; padding: 0.65rem 1rem; width: 100%; }

          .password-row { flex-direction: column; }
          .password-display { font-size: 0.82rem; padding: 0.6rem 0.75rem; white-space: normal; word-break: break-all; }
          .btn-change-pass { justify-content: center; padding: 0.65rem 1rem; width: 100%; }
          .password-hint { font-size: 0.68rem; }

          .section-top-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .btn-assign { width: 100%; justify-content: center; font-size: 0.8rem; }
          .count-badge { font-size: 0.72rem; padding: 0.15rem 0.5rem; }

          .spon-table th { padding: 0.5rem 0.6rem; font-size: 0.72rem; }
          .spon-table td { padding: 0.5rem 0.6rem; font-size: 0.78rem; }
          .beneficiary-cell { gap: 0.4rem; font-size: 0.78rem; }
          .ben-icon { width: 28px; height: 28px; flex-shrink: 0; }
          .type-badge { font-size: 0.7rem; padding: 0.15rem 0.45rem; }
          .status-badge { font-size: 0.7rem; padding: 0.15rem 0.5rem; }
          .amount-text { font-size: 0.78rem; }

          .empty-state { padding: 1.75rem 0.75rem; }
          .empty-icon-wrap { width: 56px; height: 56px; }
          .empty-state h3 { font-size: 0.95rem; }
          .empty-state p { font-size: 0.8rem; }

          .toast { font-size: 0.8rem; padding: 0.65rem 1rem; gap: 0.6rem; max-width: 90vw; left: 5%; right: 5%; transform: none; }
        }

      `}</style>
    </AppShell>
  );
}
