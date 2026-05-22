/* eslint-disable @typescript-eslint/no-explicit-any */
// app/account/orders/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomerOrders } from '@/src/hooks';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import clsx from 'clsx';
import { Package, ChevronDown, ChevronUp, ArrowRight, MapPin } from 'lucide-react';
import type { Order, OrderItem, Address } from '@repo/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = [
  { key: '',            label: 'All Orders'  },
  { key: 'processing',  label: 'Processing'  },
  { key: 'shipped',     label: 'Shipped'     },
  { key: 'delivered',   label: 'Delivered'   },
  { key: 'cancelled',   label: 'Cancelled'   },
];

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string; emoji: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-zinc-100 text-zinc-600',      dot: 'bg-zinc-400',    emoji: '📦' },
  processing: { label: 'Processing', cls: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-500',   emoji: '📦' },
  shipped:    { label: 'Shipped',    cls: 'bg-sky-50 text-sky-700',         dot: 'bg-sky-500',     emoji: '🚚' },
  delivered:  { label: 'Delivered',  cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', emoji: '✅' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-50 text-red-600',         dot: 'bg-red-500',     emoji: '❌' },
  refunded:   { label: 'Refunded',   cls: 'bg-violet-50 text-violet-600',   dot: 'bg-violet-500',  emoji: '↩️' },
};

const PAY_STATUS_CLS: Record<string, string> = {
  paid:     'text-emerald-600',
  pending:  'text-amber-600',
  failed:   'text-red-600',
  refunded: 'text-violet-600',
};

const PROGRESS_STEPS = ['pending', 'processing', 'shipped', 'delivered'] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' };
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full', cfg.cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

/**
 * Renders the structured ShippingAddress object.
 * Falls back gracefully if any field is missing.
 */
function ShippingAddressBlock({ address }: { address: Address }) {
  const lines = [
    address.fullName,
    address.addressLine1,
    [address.addressLine2, address.landmark && `Near ${address.landmark}`].filter(Boolean).join(', ') || null,
    `${address.city}, ${address.state} — ${address.pincode}`,
    address.country && address.country !== 'India' ? address.country : null,
  ].filter(Boolean);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2 flex items-center gap-1">
        <MapPin size={11} /> Shipping to
      </p>
      <div className="text-[13px] text-[var(--text-soft)] leading-relaxed space-y-0.5">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        {address.phone && (
          <p className="text-[12px] text-[var(--text-muted)] mt-1">📞 {address.phone}</p>
        )}
      </div>
    </div>
  );
}

// ── Order progress bar ────────────────────────────────────────────────────────

