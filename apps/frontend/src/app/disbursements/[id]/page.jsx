'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X, Zap } from 'lucide-react';

import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';
import { MONTHS_AR, STATUS_MAP, formatAmount } from '@/components/disbursements/_constants';
import RejectModal from '@/components/RejectModal';

export default function DisbursementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { user } = useAuthStore();

  const [list, setList]         = useState(null);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [acting, setActing]       = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [isActionOk, setIsActionOk] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const role = user?.role;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/disbursements/${id}`)
      .then(res => {
        const { items: fetchedItems, ...listData } = res.data;
        setList(listData);
        setItems(fetchedItems || []);
      })
      .catch(err => setError(err.response?.data?.error || 'تعذّر تحميل بيانات كشف الصرف'))
      .finally(() => setLoading(false));
  }, [id]);

  const doAction = async (endpoint, body = {}) => {
    setActing(true);
    setActionMsg('');
    try {
      const res = await api.patch(`/disbursements/${id}/${endpoint}`, body);
      setIsActionOk(true);
      setActionMsg(res.data.message);
      // Reload list
      const refresh = await api.get(`/disbursements/${id}`);
      const { items: refreshedItems, ...refreshedList } = refresh.data;
      setList(refreshedList);
      setItems(refreshedItems || []);
    } catch (err) {
      setIsActionOk(false);
      setActionMsg(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (notes) => {
    setShowReject(false);
    const endpoint = list.status === 'draft' ? 'reject' : 'finance-reject';
    await doAction(endpoint, { notes });
  };

  // Determine available actions based on role + status
  const canSupervisorApprove = (role === 'supervisor' || role === 'gm') && list?.status === 'draft';
  const canSupervisorReject  = (role === 'supervisor' || role === 'gm') && list?.status === 'draft';
  const canFinanceApprove    = (role === 'finance' || role === 'gm') && list?.status === 'supervisor_approved';
  const canFinanceReject     = (role === 'finance' || role === 'gm') && list?.status === 'supervisor_approved';
  const canGmRelease         = role === 'gm' && list?.status === 'finance_approved';

  const hasActions = canSupervisorApprove || canSupervisorReject || canFinanceApprove || canFinanceReject || canGmRelease;

  const totalIncluded = items.filter(i => i.included).reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalExcluded = items.filter(i => !i.included).length;

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[1100px] mx-auto flex flex-col gap-5" dir="rtl">
          <div className="h-20 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
          <div className="h-72 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-[1100px] mx-auto flex flex-col gap-5" dir="rtl">
          <button
            className="inline-flex items-center gap-1.5 self-start px-4 py-2 bg-transparent text-gray-500 text-sm font-semibold border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => router.push('/disbursements')}
          >
            <ArrowRight size={16} /> رجوع
          </button>
          <div className="flex items-center gap-2 px-4 py-3 mt-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            <AlertTriangle size={18} /> {error}
          </div>
        </div>
      </AppShell>
    );
  }

  const statusInfo = STATUS_MAP[list?.status] || {};

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5" dir="rtl">

        {/* Reject modal */}
        {showReject && (
          <RejectModal
            title="رفض كشف الصرف"
            onConfirm={handleReject}
            onClose={() => setShowReject(false)}
            loading={acting}
          />
        )}

        {/* Back */}
        <button
          className="inline-flex items-center gap-1.5 self-start px-4 py-2 bg-transparent text-gray-500 text-sm font-semibold border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => router.push('/disbursements')}
        >
          <ArrowRight size={16} /> كشوف الصرف
        </button>

        {/* Title + status */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0d3d5c] mb-0.5">
              كشف صرف شهر {MONTHS_AR[list?.month]} {list?.year}
            </h1>
            <p className="text-xs text-gray-400 m-0">أُنشئ بواسطة {list?.created_by_name || '—'}</p>
          </div>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0"
            style={{ color: statusInfo.color, background: statusInfo.bg }}
          >
            {statusInfo.label || list?.status}
          </span>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${isActionOk ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {actionMsg}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col gap-1">
            <span className="text-[0.72rem] text-gray-400 font-semibold">إجمالي البنود</span>
            <span className="text-[1.55rem] font-extrabold text-[#0d3d5c] leading-none">{items.length}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col gap-1">
            <span className="text-[0.72rem] text-gray-400 font-semibold">مُدرَج للصرف</span>
            <span className="text-[1.55rem] font-extrabold text-emerald-500 leading-none">{items.filter(i => i.included).length}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col gap-1">
            <span className="text-[0.72rem] text-gray-400 font-semibold">مستثنى</span>
            <span className="text-[1.55rem] font-extrabold text-amber-500 leading-none">{totalExcluded}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col gap-1">
            <span className="text-[0.72rem] text-gray-400 font-semibold">المبلغ الإجمالي</span>
            <span className="text-xl font-extrabold text-[#1B5E8C] leading-none">{formatAmount(totalIncluded)}</span>
          </div>
        </div>

        {/* Action buttons */}
        {hasActions && list?.status !== 'released' && list?.status !== 'rejected' && (
          <div className="flex items-center gap-3 flex-wrap bg-white border border-gray-200 rounded-2xl px-5 py-3.5">
            <span className="text-[0.8rem] font-bold text-gray-400 shrink-0">الإجراءات المتاحة:</span>
            {(canSupervisorApprove || canFinanceApprove) && (
              <button
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-50 text-emerald-800 text-sm font-bold border border-emerald-200 rounded-xl cursor-pointer transition-colors hover:bg-emerald-500 hover:text-white hover:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => doAction(canSupervisorApprove ? 'approve' : 'finance-approve')}
                disabled={acting}
              >
                {acting
                  ? <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-800 rounded-full animate-spin" />
                  : <CheckCircle2 size={16} />}
                {canSupervisorApprove ? 'اعتماد الكشف' : 'مصادقة المالية'}
              </button>
            )}
            {canGmRelease && (
              <button
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-[#1B5E8C] text-white text-sm font-bold rounded-xl border-none cursor-pointer shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition-colors hover:bg-[#2E7EB8] disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => doAction('release')}
                disabled={acting}
              >
                {acting
                  ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Zap size={16} />}
                إصدار أمر الصرف النهائي
              </button>
            )}
            {(canSupervisorReject || canFinanceReject) && (
              <button
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-50 text-red-700 text-sm font-bold border border-red-200 rounded-xl cursor-pointer transition-colors hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => setShowReject(true)}
                disabled={acting}
              >
                <X size={16} />
                رفض الكشف
              </button>
            )}
          </div>
        )}

        {/* Rejection notes */}
        {list?.rejection_notes && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <strong>سبب الرفض:</strong> {list.rejection_notes}
          </div>
        )}

        {/* Items table */}
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">لا توجد بنود في هذا الكشف.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#1B5E8C] m-0">بنود الكشف ({items.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[0.82rem]">
                <thead>
                  <tr>
                    {['#', 'المستفيد', 'الكافل', 'المندوب', 'المحافظة', 'المبلغ', 'الحالة'].map(h => (
                      <th key={h} className="text-right px-4 py-3 text-[0.73rem] font-bold text-gray-400 bg-gray-50 border-b-2 border-gray-100 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-gray-100 last:border-b-0 hover:[&>td]:bg-[#fafbff] ${!item.included ? 'opacity-55' : ''}`}>
                      <td className="px-4 py-3 text-gray-300 text-[0.75rem] text-center w-10">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-[#0d3d5c]">{item.beneficiary_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.sponsor_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.agent_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.governorate_ar || '—'}</td>
                      <td className="px-4 py-3 font-bold text-[#1B5E8C] tabular-nums whitespace-nowrap">{formatAmount(item.amount)}</td>
                      <td className="px-4 py-3">
                        {item.included ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[0.72rem] font-bold">مُدرَج</span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[0.72rem] font-bold cursor-help" title={item.exclusion_reason || ''}>مستثنى</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
