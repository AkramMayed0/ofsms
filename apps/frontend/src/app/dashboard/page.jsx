'use client';

/**
 * apps/frontend/src/app/dashboard/page.jsx
 * Role-based dashboard router using dynamic imports.
 */

import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';

const AgentDashboard = dynamic(
  () => import('@/components/dashboards/AgentDashboard'),
  { loading: () => <Spinner />, ssr: false }
);

const GmDashboard = dynamic(
  () => import('@/components/dashboards/GmDashboard'),
  { loading: () => <Spinner />, ssr: false }
);

const SupervisorDashboard = dynamic(
  () => import('@/components/dashboards/SupervisorDashboard'),
  { loading: () => <Spinner />, ssr: false }
);

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const renderDashboard = () => {
    switch (role) {
      case 'agent':      return <AgentDashboard />;
      case 'gm':         return <GmDashboard />;
      case 'supervisor': return <SupervisorDashboard />;
      case 'finance':    return <ComingSoon role="القسم المالي" />;
      default:           return <Spinner />;
    }
  };

  return (
    <AppShell>
      <div dir="rtl">{renderDashboard()}</div>
    </AppShell>
  );
}

function Spinner() {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'60vh', flexDirection:'column', gap:'1rem',
      fontFamily:"'Cairo','Tajawal',sans-serif",
    }}>
      <div style={{
        width:36, height:36,
        border:'3px solid #e5eaf0', borderTopColor:'#1B5E8C',
        borderRadius:'50%', animation:'spin .7s linear infinite',
      }}/>
      <p style={{ color:'#94a3b8', fontSize:'.85rem', margin:0 }}>جارٍ التحميل…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ComingSoon({ role }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'60vh', gap:'1rem',
      fontFamily:"'Cairo','Tajawal',sans-serif", textAlign:'center',
    }}>
      <div style={{ fontSize:'3rem' }}>🚧</div>
      <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'#0d3d5c', margin:0 }}>
        لوحة تحكم {role}
      </h2>
      <p style={{ fontSize:'.88rem', color:'#94a3b8', margin:0 }}>
        هذه اللوحة قيد التطوير وستكون متاحة قريباً
      </p>
    </div>
  );
}
