const fs = require('fs');

let content = fs.readFileSync('d:/Githubrepo/ofsms/apps/frontend/src/app/users/page.jsx', 'utf8');

// Replace UserFormModal
const oldUserFormModal = `function UserFormModal({ mode, user, onClose, onSaved }) {
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
        await api.patch(\`/users/\${user.id}\`, {
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
            {isEdit ? \`تعديل: \${user.full_name}\` : 'إضافة مستخدم جديد'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-body">
          {apiErr && (
            <div className="err-banner">
              <span><AlertTriangle size={18} /></span> {apiErr}
            </div>
          )}

          {/* Full name */}
          <div className="fg">
            <label className="lbl">الاسم الكامل <span className="req">*</span></label>
            <input
              className={\`inp \${errors.fullName ? 'inp-err' : ''}\`}
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
                className={\`inp ltr \${errors.email ? 'inp-err' : ''}\`}
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
                className={\`inp ltr \${errors.password ? 'inp-err' : ''}\`}
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
              className={\`inp sel \${errors.role ? 'inp-err' : ''}\`}
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
}`;

const newUserFormModal = `function UserFormModal({ mode, user, onClose, onSaved }) {
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
  }, [user?.id, isEdit, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setApiErr('');
    try {
      if (isEdit) {
        await api.patch(\`/users/\${user.id}\`, {
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
      <div className="modal modal-lg" dir="rtl">
        <div className="modal-head modal-head-blue">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span className="modal-icon-blue"><User size={20} /></span>
            <h2 className="modal-title">
              {isEdit ? \`تعديل مستخدم: \${user.full_name}\` : 'إضافة مستخدم جديد'}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-body">
          {apiErr && (
            <div className="err-banner">
              <span><AlertTriangle size={18} /></span> {apiErr}
            </div>
          )}

          <div className="form-grid">
            <div className="fg fg-full">
              <label className="lbl">الاسم الكامل <span className="req">*</span></label>
              <input
                className={\`inp \${errors.fullName ? 'inp-err' : ''}\`}
                placeholder="الاسم الكامل للموظف أو المندوب"
                {...register('fullName', {
                  required: 'الاسم مطلوب',
                  minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
                })}
              />
              {errors.fullName && <p className="ferr">{errors.fullName.message}</p>}
            </div>

            {!isEdit && (
              <div className="fg">
                <label className="lbl">البريد الإلكتروني <span className="req">*</span></label>
                <input
                  type="email"
                  className={\`inp ltr \${errors.email ? 'inp-err' : ''}\`}
                  placeholder="user@example.com"
                  {...register('email', {
                    required: 'البريد مطلوب',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد غير صحيح' },
                  })}
                />
                {errors.email && <p className="ferr">{errors.email.message}</p>}
              </div>
            )}

            {!isEdit && (
              <div className="fg">
                <label className="lbl">كلمة المرور <span className="req">*</span></label>
                <input
                  type="password"
                  className={\`inp ltr \${errors.password ? 'inp-err' : ''}\`}
                  placeholder="8 أحرف على الأقل"
                  {...register('password', {
                    required: 'كلمة المرور مطلوبة',
                    minLength: { value: 8, message: '8 أحرف على الأقل' },
                  })}
                />
                {errors.password && <p className="ferr">{errors.password.message}</p>}
              </div>
            )}

            <div className="fg">
              <label className="lbl">رقم الهاتف <span className="opt">(اختياري)</span></label>
              <input
                className="inp ltr"
                placeholder="+967 7XX XXX XXX"
                {...register('phone')}
              />
            </div>

            <div className="fg">
              <label className="lbl">الدور <span className="req">*</span></label>
              <select
                className={\`inp sel \${errors.role ? 'inp-err' : ''}\`}
                {...register('role', { required: 'الدور مطلوب' })}
              >
                {ROLES_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {errors.role && <p className="ferr">{errors.role.message}</p>}
            </div>
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
}`;

content = content.replace(oldUserFormModal, newUserFormModal);


const oldDeleteModal = `function DeleteConfirmModal({ user, onClose, onConfirm, loading }) {
  if (!user) return null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal modal-sm" dir="rtl">
        <div className="modal-head">
          <h2 className="modal-title">حذف المستخدم</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
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
}`;

