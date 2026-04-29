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
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_MAP = {
  gm:         { label: 'مدير عام',       color: '#7c3aed', bg: '#f5f3ff' },
  supervisor: { label: 'مشرف أيتام',    color: '#1d4ed8', bg: '#eff6ff' },
  agent:      { label: 'مندوب',           color: '#059669', bg: '#ecfdf5' },
  finance:    { label: 'قسم مالي',       color: '#d97706', bg: '#fffbeb' },
};

const ROLES_OPTIONS = [
  { value: 'agent',      label: 'مندوب' },
  { value: 'supervisor', label: 'مشرف أيتام' },
  { value: 'finance',    label: 'قسم مالي' },
  { value: 'gm',        label: 'مدير عام' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

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

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" dir="rtl">
        <div className="modal-head">
          <h2 className="modal-title">
            {isEdit ? `تعديل: ${user.full_name}` : 'إضافة مستخدم جديد'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-body">
          {apiErr && (
            <div className="err-banner">
              <span>⚠</span> {apiErr}
            </div>
          )}

          {/* Full name */}
          <div className="fg">
            <label className="lbl">الاسم الكامل <span className="req">*</span></label>
            <input
              className={`inp ${errors.fullName ? 'inp-err' : ''}`}
              placeholder="الاسم الكامل"
              {...register('fullName', {
                required: 'الاسم مطلوب',
                minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
              })}
            />
            {errors.fullName && <p className="ferr">{errors.fullName.message}</p>}
          </div>

          {/* Email — only for create */}
          {!isEdit && (
            <div className="fg">
              <label className="lbl">البريد الإلكتروني <span className="req">*</span></label>
              <input
                type="email"
                className={`inp ltr ${errors.email ? 'inp-err' : ''}`}
                placeholder="user@example.com"
                {...register('email', {
                  required: 'البريد مطلوب',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد غير صحيح' },
                })}
              />
              {errors.email && <p className="ferr">{errors.email.message}</p>}
            </div>
          )}

          {/* Password — only for create */}
          {!isEdit && (
            <div className="fg">
              <label className="lbl">كلمة المرور <span className="req">*</span></label>
              <input
                type="password"
                className={`inp ltr ${errors.password ? 'inp-err' : ''}`}
                placeholder="8 أحرف على الأقل"
                {...register('password', {
                  required: 'كلمة المرور مطلوبة',
                  minLength: { value: 8, message: '8 أحرف على الأقل' },
                })}
              />
              {errors.password && <p className="ferr">{errors.password.message}</p>}
            </div>
          )}

          {/* Phone */}
          <div className="fg">
            <label className="lbl">رقم الهاتف <span className="opt">(اختياري)</span></label>
            <input
              className="inp ltr"
              placeholder="+967 7XX XXX XXX"
              {...register('phone')}
            />
          </div>

          {/* Role */}
          <div className="fg">
            <label className="lbl">الدور <span className="req">*</span></label>
            <select
              className={`inp sel ${errors.role ? 'inp-err' : ''}`}
              {...register('role', { required: 'الدور مطلوب' })}
            >
              {ROLES_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <p className="ferr">{errors.role.message}</p>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              إلغاء
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? <><span className="spin" /> جارٍ الحفظ…</>
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
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal modal-sm" dir="rtl">
        <div className="modal-head">
          <h2 className="modal-title">حذف المستخدم</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-msg">
            هل أنت متأكد من حذف <strong>{user.full_name}</strong>؟
            هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
            <button className="btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? <><span className="spin" /> جارٍ الحذف…</> : 'نعم، احذف'}
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

  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast]           = useState(null);

  // Modals
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [toggling,   setToggling]   = useState(null); // user id being toggled
  const [deleting,   setDeleting]   = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
      showToast(user.is_active ? `تم إيقاف حساب ${user.full_name}` : `تم تفعيل حساب ${user.full_name}`);
    } catch {
      showToast('فشل تغيير حالة الحساب', 'error');
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
      setDelTarget(null);
      showToast(`تم حذف ${delTarget.full_name}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل الحذف', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const activeCount   = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* ── Toast ── */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </div>
        )}

        {/* ── Modals ── */}
        {showAdd && (
          <UserFormModal
            mode="add"
            onClose={() => setShowAdd(false)}
            onSaved={() => { fetchUsers(); showToast('تم إضافة المستخدم بنجاح'); }}
          />
        )}
        {editTarget && (
          <UserFormModal
            mode="edit"
            user={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={() => { fetchUsers(); showToast('تم تحديث بيانات المستخدم'); }}
          />
        )}
        <DeleteConfirmModal
          user={delTarget}
          onClose={() => setDelTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />

        {/* ── Header ── */}
        <div className="page-top">
          <div>
            <h1 className="page-title">إدارة المستخدمين</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${users.length} مستخدم · ${activeCount} نشط · ${inactiveCount} موقوف`}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + إضافة مستخدم
          </button>
        </div>

        {/* ── Stats chips ── */}
        {!loading && (
          <div className="stats-row">
            {Object.entries(ROLE_MAP).map(([role, cfg]) => (
              <div
                key={role}
                className="stat-chip"
                style={{ borderColor: `${cfg.color}30`, background: cfg.bg }}
              >
                <span className="chip-count" style={{ color: cfg.color }}>
                  {roleCounts[role] || 0}
                </span>
                <span className="chip-label" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + filter ── */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-inp"
              placeholder="ابحث بالاسم أو البريد الإلكتروني…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
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
        {error && <div className="err-banner">⚠ {error}</div>}

        {/* ── Skeleton ── */}
        {loading && (
          <div className="table-wrap">
            {[1,2,3,4,5].map(i => (
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
            <div style={{ fontSize: '3rem' }}>👥</div>
            <h3 className="empty-title">
              {search || roleFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا يوجد مستخدمون بعد'}
            </h3>
            <p className="empty-sub">
              {search || roleFilter !== 'all' ? 'جرّب تغيير معايير البحث' : 'ابدأ بإضافة مستخدم جديد'}
            </p>
            {!search && roleFilter === 'all' && (
              <button className="btn-primary" onClick={() => setShowAdd(true)}>
                + إضافة مستخدم
              </button>
            )}
          </div>
        )}

        {/* ── Table ── */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
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
                            ✏️
                          </button>
                          {!isSelf && (
                            <button
                              className="action-btn action-btn-del"
                              onClick={() => setDelTarget(user)}
                              title="حذف"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

        /* ── Toast ───────────────────────────────────────────────────── */
        .toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          z-index: 200; padding: .75rem 1.5rem; border-radius: 2rem;
          font-size: .88rem; font-weight: 600; white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,.15);
          animation: toastIn .25s ease;
        }
        .toast-success { background: #0d3d5c; color: #fff; }
        .toast-error   { background: #dc2626; color: #fff; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Header ───────────────────────────────────────────────────── */
        .page-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub { font-size: .85rem; color: #6b7a8d; margin: 0; }

        /* ── Stats chips ──────────────────────────────────────────────── */
        .stats-row { display: flex; gap: .65rem; flex-wrap: wrap; }
        .stat-chip {
          display: flex; align-items: center; gap: .4rem;
          padding: .45rem 1rem; border-radius: 2rem; border: 1.5px solid;
        }
        .chip-count { font-size: 1.1rem; font-weight: 800; font-family: 'Cairo', sans-serif; }
        .chip-label { font-size: .78rem; font-weight: 600; }

        /* ── Toolbar ──────────────────────────────────────────────────── */
        .toolbar { display: flex; flex-direction: column; gap: .75rem; }
        .search-wrap { position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; right: .85rem; font-size: .9rem; pointer-events: none; }
        .search-inp {
          width: 100%; border: 1.5px solid #d1d5db; border-radius: .75rem;
          padding: .65rem .9rem .65rem 2.5rem; padding-right: 2.4rem;
          font-size: .88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .search-inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .search-clear { position: absolute; left: .75rem; background: none; border: none; cursor: pointer; color: #9ca3af; }

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
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

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
        .table { width: 100%; border-collapse: collapse; }
        .table thead tr { background: #f8fafc; }
        .table th { padding: .8rem 1.1rem; text-align: right; font-size: .72rem; font-weight: 700; color: #6b7a8d; border-bottom: 1px solid #e5eaf0; white-space: nowrap; }
        .table td { padding: .85rem 1.1rem; font-size: .83rem; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
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
          padding: .3rem .5rem; font-size: .88rem; cursor: pointer; transition: all .15s;
          line-height: 1;
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
        .modal-title { font-size: 1rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .modal-close { background: none; border: none; font-size: 1.1rem; color: #9ca3af; cursor: pointer; padding: .2rem .35rem; border-radius: 6px; transition: all .15s; }
        .modal-close:hover { background: #f3f4f6; color: #374151; }
        .modal-body { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; }
        .modal-foot { display: flex; gap: .75rem; justify-content: flex-end; padding-top: .5rem; border-top: 1px solid #f0f4f8; margin-top: .5rem; }

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

        /* Delete msg */
        .delete-msg { font-size: .88rem; color: #374151; line-height: 1.7; margin: 0 0 1rem; }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .btn-primary {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .7rem 1.4rem; background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-family: 'Cairo', sans-serif; font-size: .9rem; font-weight: 700;
          border: none; border-radius: .75rem; cursor: pointer;
          box-shadow: 0 2px 8px rgba(27,94,140,.25); transition: all .15s;
        }
        .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #2E7EB8, #1B5E8C); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: .65; cursor: not-allowed; }

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
          .page-top { flex-direction: column; }
          .table th:nth-child(4), .table td:nth-child(4),
          .table th:nth-child(6), .table td:nth-child(6) { display: none; }
        }
      `}</style>
    </AppShell>
  );
}
