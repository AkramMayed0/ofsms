'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import { 
  ArrowRight, 
  Phone, 
  Mail, 
  Calendar, 
  Copy, 
  Link as LinkIcon,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Briefcase
} from 'lucide-react';

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';
const formatAmount = (n) => n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

export default function SponsorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sponsorId = params?.id;

  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sponsorId) return;
    setLoading(true);
    api.get(`/sponsors/${sponsorId}`)
      .then(({ data }) => setSponsor(data))
      .catch(() => setError('تعذّر تحميل بيانات الكافل.'))
      .finally(() => setLoading(false));
  }, [sponsorId]);

  if (loading) {
    return (
      <AppShell>
        <div className="page-container skel-loading">
          <div className="skel skel-header"></div>
          <div className="skel skel-card"></div>
          <div className="skel skel-card"></div>
        </div>
        <style jsx>{`
          .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
          .skel { background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 1rem; }
          .skel-header { height: 40px; width: 300px; }
          .skel-card { height: 200px; width: 100%; }
          @keyframes shimmer { to { background-position: -200% 0; } }
        `}</style>
      </AppShell>
    );
  }

  if (error || !sponsor) {
    return (
      <AppShell>
        <div className="page-container error-state" dir="rtl">
          <XCircle size={48} className="error-icon" />
          <h2>{error || 'لم يتم العثور على الكافل'}</h2>
          <button onClick={() => router.back()} className="btn-ghost">العودة للسابق</button>
        </div>
        <style jsx>{`
          .page-container { padding: 4rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .error-icon { color: #ef4444; }
          .btn-ghost { padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; background: transparent; cursor: pointer; font-family: inherit; font-weight: 600; color: #374151; transition: all 0.2s; }
          .btn-ghost:hover { background: #f3f4f6; }
        `}</style>
      </AppShell>
    );
  }

  const sponsorData = sponsor?.sponsor || {};
  const sponsorships = sponsor?.sponsorships || [];
  const totalMonthly = sponsorships
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + parseFloat(s.monthly_amount || 0), 0);

  return (
    <AppShell>
      <div className="page" dir="rtl">
        {/* Header Actions */}
        <div className="header-actions">
          <button onClick={() => router.push('/sponsors')} className="btn-back">
            <ArrowRight size={18} />
            <span>العودة للكفلاء</span>
          </button>
        </div>

        {/* Top Grid: Profile & Stats */}
        <div className="top-grid">
          {/* Profile Card */}
          <div className="card profile-card">
            <div className="profile-header">
              <div className="avatar-large">{sponsorData.full_name?.charAt(0) || <User />}</div>
              <div className="profile-titles">
                <h1 className="sponsor-name">{sponsorData.full_name}</h1>
                <p className="sponsor-id">رقم التعريف: {sponsorData.id}</p>
              </div>
            </div>
            
            <div className="contact-info">
              {sponsorData.phone && (
                <div className="info-row">
                  <div className="info-icon"><Phone size={16} /></div>
                  <span className="info-text ltr" dir="ltr">{sponsorData.phone}</span>
                </div>
              )}
              {sponsorData.email && (
                <div className="info-row">
                  <div className="info-icon"><Mail size={16} /></div>
                  <span className="info-text">{sponsorData.email}</span>
                </div>
              )}
              <div className="info-row">
                <div className="info-icon"><Calendar size={16} /></div>
                <span className="info-text">تاريخ التسجيل: {formatDate(sponsorData.created_at)}</span>
              </div>
              <div className="info-row">
                <div className="info-icon"><User size={16} /></div>
                <span className="info-text">بواسطة: {sponsorData.created_by_name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Stats & Portal Column */}
          <div className="stats-column">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper active-spon"><CheckCircle2 size={24} /></div>
                <div className="stat-content">
                  <span className="stat-label">كفالة نشطة</span>
                  <span className="stat-value">{sponsorData.active_sponsorships || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper total-amt"><Briefcase size={24} /></div>
                <div className="stat-content">
                  <span className="stat-label">إجمالي شهري</span>
                  <span className="stat-value text-primary">{formatAmount(totalMonthly)}</span>
                </div>
              </div>
            </div>

            <div className="card portal-card">
              <div className="portal-header">
                <LinkIcon size={18} className="portal-icon" />
                <h3 className="portal-title">رابط البوابة الخاصة بالكافل</h3>
              </div>
              <p className="portal-desc">يمكنك مشاركة هذا الرابط مع الكافل ليتمكن من متابعة كفالاته وتقاريره.</p>
              <div className="portal-action">
                <div className="token-display" dir="ltr">
                  {`${window.location.origin}/sponsor/portal?token=${sponsorData.portal_token?.substring(0,8)}...`}
                </div>
                <button 
                  onClick={() => {
                    if (!sponsorData.portal_token) return;
                    navigator.clipboard.writeText(`${window.location.origin}/sponsor/portal?token=${sponsorData.portal_token}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} 
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                >
                  <Copy size={16} />
                  <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsorships Section */}
        <div className="card sponsorships-section">
          <div className="section-header">
            <h2>الكفالات التابعة له</h2>
            <span className="badge">{sponsorships.length} كفالة</span>
          </div>

          {sponsorships.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap"><Briefcase size={40} /></div>
              <h3>لا توجد كفالات مسجّلة</h3>
              <p>لم يتم إضافة أي كفالات لهذا الكافل حتى الآن.</p>
            </div>
          ) : (
            <div className="spon-table-container">
              <table className="spon-table">
                <thead>
                  <tr>
                    <th>المستفيد</th>
                    <th>النوع</th>
                    <th>المندوب</th>
                    <th>المبلغ الشهري</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsorships.map(s => (
                    <tr key={s.id} className={!s.is_active ? 'inactive-row' : ''}>
                      <td>
                        <div className="beneficiary-cell">
                          <div className="ben-icon">
                            {s.beneficiary_type === 'orphan' ? <User size={18} /> : <Users size={18} />}
                          </div>
                          <span>{s.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                        </div>
                      </td>
                      <td>
                         <span className="type-badge">{s.beneficiary_type === 'orphan' ? 'يتيم' : 'أسرة'}</span>
                      </td>
                      <td className="text-muted">{s.agent_name || '—'}</td>
                      <td><span className="amount-text">{formatAmount(s.monthly_amount)}</span></td>
                      <td>
                        {s.is_active ? (
                          <span className="status-badge active">نشطة</span>
                        ) : (
                          <span className="status-badge inactive">منتهية</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem 4rem; font-family: 'Cairo', 'Tajawal', sans-serif; display: flex; flex-direction: column; gap: 1.5rem; }
        
        .header-actions { display: flex; align-items: center; }
        .btn-back { display: inline-flex; align-items: center; gap: 0.5rem; background: none; border: none; color: #6b7a8d; font-family: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 0.5rem; transition: all 0.2s; }
        .btn-back:hover { background: #f0f4f8; color: #1B5E8C; }
        
        .top-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
        @media (max-width: 860px) { .top-grid { grid-template-columns: 1fr; } }
        
        .card { background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem; box-shadow: 0 4px 15px rgba(27, 94, 140, 0.03); overflow: hidden; padding: 1.5rem; }
        
        .profile-card { display: flex; flex-direction: column; gap: 1.5rem; }
        .profile-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #f0f4f8; padding-bottom: 1.25rem; }
        .avatar-large { width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #1B5E8C, #0d3d5c); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; flex-shrink: 0; box-shadow: 0 4px 10px rgba(27, 94, 140, 0.2); }
        .profile-titles { display: flex; flex-direction: column; gap: 0.2rem; }
        .sponsor-name { font-size: 1.4rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .sponsor-id { font-size: 0.85rem; color: #94a3b8; margin: 0; }
        
        .contact-info { display: flex; flex-direction: column; gap: 0.85rem; }
        .info-row { display: flex; align-items: center; gap: 0.75rem; }
        .info-icon { width: 32px; height: 32px; border-radius: 50%; background: #f0f7ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .info-text { font-size: 0.95rem; color: #475569; font-weight: 500; }
        .ltr { direction: ltr; text-align: left; }
        
        .stats-column { display: flex; flex-direction: column; gap: 1.5rem; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr; } }
        .stat-card { background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 15px rgba(27, 94, 140, 0.03); }
        .stat-icon-wrapper { width: 48px; height: 48px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-icon-wrapper.active-spon { background: #ecfdf5; color: #10b981; }
        .stat-icon-wrapper.total-amt { background: #eff6ff; color: #3b82f6; }
        .stat-content { display: flex; flex-direction: column; gap: 0.2rem; }
        .stat-label { font-size: 0.85rem; color: #6b7a8d; font-weight: 600; }
        .stat-value { font-size: 1.4rem; font-weight: 800; color: #1f2937; }
        .text-primary { color: #1B5E8C; }
        
        .portal-card { background: linear-gradient(to left, #ffffff, #f8fbff); border-color: #bfdbfe; }
        .portal-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .portal-icon { color: #2563eb; }
        .portal-title { font-size: 1.05rem; font-weight: 800; color: #1e3a8a; margin: 0; }
        .portal-desc { font-size: 0.85rem; color: #64748b; margin: 0 0 1.25rem; }
        .portal-action { display: flex; gap: 0.5rem; align-items: stretch; }
        .token-display { flex: 1; background: #fff; border: 1.5px dashed #bfdbfe; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.85rem; color: #475569; display: flex; align-items: center; user-select: all; }
        .btn-copy { display: inline-flex; align-items: center; gap: 0.4rem; background: #2563eb; color: #fff; border: none; border-radius: 0.75rem; padding: 0 1.25rem; font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-copy:hover { background: #1d4ed8; }
        .btn-copy.copied { background: #10b981; }
        
        .sponsorships-section { display: flex; flex-direction: column; gap: 1rem; padding: 0; }
        .section-header { display: flex; align-items: center; gap: 1rem; padding: 1.5rem 1.5rem 0; }
        .section-header h2 { font-size: 1.25rem; font-weight: 800; color: #0d3d5c; margin: 0; }
        .badge { background: #f0f7ff; color: #2563eb; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 700; }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem 1.5rem; text-align: center; }
        .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: #f8fafc; color: #cbd5e1; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
        .empty-state h3 { font-size: 1.1rem; font-weight: 700; color: #475569; margin: 0; }
        .empty-state p { font-size: 0.9rem; color: #94a3b8; margin: 0; }
        
        .spon-table-container { overflow-x: auto; padding-bottom: 1rem; }
        .spon-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .spon-table th { padding: 1rem 1.5rem; text-align: right; font-size: 0.85rem; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .spon-table td { padding: 1rem 1.5rem; font-size: 0.95rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .spon-table tbody tr { transition: background 0.15s; }
        .spon-table tbody tr:hover { background: #f8fafc; }
        .inactive-row { opacity: 0.7; }
        .beneficiary-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; color: #1e293b; }
        .ben-icon { width: 36px; height: 36px; border-radius: 50%; background: #f0f4f8; color: #64748b; display: flex; align-items: center; justify-content: center; }
        .type-badge { font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 0.5rem; background: #f1f5f9; color: #475569; }
        .amount-text { font-weight: 800; color: #1B5E8C; }
        .status-badge { display: inline-flex; font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.75rem; border-radius: 2rem; }
        .status-badge.active { background: #ecfdf5; color: #059669; }
        .status-badge.inactive { background: #f3f4f6; color: #6b7280; }
        .text-muted { color: #64748b; }
      `}</style>
    </AppShell>
  );
}
