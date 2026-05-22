'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCustomerProfile } from '@/src/hooks';
import {
  LayoutDashboard,
  Package,
  Zap,
  User,
  CreditCard,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@repo/auth';

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/account/orders', label: 'Orders', icon: Package, exact: false },
  { href: '/account/profile', label: 'Profile', icon: User, exact: false },
  {
    href: '/account/addresses',
    label: 'Addresses',
    icon: MapPin,
    exact: false,
  },
  {
    href: '/account/subscription',
    label: 'Subscription',
    icon: Zap,
    exact: false,
  },
  {
    href: '/account/payments',
    label: 'Payments',
    icon: CreditCard,
    exact: false,
  },
];

// ── Plan chip ─────────────────────────────────────────────────────────────────

const PLAN_CHIP: Record<string, string> = {
  free: 'bg-[var(--bg-3)] text-[var(--text-muted)]',
  starter: 'bg-blue-50 text-blue-600 border border-blue-100',
  pro: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
  enterprise: 'bg-violet-50 text-violet-700 border border-violet-100',
};

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: '⚡ Pro',
  enterprise: 'Enterprise',
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authOk, setAuthOk] = useState(false);
  const { data: profile, isLoading, isFetched } = useCustomerProfile();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    checkAuth().then((ok) => {
      if (!mounted) return;
      setAuthOk(ok);
      setAuthChecked(true);
      if (!ok) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    });
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (authChecked && authOk && isFetched && !isLoading && !profile) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authChecked, authOk, isFetched, isLoading, pathname, profile, router]);

  if (!authChecked || (authOk && isLoading)) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  if (!authOk) {
    return null;
  }


  const initials =
    profile?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  const plan = profile?.plan ?? 'free';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ── Hero / profile header ──────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 pt-5 text-xs text-[var(--text-muted)]">
            <Link
              href="/"
              className="hover:text-[var(--primary)] transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-[var(--text-soft)]">My Account</span>
          </div>

          {/* Profile strip */}
          <div className="flex items-center gap-5 py-6">
            {/* Avatar */}
            {isLoading ? (
              <div className="w-14 h-14 rounded-full bg-[var(--bg-3)] animate-pulse flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-white font-bold text-[18px] flex items-center justify-center flex-shrink-0 select-none">
                {initials}
              </div>
            )}

            {/* Name + email + plan */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-[var(--bg-3)] rounded animate-pulse" />
                  <div className="h-4 w-56 bg-[var(--bg-3)] rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-lg md:text-xl font-semibold text-[var(--text-strong)]">
                      {profile?.name ?? 'My Account'}
                    </h1>
                    <span
                      className={clsx(
                        'text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wide',
                        PLAN_CHIP[plan],
                      )}
                    >
                      {PLAN_LABEL[plan]}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate">
                    {profile?.email ?? profile?.phone ?? ''}
                  </p>
                </>
              )}
            </div>

            {/* Orders count stat */}
            <div className="hidden md:block text-right">
              <div className="text-xl font-bold text-[var(--text-strong)]">
                {isLoading ? '—' : (profile?.totalOrders ?? 0)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
                Total Orders
              </div>
            </div>
          </div>

          {/* ── Tabs navigation ───────────────────────────────────────── */}
          <div className="flex items-end overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-150',
                    active
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-soft)] hover:border-[var(--border-strong)]',
                  )}
                >
                  <Icon size={14} strokeWidth={active ? 2.2 : 1.7} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-8">{children}</div>
    </div>
  );
}
