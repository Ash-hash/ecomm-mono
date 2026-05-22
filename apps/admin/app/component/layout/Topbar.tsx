'use client';

import { useRouter } from 'next/navigation';

import { logout } from '@/app/lib/auth';

export default function Topbar() {
  const router = useRouter();

  async function handleLogout() {
    await logout();

    window.location.href = '/login';
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-8">
      <h2 className="text-lg font-semibold">
        Super Admin
      </h2>

      <button
        onClick={handleLogout}
        className="rounded-xl border border-red-500/30 px-4 py-2 text-red-400 transition hover:bg-red-500/10"
      >
        Logout
      </button>
    </header>
  );
}