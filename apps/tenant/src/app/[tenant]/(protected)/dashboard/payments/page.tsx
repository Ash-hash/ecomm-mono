/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import { useQueryState } from 'nuqs';
import { ColumnDef } from '@tanstack/react-table';

import {
  DataTable,
  DataTableToolbar,
} from '../../../../components/data-table';

import {
  Badge,
  PageHeader,
  Btn,
  TableCard,
  formatINR,
  formatDate,
} from '../../../../components/ui';

import {
  usePayments,
  useRefundPayment,
} from '../../../../hooks';
import { Payment, PaymentStatus } from '@repo/types';


// ─────────────────────────────────────────────────────────────
// Refund Modal
// ─────────────────────────────────────────────────────────────
function RefundModal({
  payment,
  onConfirm,
  onClose,
}: {
  payment: Payment;
  onConfirm: (amount?: number) => void;
  onClose: () => void;
}) {
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState(payment.amount);

  return (
    <div className="modal">
      <div>
        <h3>Refund {payment.transactionId}</h3>

        <Btn onClick={() => onConfirm()}>
          Full Refund ({formatINR(payment.amount)})
        </Btn>

        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  // URL STATE
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [status, setStatus] = useQueryState('status', { defaultValue: '' });
  const [gateway, setGateway] = useQueryState('gateway', { defaultValue: '' });

  const [refunding, setRefunding] = useState<Payment | null>(null);

  function asPaymentStatus(value?: string | null): PaymentStatus | undefined {
  if (
    value === 'success' ||
    value === 'failed' ||
    value === 'pending' ||
    value === 'refunded' ||
    value === 'partially_refunded'
  ) {
    return value;
  }
  return undefined;
}

function asGateway(value?: string | null): 'razorpay' | 'stripe' | 'paypal' | undefined {
  if (value === 'razorpay' || value === 'stripe' || value === 'paypal') {
    return value;
  }
  return undefined;
}

  // API
  const params = useMemo(() => ({
  page: Number(page),
  limit: 15,
  status: asPaymentStatus(status),
  gateway: asGateway(gateway),
}), [page, status, gateway]);

const { data, isLoading } = usePayments(params);

  const refundPayment = useRefundPayment();

  const payments = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  // ACTION
  const handleRefund = (id: string, amount?: number) => {
    refundPayment.mutate({ id, amount });
  };

  // ─────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────
  const columns: ColumnDef<Payment, any>[] = [
    {
      accessorKey: 'transactionId',
      header: () => <span>Transaction</span>,
      cell: ({ getValue }) => <strong>{getValue()}</strong>,
    },
    {
      accessorKey: 'userName',
      header: () => <span>User</span>,
      cell: ({ row }) => (
        <div>
          <div>{row.original.userName}</div>
          <div style={{ fontSize: 11 }}>{row.original.userEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <span>Amount</span>,
      cell: ({ row }) => (
        <div>
          {formatINR(row.original.amount)}
          {row.original.refundedAmount && (
            <div style={{ fontSize: 11 }}>
              Refunded: {formatINR(row.original.refundedAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gateway',
      header: () => <span>Gateway</span>,
    },
    {
      accessorKey: 'status',
      header: () => <span>Status</span>,
      cell: ({ getValue }) => <Badge status={getValue()} />,
    },
    {
      accessorKey: 'createdAt',
      header: () => <span>Date</span>,
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const p = row.original;

        return (
          <div>
            {p.status === 'success' && (
              <Btn onClick={() => setRefunding(p)}>
                Refund
              </Btn>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {refunding && (
        <RefundModal
          payment={refunding}
          onConfirm={(amount) => {
            handleRefund(refunding._id, amount);
            setRefunding(null);
          }}
          onClose={() => setRefunding(null)}
        />
      )}

      <PageHeader
        title="Payments"
        subtitle={`${total} transactions`}
      />

      <TableCard>
        <div style={{ padding: 16 }}>
          <DataTableToolbar
            filters={[
              {
                key: 'status',
                placeholder: 'Select Status',
                value: status ?? '',
                options: [
                  { label: 'Success', value: 'success' },
                  { label: 'Failed', value: 'failed' },
                ],
                onChange: (v) => {
                  setStatus(v);
                  setPage('1');
                },
              },
              {
                key: 'gateway',
                placeholder: 'Select Gateway',
                value: gateway ?? '',
                options: [
                  { label: 'Razorpay', value: 'razorpay' },
                  { label: 'Stripe', value: 'stripe' },
                ],
                onChange: (v) => {
                  setGateway(v);
                  setPage('1');
                },
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          data={payments}
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