const newDeleteModal = `function DeleteConfirmModal({ user, onClose, onConfirm, loading }) {
  if (!user) return null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal modal-sm" dir="rtl">
        <div className="modal-head-warn">
          <div className="warn-icon-wrapper"><AlertTriangle size={28} /></div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body-warn">
          <h2 className="modal-title-warn">حذف المستخدم</h2>
          <p className="delete-msg">
            هل أنت متأكد من حذف حساب <strong>{user.full_name}</strong>؟
            <br/>
            لا يمكن التراجع عن هذا الإجراء وسيتم مسح بيانات تسجيل الدخول الخاصة به.
          </p>
          <div className="modal-foot-warn">
            <button className="btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
            <button className="btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? <><span className="spin" /> جارٍ الحذف…</> : 'تأكيد الحذف'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}`;

content = content.replace(oldDeleteModal, newDeleteModal);

content = content.replace('<div style={{ fontSize: \'3rem\' }}>👥</div>', '<div style={{ fontSize: \'3rem\', color: \'#cbd5e1\' }}><Users size={48} /></div>');

content = content.replace(/✏️/g, '<Edit2 size={15} />');
content = content.replace(/🗑️/g, '<Trash2 size={15} />');


const oldStyles = `/* ── Modal shared ─────────────────────────────────────────────── */
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
        .delete-msg { font-size: .88rem; color: #374151; line-height: 1.7; margin: 0 0 1rem; }`;

const newStyles = `/* ── Modal shared ─────────────────────────────────────────────── */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 50; animation: fadeIn .2s ease; backdrop-filter: blur(3px); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 500px; max-width: 95vw; background: #fff; border-radius: 1.25rem;
          z-index: 51; box-shadow: 0 24px 60px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.05);
          animation: slideUp .25s cubic-bezier(0.16, 1, 0.3, 1); font-family: 'Cairo', 'Tajawal', sans-serif;
          max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column;
        }
        .modal-sm { width: 420px; }
        .modal-lg { width: 640px; }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f4f8; position: sticky; top: 0; background: #fff; z-index: 1; border-radius: 1.25rem 1.25rem 0 0; }
        .modal-head-blue { background: #f8fbff; border-bottom: 1px solid #e0e7ff; }
        .modal-icon-blue { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: #dbeafe; color: #1d4ed8; border-radius: 50%; }
        .modal-title { font-size: 1.1rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .modal-close { background: none; border: none; font-size: 1.1rem; color: #9ca3af; cursor: pointer; padding: .4rem; border-radius: .5rem; transition: all .15s; display: flex; align-items: center; justify-content: center; }
        .modal-close:hover { background: #f3f4f6; color: #374151; }
        
        .modal-body { display: flex; flex-direction: column; gap: 1.1rem; padding: 1.5rem; }
        
        /* Form grid */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
        .form-grid .fg-full { grid-column: 1 / -1; }
        
        .modal-foot { display: flex; gap: .75rem; justify-content: flex-end; padding-top: .75rem; border-top: 1px solid #f0f4f8; margin-top: .5rem; }

        /* Warning modal (Delete) */
        .modal-head-warn { position: relative; padding: 2rem 1.5rem 0; text-align: center; }
        .modal-head-warn .modal-close { position: absolute; top: 1rem; left: 1.5rem; }
        .warn-icon-wrapper { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #fef2f2; color: #dc2626; border-radius: 50%; margin-bottom: 1rem; box-shadow: 0 0 0 8px #fff5f5; }
        .modal-body-warn { padding: 0 1.5rem 1.5rem; text-align: center; display: flex; flex-direction: column; gap: .75rem; }
        .modal-title-warn { font-size: 1.25rem; font-weight: 800; color: #1f2937; margin: 0; }
        .delete-msg { font-size: .92rem; color: #6b7280; line-height: 1.7; margin: 0 0 1rem; }
        .delete-msg strong { color: #111827; }
        .modal-foot-warn { display: flex; gap: .75rem; justify-content: center; width: 100%; margin-top: .5rem; }
        .modal-foot-warn button { flex: 1; justify-content: center; }

        /* Modal field helpers */
        .fg { display: flex; flex-direction: column; gap: .35rem; }
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
        .err-banner { display: flex; align-items: center; gap: .5rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: .625rem; padding: .65rem .85rem; font-size: .82rem; color: #b91c1c; font-weight: 500; }`;

content = content.replace(oldStyles, newStyles);

fs.writeFileSync('d:/Githubrepo/ofsms/apps/frontend/src/app/users/page.jsx', content);
