const fs = require('fs');

let content = fs.readFileSync('d:/Githubrepo/ofsms/apps/frontend/src/app/users/page.jsx', 'utf8');

const oldModalRegex = /\/\/ ── DeleteConfirmModal ─────────────────────────────────────────────────────────[\s\S]*?function DeleteConfirmModal[\s\S]*?return \([\s\S]*?<>[\s\S]*?<div className="modal-backdrop"[\s\S]*?<div className="modal modal-sm".*?>[\s\S]*?<div className="modal-head".*?>[\s\S]*?<\/div>[\s\S]*?<div className="modal-body".*?>[\s\S]*?<p className="delete-msg"[\s\S]*?<\/p>[\s\S]*?<div className="modal-foot"[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/>\s*\);\s*}/;

const newModal = `// ── DeleteConfirmModal ─────────────────────────────────────────────────────────

function DeleteConfirmModal({ user, onClose, onConfirm, loading }) {
  if (!user) return null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal modal-sm delete-modal" dir="rtl">
        <div className="modal-body text-center">
          <div className="delete-icon-wrapper">
            <AlertTriangle size={42} strokeWidth={1.5} />
          </div>
          <h2 className="delete-title">تأكيد الحذف</h2>
          <p className="delete-msg">
            هل أنت متأكد من رغبتك في حذف المستخدم <strong>{user.full_name}</strong>؟
            <br/>
            <span className="delete-warning">لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</span>
          </p>
          <div className="modal-foot delete-foot">
            <button className="btn-ghost" onClick={onClose} disabled={loading}>تراجع</button>
            <button className="btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? <><span className="spin" /> جاري الحذف…</> : 'نعم، احذف المستخدم'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}`;

content = content.replace(oldModalRegex, newModal);

// Replace CSS
content = content.replace(
  /\.modal-title \{[^\}]+\}/,
  `.modal-title { font-size: 1.1rem; font-weight: 800; color: #0d3d5c; margin: 0; }`
);

content = content.replace(
  /\.modal-close \{[^\}]+\}/,
  `.modal-close { background: #f3f4f6; border: none; font-size: 1.1rem; color: #6b7280; cursor: pointer; padding: .4rem; border-radius: 50%; transition: all .2s; display: flex; align-items: center; justify-content: center; }`
);

content = content.replace(
  /\.modal-close:hover \{[^\}]+\}/,
  `.modal-close:hover { background: #e5e7eb; color: #111827; transform: rotate(90deg); }`
);

content = content.replace(
  /\.modal-body \{[^\}]+\}/,
  `.modal-body { display: flex; flex-direction: column; gap: 1.15rem; padding: 1.75rem; }`
);

content = content.replace(
  /\.modal-foot \{[^\}]+\}/,
  `.modal-foot { display: flex; gap: .75rem; justify-content: flex-end; padding-top: .75rem; border-top: 1px solid #f0f4f8; margin-top: .5rem; }\n        .text-center { text-align: center; }`
);

content = content.replace(
  /\/\* Delete msg \*\/\s*\.delete-msg\s*\{[^\}]+\}/,
  `/* Delete modal */
        .delete-modal { overflow: visible; width: 420px; border-top: 4px solid #ef4444; }
        .delete-icon-wrapper { width: 80px; height: 80px; border-radius: 50%; background: #fef2f2; color: #ef4444; display: flex; align-items: center; justify-content: center; margin: -40px auto 1rem; border: 4px solid #fff; box-shadow: 0 4px 12px rgba(239,68,68,.15); }
        .delete-title { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0 0 .5rem; }
        .delete-msg { font-size: .95rem; color: #4b5563; line-height: 1.6; margin: 0 0 1.5rem; }
        .delete-warning { color: #dc2626; font-size: .85rem; font-weight: 600; display: inline-block; margin-top: .5rem; padding: .3rem .75rem; background: #fef2f2; border-radius: 2rem; }
        .delete-foot { border-top: none; padding-top: 0; justify-content: center; gap: 1rem; margin-top: 0; }
        .delete-foot .btn-ghost { width: 100px; justify-content: center; }
        .delete-foot .btn-danger { flex: 1; justify-content: center; }`
);


fs.writeFileSync('d:/Githubrepo/ofsms/apps/frontend/src/app/users/page.jsx', content, 'utf8');
console.log('done');
