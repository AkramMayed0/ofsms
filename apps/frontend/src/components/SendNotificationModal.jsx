'use client';

/**
 * SendNotificationModal.jsx
 * GM only — compose and send a manual notification to:
 *   - All agents
 *   - All supervisors
 *   - All finance staff
 *   - Everyone (all roles)
 *   - Specific individual users (picked from a searchable list)
 *
 * API: POST /api/notifications/broadcast
 */

import { useState, useEffect } from 'react';
import api from '../lib/api';
import Button from '@/components/ui/Button';
import { UserRound, Eye, Banknote, Building2, Megaphone, Users, Search, CheckCircle, AlertTriangle, X, Check } from 'lucide-react';

// ── Role target options ────────────────────────────────────────────────────────
const ROLE_TARGETS = [
  { value: 'agent',      label: 'جميع المناديب',    icon: <UserRound size={18}/>, color: '#3b82f6' },
  { value: 'supervisor', label: 'جميع المشرفين',    icon: <Eye size={18}/>,       color: '#8b5cf6' },
  { value: 'finance',    label: 'القسم المالي',      icon: <Banknote size={18}/>,  color: '#059669' },
  { value: 'gm',         label: 'المديرون العامون', icon: <Building2 size={18}/>, color: '#f59e0b' },
  { value: 'all',        label: 'الجميع',            icon: <Megaphone size={18}/>, color: '#ef4444' },
];

// ── Character counter color ────────────────────────────────────────────────────
const charColor = (len) => {
  if (len > 450) return '#ef4444';
  if (len > 350) return '#f59e0b';
  return '#9ca3af';
};

