/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
// app/account/subscription/page.tsx
'use client';

import { useState } from 'react';
import {
  useActiveSubscription,
  useSubscriptionHistory,
  useUpgradeSubscription,
  useCancelSubscription,
  useCustomerProfile,
} from '@/src/hooks';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import clsx from 'clsx';
import {
  Zap, Check, ArrowRight, AlertTriangle, Sparkles,
  Shield, Truck, Headphones, Tag, RefreshCcw, Clock,
  ChevronDown, ChevronUp, CreditCard, X,
} from 'lucide-react';
import type { Subscription, SubStatus, UserPlan } from '@repo/types';

// ─────────────────────────────────────────────────────────────────────────────
// Plan catalogue
// ─────────────────────────────────────────────────────────────────────────────

interface PlanDef {
  key:          UserPlan;
  name:         string;
  tagline:      string;
  monthlyPrice: number;
  annualPrice:  number;
  color:        string;
  colorSoft:    string;
  gradient:     string;
  popular?:     boolean;
  features:     { icon: React.ElementType; text: string; highlight?: boolean }[];
}

const PLANS: PlanDef[] = [
  {
    key:          'free',
    name:         'Free',
    tagline:      'Get started, no commitment',
    monthlyPrice: 0,
    annualPrice:  0,
    color:        '#64748b',
    colorSoft:    '#f1f5f9',
    gradient:     'from-slate-500 to-slate-600',
    features: [
      { icon: Check, text: 'Order history & tracking'    },
      { icon: Check, text: 'Standard delivery rates'     },
      { icon: Check, text: 'Email support'               },
    ],
  },
  {
    key:          'starter',
    name:         'Starter',
    tagline:      'Perfect for regular shoppers',
    monthlyPrice: 299,
    annualPrice:  2990,
    color:        '#1d4ed8',
    colorSoft:    '#eff6ff',
    gradient:     'from-blue-600 to-blue-700',
    features: [
      { icon: Check, text: 'Everything in Free'          },
      { icon: Truck, text: 'Free standard shipping'      },
      { icon: Tag,   text: 'Early sale access'           },
      { icon: Check, text: 'Priority order processing'   },
    ],
  },
  {
    key:          'pro',
    name:         'Pro',
    tagline:      'For the power shopper',
    monthlyPrice: 799,
    annualPrice:  7990,
    color:        '#b45309',
    colorSoft:    '#fffbeb',
    gradient:     'from-amber-600 to-amber-700',
    popular:      true,
    features: [
      { icon: Check,       text: 'Everything in Starter'                    },
      { icon: Truck,       text: 'Free express shipping',  highlight: true  },
      { icon: Tag,         text: 'Exclusive member pricing', highlight: true },
      { icon: Headphones,  text: 'Dedicated support line'                   },
      { icon: Sparkles,    text: 'Wishlist price alerts'                    },
      { icon: Zap,         text: 'Early product launches'                   },
    ],
  },
  {
    key:          'enterprise',
    name:         'Enterprise',
    tagline:      'Tailored for teams & businesses',
    monthlyPrice: 1999,
    annualPrice:  19990,
    color:        '#6d28d9',
    colorSoft:    '#f5f3ff',
    gradient:     'from-violet-700 to-violet-800',
    features: [
      { icon: Check,       text: 'Everything in Pro'       },
      { icon: Tag,         text: 'Bulk order discounts', highlight: true  },
      { icon: Headphones,  text: 'Dedicated account manager'              },
      { icon: CreditCard,  text: 'Custom invoicing & GST'                 },
      { icon: Shield,      text: 'API access'                             },
      { icon: Zap,         text: 'SLA-backed fulfilment'                  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SubStatus, { label: string; dot: string; cls: string }> = {
  active:    { label: 'Active',    dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200'  },
  trialing:  { label: 'Trial',     dot: 'bg-sky-500',     cls: 'bg-sky-50 text-sky-700 border border-sky-200'              },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     cls: 'bg-red-50 text-red-600 border border-red-200'             },
  past_due:  { label: 'Past Due',  dot: 'bg-amber-500',   cls: 'bg-amber-50 text-amber-700 border border-amber-200'       },
  paused:    { label: 'Paused',    dot: 'bg-zinc-400',    cls: 'bg-zinc-100 text-zinc-600 border border-zinc-200'          },
};

function StatusBadge({ status }: { status: SubStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.active;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full',
      cfg.cls,
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing toggle
// ─────────────────────────────────────────────────────────────────────────────

function BillingToggle({
  billing,
  onChange,
}: {
  billing: 'monthly' | 'annual';
  onChange: (v: 'monthly' | 'annual') => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg-2)] rounded-full border border-[var(--border)]">
      {(['monthly', 'annual'] as const).map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          className={clsx(
            'relative px-5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-200',
            billing === b
              ? 'bg-[var(--text-strong)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-soft)]',
          )}
        >
          {b === 'annual' && (
            <span className={clsx(
              'absolute -top-2.5 -right-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full',
              billing === 'annual' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700',
            )}>
              −17%
            </span>
          )}
          {b.charAt(0).toUpperCase() + b.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active plan card (hero)
// ─────────────────────────────────────────────────────────────────────────────

function ActivePlanCard({
  subscription,
  onCancel,
  cancelling,
}: {
  subscription: Subscription;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const plan = PLANS.find((p) => p.key === subscription.plan) ?? PLANS[0];

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const periodPct = Math.min(
    100,
    Math.round(
      ((Date.now() - new Date(subscription.currentPeriodStart).getTime()) /
        (new Date(subscription.currentPeriodEnd).getTime() -
          new Date(subscription.currentPeriodStart).getTime())) *
        100,
    ),
  );

  return (
    <div className={clsx(
      'relative overflow-hidden rounded-2xl border p-6 md:p-8',
      'bg-gradient-to-br from-[var(--text-strong)] to-[#121c10]',
      'border-white/10',
    )}>
      {/* Radial glow */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: plan?.color }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10"
        style={{ background: plan?.color }}
      />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Plan icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10"
              style={{ background: `${plan?.color ?? '#64748b'}33` }}
            >
              <Zap size={24} style={{ color: plan?.color }} fill="currentColor" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-0.5">
                Current Plan
              </p>
              <h2 className="text-2xl font-bold text-white capitalize">
                {subscription.plan} Plan
              </h2>
              <p className="text-[12px] text-white/45 mt-0.5">
                {subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly'} billing
                {subscription.amount > 0 && ` · ${formatCurrency(subscription.amount)}/${subscription.billingCycle === 'annual' ? 'yr' : 'mo'}`}
              </p>
            </div>
          </div>
          <StatusBadge status={subscription.status} />
        </div>

        {/* Period progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-white/50">Billing period</span>
            <span className="text-white/70 font-medium">
              {daysLeft > 0 ? (
                <>{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</>
              ) : (
                'Expires today'
              )}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${periodPct}%`, background: plan?.color }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/30 mt-1.5">
            <span>{formatDate(subscription.currentPeriodStart)}</span>
            <span>{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { icon: CreditCard, label: 'Gateway',  value: subscription.gateway        },
            { icon: RefreshCcw, label: 'Cycle',    value: subscription.billingCycle   },
            { icon: Clock,      label: 'Renews',   value: formatDate(subscription.currentPeriodEnd) },
          ].map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5"
            >
              <p.icon size={13} className="text-white/40" />
              <div>
                <div className="text-[10px] text-white/35 uppercase tracking-wide">{p.label}</div>
                <div className="text-[13px] font-semibold text-white capitalize">{p.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cancel section */}
        {subscription.cancelAtPeriodEnd ? (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
            <p className="text-[12.5px] text-amber-300">
              Cancels on {formatDate(subscription.currentPeriodEnd)} — you keep access until then.
            </p>
          </div>
        ) : subscription.status === 'active' || subscription.status === 'trialing' ? (
          <>
            {!confirmCancel ? (
              <button
                onClick={() => setConfirmCancel(true)}
                className="text-[12px] text-white/30 hover:text-red-400 transition-colors border border-white/10 hover:border-red-400/30 px-4 py-2 rounded-full"
              >
                Cancel subscription
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex-wrap">
                <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
                <span className="text-[12.5px] text-red-300 flex-1">
                  Cancel at period end? You keep access until {formatDate(subscription.currentPeriodEnd)}.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onCancel(); setConfirmCancel(false); }}
                    disabled={cancelling}
                    className="px-4 py-1.5 bg-red-500 text-white text-[12px] font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                  >
                    {cancelling ? '…' : 'Yes, cancel'}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="px-4 py-1.5 border border-white/20 text-white/60 text-[12px] rounded-lg hover:border-white/40 transition-colors"
                  >
                    Keep plan
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
  currentPlan,
  isLoading,
  onSelect,
}: {
  plan:        PlanDef;
  billing:     'monthly' | 'annual';
  currentPlan: UserPlan;
  isLoading:   boolean;
  onSelect:    (key: UserPlan) => void;
}) {
  const isCurrent  = plan.key === currentPlan;
  const price      = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const monthlyEq  = billing === 'annual' && plan.annualPrice > 0
    ? Math.round(plan.annualPrice / 12) : null;

  const planOrder: UserPlan[] = ['free', 'starter', 'pro', 'enterprise'];
  const isDowngrade = planOrder.indexOf(plan.key) < planOrder.indexOf(currentPlan);
  const isUpgrade   = planOrder.indexOf(plan.key) > planOrder.indexOf(currentPlan);

  return (
    <div className={clsx(
      'relative flex flex-col rounded-2xl border-2 transition-all duration-200',
      isCurrent
        ? 'shadow-lg'
        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-md',
      plan.popular && !isCurrent && 'ring-2 ring-offset-2',
    )}
      style={
        isCurrent
          ? { borderColor: plan.color, background: plan.colorSoft }
          : plan.popular && !isCurrent
          ? { '--tw-ring-color': plan?.color } as any
          : {}
      }
    >
      {/* Popular ribbon */}
      {plan.popular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-[0.1em] px-3.5 py-1 rounded-full text-white whitespace-nowrap shadow-sm"
          style={{ background: plan.color }}
        >
          ✦ Most Popular
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold" style={{ color: isCurrent ? plan.color : 'var(--text-strong)' }}>
                {plan.name}
              </h3>
              {isCurrent && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{ color: plan.color, borderColor: `${plan.color}40`, background: `${plan.color}15` }}
                >
                  Current
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mt-4 mb-5">
          <div className="flex items-end gap-1.5">
            <span className="text-[30px] font-black text-[var(--text-strong)] leading-none mono">
              {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
            </span>
            {price > 0 && (
              <span className="text-[12px] text-[var(--text-muted)] mb-1">
                /{billing === 'annual' ? 'yr' : 'mo'}
              </span>
            )}
          </div>
          {monthlyEq && (
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
              ≈ ₹{monthlyEq.toLocaleString('en-IN')}/mo · billed annually
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <f.icon
                size={13}
                className="flex-shrink-0 mt-0.5"
                style={{ color: plan.color }}
              />
              <span className={clsx(
                'text-[12.5px] leading-snug',
                f.highlight
                  ? 'font-semibold text-[var(--text-strong)]'
                  : 'text-[var(--text-soft)]',
              )}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => !isCurrent && onSelect(plan.key)}
          disabled={isCurrent || isLoading}
          className={clsx(
            'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-[0.98]',
            isCurrent
              ? 'cursor-default opacity-80'
              : isDowngrade
              ? 'border border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--border-strong)] hover:text-[var(--text-strong)] bg-[var(--surface)]'
              : 'text-white shadow-md hover:shadow-lg',
            isLoading && !isCurrent && 'opacity-60 cursor-not-allowed',
          )}
          style={
            isCurrent
              ? { color: plan.color, background: `${plan.color}18`, border: `1.5px solid ${plan.color}35` }
              : !isDowngrade
              ? { background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` }
              : {}
          }
        >
          {isLoading && !isCurrent ? (
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : null}
          {isCurrent ? 'Your current plan' : isDowngrade ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
          {!isCurrent && !isLoading && <ArrowRight size={13} />}
        </button>

        {/* Downgrade note */}
        {isDowngrade && !isCurrent && (
          <p className="text-[10.5px] text-[var(--text-muted)] text-center mt-2">
            Takes effect at end of billing period
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History row
// ─────────────────────────────────────────────────────────────────────────────

function HistoryRow({ sub }: { sub: Subscription }) {
  const plan = PLANS.find((p) => p.key === sub.plan);
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg)] transition-colors gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${plan?.color ?? '#64748b'}20` }}
        >
          <Zap size={13} style={{ color: plan?.color ?? '#64748b' }} />
        </div>
        <div>
          <p className="text-[13.5px] font-semibold text-[var(--text-strong)] capitalize">
            {sub.plan} · {sub.billingCycle}
          </p>
          <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
            {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={sub.status} />
        <span className="text-[14px] font-bold text-[var(--text-strong)] mono">
          {sub.amount === 0 ? 'Free' : formatCurrency(sub.amount)}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison table (collapsible)
// ─────────────────────────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { label: 'Order tracking',          free: true,  starter: true,  pro: true,       enterprise: true   },
  { label: 'Free standard shipping',  free: false, starter: true,  pro: true,       enterprise: true   },
  { label: 'Free express shipping',   free: false, starter: false, pro: true,       enterprise: true   },
  { label: 'Member-only pricing',     free: false, starter: false, pro: true,       enterprise: true   },
  { label: 'Early sale access',       free: false, starter: true,  pro: true,       enterprise: true   },
  { label: 'Wishlist price alerts',   free: false, starter: false, pro: true,       enterprise: true   },
  { label: 'Priority support',        free: false, starter: true,  pro: true,       enterprise: true   },
  { label: 'Dedicated account manager', free: false, starter: false, pro: false,    enterprise: true   },
  { label: 'Bulk order discounts',    free: false, starter: false, pro: false,      enterprise: true   },
  { label: 'API access',              free: false, starter: false, pro: false,      enterprise: true   },
  { label: 'Custom invoicing',        free: false, starter: false, pro: false,      enterprise: true   },
];

function ComparisonTable({ currentPlan }: { currentPlan: UserPlan }) {
  const [open, setOpen] = useState(false);
  const plans: UserPlan[] = ['free', 'starter', 'pro', 'enterprise'];

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--bg)] transition-colors"
      >
        <h3 className="text-[15px] font-bold text-[var(--text-strong)]">Full feature comparison</h3>
        {open ? (
          <ChevronUp size={16} className="text-[var(--text-muted)]" />
        ) : (
          <ChevronDown size={16} className="text-[var(--text-muted)]" />
        )}
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-t border-[var(--border)] bg-[var(--bg-2)]">
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] w-1/3">
                  Feature
                </th>
                {plans.map((p) => {
                  const def = PLANS.find((pl) => pl.key === p)!;
                  return (
                    <th key={p} className="px-4 py-3 text-center">
                      <span
                        className={clsx(
                          'text-[12px] font-bold capitalize',
                          p === currentPlan ? '' : 'text-[var(--text-muted)]',
                        )}
                        style={p === currentPlan ? { color: def.color } : {}}
                      >
                        {p}
                        {p === currentPlan && <span className="ml-1 text-[9px]">✦</span>}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="hover:bg-[var(--bg)] transition-colors">
                  <td className="px-6 py-3 text-[12.5px] text-[var(--text-soft)]">
                    {row.label}
                  </td>
                  {plans.map((p) => {
                    const def  = PLANS.find((pl) => pl.key === p)!;
                    const val  = row[p as keyof typeof row] as boolean;
                    const curr = p === currentPlan;
                    return (
                      <td key={p} className="px-4 py-3 text-center">
                        {val ? (
                          <Check
                            size={14}
                            className="mx-auto"
                            style={{ color: curr ? def.color : 'var(--text-muted)' }}
                          />
                        ) : (
                          <X size={14} className="mx-auto text-[var(--border-strong)] opacity-50" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-56 rounded-2xl bg-[var(--bg-3)]" />
      <div className="flex justify-center gap-2">
        <div className="h-9 w-40 rounded-full bg-[var(--bg-3)]" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-2xl bg-[var(--bg-3)]" />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// No subscription state
// ─────────────────────────────────────────────────────────────────────────────

function NoSubscription() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-8 py-12 text-center mb-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
        <Zap size={26} className="text-amber-500" fill="currentColor" />
      </div>
      <h3 className="text-[18px] font-bold text-[var(--text-strong)] mb-2">No active subscription</h3>
      <p className="text-[13.5px] text-[var(--text-muted)] max-w-sm mx-auto">
        You&apos;re on the free plan. Upgrade below to unlock shipping perks, member pricing, and more.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AccountSubscriptionPage() {
  const { data: subscription, isLoading: subLoading }  = useActiveSubscription();
  const { data: history,      isLoading: histLoading }  = useSubscriptionHistory();
  const { data: profile }                               = useCustomerProfile();
  const { mutate: upgrade, isPending: upgrading }       = useUpgradeSubscription();
  const { mutate: cancel,  isPending: cancelling }      = useCancelSubscription();

  const [billing,      setBilling]     = useState<'monthly' | 'annual'>('monthly');
  const [pendingPlan,  setPendingPlan] = useState<UserPlan | null>(null);
  const [historyOpen,  setHistoryOpen] = useState(false);

  const currentPlan: UserPlan = subscription?.plan ?? profile?.plan ?? 'free';
  const isLoading = subLoading;

  function handleUpgrade(planKey: UserPlan) {
    if (planKey === currentPlan) return;
    setPendingPlan(planKey);
    upgrade(
      { plan: planKey, billingCycle: billing, gateway: 'razorpay' },
      { onSettled: () => setPendingPlan(null) },
    );
  }

  function handleCancel() {
    cancel();
  }

  return (
    <div className="space-y-8">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text-strong)]">Subscription</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Manage your plan, billing cycle, and member benefits
          </p>
        </div>
        {/* Billing toggle in header for quick access */}
        <BillingToggle billing={billing} onChange={setBilling} />
      </div>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {isLoading && <Skeleton />}

      {!isLoading && (
        <>
          {/* ── Active plan card ──────────────────────────────────────── */}
          {subscription ? (
            <ActivePlanCard
              subscription={subscription}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ) : (
            <NoSubscription />
          )}

          {/* ── Plan picker ───────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-[var(--text-strong)]">
                {subscription ? 'Change your plan' : 'Choose a plan'}
              </h2>
              {/* Mobile billing toggle (header one hides on small) */}
              <div className="sm:hidden">
                <BillingToggle billing={billing} onChange={setBilling} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  billing={billing}
                  currentPlan={currentPlan}
                  isLoading={pendingPlan === plan.key && upgrading}
                  onSelect={handleUpgrade}
                />
              ))}
            </div>

            {/* Annual savings callout */}
            {billing === 'monthly' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[12.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
                <Sparkles size={14} className="flex-shrink-0" />
                <span>
                  Switch to annual billing and save up to{' '}
                  <strong>₹{(1999 * 12 - 19990).toLocaleString('en-IN')}</strong> per year on Enterprise.
                </span>
              </div>
            )}
          </div>

          {/* ── Feature comparison ────────────────────────────────────── */}
          <ComparisonTable currentPlan={currentPlan} />

          {/* ── Billing history ───────────────────────────────────────── */}
          {history && history.length > 0 && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--bg)] transition-colors"
              >
                <div>
                  <h3 className="text-[15px] font-bold text-[var(--text-strong)] text-left">
                    Billing history
                  </h3>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5 text-left">
                    {history.length} record{history.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {historyOpen ? (
                  <ChevronUp size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                )}
              </button>

              {historyOpen && (
                <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                  {(history as Subscription[]).map((sub) => (
                    <HistoryRow key={sub._id} sub={sub} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Trust strip ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Shield,     label: 'Secure billing',      desc: 'Razorpay encrypted'    },
              { icon: RefreshCcw, label: 'Cancel anytime',      desc: 'No lock-in contracts'  },
              { icon: Clock,      label: 'Instant activation',  desc: 'Access within seconds' },
              { icon: Headphones, label: 'Priority support',    desc: 'On paid plans'         },
            ].map((t) => (
              <div key={t.label} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <t.icon size={16} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12.5px] font-semibold text-[var(--text-strong)]">{t.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </>
      )}
    </div>
  );
}
