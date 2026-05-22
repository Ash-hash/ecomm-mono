'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/hooks/useAuth';

import DashboardShell from '@/app/component/layout/DashboardShell';
import Loader from '@/app/component/ui/Loader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { loading, authed } = useAuth();

  useEffect(() => {
    if (!loading && !authed) {
      router.replace('/login');
    }
  }, [loading, authed, router]);

  if (loading) {
    return <Loader />;
  }

  if (!authed) {
    return null;
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}