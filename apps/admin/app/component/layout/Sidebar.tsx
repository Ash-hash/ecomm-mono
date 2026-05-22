'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Tenants',
    href: '/dashboard/tenants',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-[var(--border)] bg-[var(--card)] p-6">
      <h1 className="mb-10 text-2xl font-bold text-[var(--primary)]">
        AdminOS
      </h1>

      <nav className="space-y-2">
        {items.map((item) => {
          const active =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 transition ${
                active
                  ? 'bg-[var(--primary)] text-black'
                  : 'text-[var(--muted)] hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}