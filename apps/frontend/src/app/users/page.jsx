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
import { AlertTriangle, X, Trash2, Edit2, Users, Search, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';

import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_MAP = {
  gm: { label: 'مدير عام', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', active: 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/30' },
  supervisor: { label: 'مشرف أيتام', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', active: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' },
  agent: { label: 'مندوب', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30' },
  finance: { label: 'قسم مالي', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', active: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/30' },
};

const ROLES_OPTIONS = [
  { value: 'agent', label: 'مندوب' },
  { value: 'supervisor', label: 'مشرف أيتام' },
  { value: 'finance', label: 'قسم مالي' },
  { value: 'gm', label: 'مدير عام' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

// ── SuccessPopup ───────────────────────────────────────────────────────────────

function SuccessPopup({ title, msg, type = 'success', onClose }) {
  const isSuccess = type === 'success';
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-white/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} 
        dir="rtl"
      >
        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full shadow-inner ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {isSuccess ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-500" strokeWidth={2} />
          ) : (
            <X className="h-10 w-10 text-red-500" strokeWidth={2} />
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        {msg && <p className="mt-2 text-sm text-slate-500 leading-relaxed">{msg}</p>}
      </div>
    </div>
  );
}

// ── StatPill ───────────────────────────────────────────────────────────────────

function StatPill({ label, count, roleKey }) {
  const cfg = roleKey ? ROLE_MAP[roleKey] : { color: 'text-slate-800' };
  
  return (
    <div className="group relative flex min-w-[90px] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <span className={`relative z-10 text-2xl font-black leading-none tracking-tight ${cfg.color}`}>
        {count}
      </span>
      <span className="relative z-10 whitespace-nowrap text-xs font-bold text-slate-500">
        {label}
      </span>
    </div>
  );
}

// ── RoleBadge ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_MAP[role] || { label: role, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${cfg.bg} ${cfg.color} ${cfg.border}`}>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 ${
        isActive 
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
      } ${isSelf || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm'}`}
      onClick={() => !isSelf && onToggle(user)}
      disabled={isSelf || loading}
      title={isSelf ? 'لا يمكنك إيقاف حسابك الخاص' : isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
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

  useEffect(() => {
    if (isEdit && user) {
      reset({ fullName: user.full_name, phone: user.phone || '', role: user.role });
    }
  }, [user?.id, isEdit, user, reset]);

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

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div 
        className="fixed left-1/2 top-1/2 z-[1001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl border border-white/40 animate-in slide-in-from-bottom-4 zoom-in-95" 
        dir="rtl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-5 backdrop-blur-md">
          <h2 className="text-lg font-extrabold text-slate-800">
            {isEdit ? `تعديل: ${user.full_name}` : 'إضافة مستخدم جديد'}
          </h2>
          <button 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900" 
            onClick={onClose} 
            aria-label="إغلاق"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-h-[80vh] flex-col gap-5 overflow-y-auto p-6">
          {apiErr && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertTriangle size={16} /> {apiErr}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">الاسم الكامل <span className="text-red-500">*</span></label>
            <input
              className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
              placeholder="الاسم الكامل"
              {...register('fullName', {
                required: 'الاسم مطلوب',
                minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
              })}
            />
            {errors.fullName && <p className="text-xs font-semibold text-red-500">{errors.fullName.message}</p>}
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">البريد الإلكتروني <span className="text-red-500">*</span></label>
              <input
                type="email"
                dir="ltr"
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                placeholder="user@example.com"
                {...register('email', {
                  required: 'البريد مطلوب',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد غير صحيح' },
                })}
              />
              {errors.email && <p className="text-xs font-semibold text-red-500">{errors.email.message}</p>}
            </div>
          )}

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">كلمة المرور <span className="text-red-500">*</span></label>
              <input
                type="password"
                dir="ltr"
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                placeholder="8 أحرف على الأقل"
                {...register('password', {
                  required: 'كلمة المرور مطلوبة',
                  minLength: { value: 8, message: '8 أحرف على الأقل' },
                })}
              />
              {errors.password && <p className="text-xs font-semibold text-red-500">{errors.password.message}</p>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">رقم الهاتف <span className="text-slate-400 font-normal">(اختياري)</span></label>
            <input
              dir="ltr"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="+967 7XX XXX XXX"
              {...register('phone')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">الدور <span className="text-red-500">*</span></label>
            <select
              className={`w-full appearance-none rounded-xl border px-4 py-2.5 pr-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${errors.role ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
              {...register('role', { required: 'الدور مطلوب' })}
            >
              {ROLES_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs font-semibold text-red-500">{errors.role.message}</p>}
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button 
              type="button" 
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50" 
              onClick={onClose} 
              disabled={saving}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-slate-900 to-slate-800 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/30 disabled:pointer-events-none disabled:opacity-70" 
              disabled={saving}
            >
              {saving ? (
                <><Spinner size="xs" variant="white" /> جارٍ الحفظ…</>
              ) : (
                isEdit ? 'حفظ التغييرات' : 'إضافة المستخدم'
              )}
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
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div 
        className="fixed left-1/2 top-1/2 z-[1001] w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-3xl border-t-4 border-red-500 bg-white/95 shadow-2xl backdrop-blur-xl animate-in zoom-in-95" 
        dir="rtl"
      >
        <div className="absolute -top-11 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-red-50 text-red-500 shadow-lg shadow-red-500/15">
          <AlertTriangle size={42} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col items-center gap-3 p-8 pt-14 text-center">
          <h2 className="text-xl font-extrabold text-slate-900">تأكيد الحذف</h2>
          <p className="text-sm font-medium leading-relaxed text-slate-600">
            هل أنت متأكد من رغبتك في حذف المستخدم <strong className="text-slate-900">{user.full_name}</strong>؟
          </p>
          <span className="mt-2 inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
          </span>
          <div className="mt-4 flex w-full items-center gap-3">
            <button 
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50" 
              onClick={onClose} 
              disabled={loading}
            >
              تراجع
            </button>
            <button 
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40 disabled:pointer-events-none disabled:opacity-70" 
              onClick={onConfirm} 
              disabled={loading}
            >
              {loading ? (
                <><Spinner size="xs" variant="white" /> جاري الحذف…</>
              ) : (
                'نعم، احذف المستخدم'
              )}
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
  const [popup, setPopup] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [toggling, setToggling] = useState(null);
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

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.full_name?.includes(search) ||
      u.email?.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

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
      {popup && (
        <SuccessPopup
          title={popup.title}
          msg={popup.msg}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="mx-auto max-w-[1100px] flex flex-col gap-6 pb-16 pt-4 font-cairo relative" dir="rtl">
        
        {/* Modals */}
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

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">إدارة المستخدمين</h1>
            <p className="text-sm font-medium text-slate-500">
              {loading ? 'جارٍ التحميل…' : `${users.length} مستخدم · ${activeCount} نشط · ${inactiveCount} موقوف`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button 
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/60 text-slate-500 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md" 
              onClick={fetchUsers} 
              title="تحديث"
            >
              <RefreshCw size={18} strokeWidth={2.5} />
            </button>
            <Button variant="primary" onClick={() => setShowAdd(true)} className="h-11">
              <Plus size={18} strokeWidth={2.5} /> إضافة مستخدم
            </Button>
          </div>
        </div>

        {/* Stat Pills */}
        <div className="flex flex-wrap gap-3">
          <StatPill label="الإجمالي" count={users.length} />
          <StatPill label="مدير عام" count={roleCounts.gm || 0} roleKey="gm" />
          <StatPill label="مشرف أيتام" count={roleCounts.supervisor || 0} roleKey="supervisor" />
          <StatPill label="مندوب" count={roleCounts.agent || 0} roleKey="agent" />
          <StatPill label="قسم مالي" count={roleCounts.finance || 0} roleKey="finance" />
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-md">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1">
            <span className="absolute right-3 top-1/2 flex -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search size={18} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="ابحث بالاسم أو البريد الإلكتروني…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 ${
                roleFilter === 'all' 
                  ? 'border-slate-800 bg-slate-800 text-white shadow-md shadow-slate-800/20' 
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
              onClick={() => setRoleFilter('all')}
            >
              الكل
              <span className={`flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] ${roleFilter === 'all' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                {users.length}
              </span>
            </button>
            {Object.entries(ROLE_MAP).map(([role, cfg]) => (
              <button
                key={role}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 ${
                  roleFilter === role ? cfg.active : `bg-white ${cfg.color} ${cfg.border} hover:bg-slate-50`
                }`}
                onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
              >
                {cfg.label}
                <span className={`flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] ${roleFilter === role ? 'bg-white/20' : 'bg-slate-100/50'}`}>
                  {roleCounts[role] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm">
            <AlertTriangle size={18} strokeWidth={2.5} /> {error}
          </div>
        )}

        {loading && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 shadow-sm backdrop-blur-md">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 border-b border-slate-100 p-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200/80" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-slate-200/80" />
                  <div className="h-3 w-1/4 animate-pulse rounded-full bg-slate-200/60" />
                </div>
                <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200/80" />
                <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-200/80" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200/60 bg-white/60 p-8 text-center shadow-sm backdrop-blur-md">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 shadow-inner">
              <Users size={40} strokeWidth={1.5} className="text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-800">
                {search || roleFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا يوجد مستخدمون بعد'}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                {search || roleFilter !== 'all' ? 'جرّب تغيير معايير البحث' : 'ابدأ بإضافة مستخدم جديد إلى النظام'}
              </p>
            </div>
            {!search && roleFilter === 'all' && (
              <div className="mt-2">
                <Button variant="primary" onClick={() => setShowAdd(true)}>
                  <Plus size={18} strokeWidth={2.5} /> إضافة مستخدم
                </Button>
              </div>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/60 shadow-xl shadow-slate-200/30 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">المستخدم</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">البريد الإلكتروني</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الدور</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">رقم الهاتف</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الحالة</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <tr key={user.id} className={`group transition-colors hover:bg-white/80 ${!user.is_active ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-sm font-bold text-white shadow-inner">
                              {user.full_name?.charAt(0) || '؟'}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                {user.full_name}
                                {isSelf && <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-700">أنت</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-left font-medium text-slate-600" dir="ltr">{user.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-left font-medium text-slate-500" dir="ltr">{user.phone || '—'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusToggle
                            user={user}
                            currentUserId={currentUser?.id}
                            onToggle={handleToggle}
                            loading={toggling === user.id}
                          />
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"
                              onClick={() => setEditTarget(user)}
                              title="تعديل"
                            >
                              <Edit2 size={14} strokeWidth={2.5} />
                            </button>
                            {!isSelf && (
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                                onClick={() => setDelTarget(user)}
                                title="حذف"
                              >
                                <Trash2 size={14} strokeWidth={2.5} />
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
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-xs font-bold text-slate-400">
              عرض {filtered.length} من {users.length} مستخدم
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