export default function SendNotificationModal({ onClose, onSent }) {
  const [mode, setMode]         = useState('roles');   // 'roles' | 'users'
  const [message, setMessage]   = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [users, setUsers]       = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(null); // { recipients, delivered }

  // Load users when switching to individual mode
  useEffect(() => {
    if (mode !== 'users' || users.length > 0) return;
    setUsersLoading(true);
    api.get('/users')
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => setError('تعذّر تحميل قائمة المستخدمين'))
      .finally(() => setUsersLoading(false));
  }, [mode]);

  const toggleRole = (val) => {
    if (val === 'all') {
      // "all" is exclusive — selecting it clears others, deselecting it clears it
      setSelectedRoles((prev) => prev.includes('all') ? [] : ['all']);
      return;
    }
    setSelectedRoles((prev) =>
      prev.includes(val)
        ? prev.filter((r) => r !== val && r !== 'all')
        : [...prev.filter((r) => r !== 'all'), val]
    );
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const filteredUsers = users.filter((u) =>
    !userSearch ||
    u.full_name?.includes(userSearch) ||
    u.email?.includes(userSearch) ||
    u.role?.includes(userSearch)
  );

  const ROLE_LABEL_MAP = { agent: 'مندوب', supervisor: 'مشرف', finance: 'مالي', gm: 'مدير عام' };

  const canSend =
    message.trim().length >= 3 &&
    message.trim().length <= 500 &&
    (mode === 'roles' ? selectedRoles.length > 0 : selectedUsers.length > 0);

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError('');

    const payload = {
      message: message.trim(),
      ...(mode === 'roles'
        ? { targets: selectedRoles }
        : { userIds: selectedUsers }),
    };

    try {
      const { data } = await api.post('/notifications/broadcast', payload);
      setSuccess({ recipients: data.recipients, delivered: data.delivered });
      onSent?.();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'فشل إرسال الإشعار. يرجى المحاولة مجدداً'
      );
    } finally {
      setSending(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <>
        <div className="backdrop" onClick={onClose} />
        <div className="modal" dir="rtl">
          <div className="success-wrap">
            <div className="success-icon"><CheckCircle size={48} color="#10b981"/></div>
            <h3 className="success-title">تم الإرسال بنجاح</h3>
            <p className="success-body">
              تم إرسال الإشعار إلى{' '}
              <strong>{success.recipients}</strong> مستخدم
              {success.delivered < success.recipients && (
                <span className="success-note">
                  {' '}(تم التسليم لـ {success.delivered} — الباقون ليس لديهم أجهزة مسجّلة)
                </span>
              )}
            </p>
            <div className="success-msg-preview">{message}</div>
            <Button variant="primary" onClick={onClose}>إغلاق</Button>
          </div>
        </div>
        <Styles />
      </>
    );
  }

  // ── Main modal ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal" dir="rtl">

        {/* Header */}
        <div className="modal-head">
          <div className="modal-head-left">
            <span className="modal-head-icon"><Megaphone size={22} color="#fff"/></span>
            <div>
              <h2 className="modal-title">إرسال إشعار</h2>
              <p className="modal-sub">أرسل رسالة مباشرة للمناديب والمشرفين</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق"><X size={16} /></button>
        </div>

        <div className="modal-body">

          {/* ── Message composer ── */}
          <div className="field-group">
            <label className="field-label">
              نص الإشعار <span className="req">*</span>
            </label>
            <textarea
              className="field-textarea"
              rows={4}
              placeholder="اكتب نص الإشعار هنا… مثال: يرجى رفع تقارير هذا الشهر قبل يوم 25"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
              }}
              maxLength={500}
              autoFocus
            />
            <div className="char-row">
              <span style={{ color: charColor(message.length) }}>
                {message.length} / 500
              </span>
              {message.length < 3 && message.length > 0 && (
                <span className="char-warn">3 أحرف على الأقل</span>
              )}
            </div>
          </div>

          {/* ── Quick message templates ── */}
          <div className="templates">
            <span className="templates-label">رسائل سريعة:</span>
            <div className="template-chips">
              {[
                'يرجى رفع تقارير حفظ القرآن قبل نهاية الشهر',
                'اجتماع طارئ — يرجى التواجد غداً',
                'تذكير: موعد صرف المستحقات هذا الأسبوع',
                'يرجى مراجعة طلبات التسجيل المعلّقة',
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  className="template-chip"
                  onClick={() => { setMessage(t); setError(''); }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Mode tabs ── */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'roles' ? 'mode-tab-active' : ''}`}
              onClick={() => { setMode('roles'); setError(''); }}
            >
              <Users size={15} style={{display:'inline',verticalAlign:'middle',marginLeft:4}}/> إرسال حسب الدور
            </button>
            <button
              className={`mode-tab ${mode === 'users' ? 'mode-tab-active' : ''}`}
              onClick={() => { setMode('users'); setError(''); }}
            >
              <UserRound size={15} style={{display:'inline',verticalAlign:'middle',marginLeft:4}}/> إرسال لأفراد محددين
            </button>
          </div>

          {/* ── Role selection ── */}
          {mode === 'roles' && (
            <div className="role-grid">
              {ROLE_TARGETS.map(({ value, label, icon, color }) => {
                const active = selectedRoles.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`role-card ${active ? 'role-card-active' : ''}`}
                    style={active ? { borderColor: color, background: `${color}10` } : {}}
                    onClick={() => toggleRole(value)}
                    aria-pressed={active}
                  >
                    <span className="role-card-icon"
                      style={{ background: active ? `${color}20` : '#f3f4f6', color: active ? color : '#6b7280' }}>
                      {icon}
                    </span>
                    <span className="role-card-label" style={{ color: active ? color : '#374151' }}>
                      {label}
                    </span>
                    {active && (
                      <span className="role-card-check" style={{ color }}><Check size={16} /></span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Individual user selection ── */}
          {mode === 'users' && (
            <div className="users-section">
              <div className="search-wrap">
                <Search size={15} style={{position:'absolute',right:'.85rem',pointerEvents:'none',color:'#9ca3af'}}/>
                <input
                  className="search-inp"
                  placeholder="ابحث بالاسم أو البريد…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {userSearch && (
                  <button className="search-clear" onClick={() => setUserSearch('')}><X size={16} /></button>
                )}
              </div>

              {usersLoading ? (
                <div className="users-loading">
                  {[1,2,3].map((i) => (
                    <div key={i} className="user-skel">
                      <div className="skel skel-avatar" />
                      <div>
                        <div className="skel skel-name" />
                        <div className="skel skel-role" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="users-list">
                  {filteredUsers.length === 0 ? (
                    <p className="users-empty">لا يوجد مستخدمون مطابقون</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const checked = selectedUsers.includes(u.id);
                      return (
                        <label key={u.id} className={`user-row ${checked ? 'user-row-checked' : ''}`}>
                          <input
                            type="checkbox"
                            className="user-checkbox"
                            checked={checked}
                            onChange={() => toggleUser(u.id)}
                          />
                          <div className="user-avatar">
                            {u.full_name?.charAt(0) || '؟'}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{u.full_name}</span>
                            <span className="user-role-tag">
                              {ROLE_LABEL_MAP[u.role] || u.role}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div className="selected-summary">
                  تم تحديد <strong>{selectedUsers.length}</strong> مستخدم
                  <button className="clear-selection" onClick={() => setSelectedUsers([])}>
                    مسح التحديد
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-banner">
              <AlertTriangle size={15}/> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!canSend || sending}
          >
            {sending ? (
              <><span className="spin" aria-hidden />جارٍ الإرسال…</>
            ) : (
              <>
                <Megaphone size={16}/> إرسال
                {mode === 'roles' && selectedRoles.length > 0 && (
                  <span className="send-count">
                    ({selectedRoles.includes('all') ? 'للجميع' : selectedRoles.length + ' أدوار'})
                  </span>
                )}
                {mode === 'users' && selectedUsers.length > 0 && (
                  <span className="send-count">({selectedUsers.length} مستخدم)</span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      <Styles />
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      .backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,.45);
        backdrop-filter: blur(2px); z-index: 50;
        animation: fadeIn .18s ease;
      }
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

      .modal {
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: min(560px, 95vw);
        max-height: 90vh;
        background: #fff;
        border-radius: 1.25rem;
        z-index: 51;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 40px rgba(0,0,0,.18);
        animation: popIn .2s ease;
        font-family: 'Cairo','Tajawal',sans-serif;
      }
      @keyframes popIn {
        from { opacity:0; transform:translate(-50%,-50%) scale(.96) }
        to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
      }

      /* Header */
      .modal-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 1rem; padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f0f4f8;
      }
      .modal-head-left { display: flex; align-items: center; gap: .85rem; }
      .modal-head-icon {
        width: 44px; height: 44px; border-radius: 12px;
        background: linear-gradient(135deg,#1B5E8C,#0d3d5c);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.3rem; flex-shrink: 0;
      }
      .modal-title { font-size: 1rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .1rem; }
      .modal-sub   { font-size: .75rem; color: #9ca3af; margin: 0; }
      .modal-close {
        background: none; border: none; font-size: 1.1rem; color: #9ca3af;
        cursor: pointer; padding: .25rem .4rem; border-radius: 6px; transition: all .15s;
      }
      .modal-close:hover { background: #f3f4f6; color: #374151; }

      /* Body */
      .modal-body {
        flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;
        display: flex; flex-direction: column; gap: 1.1rem;
      }

      /* Field group */
      .field-group { display: flex; flex-direction: column; gap: .35rem; }
      .field-label { font-size: .82rem; font-weight: 600; color: #374151; }
      .req { color: #dc2626; }
      .field-textarea {
        border: 1.5px solid #d1d5db; border-radius: .75rem;
        padding: .75rem .9rem; font-size: .88rem;
        font-family: 'Cairo',sans-serif; color: #1f2937;
        background: #fafafa; outline: none; resize: vertical;
        min-height: 100px; box-sizing: border-box; width: 100%;
        transition: border-color .15s, box-shadow .15s;
      }
      .field-textarea:focus {
        border-color: #1B5E8C; background: #fff;
        box-shadow: 0 0 0 3px rgba(27,94,140,.1);
      }
      .char-row {
        display: flex; align-items: center; justify-content: space-between;
        font-size: .72rem;
      }
      .char-warn { color: #f59e0b; font-weight: 600; }

      /* Templates */
      .templates { display: flex; flex-direction: column; gap: .45rem; }
      .templates-label { font-size: .72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .04em; }
      .template-chips { display: flex; flex-wrap: wrap; gap: .35rem; }
      .template-chip {
        font-family: 'Cairo',sans-serif; font-size: .73rem; font-weight: 600;
        padding: .3rem .7rem; border: 1.5px solid #e5eaf0;
        border-radius: 2rem; background: #fafafa; color: #374151;
        cursor: pointer; transition: all .15s; text-align: right;
      }
      .template-chip:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }

      /* Mode tabs */
      .mode-tabs { display: flex; gap: .4rem; }
      .mode-tab {
        flex: 1; padding: .55rem 1rem; border: 1.5px solid #e5eaf0;
        border-radius: .625rem; font-family: 'Cairo',sans-serif;
        font-size: .83rem; font-weight: 600; color: #6b7280;
        background: #fafafa; cursor: pointer; transition: all .15s;
      }
      .mode-tab:hover { border-color: #1B5E8C; color: #1B5E8C; }
      .mode-tab-active { border-color: #1B5E8C; background: #1B5E8C; color: #fff; }

      /* Role grid */
      .role-grid {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: .6rem;
      }
      .role-card {
        display: flex; align-items: center; gap: .65rem;
        padding: .75rem .9rem; border: 1.5px solid #e5eaf0;
        border-radius: .875rem; background: #fafafa;
        cursor: pointer; transition: all .15s; text-align: right;
        position: relative;
      }
      .role-card:hover { border-color: #9ca3af; }
      .role-card-active { box-shadow: 0 0 0 2px currentColor; }
      .role-card-icon {
        width: 36px; height: 36px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem; flex-shrink: 0; transition: all .15s;
      }
      .role-card-label { flex: 1; font-size: .83rem; font-weight: 700; }
      .role-card-check {
        font-size: .9rem; font-weight: 800; flex-shrink: 0;
      }

      /* Users section */
      .users-section { display: flex; flex-direction: column; gap: .65rem; }
      .search-wrap { position: relative; display: flex; align-items: center; }
      .search-icon { position: absolute; right: .85rem; font-size: .85rem; pointer-events: none; color: #9ca3af; }
      .search-inp {
        width: 100%; border: 1.5px solid #d1d5db; border-radius: .625rem;
        padding: .55rem .9rem .55rem 2.2rem; padding-right: 2.4rem;
        font-size: .85rem; font-family: 'Cairo',sans-serif;
        background: #fafafa; outline: none; box-sizing: border-box;
        transition: border-color .15s;
      }
      .search-inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
      .search-clear {
        position: absolute; left: .75rem; background: none; border: none;
        cursor: pointer; color: #9ca3af; font-size: .8rem;
      }

      .users-list {
        max-height: 200px; overflow-y: auto;
        border: 1.5px solid #e5eaf0; border-radius: .75rem;
        background: #fafafa;
      }
      .user-row {
        display: flex; align-items: center; gap: .65rem;
        padding: .6rem .85rem; cursor: pointer; transition: background .12s;
        border-bottom: 1px solid #f3f4f6;
      }
      .user-row:last-child { border-bottom: none; }
      .user-row:hover { background: #f0f7ff; }
      .user-row-checked { background: #eff6ff; }
      .user-checkbox { width: 16px; height: 16px; accent-color: #1B5E8C; flex-shrink: 0; cursor: pointer; }
      .user-avatar {
        width: 32px; height: 32px; border-radius: 50%;
        background: linear-gradient(135deg,#1B5E8C,#0d3d5c);
        color: #fff; font-size: .82rem; font-weight: 700;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .user-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
      .user-name { font-size: .83rem; font-weight: 600; color: #1f2937; }
      .user-role-tag {
        font-size: .68rem; font-weight: 700; padding: .1rem .45rem;
        border-radius: 2rem; background: #f0f4f8; color: #6b7280;
      }
      .users-empty { font-size: .82rem; color: #9ca3af; text-align: center; padding: 1.5rem; margin: 0; }
      .users-loading { display: flex; flex-direction: column; gap: .5rem; }
      .user-skel { display: flex; gap: .65rem; align-items: center; padding: .6rem; }
      .skel {
        background: linear-gradient(90deg,#f3f4f6 25%,#e9ecef 50%,#f3f4f6 75%);
        background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px;
      }
      .skel-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
      .skel-name  { width: 110px; height: 12px; margin-bottom: 5px; }
      .skel-role  { width: 60px; height: 10px; }
      @keyframes shimmer { to { background-position: -200% 0; } }

      .selected-summary {
        display: flex; align-items: center; justify-content: space-between;
        font-size: .78rem; color: #1B5E8C; font-weight: 600;
        background: #eff6ff; border: 1px solid #bfdbfe;
        border-radius: .5rem; padding: .45rem .75rem;
      }
      .clear-selection {
        background: none; border: none; font-family: 'Cairo',sans-serif;
        font-size: .72rem; color: #9ca3af; cursor: pointer; transition: color .15s;
      }
      .clear-selection:hover { color: #dc2626; }

      /* Error */
      .error-banner {
        display: flex; align-items: center; gap: .5rem;
        background: #fef2f2; border: 1px solid #fecaca;
        border-radius: .625rem; padding: .65rem .85rem;
        font-size: .82rem; color: #b91c1c; font-weight: 500;
      }

      /* Footer */
      .modal-foot {
        display: flex; gap: .75rem; justify-content: flex-end;
        padding: 1rem 1.5rem; border-top: 1px solid #f0f4f8;
      }
      .send-count { font-size: .75rem; opacity: .8; }

      /* Spinner */
      .spin {
        display: inline-block; width: 14px; height: 14px;
        border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
        border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Success screen */
      .success-wrap {
        display: flex; flex-direction: column; align-items: center;
        text-align: center; padding: 2.5rem 2rem; gap: .75rem;
      }
      .success-icon { font-size: 3rem; }
      .success-title { font-size: 1.2rem; font-weight: 800; color: #0d3d5c; margin: 0; }
      .success-body { font-size: .88rem; color: #6b7a8d; margin: 0; line-height: 1.7; }
      .success-note { font-size: .78rem; color: #f59e0b; }
      .success-msg-preview {
        background: #f8fafc; border: 1px solid #e5eaf0; border-radius: .75rem;
        padding: .85rem 1rem; font-size: .85rem; color: #374151;
        font-style: italic; max-width: 100%; text-align: right; width: 100%;
        box-sizing: border-box;
      }
    `}</style>
  );
}
