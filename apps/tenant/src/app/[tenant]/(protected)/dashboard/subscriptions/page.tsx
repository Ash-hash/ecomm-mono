/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useQueryState } from 'nuqs';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

import { DataTable, DataTableToolbar } from '../../../../components/data-table';
import {
  Badge,
  PageHeader,
  Btn,
  TableCard,
  Card,
  formatINR,
  formatDate,
} from '../../../../components/ui';

import {
  useSubscriptions,
  useCancelSubscription,
  useSubscriptionOverview,
  useExpiringSubscriptions,
} from '../../../../hooks'; // ← adjust to your hooks path
import { Subscription, SubStatus, UserPlan } from '@repo/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_COLOR: Record<string, string> = {
  free: 'var(--text-muted)',
  starter: '#60a5fa',
  pro: '#a78bfa',
  enterprise: '#f59e0b',
};

const PLAN_BG: Record<string, string> = {
  free: 'var(--bg-3)',
  starter: '#eff6ff',
  pro: '#f5f3ff',
  enterprise: '#fffbeb',
};

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Trialing', value: 'trialing' },
  { label: 'Past Due', value: 'past_due' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Paused', value: 'paused' },
];

const PLAN_OPTIONS = [
  { label: 'Free', value: 'free' },
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────

function asSubStatus(v?: string | null): SubStatus | undefined {
  const valid = ['active', 'cancelled', 'past_due', 'trialing', 'paused'];
  return valid.includes(v ?? '') ? (v as SubStatus) : undefined;
}
function asUserPlan(v?: string | null): UserPlan | undefined {
  const valid = ['free', 'starter', 'pro', 'enterprise'];
  return valid.includes(v ?? '') ? (v as UserPlan) : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-[var(--text-muted)] font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-[22px] font-bold text-[var(--text-strong)] leading-none mono">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan breakdown card
// ─────────────────────────────────────────────────────────────────────────────

function PlanBreakdown({
  plans,
}: {
  plans: { plan: UserPlan; mrr: number; count: number }[];
}) {
  const maxMrr = Math.max(...plans.map((p) => p.mrr), 1);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
      <p className="text-[13px] font-semibold text-[var(--text-strong)] mb-4">
        Plan Breakdown
      </p>
      <div className="space-y-3">
        {plans.map((p) => (
          <div key={p.plan}>
            <div className="flex items-center justify-between text-[12.5px] mb-1.5">
              <span
                className="font-semibold capitalize px-2 py-0.5 rounded-full text-[11px]"
                style={{
                  color: PLAN_COLOR[p.plan],
                  background: PLAN_BG[p.plan],
                }}
              >
                {p.plan}
              </span>
              <div className="flex items-center gap-4 text-[var(--text-muted)]">
                <span>
                  {p.count} user{p.count !== 1 ? 's' : ''}
                </span>
                <span className="mono font-semibold text-[var(--text-strong)]">
                  {formatINR(p.mrr)}/mo
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-[var(--bg-3)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(p.mrr / maxMrr) * 100}%`,
                  background: PLAN_COLOR[p.plan],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expiring soon panel (collapsible)
// ─────────────────────────────────────────────────────────────────────────────

export function daysUntil(date: string | Date) {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function ExpiringPanel() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const { data } = useExpiringSubscriptions(days);
  const items = data?.data ?? [];


  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--bg)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock size={15} className="text-amber-600" />
          </div>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-[var(--text-strong)]">
              Expiring Soon
            </p>
            <p className="text-[11.5px] text-[var(--text-muted)]">
              {data?.count ?? 0} subscription
              {(data?.count ?? 0) !== 1 ? 's' : ''} in the next {days} days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-[12px] border border-[var(--border)] rounded-lg px-2 py-1 bg-[var(--surface)] text-[var(--text-soft)]"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
          {open ? (
            <ChevronUp size={16} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={16} className="text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)]">
          {items.length === 0 ? (
            <p className="text-center py-8 text-[13px] text-[var(--text-muted)]">
              No subscriptions expiring in {days} days 🎉
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {items.map((sub) => {
                const daysLeft = daysUntil(sub.currentPeriodEnd);
                return (
                  <div
                    key={sub._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg)] transition-colors"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-strong)]">
                        {sub.userName}
                      </p>
                      <p className="text-[11.5px] text-[var(--text-muted)]">
                        {sub.userEmail}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <span
                          className="text-[11px] font-bold capitalize px-2 py-0.5 rounded-full"
                          style={{
                            color: PLAN_COLOR[sub.plan],
                            background: PLAN_BG[sub.plan],
                          }}
                        >
                          {sub.plan}
                        </span>
                        <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                          Expires in {daysLeft}d
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold mono text-[var(--text-strong)]">
                        {formatINR(sub.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [status, setStatus] = useQueryState('status', { defaultValue: '' });
  const [plan, setPlan] = useQueryState('plan', { defaultValue: '' });
  const [search, setSearch] = useQueryState('search', { defaultValue: '' });

  const params = useMemo(
    () => ({
      page: Number(page),
      limit: 15,
      status: asSubStatus(status),
      plan: asUserPlan(plan),
      search: search || undefined,
    }),
    [page, status, plan, search],
  );

  const { data, isLoading } = useSubscriptions(params);
  const { data: overview } = useSubscriptionOverview();
  const cancelSub = useCancelSubscription();

  const subs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const plans = overview?.plans ?? [];

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: ColumnDef<Subscription, any>[] = useMemo(
    () => [
      {
        accessorKey: 'userName',
        header: 'Customer',
        cell: ({ row }) => (
          <div>
            <p className="text-[13.5px] font-semibold text-[var(--text-strong)]">
              {row.original.userName}
            </p>
            <p className="text-[11.5px] text-[var(--text-muted)]">
              {row.original.userEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'plan',
        header: 'Plan',
        cell: ({ getValue }) => {
          const p = getValue() as string;
          return (
            <span
              className="text-[12px] font-bold capitalize px-2.5 py-1 rounded-full"
              style={{ color: PLAN_COLOR[p], background: PLAN_BG[p] }}
            >
              {p}
            </span>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <div>
            <p className="text-[13.5px] font-semibold mono text-[var(--text-strong)]">
              {row.original.amount === 0 ? '—' : formatINR(row.original.amount)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] capitalize">
              {row.original.billingCycle}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge status={row.original.status} />
            {row.original.cancelAtPeriodEnd && (
              <p className="text-[10px] text-amber-600 font-medium">
                ⚠ Cancels at period end
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'billingCycle',
        header: 'Cycle',
        cell: ({ getValue }) => (
          <span className="text-[12.5px] capitalize text-[var(--text-soft)]">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'currentPeriodEnd',
        header: 'Renews / Ends',
        cell: ({ getValue, row }) => {
          const isPast = new Date(getValue()).getTime() < new Date().getTime();
          return (
            <span
              className={clsx(
                'text-[12.5px] mono',
                row.original.status === 'cancelled' || isPast
                  ? 'text-[var(--text-muted)]'
                  : 'text-[var(--text-soft)]',
              )}
            >
              {row.original.status === 'cancelled'
                ? '—'
                : formatDate(getValue())}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Subscribed',
        cell: ({ getValue }) => (
          <span className="text-[12px] text-[var(--text-muted)]">
            {formatDate(getValue())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const sub = row.original;
          const busy = cancelSub.isPending;

          if (sub.status !== 'active' && sub.status !== 'trialing') return null;

          return (
            <div className="flex gap-2">
              {!sub.cancelAtPeriodEnd && (
                <Btn
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    cancelSub.mutate({ id: sub._id, immediately: false })
                  }
                >
                  Cancel at End
                </Btn>
              )}
              <Btn
                size="sm"
                variant="danger"
                disabled={busy}
                onClick={() =>
                  cancelSub.mutate({
                    id: sub._id,
                    immediately: true,
                    reason: 'Admin action',
                  })
                }
              >
                Cancel Now
              </Btn>
            </div>
          );
        },
      },
    ],
    [cancelSub],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        subtitle={`${total.toLocaleString('en-IN')} subscriptions`}
        actions={<Btn variant="secondary">Export CSV</Btn>}
      />

      {/* ── Analytics overview ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="MRR"
          value={formatINR(overview?.totalMrr ?? 0)}
          sub={`ARR ${formatINR(overview?.arr ?? 0)}`}
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          label="Active"
          value={(overview?.active ?? 0).toLocaleString('en-IN')}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          label="Trialing"
          value={(overview?.trialing ?? 0).toLocaleString('en-IN')}
          icon={RefreshCw}
          color="#8b5cf6"
        />
        <StatCard
          label="Past Due"
          value={(overview?.pastDue ?? 0).toLocaleString('en-IN')}
          icon={AlertTriangle}
          color="#f59e0b"
        />
        <StatCard
          label="Churn (30d)"
          value={`${overview?.churnRate ?? 0}%`}
          sub={`${overview?.recentChurn ?? 0} cancelled`}
          icon={XCircle}
          color="#ef4444"
        />
        <StatCard
          label="Expiring"
          value={(overview?.expiringThisWeek ?? 0).toLocaleString('en-IN')}
          sub="Next 7 days"
          icon={Clock}
          color="#f97316"
        />
      </div>

      {/* ── Plan breakdown + expiring ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <PlanBreakdown plans={plans} />
        <ExpiringPanel />
      </div>

      {/* ── Subscriptions table ────────────────────────────────────────── */}
      <TableCard>
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <DataTableToolbar
            searchPlaceholder="Search by name or email…"
            search={search ?? ''}
            onSearch={(v) => {
              setSearch(v);
              setPage('1');
            }}
            filters={[
              {
                key: 'status',
                placeholder: 'Filter status',
                value: status ?? '',
                options: STATUS_OPTIONS,
                onChange: (v) => {
                  setStatus(v);
                  setPage('1');
                },
              },
              {
                key: 'plan',
                placeholder: 'Filter plan',
                value: plan ?? '',
                options: PLAN_OPTIONS,
                onChange: (v) => {
                  setPlan(v);
                  setPage('1');
                },
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          data={subs}
          total={total}
          page={Number(page)}
          limit={15}
          isLoading={isLoading}
          onPageChange={(p) => setPage(String(p))}
        />
      </TableCard>
    </div>
  );
}
