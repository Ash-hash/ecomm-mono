'use client';

import { Card } from '@/app/component/ui/Card';
import { SkeletonCards } from '@/app/component/ui/SkeletonCards';

import { useStats } from '@/app/hooks/useStats';

export default function DashboardPage() {
  const {
    data,
    isLoading,
    error,
  } = useStats();

  const overview =
    data?.data?.overview;

  if (isLoading) {
    return <SkeletonCards />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8">
        Failed to load dashboard
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-[var(--muted)]">
        No dashboard data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      <Card
        title="Total Tenants"
        value={overview.totalTenants}
      />

      <Card
        title="Active Tenants"
        value={overview.activeTenants}
      />

      <Card
        title="Trial Tenants"
        value={overview.trialTenants}
      />

      <Card
        title="MRR"
        value={`₹${overview.mrr.toLocaleString()}`}
      />
    </div>
  );
}