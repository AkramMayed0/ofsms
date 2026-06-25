'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import { MONTHS_AR, formatDate, formatAmount } from '@/components/disbursements/_constants';
import StatusBadge from '@/components/ui/StatusBadge';

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

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto" dir="rtl">
        <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] mb-0.5">
          سجل الإصدارات
        </h1>
        <p className="text-sm text-[#6b7a8d] mb-6">
          جميع كشوف الصرف الشهري
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {!loading && lists.length > 0 && (
          <div className="bg-white border border-[#e5eaf0] rounded-2xl shadow-[0_1px_4px_rgba(27,94,140,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[0.83rem] min-w-[480px]">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    {['الشهر / السنة', 'المستفيدون', 'المبلغ الإجمالي', 'الحالة', 'تاريخ الإنشاء'].map(h => (
                      <th key={h} className="px-4 py-3 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lists.map(list => (
                    <tr
                      key={list.id}
                      onClick={() => router.push(`/disbursements/${list.id}`)}
                      className="border-b border-[#f8fafc] cursor-pointer transition-colors hover:bg-[#f0f7ff]"
                    >
                      <td className="px-4 py-3.5 font-bold text-[#0d3d5c] whitespace-nowrap">
                        {MONTHS_AR[list.month]} {list.year}
                      </td>
                      <td className="px-4 py-3.5 text-[#6b7a8d] whitespace-nowrap">
                        <span className="text-emerald-500 font-bold">{list.included_count}</span>
                        {list.excluded_count > 0 && (
                          <span className="text-red-500 mr-1.5">(-{list.excluded_count})</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#1B5E8C] whitespace-nowrap">
                        {formatAmount(list.total_amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={list.status} />
                      </td>
                      <td className="px-4 py-3.5 text-[#6b7a8d] text-[0.78rem] whitespace-nowrap">
                        {formatDate(list.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && lists.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center min-h-[260px] gap-3 text-center bg-white border border-[#e5eaf0] rounded-2xl p-8">
            <span className="text-4xl">📋</span>
            <h3 className="text-base font-bold text-gray-700 m-0">لا توجد كشوف صرف بعد</h3>
            <p className="text-sm text-gray-400 m-0">لم يتم إنشاء أي كشف صرف حتى الآن</p>
          </div>
        )}

        {loading && (
          <div className="bg-white border border-[#e5eaf0] rounded-2xl overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-gray-50 last:border-b-0">
                <div className="h-3.5 w-20 rounded bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
                <div className="flex-1">
                  <div className="h-3.5 w-2/5 rounded bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
                </div>
                <div className="h-6 w-24 rounded-full bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
                <div className="h-3.5 w-24 rounded bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
