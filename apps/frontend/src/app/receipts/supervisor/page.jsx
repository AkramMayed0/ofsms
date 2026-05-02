'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function SupervisorBiometricLogPage() {
  const router = useRouter();
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [logData, setLogData] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch available lists
  useEffect(() => {
    api.get('/disbursements')
      .then(({ data }) => {
        setLists(data.lists);
        // Default to the first (latest) released/approved list
        if (data.lists.length > 0) {
          const list = data.lists[0];
          setSelectedListId(list.id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setError('تعذّر تحميل كشوفات الصرف.');
        setLoading(false);
      });
  }, []);

  // 2. Fetch supervisor log when list changes
  useEffect(() => {
    if (!selectedListId) return;

    setLoading(true);
    setLogData(null);
    setSelectedAgentId('');

    api.get(`/receipts/supervisor-log/${selectedListId}`)
      .then(({ data }) => {
        setLogData(data);
        if (data.agents && data.agents.length > 0) {
          setSelectedAgentId(data.agents[0].agent_id);
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'تعذّر تحميل سجل البصمات.'))
      .finally(() => setLoading(false));
  }, [selectedListId]);

  // ── Render Helpers ──────────────────────────────────────────────────────────

  const activeAgent = logData?.agents?.find(a => a.agent_id === selectedAgentId);

  return (
    <div className="supervisor-log-page" dir="rtl">
      <div className="header-row">
        <div>
          <h1 className="page-title">متابعة بصمات الصرف</h1>
          <p className="page-sub">عرض تقرير إنجاز المندوبين لتسليم مبالغ الصرف</p>
        </div>
        
        {lists.length > 0 && (
          <select 
            className="list-select" 
            value={selectedListId} 
            onChange={(e) => setSelectedListId(e.target.value)}
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                كشف شهر {list.month} / {list.year}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="err-banner">⚠ {error}</div>}

      {loading ? (
        <div className="skeleton-box" style={{ height: 300, marginTop: '2rem' }} />
      ) : !logData ? (
        <div className="empty-state">
          <h2>لا توجد بيانات</h2>
          <p>لم يتم العثور على سجل بصمات لهذا الكشف.</p>
        </div>
      ) : logData.agents.length === 0 ? (
        <div className="empty-state">
          <h2>لا يوجد مندوبين</h2>
          <p>لا يوجد مستفيدين معتمدين في هذا الكشف.</p>
        </div>
      ) : (
        <div className="layout-grid">
          
          {/* Sidebar: Agents List */}
          <div className="agents-sidebar">
            <h3 className="sidebar-title">المندوبين ({logData.agents.length})</h3>
            <div className="agents-list">
              {logData.agents.map(agent => (
                <div 
                  key={agent.agent_id} 
                  className={`agent-card ${selectedAgentId === agent.agent_id ? 'active' : ''}`}
                  onClick={() => setSelectedAgentId(agent.agent_id)}
                >
                  <div className="agent-name">{agent.agent_name}</div>
                  <div className="agent-progress">
                    <span className="progress-text">{agent.confirmed_items} / {agent.total_items}</span>
                    <span className="progress-badge" style={{
                      background: agent.all_confirmed ? '#ecfdf5' : '#fffbeb',
                      color: agent.all_confirmed ? '#059669' : '#d97706'
                    }}>
                      {agent.all_confirmed ? 'مكتمل ✅' : 'قيد التسليم ⏳'}
                    </span>
                  </div>
                  {agent.batch_confirmed_at && (
                    <div className="batch-confirmed-text">
                      تم تسليم الكشف ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content: Agent Details */}
          <div className="agent-details">
            {activeAgent ? (
              <>
                <div className="details-header">
                  <h2>{activeAgent.agent_name}</h2>
                  <div className="stats-row">
                    <div className="stat-pill">
                      الإجمالي: <strong>{activeAgent.total_items}</strong>
                    </div>
                    <div className="stat-pill success">
                      المسلمة: <strong>{activeAgent.confirmed_items}</strong>
                    </div>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>المستفيد</th>
                        <th>النوع</th>
                        <th>الحالة</th>
                        <th>البصمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAgent.items.map(item => (
                        <tr key={item.item_id}>
                          <td style={{ fontWeight: 700, color: '#1f2937' }}>
                            {item.beneficiary_name}
                          </td>
                          <td className="muted">
                            {item.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}
                          </td>
                          <td>
                            {item.receipt_id ? (
                              <span className="status-badge success">✅ تم التسليم</span>
                            ) : (
                              <span className="status-badge pending">⏳ قيد التسليم</span>
                            )}
                          </td>
                          <td>
                            {item.fingerprint_key ? (
                              <a 
                                href={`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.amazonaws.com/${item.fingerprint_key}`}
                                target="_blank"
                                rel="noreferrer"
                                className="thumb-link"
                              >
                                عرض البصمة 👆
                              </a>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>اختر مندوباً لعرض التفاصيل</p>
              </div>
            )}
          </div>

        </div>
      )}

      <style jsx>{`
        .supervisor-log-page { display:flex; flex-direction:column; gap:1.75rem; font-family:'Cairo','Tajawal',sans-serif; max-width:1100px; margin:0 auto; padding-bottom:3rem; }
        .header-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.9rem; color:#6b7a8d; margin:0; }
        
        .list-select { padding:.6rem 1rem; border:1px solid #d1d5db; border-radius:.5rem; font-family:inherit; font-size:.9rem; font-weight:700; color:#1f2937; background:#fff; outline:none; cursor:pointer; }
        .list-select:focus { border-color:#1B5E8C; box-shadow:0 0 0 3px rgba(27,94,140,0.1); }

        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; font-weight:700; }
        
        .skeleton-box { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:1rem; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .empty-state { text-align:center; padding:4rem 2rem; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; color:#6b7a8d; }

        .layout-grid { display:grid; grid-template-columns:300px 1fr; gap:1.5rem; align-items:start; }

        /* Sidebar */
        .agents-sidebar { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.25rem; display:flex; flex-direction:column; gap:1rem; }
        .sidebar-title { margin:0; font-size:1rem; color:#0d3d5c; }
        .agents-list { display:flex; flex-direction:column; gap:.5rem; max-height:600px; overflow-y:auto; padding-right:.5rem; }
        .agent-card { padding:.85rem 1rem; border:1px solid #e5eaf0; border-radius:.75rem; cursor:pointer; transition:all .15s; display:flex; flex-direction:column; gap:.4rem; }
        .agent-card:hover { border-color:#cbd5e1; background:#f8fafc; }
        .agent-card.active { border-color:#1B5E8C; background:#f0f9ff; box-shadow:0 2px 4px rgba(27,94,140,.1); }
        .agent-name { font-weight:800; font-size:.95rem; color:#1f2937; }
        .agent-progress { display:flex; justify-content:space-between; align-items:center; }
        .progress-text { font-size:.85rem; font-weight:700; color:#475569; }
        .progress-badge { font-size:.7rem; font-weight:800; padding:.15rem .5rem; border-radius:1rem; }
        .batch-confirmed-text { font-size:.75rem; color:#059669; font-weight:700; margin-top:.25rem; }

        /* Main Details */
        .agent-details { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.5rem; display:flex; flex-direction:column; gap:1.5rem; }
        .details-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; border-bottom:1px solid #f1f5f9; padding-bottom:1rem; }
        .details-header h2 { margin:0; font-size:1.4rem; color:#0d3d5c; }
        .stats-row { display:flex; gap:.75rem; }
        .stat-pill { padding:.4rem .85rem; background:#f1f5f9; color:#475569; border-radius:2rem; font-size:.85rem; }
        .stat-pill.success { background:#ecfdf5; color:#065f46; }

        .table-wrap { overflow-x:auto; }
        .table { width:100%; border-collapse:collapse; text-align:right; }
        .table th { padding:.75rem; border-bottom:2px solid #e5eaf0; color:#6b7a8d; font-size:.85rem; font-weight:700; }
        .table td { padding:.85rem .75rem; border-bottom:1px solid #f1f5f9; font-size:.9rem; vertical-align:middle; }
        .muted { color:#6b7a8d; }

        .status-badge { display:inline-block; padding:.2rem .6rem; border-radius:2rem; font-size:.75rem; font-weight:800; }
        .status-badge.success { background:#ecfdf5; color:#059669; }
        .status-badge.pending { background:#fffbeb; color:#d97706; }

        .thumb-link { display:inline-block; background:#eff6ff; color:#2563eb; padding:.3rem .75rem; border-radius:.5rem; font-size:.8rem; font-weight:700; text-decoration:none; transition:background .15s; }
        .thumb-link:hover { background:#dbeafe; }

        @media (max-width: 800px) {
          .layout-grid { grid-template-columns:1fr; }
        }
      `}</style>
    </div>
  );
}
