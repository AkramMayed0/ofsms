'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import Spinner from '@/components/ui/Spinner';
import { 
  ArrowRight, 
  Copy, 
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
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
const MIN_NAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;
const TOAST_DURATION = 4000;
const MS_IN_A_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const DEFAULT_MONTHLY_AMOUNT = 30000;

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';
const formatAmount = (n) => n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / MS_IN_A_YEAR)} سنة`;
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
    const fetchMarketingLists = async () => {
      setFetching(true);
      setError('');
      try {
        const [oRes, fRes] = await Promise.all([
          api.get('/orphans/marketing'),
          api.get('/families/marketing'),
        ]);
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
      } catch (err) {
        setError('تعذّر تحميل قائمة المستفيدين');
      } finally {
        setFetching(false);
      }
    };
    fetchMarketingLists();
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

  return (
    <div 
      className="fixed inset-0 bg-[#0d3d5c]/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" 
      ref={overlayRef} 
      onClick={e => { if (e.target === overlayRef.current) onClose(); }} 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] display flex flex-col shadow-[0_20px_60px_rgba(13,61,92,0.25)] overflow-hidden animate-slideUp font-sans" 
        dir="rtl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5 px-6 py-5 border-b border-[#f0f4f8] shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#134569] text-white flex items-center justify-center shrink-0">
            <Handshake size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[1rem] font-bold text-[#0d3d5c] m-0">تعيين مستفيد</h2>
            <p className="text-[0.78rem] text-gray-500 m-0 mt-0.5">الكافل: <strong className="text-primary">{sponsor.full_name}</strong></p>
          </div>
          <button className="flex items-center justify-center width-8 h-8 rounded-lg border-none bg-transparent text-gray-400 cursor-pointer shrink-0 hover:bg-slate-100 hover:text-red-500 transition-colors" onClick={onClose} disabled={loading}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3.5">
          <div>
            <label className="block text-[0.8rem] font-semibold text-gray-700 mb-1.5">اختر المستفيد <span className="text-red-600">*</span></label>
            <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)]" placeholder="ابحث بالاسم أو المحافظة…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="border border-[#e5eaf0] rounded-[0.625rem] max-h-[200px] overflow-y-auto bg-[#fafafa] mt-1.5">
              {fetching ? (
                [1,2,3].map(i => <div key={i} className="h-[52px] m-1.5 rounded-lg bg-gradient-to-r from-[#f3f4f6] via-[#e5e7eb] to-[#f3f4f6] bg-[length:200%_100%] animate-shimmer" />)
              ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-[0.82rem] py-4 m-0">لا يوجد مستفيدون بانتظار كافل</p>
              ) : filtered.map(item => (
                <button 
                  key={item.id} 
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer border-b border-[#f0f4f8] last:border-b-0 transition-colors w-full font-sans text-right ${selectedId === item.id ? 'bg-[#f0f7ff]' : 'bg-transparent hover:bg-slate-50'}`} 
                  onClick={() => handleSelect(item)}
                >
                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-[0.75rem] font-bold shrink-0 ${item.type === 'orphan' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
                    {item.type === 'orphan' ? <User size={14} /> : <Users size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.85rem] font-semibold text-gray-800 flex items-center">
                      {item.name}
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.65rem] font-bold mr-1.5 ${item.type === 'orphan' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                    </div>
                    <div className="text-[0.72rem] text-gray-400">{item.governorate} · {item.age}</div>
                  </div>
                  {selectedId === item.id && <span className="text-primary font-extrabold"><Check size={16} /></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[0.72rem] font-bold text-slate-400 text-center py-1 border-t border-b border-[#f0f4f8]">تفاصيل الكفالة</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.8rem] font-semibold text-gray-700 mb-1.5">تاريخ البداية <span className="text-red-600">*</span></label>
              <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-[0.8rem] font-semibold text-gray-700 mb-1.5">المبلغ الشهري (ر.ي) <span className="text-red-600">*</span></label>
              <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left" type="number" min="1" placeholder={String(DEFAULT_MONTHLY_AMOUNT)} value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-[0.8rem] font-semibold text-gray-700 mb-1.5">الوسيط <span className="text-slate-400 font-normal text-[0.72rem]">(اختياري)</span></label>
              <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)]" placeholder="اسم الوسيط أو الجهة المسهِّلة" value={intermediary} onChange={e => setIntermediary(e.target.value)} />
            </div>
          </div>

          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-[0.82rem] text-red-700 font-medium"><AlertTriangle size={18} /> {error}</div>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#f0f4f8]">
          <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-gray-500 font-sans text-[0.88rem] font-semibold border border-[#e5eaf0] rounded-xl cursor-pointer hover:bg-slate-50 hover:text-gray-700 transition-colors" onClick={onClose} disabled={loading}>إلغاء</button>
          <button className="inline-flex items-center gap-1.5 px-6 py-2.5 text-white font-sans text-[0.9rem] font-bold border-none rounded-xl cursor-pointer shadow-[0_2px_8px_rgba(27,94,140,0.3)] bg-gradient-to-br from-primary to-[#134569] hover:from-primary-light hover:to-primary hover:-translate-y-0.5 transition-all duration-200 disabled:bg-[#94a3b8] disabled:from-[#94a3b8] disabled:to-[#94a3b8] disabled:cursor-not-allowed disabled:shadow-none" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><Spinner size="sm" />جارٍ التعيين…</>
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
    if (!form.fullName.trim() || form.fullName.trim().length < MIN_NAME_LENGTH) {
      setError(`الاسم يجب أن يكون ${MIN_NAME_LENGTH} أحرف على الأقل`);
      return;
    }
    if (form.portalPassword && form.portalPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`);
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

  return (
    <div 
      className="fixed inset-0 bg-[#0d3d5c]/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" 
      ref={overlayRef} 
      onClick={e => { if (e.target === overlayRef.current) onClose(); }} 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-[480px] shadow-[0_20px_60px_rgba(13,61,92,0.25)] overflow-hidden animate-slideUp font-sans" 
        dir="rtl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5 px-6 py-5 border-b border-[#f0f4f8]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#134569] text-white flex items-center justify-center shrink-0">
            <Pencil size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-[1rem] font-bold text-[#0d3d5c] m-0">تعديل بيانات الكافل</h2>
          </div>
          <button className="flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent text-gray-400 cursor-pointer mr-auto hover:bg-slate-100 hover:text-red-500 transition-colors" onClick={onClose} disabled={saving}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-[0.82rem] font-semibold text-gray-700 mb-1.5">الاسم الكامل <span className="text-red-600">*</span></label>
            <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)]" placeholder="اسم الكافل كاملاً" value={form.fullName} onChange={e => handleChange('fullName', e.target.value)} />
          </div>
          <div>
            <label className="block text-[0.82rem] font-semibold text-gray-700 mb-1.5">رقم الهاتف</label>
            <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left" placeholder="+967 7XX XXX XXX" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-[0.82rem] font-semibold text-gray-700 mb-1.5">البريد الإلكتروني</label>
            <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left" type="email" placeholder="sponsor@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-[0.82rem] font-semibold text-gray-700 mb-1.5">كلمة مرور البوابة</label>
            <input className="w-full border border-gray-300 rounded-[0.625rem] px-3.5 py-2.5 text-[0.88rem] font-sans text-gray-800 bg-[#fafafa] outline-none transition-all duration-150 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.1)] [direction:ltr] text-left" type="password" placeholder="أحرف على الأقل 8" value={form.portalPassword} onChange={e => handleChange('portalPassword', e.target.value)} />
            <p className="text-[0.72rem] text-slate-400 mt-1 m-0">سيستخدمها الكافل للدخول إلى بوابته الخاصة · اتركه فارغاً للحفاظ على الحالية</p>
          </div>

          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-[0.82rem] text-red-700 font-medium"><AlertTriangle size={16} /> {error}</div>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#f0f4f8]">
          <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-gray-500 font-sans text-[0.88rem] font-semibold border border-[#e5eaf0] rounded-xl cursor-pointer hover:bg-slate-50 hover:text-gray-700 transition-colors" onClick={onClose} disabled={saving}>إلغاء</button>
          <button className="inline-flex items-center gap-1.5 px-6 py-2.5 text-white font-sans text-[0.9rem] font-bold border-none rounded-xl cursor-pointer shadow-[0_2px_8px_rgba(27,94,140,0.3)] bg-gradient-to-br from-primary to-[#134569] hover:from-primary-light hover:to-primary hover:-translate-y-0.5 transition-all duration-200 disabled:bg-[#94a3b8] disabled:from-[#94a3b8] disabled:to-[#94a3b8] disabled:cursor-not-allowed disabled:shadow-none" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <><Spinner size="sm" />جارٍ الحفظ…</>
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

  return (
    <div 
      className="fixed inset-0 bg-[#0d3d5c]/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" 
      ref={overlayRef} 
      onClick={e => { if (e.target === overlayRef.current) onClose(); }} 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-[420px] shadow-[0_20px_60px_rgba(13,61,92,0.25)] overflow-hidden animate-slideUp font-sans text-center" 
        dir="rtl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 px-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={28} /></div>
          <h2 className="text-[1.15rem] font-extrabold text-gray-800 m-0">حذف الكافل</h2>
          <p className="text-[0.88rem] text-gray-500 m-0 leading-relaxed">
            هل أنت متأكد أنك تريد حذف الكافل <span className="font-extrabold text-red-600">{sponsor.full_name}</span>؟
            <br />هذا الإجراء لا يمكن التراجع عنه.
          </p>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-[0.82rem] text-red-700 font-medium w-full text-right"><AlertTriangle size={16} /> {error}</div>}
        </div>
        <div className="flex justify-center gap-3 px-6 py-4 border-t border-[#f0f4f8]">
          <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent text-gray-500 font-sans text-[0.88rem] font-semibold border border-[#e5eaf0] rounded-xl cursor-pointer hover:bg-slate-50 hover:text-gray-700 transition-colors" onClick={onClose} disabled={deleting}>إلغاء</button>
          <button className="inline-flex items-center gap-1.5 px-6 py-2.5 text-white font-sans text-[0.9rem] font-bold border-none rounded-xl cursor-pointer shadow-[0_2px_8px_rgba(220,38,38,0.25)] bg-red-600 hover:bg-red-700 hover:-translate-y-0.5 transition-all duration-150 disabled:bg-red-400 disabled:cursor-not-allowed disabled:shadow-none" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <><Spinner size="sm" />جارٍ الحذف…</>
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
  const [showPass, setShowPass] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchSponsor = useCallback(async () => {
    if (!sponsorId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/sponsors/${sponsorId}`);
      setSponsor(data);
    } catch (err) {
      setError('تعذّر تحميل بيانات الكافل.');
    } finally {
      setLoading(false);
    }
  }, [sponsorId]);

  useEffect(() => {
    fetchSponsor();
  }, [fetchSponsor]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[1040px] mx-auto flex flex-col gap-4 pb-12" dir="rtl">
          {[120, 80, 200].map((h, i) => (
            <div key={i} className="rounded-2xl bg-gradient-to-r from-[#f3f4f6] via-[#e5e7eb] to-[#f3f4f6] bg-[length:200%_100%] animate-shimmer" style={{ height: h }} />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error || !sponsor) {
    return (
      <AppShell>
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3" dir="rtl">
          <XCircle size={48} className="text-red-500" />
          <p className="text-[0.9rem] text-gray-600">{error || 'لم يتم العثور على الكافل'}</p>
          <button onClick={() => router.back()} className="text-primary bg-transparent border-[1.5px] border-primary rounded-[0.625rem] px-5 py-2 font-sans font-semibold cursor-pointer text-[0.875rem] hover:bg-[#f0f7ff]">رجوع</button>
        </div>
      </AppShell>
    );
  }

  const sponsorData = sponsor?.sponsor || {};
  const sponsorships = sponsor?.sponsorships || [];
  const activeSponsorships = sponsorships.filter(s => s.is_active);
  const totalMonthly = activeSponsorships.reduce((sum, s) => sum + parseFloat(s.monthly_amount || 0), 0);

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto pb-12 font-sans flex flex-col gap-3.5 w-full box-border max-[360px]:gap-2" dir="rtl">
        {/* Page top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap max-[360px]:flex-col max-[360px]:items-start max-[360px]:gap-2">
          <div className="flex items-center gap-2 text-[0.82rem]">
            <button className="inline-flex items-center gap-1.5 bg-transparent border-none text-[#6b7a8d] font-semibold text-[0.88rem] cursor-pointer px-2 py-1.5 rounded-lg transition-all duration-150 hover:bg-[#f0f4f8] hover:text-primary" onClick={() => router.push('/sponsors')}>
              <ArrowRight size={15} /> رجوع
            </button>
            <span className="text-slate-300 text-[0.75rem]">/</span>
            <span className="text-primary font-semibold hover:underline cursor-pointer" onClick={() => router.push('/sponsors')}>الكفلاء</span>
            <span className="text-slate-300 text-[0.75rem]">/</span>
            <span className="text-slate-400 font-medium">تفاصيل الكافل</span>
          </div>
          <div className="flex gap-2 flex-wrap items-center max-[360px]:w-full">
            <button className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-white text-amber-600 border-[1.5px] border-amber-600 rounded-xl font-sans text-[0.875rem] font-bold cursor-pointer transition-all duration-150 hover:bg-amber-50/50 hover:-translate-y-0.5 max-[360px]:flex-1 max-[360px]:justify-center max-[360px]:text-[0.8rem] max-[360px]:py-2 max-[360px]:px-3" onClick={() => setShowEdit(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              تعديل
            </button>
            <button className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-white text-red-600 border-[1.5px] border-red-300 rounded-xl font-sans text-[0.875rem] font-bold cursor-pointer transition-all duration-150 hover:bg-red-50 hover:border-red-600 hover:-translate-y-0.5 max-[360px]:flex-1 max-[360px]:justify-center max-[360px]:text-[0.8rem] max-[360px]:py-2 max-[360px]:px-3" onClick={() => setShowDelete(true)}>
              <Trash2 size={15} /> حذف
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d2f47] via-[#1a4f72] to-[#22669a] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-[0_4px_20px_rgba(27,94,140,0.2)] w-full box-border overflow-hidden max-[360px]:p-3 max-[360px]:gap-2.5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-14 h-14 rounded-full bg-white/15 text-white flex items-center justify-center text-[1.5rem] font-extrabold shrink-0 border-2 border-white/25 max-[360px]:w-10 max-[360px]:h-10 max-[360px]:text-[1rem]">{sponsorData.full_name?.charAt(0) || '؟'}</div>
            <div className="flex flex-col gap-1.5 min-w-0 overflow-hidden">
              <h2 className="text-[1.2rem] font-extrabold text-white m-0 truncate max-[360px]:text-[0.88rem]">{sponsorData.full_name}</h2>
              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 bg-white/15 text-white/90 border border-white/20 rounded-full px-2.5 py-1 text-[0.78rem] font-semibold whitespace-nowrap max-[360px]:text-[0.68rem] max-[360px]:px-2 max-[360px]:py-0.5"><CheckCircle2 size={13} /> {activeSponsorships.length} كفالة نشطة</span>
                <span className="inline-flex items-center gap-1 bg-white/15 text-white/90 border border-white/20 rounded-full px-2.5 py-1 text-[0.78rem] font-semibold whitespace-nowrap max-[360px]:text-[0.68rem] max-[360px]:px-2 max-[360px]:py-0.5"><Briefcase size={13} /> {formatAmount(totalMonthly)} / شهر</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-5">
          {/* col-main */}
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-[#e5eaf0] rounded-2xl shadow-[0_2px_10px_rgba(27,94,140,0.04)] p-4 flex flex-col gap-2.5 max-[360px]:p-3 max-[360px]:rounded-xl">
              <h3 className="text-[0.88rem] font-extrabold text-[#0d3d5c] m-0 flex items-center gap-2 max-[360px]:text-[0.82rem]">بيانات التواصل</h3>
              <div className="flex flex-col gap-0 px-1">
                {sponsorData.phone && (
                  <div className="flex justify-between items-baseline gap-2 flex-wrap border-b border-slate-50 py-1.5 last:border-b-0"><span className="text-[0.78rem] text-[#6b7a8d] font-medium whitespace-nowrap shrink-0 max-[360px]:text-[0.73rem]">الهاتف</span><span className="text-[0.82rem] text-gray-800 font-semibold break-all text-left max-w-full [direction:ltr] max-[360px]:text-[0.78rem]">{sponsorData.phone}</span></div>
                )}
                {sponsorData.email && (
                  <div className="flex justify-between items-baseline gap-2 flex-wrap border-b border-slate-50 py-1.5 last:border-b-0"><span className="text-[0.78rem] text-[#6b7a8d] font-medium whitespace-nowrap shrink-0 max-[360px]:text-[0.73rem]">البريد الإلكتروني</span><span className="text-[0.82rem] text-gray-800 font-semibold break-all text-left max-w-full max-[360px]:text-[0.78rem]">{sponsorData.email}</span></div>
                )}
                <div className="flex justify-between items-baseline gap-2 flex-wrap border-b border-slate-50 py-1.5 last:border-b-0"><span className="text-[0.78rem] text-[#6b7a8d] font-medium whitespace-nowrap shrink-0 max-[360px]:text-[0.73rem]">تاريخ التسجيل</span><span className="text-[0.82rem] text-gray-800 font-semibold break-all text-left max-w-full max-[360px]:text-[0.78rem]">{formatDate(sponsorData.created_at)}</span></div>
                <div className="flex justify-between items-baseline gap-2 flex-wrap border-b border-slate-50 py-1.5 last:border-b-0"><span className="text-[0.78rem] text-[#6b7a8d] font-medium whitespace-nowrap shrink-0 max-[360px]:text-[0.73rem]">بواسطة</span><span className="text-[0.82rem] text-gray-800 font-semibold break-all text-left max-w-full max-[360px]:text-[0.78rem]">{sponsorData.created_by_name || '—'}</span></div>
              </div>
            </div>
          </div>

          {/* col-side */}
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-[#e5eaf0] rounded-2xl shadow-[0_2px_10px_rgba(27,94,140,0.04)] p-4 flex flex-col gap-2.5 max-[360px]:p-3 max-[360px]:rounded-xl">
              <h3 className="text-[0.88rem] font-extrabold text-[#0d3d5c] m-0 flex items-center gap-2 max-[360px]:text-[0.82rem]">بوابة الكافل</h3>
              <p className="text-[0.78rem] text-slate-500 mb-2.5 m-0 max-[360px]:text-[0.74rem]">شارك هذا الرابط مع الكافل ليتابع كفالاته وتقاريره.</p>
              <div className="flex gap-2 items-stretch flex-wrap max-[360px]:flex-col">
                <div className="flex-1 min-w-0 bg-white border-[1.5px] dashed border-blue-200 rounded-xl px-4 py-3 text-[0.85rem] text-slate-600 flex items-center select-all overflow-hidden text-ellipsis whitespace-nowrap max-[360px]:whitespace-normal max-[360px]:break-all max-[360px]:text-[0.75rem] max-[360px]:px-3 max-[360px]:py-2.5" dir="ltr">
                  {`${window.location.origin}/sponsor/portal?token=${sponsorData.portal_token?.substring(0,8)}...`}
                </div>
                <button
                  onClick={() => {
                    if (!sponsorData.portal_token) return;
                    navigator.clipboard.writeText(`${window.location.origin}/sponsor/portal?token=${sponsorData.portal_token}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`inline-flex items-center gap-1.5 bg-blue-600 text-white border-none rounded-xl px-5 py-3 text-[0.9rem] font-bold cursor-pointer transition-all duration-200 hover:bg-blue-700 whitespace-nowrap max-[360px]:justify-center max-[360px]:w-full max-[360px]:py-2.5 ${copied ? '!bg-emerald-500' : ''}`}
                >
                  <Copy size={16} />
                  <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>
              <div className="mt-3 pt-3 border-t-[1.5px] dashed border-blue-200">
                <div className="text-[0.82rem] font-bold text-gray-700 mb-2">كلمة مرور البوابة</div>
                <div className="flex gap-2 items-stretch w-full max-[360px]:flex-col">
                  <div className="flex-1 min-w-0 bg-white border border-[#e5eaf0] rounded-xl px-4 py-2.5 text-[0.95rem] text-gray-800 font-semibold font-mono flex items-center justify-between tracking-[0.05em] overflow-hidden whitespace-nowrap max-[360px]:text-[0.82rem] max-[360px]:px-3 max-[360px]:py-2.5 max-[360px]:whitespace-normal max-[360px]:break-all" dir="ltr">
                    <span>{showPass ? (sponsorData.portal_password_plain || '—') : '••••••••'}</span>
                    {sponsorData.portal_password_plain && (
                      <button
                        type="button"
                        className="text-gray-400 hover:text-primary transition-colors cursor-pointer p-1"
                        onClick={() => setShowPass(!showPass)}
                        title={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-br from-primary to-[#134569] text-white border-none rounded-xl text-[0.82rem] font-bold cursor-pointer transition-all duration-200 hover:from-primary-light hover:to-primary hover:-translate-y-0.5 whitespace-nowrap max-[360px]:justify-center max-[360px]:w-full max-[360px]:py-2.5" onClick={() => setShowEdit(true)}>
                    <Pencil size={14} /> تغيير
                  </button>
                </div>
                {!sponsorData.portal_password_plain && (
                  <p className="text-[0.72rem] text-slate-400 mt-1.5 m-0 italic max-[360px]:text-[0.68rem]">كلمة المرور غير متاحة للعرض (تم إنشاؤها قبل التحديث)</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sponsorships Section */}
        <div className="bg-white border border-[#e5eaf0] rounded-2xl shadow-[0_2px_10px_rgba(27,94,140,0.04)] p-4 flex flex-col gap-2.5 max-[360px]:p-3 max-[360px]:rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 max-[360px]:flex-col max-[360px]:items-start max-[360px]:gap-2">
            <h3 className="text-[0.88rem] font-extrabold text-[#0d3d5c] m-0 flex items-center gap-2 max-[360px]:text-[0.82rem]">الكفالات التابعة له <span className="bg-[#f0f7ff] text-blue-600 px-2.5 py-1 rounded-full text-[0.78rem] font-bold mr-1.5 max-[360px]:text-[0.72rem] max-[360px]:px-2 max-[360px]:py-0.5">{sponsorships.length}</span></h3>
            <button className="inline-flex items-center gap-1.5 bg-gradient-to-br from-primary to-[#134569] text-white border-none rounded-[0.625rem] px-4 py-2.5 text-[0.85rem] font-bold cursor-pointer transition-all duration-200 hover:from-primary-light hover:to-primary hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(27, 94, 140, 0.25)] whitespace-nowrap max-[360px]:w-full max-[360px]:justify-center max-[360px]:text-[0.8rem]" onClick={() => setShowAssign(true)}>
              <Handshake size={16} /> تعيين مستفيد
            </button>
          </div>

          {sponsorships.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 px-6 text-center max-[360px]:py-7 max-[360px]:px-3">
              <div className="w-20 h-20 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-2 max-[360px]:w-14 max-[360px]:h-14"><Briefcase size={40} /></div>
              <h3 className="text-[1.1rem] font-bold text-slate-700 m-0 max-[360px]:text-[0.95rem]">لا توجد كفالات مسجّلة</h3>
              <p className="text-[0.9rem] text-slate-400 m-0 max-[360px]:text-[0.8rem]">لم يتم إضافة أي كفالات لهذا الكافل حتى الآن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-[0.85rem] font-bold text-slate-500 border-b border-slate-200 bg-slate-50 max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.72rem]">المستفيد</th>
                    <th className="px-6 py-4 text-right text-[0.85rem] font-bold text-slate-500 border-b border-slate-200 bg-slate-50 max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.72rem]">النوع</th>
                    <th className="px-6 py-4 text-right text-[0.85rem] font-bold text-slate-500 border-b border-slate-200 bg-slate-50 max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.72rem]">المندوب</th>
                    <th className="px-6 py-4 text-right text-[0.85rem] font-bold text-slate-500 border-b border-slate-200 bg-slate-50 max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.72rem]">المبلغ الشهري</th>
                    <th className="px-6 py-4 text-right text-[0.85rem] font-bold text-slate-500 border-b border-slate-200 bg-slate-50 max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.72rem]">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsorships.map(s => (
                    <tr key={s.id} className={`transition-colors duration-150 hover:bg-slate-50 ${!s.is_active ? 'opacity-70' : ''}`}>
                      <td className="px-6 py-4 text-[0.95rem] border-b border-slate-100 align-middle max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.78rem]">
                        <div className="flex items-center gap-3 font-bold text-slate-800 max-[360px]:gap-1.5 max-[360px]:text-[0.78rem]">
                          <div className="w-9 h-9 rounded-full bg-[#f0f4f8] text-[#64748b] flex items-center justify-center shrink-0 max-[360px]:w-7 max-[360px]:h-7">
                            {s.beneficiary_type === 'orphan' ? <User size={18} /> : <Users size={18} />}
                          </div>
                          <span>{s.beneficiary_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[0.95rem] border-b border-slate-100 align-middle max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.78rem]">
                         <span className="text-[0.8rem] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-600 max-[360px]:text-[0.7rem] max-[360px]:px-2 max-[360px]:py-0.5">{s.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                      </td>
                      <td className="px-6 py-4 text-[0.95rem] border-b border-slate-100 align-middle text-slate-500 max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.78rem]">{s.agent_name || '—'}</td>
                      <td className="px-6 py-4 text-[0.95rem] border-b border-slate-100 align-middle max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.78rem]"><span className="font-extrabold text-primary max-[360px]:text-[0.78rem]">{formatAmount(s.monthly_amount)}</span></td>
                      <td className="px-6 py-4 text-[0.95rem] border-b border-slate-100 align-middle max-[360px]:px-2.5 max-[360px]:py-2 max-[360px]:text-[0.78rem]">
                        {s.is_active ? (
                          <span className="inline-flex text-[0.8rem] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 max-[360px]:text-[0.7rem] max-[360px]:px-2 max-[360px]:py-0.5">نشطة</span>
                        ) : (
                          <span className="inline-flex text-[0.8rem] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500 max-[360px]:text-[0.7rem] max-[360px]:px-2 max-[360px]:py-0.5">منتهية</span>
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
            setTimeout(() => setToast(null), TOAST_DURATION);
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
            setTimeout(() => setToast(null), TOAST_DURATION);
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
        <div className="fixed top-6 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[2000] bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl px-6 py-3 font-semibold text-[0.9rem] shadow-[0_4px_20px_rgba(0,0,0,0.12)] flex items-center gap-4 animate-toastIn max-[360px]:text-[0.8rem] max-[360px]:px-4 max-[360px]:py-2.5 max-[360px]:gap-2.5 max-[360px]:max-w-[90vw] max-[360px]:left-[5%] max-[360px]:right-[5%] max-[360px]:transform-none">
          <CheckCircle2 size={18} /> <span>{toast}</span>
          <button className="bg-transparent border-none cursor-pointer text-emerald-800 font-bold flex items-center mr-auto" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </AppShell>
  );
}
