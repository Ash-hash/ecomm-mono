'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCustomerProfile } from '@/src/hooks';
import { cn } from '@/src/lib/utils';
import {
  LayoutDashboard, Package, Zap, Heart,
  User, MapPin, LogOut, Bell,
} from 'lucide-react';
import { authApi } from '@repo/api-client';

const NAV = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/orders',      icon: Package,         label: 'My Orders',    badge: 3 },
  { href: '/dashboard/subscription',icon: Zap,             label: 'Subscription' },
  { href: '/dashboard/wishlist',    icon: Heart,           label: 'Wishlist',     badge: 5, badgeGold: true },
  { href: '/dashboard/profile',     icon: User,            label: 'Profile' },
  { href: '/dashboard/addresses',   icon: MapPin,          label: 'Addresses' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCustomerProfile();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <aside className="
      w-[260px] min-h-screen bg-[--ink-2] border-r border-[--line]
      flex flex-col sticky top-0 h-screen overflow-y-auto
    ">
      {/* Brand */}
      <div className="px-6 py-7 border-b border-[--line]">
        <div className="font-serif text-[22px] font-semibold text-[--bright] tracking-[0.02em]">
          StoreFront
        </div>
        <div className="text-[11px] text-[--dim] tracking-[0.12em] uppercase mt-0.5">
          My Account
        </div>
      </div>

      {/* User card */}
      <div className="px-6 py-5 border-b border-[--line]">
        <div className="flex items-center gap-3">
          <div className="
            w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center
            font-serif text-lg font-semibold text-[--gold]
            bg-[--gold-dim] border border-[--gold-line]
          ">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-[--bright] truncate">
              {user?.name ?? '...'}
            </div>
            <span className="
              inline-flex items-center gap-1 text-[10px] font-medium tracking-[0.1em]
              uppercase text-[--gold] bg-[--gold-dim] border border-[--gold-line]
              rounded-full px-2 py-0.5 mt-1
            ">
              <Zap size={9} strokeWidth={2.5} />
              Pro Plan
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-[--muted] px-6 py-2 mb-1">
          Account
        </div>
        {NAV.slice(0, 4).map(item => <NavItem key={item.href} {...item} active={pathname === item.href} />)}

        <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-[--muted] px-6 py-2 mt-3 mb-1">
          Settings
        </div>
        {NAV.slice(4).map(item => <NavItem key={item.href} {...item} active={pathname === item.href} />)}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[--line]">
        <button
          onClick={() => authApi.logout()}
          className="flex items-center gap-2 text-[13px] text-[--dim] hover:text-rose-400 transition-colors w-full"
        >
          <LogOut size={15} strokeWidth={1.7} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href, icon: Icon, label, badge, badgeGold, active,
}: {
  href: string; icon: React.ElementType; label: string;
  badge?: number; badgeGold?: boolean; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-6 py-2.5 text-[13.5px] transition-all duration-150 border-l-2',
        active
          ? 'text-[--gold] bg-[--gold-dim] border-l-[--gold] font-medium'
          : 'text-[--soft] hover:text-[--prose] hover:bg-[--ink-3] border-l-transparent',
      )}
    >
      <Icon size={17} strokeWidth={1.7} className={cn('flex-shrink-0', active ? 'opacity-100' : 'opacity-60')} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          'text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
          badgeGold ? 'bg-[--gold] text-[#0a0808]' : 'bg-rose-500 text-white',
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}
