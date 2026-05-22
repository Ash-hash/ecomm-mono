'use client';

import Link from 'next/link';
import { useCustomerProfile, useCustomerOrders } from '@/src/hooks';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { Package, Heart, MapPin, User, LogOut, ArrowRight, Zap, CreditCard } from 'lucide-react';
import { redirect, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Order } from '@repo/types';
import {logout} from '@repo/auth'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = 'bg-[var(--primary-soft)]',
  iconColor = 'text-[var(--primary)]',
}: {
  label:       string;
  value:       string | number;
  icon:        React.ElementType;
  iconBg?:     string;
  iconColor?:  string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className={clsx('w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0', iconBg, iconColor)}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm font-bold text-[var(--text-strong)]">{value}</div>
        <div className="text-xs text-[var(--text-muted)]">{label}</div>
      </div>
    </div>
  );
}

// ── Nav card ──────────────────────────────────────────────────────────────────

function NavCard({ icon: Icon, title, desc, href, badge }: {
  icon: React.ElementType; title: string; desc: string; href: string; badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-strong)] flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] font-bold bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0 mt-1" />
    </Link>
  );
}

// ── Order status dot ──────────────────────────────────────────────────────────

const ORDER_STATUS_CLS: Record<string, string> = {
  pending:    'bg-zinc-400',
  processing: 'bg-amber-500',
  shipped:    'bg-sky-500',
  delivered:  'bg-emerald-500',
  cancelled:  'bg-red-500',
  refunded:   'bg-violet-500',
};

const PLAN_CHIP: Record<string, string> = {
  free:       'bg-[var(--bg-3)] text-[var(--text-muted)]',
  starter:    'bg-blue-50 text-blue-600 border border-blue-100',
  pro:        'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
  enterprise: 'bg-violet-50 text-violet-700 border border-violet-100',
};

const PLAN_LABEL: Record<string, string> = {
  free:       'Free',
  starter:    'Starter',
  pro:        '⚡ Pro',
  enterprise: 'Enterprise',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { data: profile }    = useCustomerProfile();
  const { data: ordersPage } = useCustomerOrders({ limit: 5 });

  const orders: Order[] = ordersPage?.data ?? [];

  const activeOrders = orders.filter(
    (o) => !['delivered', 'cancelled', 'refunded'].includes(o.status),
  );

  async function handleLogout() {
    await logout();
    router.refresh();
  }

  // if (!profile) {
  //   redirect('/')
  // }

  return (
    <div className="space-y-8">

      {/* ── Profile header ────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-[18px] flex-shrink-0">
            {profile?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[var(--text-strong)]">
              {profile?.name ?? 'Customer'}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {profile?.email ?? profile?.phone ?? 'No contact info'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className={clsx('px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wide', PLAN_CHIP[profile?.plan ?? 'free'])}>
            {PLAN_LABEL[profile?.plan ?? 'free']}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-full transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Orders"  value={profile?.totalOrders ?? 0}         icon={Package}  />
        <StatCard label="Active Orders" value={activeOrders.length}               icon={Package}  iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard label="Wishlist"      value={profile?.wishlist?.length ?? 0}     icon={Heart}    iconBg="bg-rose-50"  iconColor="text-rose-500"  />
        <StatCard
          label="Total Spent"
          value={formatCurrency(profile?.totalSpent ?? 0)}
          icon={CreditCard}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* ── Quick navigation ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-[16px] font-bold text-[var(--text-strong)] mb-4">My Account</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NavCard
            icon={Package}
            title="Orders"
            desc="View and track your purchases"
            href="/account/orders"
            badge={activeOrders.length > 0 ? String(activeOrders.length) : undefined}
          />
          <NavCard
            icon={Heart}
            title="Wishlist"
            desc="Products you've saved"
            href="/wishlist"
            badge={profile?.wishlist?.length ? String(profile.wishlist.length) : undefined}
          />
          <NavCard
            icon={MapPin}
            title="Addresses"
            desc="Manage shipping addresses"
            href="/account/addresses"
            badge={profile?.addresses?.length ? String(profile.addresses.length) : undefined}
          />
          <NavCard
            icon={Zap}
            title="Subscription"
            desc="Manage your plan and benefits"
            href="/account/subscription"
          />
          <NavCard
            icon={CreditCard}
            title="Payments"
            desc="View your payment history"
            href="/account/payments"
          />
          <NavCard
            icon={User}
            title="Profile"
            desc="Update your personal info"
            href="/account/profile"
          />
        </div>
      </div>

      {/* ── Recent orders ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-[16px] font-bold text-[var(--text-strong)]">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-[13px] text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-2)] flex items-center justify-center mb-3">
              <Package size={20} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[14px] font-medium text-[var(--text-soft)]">No orders yet</p>
            <Link href="/" className="mt-3 text-[13px] text-[var(--primary)] hover:underline">
              Browse products →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--bg)] transition-colors">
                {/* Status icon */}
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-2)] flex items-center justify-center text-lg flex-shrink-0">
                  {order.status === 'delivered' ? '✅'
                    : order.status === 'shipped' ? '🚚'
                    : order.status === 'cancelled' ? '❌'
                    : '📦'}
                </div>

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-[var(--text-strong)] mono truncate">
                      {order.orderNumber}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium capitalize text-[var(--text-muted)]">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', ORDER_STATUS_CLS[order.status] ?? 'bg-zinc-400')} />
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    {formatDate(order.createdAt)} · {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className="text-[14px] font-bold text-[var(--text-strong)] mono">
                    {formatCurrency(order.total)}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] capitalize">
                    {order.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}