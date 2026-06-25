'use client';

/**
 * apps/frontend/src/app/dashboard/page.jsx
 * Role-based dashboard router — dynamic imports per role.
 */

import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';
import { AlertTriangle } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

const AgentDashboard = dynamic(
  () => import('@/components/dashboards/AgentDashboard'),
  { loading: () => <LoadingSpinner />, ssr: false }
);
const GmDashboard = dynamic(
  () => import('@/components/dashboards/GmDashboard'),
  { loading: () => <LoadingSpinner />, ssr: false }
);
const SupervisorDashboard = dynamic(
  () => import('@/components/dashboards/SupervisorDashboard'),
  { loading: () => <LoadingSpinner />, ssr: false }
);
const FinanceDashboard = dynamic(
  () => import('@/components/dashboards/FinanceDashboard'),
  { loading: () => <LoadingSpinner />, ssr: false }
);

const ROLE_DASHBOARDS = {
  agent: AgentDashboard,
  gm: GmDashboard,
  supervisor: SupervisorDashboard,
  finance: FinanceDashboard,
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const renderDashboard = () => {
    if (!user) {
      return <LoadingSpinner />;
    }

    const DashboardComponent = ROLE_DASHBOARDS[role];
    
    if (DashboardComponent) {
      return <DashboardComponent />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans text-center">
        <div className="flex items-center gap-2 p-4 border border-red-200 rounded-xl bg-red-50 text-red-700">
          <AlertTriangle size={24} />
          <p className="m-0 text-[0.95rem] font-extrabold">عذراً، هذا الحساب لا يملك صلاحية دخول للوحة التحكم</p>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div dir="rtl">{renderDashboard()}</div>
    </AppShell>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans">
      <Spinner size="xl" variant="primary" />
      <p className="m-0 text-slate-400 text-[0.85rem]">جارٍ التحميل…</p>
    </div>
  );
}
