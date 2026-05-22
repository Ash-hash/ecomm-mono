// app/account/payments/page.tsx
'use client';

import { useState } from 'react';
import { useCustomerPayments } from '@/src/hooks';
import { formatCurrency } from '@/src/lib/utils';
import clsx from 'clsx';
import { CreditCard } from 'lucide-react';
import type { Payment, PaymentStatus } from '@repo/types';

// ── Status config — matches backend PaymentStatus enum exactly ───────────────
//   'success' | 'failed' | 'pending' | 'refunded' | 'partially_refunded'

const STATUS_CFG: Record<PaymentStatus, { label: string; cls: string; dot: string }> = {
  success:            { label: 'Success',      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  pending:            { label: 'Pending',      cls: 'bg-amber-50 text-amber-700 border border-amber-200',       dot: 'bg-amber-500'   },
  failed:             { label: 'Failed',       cls: 'bg-red-50 text-red-600 border border-red-200',             dot: 'bg-red-400'     },
  refunded:           { label: 'Refunded',     cls: 'bg-violet-50 text-violet-600 border border-violet-200',    dot: 'bg-violet-500'  },
  partially_refunded: { label: 'Part Refunded',cls: 'bg-indigo-50 text-indigo-600 border border-indigo-200',    dot: 'bg-indigo-400'  },
};

const METHOD_ICON: Record<string, string> = {
  razorpay:   '🔷',
  upi:        '📱',
  card:       '💳',
  cod:        '💵',
  netbanking: '🏦',
  wallet:     '👛',
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' };
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full', cfg.cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPaymentsPage() {
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const { data, isLoading } = useCustomerPayments({ page, limit: LIMIT });
  const payments = (data?.data ?? []) as Payment[];
  const meta     = data?.meta;
  const total    = meta?.total    ?? 0;
  const totalPgs = meta?.totalPages ?? 1;

  // Summary stats — use `success` (not `paid`) to match backend enum
  const paidTotal    = payments
    .filter((p) => p.status === 'success')
    .reduce((acc, p) => acc + p.amount, 0);

  const refundTotal  = payments
    .filter((p) => p.status === 'refunded' || p.status === 'partially_refunded')
    .reduce((acc, p) => acc + (p.refundedAmount ?? p.amount), 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[var(--text-strong)]">Payment History</h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
          {total > 0 ? `${total} transaction${total !== 1 ? 's' : ''}` : 'All your payment records'}
        </p>
      </div>

      {/* Summary cards */}
      {!isLoading && payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Transactions',    value: String(total),              icon: '📋', cls: 'bg-[var(--surface)]'  },
            { label: 'Total Paid',      value: formatCurrency(paidTotal),  icon: '✅', cls: 'bg-emerald-50'        },
            { label: 'Total Refunded',  value: formatCurrency(refundTotal), icon: '↩️', cls: 'bg-violet-50'        },
          ].map((s) => (
            <div key={s.label} className={clsx('rounded-2xl border border-[var(--border)] px-5 py-4', s.cls)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{s.icon}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {s.label}
                </span>
              </div>
              <div className="text-[20px] font-bold text-[var(--text-strong)] mono">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2fr_1.8fr_1fr_1.5fr_1.5fr] gap-4 px-6 py-3 bg-[var(--bg-2)] border-b border-[var(--border)]">
          {['Transaction', 'Date', 'Method', 'Status', 'Amount'].map((h, i) => (
            <div
              key={h}
              className={clsx(
                'text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]',
                i === 4 && 'text-right',
              )}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-[var(--bg-3)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-2)] flex items-center justify-center mb-3">
              <CreditCard size={22} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[14px] font-medium text-[var(--text-soft)]">No payments yet</p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {payments.map((p) => (
              <div
                key={p._id}
                className="flex flex-col sm:grid sm:grid-cols-[2fr_1.8fr_1fr_1.5fr_1.5fr] gap-3 sm:gap-4 px-6 py-4 hover:bg-[var(--bg)] transition-colors items-start sm:items-center"
              >
                {/* Transaction ID + order ref */}
                <div>
                  <p className="text-[13px] font-bold text-[var(--text-strong)] mono">
                    #{p.transactionId?.slice(-10).toUpperCase()}
                  </p>
                  {p.orderId && (
                    <p className="text-[11px] text-[var(--text-muted)] mono mt-0.5">
                      Order #{(p.orderId as string)?.slice(-6).toUpperCase()}
                    </p>
                  )}
                  {p.gatewayPaymentId && (
                    <p className="text-[10px] text-[var(--text-muted)] mono mt-0.5 opacity-60">
                      {p.gateway} · {p.gatewayPaymentId.slice(-8)}
                    </p>
                  )}
                </div>

                {/* Date */}
                <p className="text-[12px] text-[var(--text-muted)]">
                  {formatDateTime(p.createdAt)}
                </p>

                {/* Payment method */}
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{METHOD_ICON[p.method?.toLowerCase()] ?? '💰'}</span>
                  <span className="text-[12.5px] text-[var(--text-soft)] capitalize">{p.method}</span>
                </div>

                {/* Status */}
                <StatusBadge status={p.status} />

                {/* Amount + refunded amount */}
                <div className="sm:text-right">
                  <p className="text-[15px] font-bold text-[var(--text-strong)] mono">
                    {formatCurrency(p.amount)}
                  </p>
                  {/* Show refunded amount for partial refund */}
                  {p.status === 'partially_refunded' && p.refundedAmount != null && (
                    <p className="text-[11px] text-indigo-500 mt-0.5">
                      ↩ {formatCurrency(p.refundedAmount)} refunded
                    </p>
                  )}
                  {p.status === 'refunded' && (
                    <p className="text-[11px] text-violet-500 mt-0.5">Fully refunded</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
          <span className="text-[13px] text-[var(--text-muted)] px-2">
            Page {page} of {totalPgs}
          </span>
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