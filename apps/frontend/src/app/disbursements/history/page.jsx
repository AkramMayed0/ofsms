'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

const MONTHS_AR = ['','يناير','فبراير','مارس','أبريل','مايو','يونيو',
                    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const STATUS_MAP = {
  draft:               { label: 'مسودة',        color: '#6b7280', bg: '#f3f4f6' },
  supervisor_approved: { label: 'اعتمد المشرف', color: '#f59e0b', bg: '#fffbeb' },
  finance_approved:    { label: 'اعتمد المالي', color: '#3b82f6', bg: '#eff6ff' },
  released:            { label: 'تم الصرف',      color: '#10b981', bg: '#ecfdf5' },
  rejected:            { label: 'مرفوض',         color: '#ef4444', bg: '#fef2f2' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', padding: '.25rem .75rem', borderRadius: '2rem', fontSize: '.72rem', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}25`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

export default function DisbursementsHistoryPage() {
  const router = useRouter();
  const [lists,   setLists]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/disbursements/history')
      .then(({ data }) => setLists(data.lists || []))
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const skel = (w, h, borderRadius = '4px') => ({
    width: w, height: h, borderRadius,
    background: 'linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    display: 'inline-block',
  });

  return (
    <AppShell>
      <div style={{ fontFamily: "'Cairo','Tajawal',sans-serif", maxWidth: 1100, margin: '0 auto' }} dir="rtl">
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d3d5c', margin: '0 0 .2rem' }}>
          سجل الإصدارات
        </h1>
        <p style={{ fontSize: '.85rem', color: '#6b7a8d', margin: '0 0 1.5rem' }}>
          جميع كشوف الصرف الشهري
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '.75rem', padding: '.85rem 1rem', marginBottom: '1rem', fontSize: '.85rem' }}>
            {error}
          </div>
        )}

        {!loading && lists.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5eaf0', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(27,94,140,.05)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem', minWidth: 480 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['الشهر / السنة', 'المستفيدون', 'المبلغ الإجمالي', 'الحالة', 'تاريخ الإنشاء'].map(h => (
                      <th key={h} style={{ padding: '.8rem 1.1rem', textAlign: 'right', fontSize: '.72rem', fontWeight: 700, color: '#6b7a8d', borderBottom: '1px solid #e5eaf0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lists.map(list => (
                    <tr
                      key={list.id}
                      onClick={() => router.push(`/disbursements/${list.id}`)}
                      style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background .12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '.85rem 1.1rem', fontWeight: 700, color: '#0d3d5c', whiteSpace: 'nowrap' }}>
                        {MONTHS_AR[list.month]} {list.year}
                      </td>
                      <td style={{ padding: '.85rem 1.1rem', color: '#6b7a8d', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{list.included_count}</span>
                        {list.excluded_count > 0 && (
                          <span style={{ color: '#ef4444', marginRight: '.35rem' }}>(-{list.excluded_count})</span>
                        )}
                      </td>
                      <td style={{ padding: '.85rem 1.1rem', fontWeight: 700, color: '#1B5E8C', whiteSpace: 'nowrap' }}>
                        {Number(list.total_amount).toLocaleString('ar-YE')} ر.ي
                      </td>
                      <td style={{ padding: '.85rem 1.1rem' }}>
                        <StatusBadge status={list.status} />
                      </td>
                      <td style={{ padding: '.85rem 1.1rem', color: '#6b7a8d', fontSize: '.78rem', whiteSpace: 'nowrap' }}>
                        {list.created_at ? new Date(list.created_at).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && lists.length === 0 && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: '.75rem', textAlign: 'center', background: '#fff', border: '1px solid #e5eaf0', borderRadius: '1rem', padding: '2rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📋</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: 0 }}>لا توجد كشوف صرف بعد</h3>
            <p style={{ fontSize: '.85rem', color: '#9ca3af', margin: 0 }}>لم يتم إنشاء أي كشف صرف حتى الآن</p>
          </div>
        )}

        {loading && (
          <div style={{ background: '#fff', border: '1px solid #e5eaf0', borderRadius: '1rem', overflow: 'hidden' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '.85rem 1.1rem', borderBottom: '1px solid #f8fafc' }}>
                <div style={skel(80, 14)} />
                <div style={{ flex: 1 }}><div style={skel('40%', 14)} /></div>
                <div style={skel(100, 24, '2rem')} />
                <div style={skel(90, 14)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
