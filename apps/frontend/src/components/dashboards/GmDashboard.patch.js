// ─────────────────────────────────────────────────────────────────
// PATCH for GmDashboard.jsx
// Add these 3 changes to apps/frontend/src/components/dashboards/GmDashboard.jsx
// ─────────────────────────────────────────────────────────────────

// ── CHANGE 1: Add import at the top (after existing imports) ──────
import SendNotificationModal from '../SendNotificationModal';

// ── CHANGE 2: Add state inside GmDashboard component ─────────────
// Place this alongside the existing useState declarations:
const [showNotifModal, setShowNotifModal] = useState(false);

// ── CHANGE 3: Add button in the greeting section ──────────────────
// Replace this existing block:
//
//   <div className="greeting">
//     <div>
//       <h1 className="greeting-title">لوحة تحكم المدير العام</h1>
//       <p className="greeting-sub">{today}</p>
//     </div>
//   </div>
//
// With:

<div className="greeting">
  <div>
    <h1 className="greeting-title">لوحة تحكم المدير العام</h1>
    <p className="greeting-sub">{today}</p>
  </div>
  <button className="btn-notif" onClick={() => setShowNotifModal(true)}>
    📣 إرسال إشعار
  </button>
</div>

// ── CHANGE 4: Add modal just before closing </div> of gm-dash ─────
// Add this right before the closing </div> of the component return:

{showNotifModal && (
  <SendNotificationModal
    onClose={() => setShowNotifModal(false)}
    onSent={() => setShowNotifModal(false)}
  />
)}

// ── CHANGE 5: Add btn-notif style inside the <style jsx> block ────
// Add this to the existing styles:
`.btn-notif {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .65rem 1.25rem;
  background: linear-gradient(135deg, #F0A500, #d97706);
  color: #fff; font-family: 'Cairo',sans-serif;
  font-size: .88rem; font-weight: 700; border: none;
  border-radius: .75rem; cursor: pointer; transition: all .15s;
  box-shadow: 0 2px 8px rgba(240,165,0,.3); white-space: nowrap;
}
.btn-notif:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(240,165,0,.4); }`
