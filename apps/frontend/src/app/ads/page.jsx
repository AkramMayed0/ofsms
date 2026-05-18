'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, RefreshCw, User, Users } from 'lucide-react';

import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';

const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
};

export default function AdsPage() {
  const { user } = useAuthStore();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const isAdmin = user?.role === 'gm';

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/ads');
      setAds(data.ads || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل الإعلانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const deleteAd = async (ad) => {
    setDeletingId(ad.id);
    setError('');
    try {
      await api.delete(`/ads/${ad.id}`);
      setAds((current) => current.filter((item) => item.id !== ad.id));
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر حذف الإعلان');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <AppShell>
      <div className="ads-page" dir="rtl">
        <div className="page-header">
          <div>
            <h1 className="page-title">صفحة الإعلانات</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${ads.length} إعلان موجه للكفلاء`}
            </p>
          </div>
          <button className="icon-btn" onClick={loadAds} title="تحديث">
            <RefreshCw size={17} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="empty">لا توجد إعلانات حالياً</div>
        ) : (
          <div className="grid">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                canDelete={isAdmin && ad.is_sponsored}
                deleting={deletingId === ad.id}
                onDelete={() => deleteAd(ad)}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .ads-page {
          max-width: 1100px; margin: 0 auto; padding-bottom: 3rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .page-header {
          display: flex; justify-content: space-between; align-items: center; gap: 1rem;
        }
        .page-title { margin: 0 0 .2rem; color: #0d3d5c; font-size: 1.55rem; font-weight: 800; }
        .page-sub { margin: 0; color: #64748b; font-size: .85rem; }
        .icon-btn {
          width: 2.35rem; height: 2.35rem; display: inline-flex; align-items: center; justify-content: center;
          border: 1.5px solid #dbe4ee; border-radius: .7rem; background: #fff; color: #0f766e;
          cursor: pointer;
        }
        .error-banner {
          display: flex; align-items: center; gap: .5rem; padding: .75rem 1rem;
          border: 1px solid #fecaca; border-radius: .75rem; background: #fef2f2; color: #b91c1c;
          font-size: .85rem;
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .empty {
          padding: 3rem 1rem; text-align: center; color: #94a3b8; background: #fff;
          border: 1px solid #e5eaf0; border-radius: .9rem;
        }
        .skeleton {
          height: 220px; border-radius: .9rem;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>
    </AppShell>
  );
}

function AdCard({ ad, canDelete, deleting, onDelete }) {
  const isOrphan = ad.beneficiary_type === 'orphan';
  const age = calcAge(ad.date_of_birth);
  const statusLabel = ad.is_sponsored ? 'Sponsored' : 'Awaiting Sponsor';

  return (
    <article className="card">
      <div className="top">
        <div className="avatar">{isOrphan ? <User size={20} /> : <Users size={20} />}</div>
        <div>
          <h2 className="name">{ad.beneficiary_name || '—'}</h2>
          <p className="type">{isOrphan ? 'يتيم' : 'أسرة'}</p>
        </div>
      </div>

      <span className={`status ${ad.is_sponsored ? 'sponsored' : 'awaiting'}`}>
        {statusLabel}
      </span>

      <div className="info">
        <span>المحافظة: {ad.governorate_ar || '—'}</span>
        <span>المندوب: {ad.agent_name || '—'}</span>
        {isOrphan && age !== null && <span>العمر: {age} سنة</span>}
        {!isOrphan && <span>عدد الأفراد: {ad.member_count || '—'}</span>}
        {!isOrphan && <span>رب الأسرة: {ad.head_of_family || '—'}</span>}
      </div>

      {canDelete && (
        <button className="delete-btn" onClick={onDelete} disabled={deleting}>
          <Trash2 size={15} /> {deleting ? 'جارٍ الحذف…' : 'Delete Ad'}
        </button>
      )}

      <style jsx>{`
        .card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: .9rem;
          padding: 1rem; display: flex; flex-direction: column; gap: .9rem;
          box-shadow: 0 1px 4px rgba(15, 23, 42, .05);
        }
        .top { display: flex; align-items: center; gap: .75rem; }
        .avatar {
          width: 42px; height: 42px; border-radius: 50%; background: #ecfdf5; color: #0f766e;
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .name { margin: 0; font-size: .98rem; color: #0d3d5c; font-weight: 800; }
        .type { margin: .1rem 0 0; color: #94a3b8; font-size: .75rem; }
        .status {
          width: fit-content; border-radius: 999px; padding: .25rem .65rem;
          font-size: .74rem; font-weight: 800;
        }
        .status.sponsored { background: #dcfce7; color: #166534; }
        .status.awaiting { background: #dbeafe; color: #1d4ed8; }
        .info { display: flex; flex-direction: column; gap: .35rem; color: #475569; font-size: .82rem; }
        .delete-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
          padding: .55rem .85rem; border: 1px solid #fecaca; border-radius: .65rem;
          background: #fef2f2; color: #b91c1c; font-family: 'Cairo', sans-serif;
          font-size: .8rem; font-weight: 800; cursor: pointer;
        }
        .delete-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>
    </article>
  );
}
