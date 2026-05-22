'use client';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/src/components/ui';

const TITLES: Record<string, string> = {
  '/dashboard':              'Overview',
  '/dashboard/orders':       'My Orders',
  '/dashboard/subscription': 'Subscription & Billing',
  '/dashboard/wishlist':     'Wishlist',
  '/dashboard/profile':      'Profile & Settings',
  '/dashboard/addresses':    'Saved Addresses',
};

export function Topbar() {
  const pathname = usePathname();
  const title    = TITLES[pathname] ?? 'Account';

  // Partial match for order detail pages
  const display = pathname.startsWith('/dashboard/orders/')
    ? 'Order Details'
    : title;

  return (
    <header className="
      sticky top-0 z-10 bg-[--ink] border-b border-[--line]
      flex items-center justify-between px-8 h-[60px]
    ">
      <h1 className="font-serif text-[22px] font-medium text-[--bright] tracking-[0.01em]">
        {display}
      </h1>
      <div className="flex items-center gap-3">
        <button className="
          relative w-9 h-9 flex items-center justify-center
          bg-[--ink-3] border border-[--line] rounded-[8px]
          hover:border-[--muted] transition-colors
        ">
          <Bell size={16} strokeWidth={1.7} className="text-[--soft]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[--ink]" />
        </button>
        <Button variant="primary" size="sm">
          🛍 Shop Now
        </Button>
      </div>
    </header>
  );
}
