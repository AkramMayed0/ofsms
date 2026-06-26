'use client';

/**
 * page.jsx
 * Route:  /gifted  (GM only)
 * Task:   feature/ui-gifted-orphan-section
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import { Star, Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import SearchField from '@/components/ui/SearchField';

// Components
import StatsBar from './components/StatsBar';
import OrphanCard from './components/OrphanCard';
import BenefitsDrawer from './components/BenefitsDrawer';
import RevokeModal from './components/RevokeModal';
import EmptyState from './components/EmptyState';
import LoadingSkeleton from './components/LoadingSkeleton';

export default function GiftedOrphansPage() {
  const [orphans, setOrphans]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [editTarget, setEditTarget] = useState(null);   // orphan being edited
  const [revokeTarget, setRevokeTarget] = useState(null); // orphan being revoked
  const [revoking, setRevoking]     = useState(false);
  const [search, setSearch]         = useState('');
  const [toast, setToast]           = useState('');

  const fetchOrphans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orphans/gifted');
      setOrphans(data.orphans || []);
    } catch (err) {
      console.error('Error fetching gifted orphans:', err);
      setError('تعذّر تحميل البيانات. يرجى تحديث الصفحة.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrphans(); }, [fetchOrphans]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaved = () => {
    setEditTarget(null);
    fetchOrphans();
    showToast(<span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> تم حفظ مزايا اليتيم بنجاح</span>);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api.patch(`/orphans/${revokeTarget.id}/gifted`, { is_gifted: false });
      setRevokeTarget(null);
      fetchOrphans();
      showToast('تم إلغاء تصنيف الموهوب');
    } catch {
      // keep modal open so user can retry
    } finally {
      setRevoking(false);
    }
  };

  const filtered = orphans.filter((o) =>
    !search ||
    o.full_name?.includes(search) ||
    o.governorate_ar?.includes(search) ||
    o.sponsor_name?.includes(search)
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto pb-16 font-['Cairo','Tajawal',sans-serif] flex flex-col gap-6 animate-in fade-in duration-500" dir="rtl">

        {/* Page header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3 m-0">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500 drop-shadow-sm" /> الأيتام الموهوبون
          </h1>
          <p className="text-sm md:text-base font-medium text-slate-500 m-0">
            إدارة كفالات الأيتام المتميزين ومتابعة مزاياهم التعليمية والمالية
          </p>
        </div>

        {/* Stats bar */}
        {!loading && orphans.length > 0 && <StatsBar orphans={orphans} />}

        {/* Search */}
        {orphans.length > 0 && (
          <div className="flex items-center gap-4">
            <SearchField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="ابحث بالاسم أو المحافظة أو الكافل…"
              className="flex-1 max-w-xl"
              inputClassName="border-2 border-slate-200 rounded-2xl py-3 pr-10 pl-10 text-sm text-slate-800 bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <span className="text-sm font-bold text-slate-400 hidden sm:block">
              {filtered.length} من {orphans.length}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <LoadingSkeleton />}

        {/* Empty state */}
        {!loading && !error && orphans.length === 0 && <EmptyState />}

        {/* No results from search */}
        {!loading && orphans.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[250px] gap-3 text-center bg-slate-50 border border-slate-200 rounded-3xl animate-in fade-in duration-300">
            <Search className="w-12 h-12 text-slate-300 mb-1" />
            <p className="text-sm font-bold text-slate-500">لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}

        {/* Card grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {filtered.map((o) => (
              <OrphanCard
                key={o.id}
                orphan={o}
                onEdit={setEditTarget}
                onRevoke={setRevokeTarget}
              />
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300">
            {toast}
          </div>
        )}

      </div>

      {/* Benefits Drawer */}
      {editTarget && (
        <BenefitsDrawer
          orphan={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Revoke Modal */}
      <RevokeModal
        orphan={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        loading={revoking}
      />
    </AppShell>
  );
}
