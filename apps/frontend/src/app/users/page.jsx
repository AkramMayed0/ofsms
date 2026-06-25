'use client';

/**
 * page.jsx
 * Route:  /users  (GM only)
 * Task:   feature/ui-user-management
 *
 * Full user management page for the General Manager:
 *   - Table of all staff users (agents, supervisors, finance, GMs)
 *   - Add User modal  → POST /api/users
 *   - Edit User modal → PATCH /api/users/:id
 *   - Activate/Deactivate toggle → PATCH /api/users/:id/activate|deactivate
 *   - Role filter tabs
 *   - Search by name or email
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, Trash2, Edit2, Users } from 'lucide-react';

import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';
import PrimaryButton from '@/components/ui/PrimaryButton';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_MAP = {
  gm: { label: 'مدير عام', color: '#7c3aed', bg: '#f5f3ff' },
  supervisor: { label: 'مشرف أيتام', color: '#1d4ed8', bg: '#eff6ff' },
  agent: { label: 'مندوب', color: '#059669', bg: '#ecfdf5' },
  finance: { label: 'قسم مالي', color: '#d97706', bg: '#fffbeb' },
};

const ROLES_OPTIONS = [
  { value: 'agent', label: 'مندوب' },
  { value: 'supervisor', label: 'مشرف أيتام' },
  { value: 'finance', label: 'قسم مالي' },
  { value: 'gm', label: 'مدير عام' },
];

// ── Icons ──────────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const IconPlus = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

// ── Shared modal inline styles ─────────────────────────────────────────────────

const modalStyles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000,
  },
  box: {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    width: '460px', maxWidth: '95vw', background: '#fff', borderRadius: '1.25rem',
    zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
    maxHeight: '90vh', overflowY: 'auto',
    fontFamily: "'Cairo','Tajawal',sans-serif",
    animation: 'none',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f4f8',
    position: 'sticky', top: 0, background: '#fff', zIndex: 1,
  },
  title: { fontSize: '1.1rem', fontWeight: 800, color: '#0d3d5c', margin: 0 },
  closeBtn: {
    background: '#f3f4f6', border: 'none', color: '#6b7280', cursor: 'pointer',
    padding: '.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    display: 'flex', flexDirection: 'column', gap: '1.15rem', padding: '1.75rem',
  },
  foot: {
    display: 'flex', gap: '.75rem', justifyContent: 'flex-end',
    paddingTop: '.75rem', borderTop: '1px solid #f0f4f8', marginTop: '.5rem',
  },
  fg: { display: 'flex', flexDirection: 'column', gap: '.3rem' },
  lbl: { fontSize: '.82rem', fontWeight: 600, color: '#374151' },
  req: { color: '#dc2626' },
  inp: {
    border: '1.5px solid #d1d5db', borderRadius: '.625rem', padding: '.65rem .9rem',
    fontSize: '.88rem', fontFamily: "'Cairo',sans-serif", color: '#1f2937',
    background: '#fafafa', outline: 'none', width: '100%', boxSizing: 'border-box',
    direction: 'rtl',
  },
  inpErr: { borderColor: '#dc2626' },
  ferr: { fontSize: '.77rem', color: '#dc2626', margin: 0 },
  errBanner: {
    display: 'flex', alignItems: 'center', gap: '.5rem',
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '.625rem',
    padding: '.65rem .85rem', fontSize: '.82rem', color: '#b91c1c', fontWeight: 500,
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '.4rem',
    padding: '.7rem 1.4rem', background: 'linear-gradient(135deg,#1B5E8C,#134569)',
    color: '#fff', fontFamily: "'Cairo',sans-serif", fontSize: '.9rem', fontWeight: 700,
    border: 'none', borderRadius: '.75rem', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(27,94,140,.25)',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', padding: '.7rem 1.25rem',
    background: 'none', color: '#6b7280', fontFamily: "'Cairo',sans-serif",
    fontSize: '.88rem', fontWeight: 600, border: '1.5px solid #e5eaf0',
    borderRadius: '.75rem', cursor: 'pointer',
  },
  btnDanger: {
    display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.7rem 1.4rem',
    background: '#dc2626', color: '#fff', fontFamily: "'Cairo',sans-serif",
    fontSize: '.88rem', fontWeight: 700, border: 'none', borderRadius: '.75rem', cursor: 'pointer',
  },
  spin: {
    display: 'inline-block', width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0,
  },
};

// ── SuccessPopup ───────────────────────────────────────────────────────────────

function SuccessPopup({ title, msg, type = 'success', onClose }) {
  const isSuccess = type === 'success';
  return (
    <div className="sp-backdrop" onClick={onClose}>
      <div className="sp-box" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="sp-icon" style={{ background: isSuccess ? '#ecfdf5' : '#fef2f2' }}>
          {isSuccess ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
        </div>
        <h3 className="sp-title">{title}</h3>
        {msg && <p className="sp-msg">{msg}</p>}
      </div>
    </div>
  );
}

// ── StatPill ───────────────────────────────────────────────────────────────────

function StatPill({ label, count, color }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      gap: '2px', padding: '.6rem 1.1rem',
      background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px',
      fontFamily: "'Cairo', sans-serif", minWidth: '80px',
      boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    }}>
      <span style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color }}>{count}</span>
      <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

// ── RoleBadge ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_MAP[role] || { label: role, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      padding: '.2rem .65rem', borderRadius: '2rem',
      fontSize: '.72rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}25`, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ── StatusToggle ───────────────────────────────────────────────────────────────

function StatusToggle({ user, currentUserId, onToggle, loading }) {
  const isSelf = user.id === currentUserId;
  const isActive = user.is_active;

  return (
    <button
      className={`toggle-btn ${isActive ? 'toggle-on' : 'toggle-off'}`}
      onClick={() => !isSelf && onToggle(user)}
      disabled={isSelf || loading}
      title={isSelf ? 'لا يمكنك إيقاف حسابك الخاص' : isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
    >
      <span className="toggle-dot" />
      {isActive ? 'نشط' : 'موقوف'}
    </button>
  );
}

// ── UserFormModal ──────────────────────────────────────────────────────────────

function UserFormModal({ mode, user, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: isEdit
      ? { fullName: user.full_name, phone: user.phone || '', role: user.role }
      : { fullName: '', email: '', password: '', phone: '', role: 'agent' },
  });

  // Reset form when modal opens with a different user
  useEffect(() => {
    if (isEdit && user) {
      reset({ fullName: user.full_name, phone: user.phone || '', role: user.role });
    }
  }, [user?.id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setApiErr('');
    try {
      if (isEdit) {
        await api.patch(`/users/${user.id}`, {
          fullName: data.fullName.trim(),
          phone: data.phone.trim() || undefined,
          role: data.role,
        });
      } else {
        await api.post('/users', {
          fullName: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          phone: data.phone.trim() || undefined,
          role: data.role,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setApiErr(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ. يرجى المحاولة مجدداً'
      );
    } finally {
      setSaving(false);
    }
  };

  const S = modalStyles;

  return (
    <>
      <div style={S.backdrop} onClick={onClose} />
      <div style={S.box} dir="rtl">
        <div style={S.head}>
          <h2 style={S.title}>
            {isEdit ? `تعديل: ${user.full_name}` : 'إضافة مستخدم جديد'}
          </h2>
          <button style={S.closeBtn} onClick={onClose} aria-label="إغلاق"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={S.body}>
          {apiErr && (
            <div style={S.errBanner}>
              <AlertTriangle size={16} /> {apiErr}
            </div>
          )}

          {/* Full name */}
          <div style={S.fg}>
            <label style={S.lbl}>الاسم الكامل <span style={S.req}>*</span></label>
            <input
              style={{ ...S.inp, ...(errors.fullName ? S.inpErr : {}) }}
              placeholder="الاسم الكامل"
              {...register('fullName', {
                required: 'الاسم مطلوب',
                minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
              })}
            />
            {errors.fullName && <p style={S.ferr}>{errors.fullName.message}</p>}
          </div>

          {/* Email — only for create */}
          {!isEdit && (
            <div style={S.fg}>
              <label style={S.lbl}>البريد الإلكتروني <span style={S.req}>*</span></label>
              <input
                type="email"
                style={{ ...S.inp, direction: 'ltr', ...(errors.email ? S.inpErr : {}) }}
                placeholder="user@example.com"
                {...register('email', {
                  required: 'البريد مطلوب',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد غير صحيح' },
                })}
              />
              {errors.email && <p style={S.ferr}>{errors.email.message}</p>}
            </div>
          )}

          {/* Password — only for create */}
          {!isEdit && (
            <div style={S.fg}>
              <label style={S.lbl}>كلمة المرور <span style={S.req}>*</span></label>
              <input
                type="password"
                style={{ ...S.inp, direction: 'ltr', ...(errors.password ? S.inpErr : {}) }}
                placeholder="8 أحرف على الأقل"
                {...register('password', {
                  required: 'كلمة المرور مطلوبة',
                  minLength: { value: 8, message: '8 أحرف على الأقل' },
                })}
              />
              {errors.password && <p style={S.ferr}>{errors.password.message}</p>}
            </div>
          )}

          {/* Phone */}
          <div style={S.fg}>
            <label style={S.lbl}>رقم الهاتف <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '.75rem' }}>(اختياري)</span></label>
            <input
              style={{ ...S.inp, direction: 'ltr' }}
              placeholder="+967 7XX XXX XXX"
              {...register('phone')}
            />
          </div>

          {/* Role */}
          <div style={S.fg}>
            <label style={S.lbl}>الدور <span style={S.req}>*</span></label>
            <select
              style={{ ...S.inp, appearance: 'none', cursor: 'pointer', ...(errors.role ? S.inpErr : {}) }}
              {...register('role', { required: 'الدور مطلوب' })}
            >
              {ROLES_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <p style={S.ferr}>{errors.role.message}</p>}
          </div>

          <div style={S.foot}>
            <button type="button" style={S.btnGhost} onClick={onClose} disabled={saving}>
              إلغاء
            </button>
            <button type="submit" style={S.btnPrimary} disabled={saving}>
              {saving
                ? <><span style={S.spin} /> جارٍ الحفظ…</>
                : isEdit ? 'حفظ التغييرات' : 'إضافة المستخدم'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── DeleteConfirmModal ─────────────────────────────────────────────────────────

function DeleteConfirmModal({ user, onClose, onConfirm, loading }) {
  if (!user) return null;
  return (
    <>
      <div style={modalStyles.backdrop} onClick={onClose} />
      <div style={{
        ...modalStyles.box,
        width: '420px',
        borderTop: '4px solid #ef4444',
        overflow: 'visible',
      }} dir="rtl">
        {/* Icon floating above box */}
        <div style={{
          position: 'absolute', top: '-44px', left: '50%', transform: 'translateX(-50%)',
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#fef2f2', color: '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '4px solid #fff', boxShadow: '0 4px 12px rgba(239,68,68,.15)',
        }}>
          <AlertTriangle size={42} strokeWidth={1.5} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem', padding: '3.5rem 2rem 2rem', textAlign: 'center', fontFamily: "'Cairo','Tajawal',sans-serif" }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', margin: 0 }}>تأكيد الحذف</h2>
          <p style={{ fontSize: '.95rem', color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
            هل أنت متأكد من رغبتك في حذف المستخدم <strong>{user.full_name}</strong>؟
          </p>
          <span style={{
            color: '#dc2626', fontSize: '.85rem', fontWeight: 600,
            padding: '.3rem .75rem', background: '#fef2f2', borderRadius: '2rem',
          }}>
            لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
          </span>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem', width: '100%', justifyContent: 'center' }}>
            <button style={modalStyles.btnGhost} onClick={onClose} disabled={loading}>تراجع</button>
            <button style={{ ...modalStyles.btnDanger, flex: 1, justifyContent: 'center' }} onClick={onConfirm} disabled={loading}>
              {loading ? <><span style={modalStyles.spin} /> جاري الحذف…</> : 'نعم، احذف المستخدم'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.user);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [popup, setPopup] = useState(null); // { title, msg, type }

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [toggling, setToggling] = useState(null); // user id being toggled
  const [deleting, setDeleting] = useState(false);

  const showPopup = (title, msg = '', type = 'success') => {
    setPopup({ title, msg, type });
    setTimeout(() => setPopup(null), 2500);
  };

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get('/users')
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => setError('تعذّر تحميل بيانات المستخدمين.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Filter
  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.full_name?.includes(search) ||
      u.email?.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Counts per role
  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // Toggle active/inactive
  const handleToggle = async (user) => {
    setToggling(user.id);
    try {
      const endpoint = user.is_active ? 'deactivate' : 'activate';
      await api.patch(`/users/${user.id}/${endpoint}`);
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      );
      showPopup(
        user.is_active ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب',
        user.is_active ? `تم إيقاف حساب ${user.full_name} بنجاح` : `تم تفعيل حساب ${user.full_name} بنجاح`
      );
    } catch {
      showPopup('فشل العملية', 'فشل تغيير حالة الحساب', 'error');
    } finally {
      setToggling(null);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${delTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== delTarget.id));
      const name = delTarget.full_name;
      setDelTarget(null);
      showPopup('تم الحذف بنجاح', `تم حذف المستخدم ${name} من النظام`);
    } catch (err) {
      showPopup('فشل الحذف', err.response?.data?.error || 'تعذّر حذف المستخدم', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  return (
    <AppShell>
      {/* ── Success / Error Popup ── */}
      {popup && (
        <SuccessPopup
          title={popup.title}
          msg={popup.msg}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="page" dir="rtl">

        {/* ── Modals ── */}
        {showAdd && (
          <UserFormModal
            mode="add"
            onClose={() => setShowAdd(false)}
            onSaved={() => { fetchUsers(); showPopup('تم الإضافة بنجاح', 'تمت إضافة المستخدم الجديد إلى النظام'); }}
          />
        )}
        {editTarget && (
          <UserFormModal
            mode="edit"
            user={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={() => { fetchUsers(); showPopup('تم الحفظ بنجاح', 'تم تحديث بيانات المستخدم'); }}
          />
        )}
        <DeleteConfirmModal
          user={delTarget}
          onClose={() => setDelTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">إدارة المستخدمين</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${users.length} مستخدم · ${activeCount} نشط · ${inactiveCount} موقوف`}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={fetchUsers} title="تحديث">
              <IconRefresh />
            </button>
            <PrimaryButton onClick={() => setShowAdd(true)}>
              <IconPlus /> إضافة مستخدم
            </PrimaryButton>
          </div>
        </div>

        {/* ── Stat pills ── */}
        <div className="stat-pills">
          <StatPill label="الإجمالي"    count={users.length}          color="#1B5E8C" />
          <StatPill label="مدير عام"    count={roleCounts.gm || 0}    color="#7c3aed" />
          <StatPill label="مشرف أيتام"  count={roleCounts.supervisor || 0} color="#1d4ed8" />
          <StatPill label="مندوب"       count={roleCounts.agent || 0} color="#059669" />
          <StatPill label="قسم مالي"    count={roleCounts.finance || 0} color="#d97706" />
        </div>

        {/* ── Filters bar ── */}
        <div style={{
          display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center',
          background: '#fff', border: '1px solid #e5eaf0', borderRadius: '0.875rem',
          padding: '0.875rem 1rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', display: 'flex', pointerEvents: 'none',
            }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="ابحث بالاسم أو البريد الإلكتروني…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.55rem 2.25rem 0.55rem 2rem',
                border: '1.5px solid #e5e7eb', borderRadius: '0.625rem',
                fontFamily: "'Cairo', sans-serif", fontSize: '0.875rem', color: '#1f2937',
                background: '#fafafa', outline: 'none', direction: 'rtl',
                transition: 'border-color .15s, box-shadow .15s',
              }}
              onFocus={e => { e.target.style.borderColor='#1B5E8C'; e.target.style.boxShadow='0 0 0 3px rgba(27,94,140,.1)'; e.target.style.background='#fff'; }}
              onBlur={e  => { e.target.style.borderColor='#e5e7eb'; e.target.style.boxShadow='none'; e.target.style.background='#fafafa'; }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.2rem',
              }}><X size={16} /></button>
            )}
          </div>

          {/* Role tabs */}
          <div className="role-tabs">
            <button
              className={`rtab ${roleFilter === 'all' ? 'rtab-active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              الكل <span className="rtab-count">{users.length}</span>
            </button>
            {Object.entries(ROLE_MAP).map(([role, cfg]) => (
              <button
                key={role}
                className={`rtab ${roleFilter === role ? 'rtab-active' : ''}`}
                onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
                style={roleFilter === role ? { '--rc': cfg.color } : {}}
              >
                {cfg.label}
                <span className="rtab-count">{roleCounts[role] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && <div className="err-banner"><AlertTriangle size={18} /> {error}</div>}

        {/* ── Skeleton ── */}
        {loading && (
          <div className="table-wrap">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skel-row">
                <div className="skel" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ width: '45%', height: 14, marginBottom: 6 }} />
                  <div className="skel" style={{ width: '30%', height: 12 }} />
                </div>
                <div className="skel" style={{ width: 80, height: 22, borderRadius: '2rem' }} />
                <div className="skel" style={{ width: 60, height: 28, borderRadius: '.5rem' }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            <Users size={48} strokeWidth={1.2} color="#9ca3af" />
            <h3 className="empty-title">
              {search || roleFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا يوجد مستخدمون بعد'}
            </h3>
            <p className="empty-sub">
              {search || roleFilter !== 'all' ? 'جرّب تغيير معايير البحث' : 'ابدأ بإضافة مستخدم جديد'}
            </p>
            {!search && roleFilter === 'all' && (
              <PrimaryButton onClick={() => setShowAdd(true)}>
                + إضافة مستخدم
              </PrimaryButton>
            )}
          </div>
        )}

        {/* ── Table ── */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور</th>
                  <th>رقم الهاتف</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className={`trow ${!user.is_active ? 'trow-inactive' : ''}`}>
                      <td>
                        <div className="name-cell">
                          <div
                            className="avatar"
                            style={{
                              background: ROLE_MAP[user.role]
                                ? `linear-gradient(135deg, ${ROLE_MAP[user.role].color}cc, ${ROLE_MAP[user.role].color}88)`
                                : 'linear-gradient(135deg,#1B5E8C,#0d3d5c)',
                            }}
                          >
                            {user.full_name?.charAt(0) || '؟'}
                          </div>
                          <div>
                            <div className="name-text">
                              {user.full_name}
                              {isSelf && <span className="self-tag">أنت</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="muted ltr">{user.email}</td>
                      <td><RoleBadge role={user.role} /></td>
                      <td className="muted ltr">{user.phone || '—'}</td>
                      <td>
                        <StatusToggle
                          user={user}
                          currentUserId={currentUser?.id}
                          onToggle={handleToggle}
                          loading={toggling === user.id}
                        />
                      </td>
                      <td className="muted">{formatDate(user.created_at)}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => setEditTarget(user)}
                            title="تعديل"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              className="action-btn action-btn-del"
                              onClick={() => setDelTarget(user)}
                              title="حذف"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <div className="table-footer">
              عرض {filtered.length} من {users.length} مستخدم
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page {
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 4rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
        }

        /* ── Success / Error Popup ───────────────────────────────────── */
        .sp-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
          animation: fadeIn .2s ease;
        }
        .sp-box {
          background: #fff; border-radius: 1.25rem;
          padding: 2.5rem 2rem 2rem; width: 340px; max-width: 92vw;
          text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.2);
          animation: scaleIn .22s ease;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; align-items: center; gap: .75rem;
        }
        .sp-icon {
          width: 80px; height: 80px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: .25rem;
        }
        .sp-title {
          font-size: 1.2rem; font-weight: 800; color: #0d3d5c; margin: 0;
        }
        .sp-msg {
          font-size: .88rem; color: #6b7280; margin: 0; line-height: 1.6;
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }

        /* ── Header ───────────────────────────────────────────────────── */
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub { font-size: .82rem; color: #9ca3af; margin: 0; }
        .header-actions { display: flex; align-items: center; gap: .75rem; flex-shrink: 0; }
        .btn-refresh {
          display: flex; align-items: center; justify-content: center;
          width: 2.25rem; height: 2.25rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          background: #fff; color: #6b7280; cursor: pointer; transition: all .15s;
        }
        .btn-refresh:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }

        /* ── Stat pills ───────────────────────────────────────────────── */
        .stat-pills { display: flex; gap: .6rem; flex-wrap: wrap; }

        .role-tabs { display: flex; gap: .4rem; flex-wrap: wrap; }
        .rtab {
          display: inline-flex; align-items: center; gap: .35rem;
          padding: .4rem .85rem; border: 1.5px solid #e5eaf0; border-radius: 2rem;
          font-size: .78rem; font-weight: 600; color: #6b7280; background: #fff;
          cursor: pointer; transition: all .15s; font-family: 'Cairo', sans-serif;
        }
        .rtab:hover { border-color: #1B5E8C; color: #1B5E8C; }
        .rtab-active { border-color: var(--rc, #1B5E8C); background: var(--rc, #1B5E8C); color: #fff; }
        .rtab-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 4px; border-radius: 2rem;
          background: rgba(0,0,0,.12); color: inherit; font-size: .7rem; font-weight: 700;
        }

        /* ── Error ────────────────────────────────────────────────────── */
        .err-banner { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: .85rem 1rem; border-radius: .75rem; font-size: .85rem; }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .skel-row { display: flex; align-items: center; gap: 1rem; padding: .85rem 1.1rem; border-bottom: 1px solid #f8fafc; }
        .skel {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Empty ────────────────────────────────────────────────────── */
        .empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 300px; gap: .75rem; text-align: center;
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem; padding: 2rem;
        }
        .empty-title { font-size: 1.05rem; font-weight: 700; color: #374151; margin: 0; }
        .empty-sub { font-size: .85rem; color: #9ca3af; margin: 0; }

        /* ── Table ────────────────────────────────────────────────────── */
        .table-wrap { background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem; overflow: hidden; box-shadow: 0 1px 4px rgba(27,94,140,.05); }
        .table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .table thead tr { background: #f8fafc; }
        .table th { padding: .8rem 1.1rem; text-align: right; font-size: .72rem; font-weight: 700; color: #6b7a8d; border-bottom: 1px solid #e5eaf0; white-space: nowrap; }
        .table td { padding: .85rem 1.1rem; font-size: .83rem; border-bottom: 1px solid #f8fafc; vertical-align: middle; white-space: nowrap; }
        .trow:hover { background: #f8fbff; }
        .trow-inactive { opacity: .6; }
        .trow:last-child td { border-bottom: none; }

        .name-cell { display: flex; align-items: center; gap: .7rem; }
        .avatar {
          width: 38px; height: 38px; border-radius: 50%;
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: .95rem; font-weight: 700; flex-shrink: 0;
        }
        .name-text { font-weight: 700; color: #1f2937; display: flex; align-items: center; gap: .4rem; }
        .self-tag {
          font-size: .65rem; font-weight: 700; padding: .1rem .4rem; border-radius: 2rem;
          background: #dbeafe; color: #1d4ed8;
        }
        .muted { color: #6b7a8d; }
        .ltr { direction: ltr; text-align: left; }

        /* ── Status toggle ────────────────────────────────────────────── */
        .toggle-btn {
          display: inline-flex; align-items: center; gap: .35rem;
          padding: .3rem .75rem; border-radius: 2rem; font-size: .75rem; font-weight: 700;
          font-family: 'Cairo', sans-serif; border: 1.5px solid; cursor: pointer;
          transition: all .15s;
        }
        .toggle-on { background: #ecfdf5; color: #059669; border-color: #6ee7b7; }
        .toggle-on:hover:not(:disabled) { background: #d1fae5; }
        .toggle-off { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .toggle-off:hover:not(:disabled) { background: #fee2e2; }
        .toggle-btn:disabled { cursor: not-allowed; opacity: .5; }
        .toggle-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          background: currentColor;
        }

        /* ── Action buttons ───────────────────────────────────────────── */
        .action-btns { display: flex; gap: .4rem; }
        .action-btn {
          background: none; border: 1.5px solid #e5eaf0; border-radius: .5rem;
          padding: .4rem .5rem; font-size: .88rem; cursor: pointer; transition: all .15s;
          line-height: 1; display: inline-flex; align-items: center; justify-content: center;
          color: #6b7a8d;
        }
        .action-btn:hover { background: #f0f7ff; border-color: #1B5E8C; }
        .action-btn-del:hover { background: #fef2f2; border-color: #fca5a5; }

        .table-footer { padding: .75rem 1.1rem; font-size: .78rem; color: #9ca3af; border-top: 1px solid #f0f4f8; }

        /* ── Modal shared ─────────────────────────────────────────────── */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 50; animation: fadeIn .2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 460px; max-width: 95vw; background: #fff; border-radius: 1.25rem;
          z-index: 51; box-shadow: 0 20px 60px rgba(0,0,0,.2);
          animation: slideUp .22s ease; font-family: 'Cairo', 'Tajawal', sans-serif;
          max-height: 90vh; overflow-y: auto;
        }
        .modal-sm { width: 400px; }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f4f8; position: sticky; top: 0; background: #fff; z-index: 1; }
        .modal-title { font-size: 1.1rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .modal-close { background: #f3f4f6; border: none; font-size: 1.1rem; color: #6b7280; cursor: pointer; padding: .4rem; border-radius: 50%; transition: all .2s; display: flex; align-items: center; justify-content: center; }
        .modal-close:hover { background: #e5e7eb; color: #111827; transform: rotate(90deg); }
        .modal-body { display: flex; flex-direction: column; gap: 1.15rem; padding: 1.75rem; }
        .modal-foot { display: flex; gap: .75rem; justify-content: flex-end; padding-top: .75rem; border-top: 1px solid #f0f4f8; margin-top: .5rem; }
        .text-center { text-align: center; }

        /* Modal field helpers */
        .fg { display: flex; flex-direction: column; gap: .3rem; }
        .lbl { font-size: .82rem; font-weight: 600; color: #374151; }
        .req { color: #dc2626; }
        .opt { color: #94a3b8; font-weight: 400; font-size: .75rem; }
        .inp {
          border: 1.5px solid #d1d5db; border-radius: .625rem; padding: .65rem .9rem;
          font-size: .88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none; transition: border-color .15s, box-shadow .15s;
          width: 100%; box-sizing: border-box;
        }
        .inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color: #dc2626 !important; }
        .sel { appearance: none; cursor: pointer; }
        .ferr { font-size: .77rem; color: #dc2626; margin: 0; }
        .err-banner { display: flex; align-items: center; gap: .5rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: .625rem; padding: .65rem .85rem; font-size: .82rem; color: #b91c1c; font-weight: 500; }

        /* Delete modal */
        .delete-modal { overflow: visible; width: 420px; border-top: 4px solid #ef4444; }
        .delete-modal .modal-body { padding-top: 3.5rem; align-items: center; }
        .delete-icon-wrapper { width: 80px; height: 80px; border-radius: 50%; background: #fef2f2; color: #ef4444; display: flex; align-items: center; justify-content: center; position: absolute; top: -40px; left: 50%; transform: translateX(-50%); border: 4px solid #fff; box-shadow: 0 4px 12px rgba(239,68,68,.15); }
        .delete-title { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0 0 .5rem; }
        .delete-msg { font-size: .95rem; color: #4b5563; line-height: 1.6; margin: 0 0 1.5rem; }
        .delete-warning { color: #dc2626; font-size: .85rem; font-weight: 600; display: inline-block; margin-top: .5rem; padding: .3rem .75rem; background: #fef2f2; border-radius: 2rem; }
        .delete-foot { border-top: none; padding-top: 0; justify-content: center; gap: 1rem; margin-top: 0; width: 100%; }
        .delete-foot .btn-ghost { min-width: 100px; justify-content: center; }
        .delete-foot .btn-danger { flex: 1; justify-content: center; }

        .btn-ghost {
          display: inline-flex; align-items: center; padding: .7rem 1.25rem;
          background: none; color: #6b7280; font-family: 'Cairo', sans-serif;
          font-size: .88rem; font-weight: 600; border: 1.5px solid #e5eaf0;
          border-radius: .75rem; cursor: pointer; transition: all .15s;
        }
        .btn-ghost:hover:not(:disabled) { border-color: #9ca3af; color: #374151; }
        .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }

        .btn-danger {
          display: inline-flex; align-items: center; gap: .4rem; padding: .7rem 1.4rem;
          background: #dc2626; color: #fff; font-family: 'Cairo', sans-serif;
          font-size: .88rem; font-weight: 700; border: none; border-radius: .75rem;
          cursor: pointer; transition: background .15s;
        }
        .btn-danger:hover:not(:disabled) { background: #b91c1c; }
        .btn-danger:disabled { opacity: .65; cursor: not-allowed; }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .page-title { font-size: 1.3rem; }
        }
      `}</style>
    </AppShell>
  );
}
