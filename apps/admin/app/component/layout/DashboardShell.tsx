'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />

      <div className="ml-64">
        <Topbar />

        <main className="pt-20 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}