function OrderProgress({ status }: { status: string }) {
  const stepIdx = PROGRESS_STEPS.indexOf(status as any);
  if (stepIdx < 0) return null; // don't render for cancelled / refunded

  return (
    <div className="px-5 py-5 bg-[var(--bg)]">
      <div className="flex items-center">
        {PROGRESS_STEPS.map((step, i) => {
          const done    = i <= stepIdx;
          const current = i === stepIdx;
          const isLast  = i === PROGRESS_STEPS.length - 1;

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center w-0 flex-1">
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all',
                  done
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
                  current && 'ring-4 ring-[var(--primary-soft)]',
                )}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={clsx(
                  'text-[10px] mt-1.5 capitalize font-medium',
                  done ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]',
                )}>
                  {step}
                </span>
              </div>
              {!isLast && (
                <div className={clsx(
                  'h-0.5 flex-1 -mt-4 mx-0.5',
                  i < stepIdx ? 'bg-[var(--primary)]' : 'bg-[var(--border)]',
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending;

  // Ensure cfg is always defined
  const safeCfg = cfg ?? { emoji: '📦' };

  return (
    <div className={clsx(
      'bg-[var(--surface)] border rounded-2xl overflow-hidden transition-all duration-200',
      open
        ? 'border-[var(--border-strong)] shadow-[var(--shadow-sm)]'
        : 'border-[var(--border)] hover:border-[var(--border-strong)]',
    )}>
      {/* ── Header (click to expand) ─────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Status icon */}
        <div className={clsx(
          'w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
          order.status === 'delivered' ? 'bg-emerald-50' :
          order.status === 'shipped'   ? 'bg-sky-50'     :
          order.status === 'cancelled' ? 'bg-red-50'     : 'bg-[var(--bg-2)]',
        )}>
          {safeCfg.emoji}
        </div>

        {/* Order number + status + date */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-bold text-[var(--text-strong)] mono">
              #{order.orderNumber}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {formatDate(order.createdAt)} · {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Amount + payment status + chevron */}
        <div className="text-right flex-shrink-0 flex items-center gap-4">
          <div>
            <div className="text-[15px] font-bold text-[var(--text-strong)] mono">
              {formatCurrency(order.total)}
            </div>
            <div className={clsx('text-[11px] capitalize', PAY_STATUS_CLS[order.paymentStatus] ?? 'text-[var(--text-muted)]')}>
              {order.paymentStatus}
            </div>
          </div>
          {open
            ? <ChevronUp size={16} className="text-[var(--text-muted)]" />
            : <ChevronDown size={16} className="text-[var(--text-muted)]" />
          }
        </div>
      </button>

      {/* ── Expanded panel ───────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-[var(--border)]">

          {/* Progress tracker */}
          <OrderProgress status={order.status} />

          {/* Items list */}
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-3">
              Items ordered
            </p>
            <div className="space-y-3">
              {(order.items ?? []).map((item: OrderItem, i: number) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] flex items-center justify-center text-sm flex-shrink-0">
                      📦
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-[var(--text-soft)] font-medium truncate">
                        {item.productName ?? `Product ${i + 1}`}
                      </p>
                      {item.productSku && (
                        <p className="text-[11px] text-[var(--text-muted)] mono">{item.productSku}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-semibold text-[var(--text-strong)] mono">
                      {formatCurrency(item.total ?? item.unitPrice * item.quantity)}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals + shipping address */}
          <div className="px-5 py-4 bg-[var(--bg-2)] border-t border-[var(--border)]">
            <div className="grid sm:grid-cols-2 gap-6">

              {/* Totals breakdown */}
              <div className="space-y-1.5">
                {[
                  { l: 'Subtotal',  v: formatCurrency(order.subtotal)       },
                  { l: 'Shipping',  v: formatCurrency(order.shipping ?? 0)  },
                  { l: 'Tax (GST)', v: formatCurrency(order.tax ?? 0)       },
                  { l: 'Payment',   v: order.paymentMethod ?? '—'           },
                ].map((row) => (
                  <div key={row.l} className="flex justify-between text-[12.5px]">
                    <span className="text-[var(--text-muted)]">{row.l}</span>
                    <span className="font-medium text-[var(--text-soft)] mono capitalize">{row.v}</span>
                  </div>
                ))}

                <div className="flex justify-between text-[14px] pt-2 border-t border-[var(--border-strong)] mt-2">
                  <span className="font-semibold text-[var(--text-strong)]">Total</span>
                  <span className="font-bold text-[var(--text-strong)] mono">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Structured shipping address */}
              {order.shippingAddress && typeof order.shippingAddress === 'object' && (
                <ShippingAddressBlock address={order.shippingAddress as Address} />
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountOrdersPage() {
  const [status, setStatus] = useState('');
  const [page,   setPage]   = useState(1);
  const LIMIT = 10;

  const { data, isLoading } = useCustomerOrders({
    page,
    limit: LIMIT,
    ...(status ? { status } : {}),
  });

  const orders   = data?.data  ?? [];
  const meta     = data?.meta;
  const total    = meta?.total ?? 0;
  const totalPgs = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[var(--text-strong)]">My Orders</h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
          {total > 0
            ? `${total} order${total !== 1 ? 's' : ''} found`
            : 'Track and manage your purchases'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setStatus(key); setPage(1); }}
            className={clsx(
              'px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-150 border',
              status === key
                ? 'bg-[var(--text-strong)] text-[var(--surface)] border-[var(--text-strong)]'
                : 'bg-[var(--surface)] text-[var(--text-soft)] border-[var(--border)] hover:border-[var(--border-strong)]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[var(--bg-3)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-2)] flex items-center justify-center mb-4">
            <Package size={26} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--text-soft)]">No orders found</p>
          <p className="text-[13px] text-[var(--text-muted)] mt-1.5">
            {status ? `No ${status} orders yet` : "You haven't placed any orders yet"}
          </p>
          {status ? (
            <button
              onClick={() => setStatus('')}
              className="mt-4 text-[13px] text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
            >
              Clear filter
            </button>
          ) : (
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--primary)] text-white text-[13px] font-semibold rounded-full hover:bg-[var(--primary-hover)] transition-colors"
            >
              Browse Products <ArrowRight size={13} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => <OrderCard key={o._id} order={o} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPgs > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[var(--border)] rounded-full text-[13px] text-[var(--text-soft)] hover:border-[var(--border-strong)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPgs, 7) }, (_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={clsx(
                    'w-9 h-9 rounded-full text-[13px] font-medium transition-colors',
                    page === pg
                      ? 'bg-[var(--text-strong)] text-white'
                      : 'text-[var(--text-soft)] hover:bg-[var(--bg-2)]',
                  )}
                >
                  {pg}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPgs, p + 1))}
            disabled={page === totalPgs}
            className="px-4 py-2 border border-[var(--border)] rounded-full text-[13px] text-[var(--text-soft)] hover:border-[var(--border-strong)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}