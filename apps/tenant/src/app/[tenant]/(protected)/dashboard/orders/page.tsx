/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQueryState } from 'nuqs';
import { ColumnDef } from '@tanstack/react-table';

import {
  DataTable,
  DataTableToolbar,
  SortableHeader,
} from '../../../../components/data-table';

import {
  Badge,
  PageHeader,
  Btn,
  TableCard,
  formatINR,
  formatDate,
} from '../../../../components/ui';

import { useOrders, useUpdateOrderStatus } from '../../../../hooks';
import { Order, OrderStatus, UserPlan, UserStatus } from '@repo/types';


// ─────────────────────────────────────────────────────────────
// Status Dropdown Component
// ─────────────────────────────────────────────────────────────
function StatusCell({
  status,
  id,
  onUpdate,
}: {
  status: OrderStatus;
  id: string;
  onUpdate: (id: string, s: OrderStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  const ORDER_STATUSES: OrderStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];

  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
        <Badge status={status} />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 0,
            zIndex: 20,
            background: '#0f0f18',
            border: '1px solid #1a1a28',
            borderRadius: 9,
            overflow: 'hidden',
            minWidth: 130,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          }}
        >
          {ORDER_STATUSES.map((s) => (
            <div
              key={s}
              onClick={() => {
                onUpdate(id, s);
                setOpen(false);
              }}
              style={{
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 12,
                color: s === status ? '#a78bfa' : '#9090b0',
                textTransform: 'capitalize',
              }}
            >
              {s === status ? '● ' : '○ '}
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const STATUS_FILTER_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
];

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  // URL State
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [status, setStatus] = useQueryState('status', { defaultValue: '' });
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [sort, setSort] = useQueryState('sort', { defaultValue: 'createdAt' });
  const [order, setOrder] = useQueryState('order', { defaultValue: 'desc' });

  // ✅ TYPE-SAFE ORDER
  const orderValue: 'asc' | 'desc' = order === 'asc' ? 'asc' : 'desc';

  function asUserStatus(value?: string | null): UserStatus | undefined {
    if (value === 'active' || value === 'banned' || value === 'suspended') {
      return value;
    }
    return undefined;
  }

  function asUserPlan(value?: string | null): UserPlan | undefined {
    if (
      value === 'free' ||
      value === 'starter' ||
      value === 'pro' ||
      value === 'enterprise'
    ) {
      return value;
    }
    return undefined;
  }

  function asOrderStatus(value?: string | null): OrderStatus | undefined {
    if (
      value === 'pending' ||
      value === 'processing' ||
      value === 'shipped' ||
      value === 'delivered' ||
      value === 'cancelled' ||
      value === 'refunded'
    ) {
      return value;
    }
    return undefined;
  }

  // API
  const params = useMemo(() => ({
  page: Number(page),
  limit: 15,
  status: asOrderStatus(status),
  search: search || undefined,
  sort,
  order: orderValue,
}), [page, status, search, sort, orderValue]);

const { data, isLoading } = useOrders(params);
  const updateStatus = useUpdateOrderStatus();
  // const exportOrders = useExportOrders();

  const orders = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  // Handlers
  const handleStatusChange = useCallback(
    (id: string, s: OrderStatus) => {
      updateStatus.mutate({ id, status: s });
    },
    [updateStatus],
  );

  // Columns
  const columns: ColumnDef<Order, any>[] = [
    {
      accessorKey: 'orderNumber',
      header: () => (
        <SortableHeader
          label="Order"
          column="orderNumber"
          currentSort={sort}
          currentOrder={orderValue}
          onSort={(s, o) => {
            setSort(s);
            setOrder(o);
          }}
        />
      ),
      cell: ({ getValue }) => (
        <span style={{ color: '#a78bfa', fontWeight: 600 }}>{getValue()}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: () => <span>Customer</span>,
      cell: ({ row }) => (
        <div>
          <div style={{ color: '#c0c0d8' }}>{row.original.customerName}</div>
          <div style={{ color: '#3a3a5a', fontSize: 11 }}>
            {row.original.customerEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: () => (
        <SortableHeader
          label="Total"
          column="total"
          currentSort={sort}
          currentOrder={orderValue}
          onSort={(s, o) => {
            setSort(s);
            setOrder(o);
          }}
        />
      ),
      cell: ({ getValue }) => (
        <span style={{ fontWeight: 600 }}>{formatINR(getValue())}</span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: () => <span>Payment</span>,
      cell: ({ getValue }) => <Badge status={getValue()} />,
    },
    {
      accessorKey: 'status',
      header: () => <span>Status</span>,
      cell: ({ getValue, row }) => (
        <StatusCell
          status={getValue()}
          id={row.original._id}
          onUpdate={handleStatusChange}
        />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: () => (
        <SortableHeader
          label="Date"
          column="createdAt"
          currentSort={sort}
          currentOrder={orderValue}
          onSort={(s, o) => {
            setSort(s);
            setOrder(o);
          }}
        />
      ),
      cell: ({ getValue }) => (
        <span style={{ fontSize: 12 }}>{formatDate(getValue())}</span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: () => (
        <Btn variant="secondary" size="sm">
          View →
        </Btn>
      ),
    },
  ];



  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Orders"
        subtitle={`${total.toLocaleString()} total orders`}
        actions={
          <>
            {/* <Btn
              variant="secondary"
              onClick={() =>
                exportOrders.mutate({
                  status: status || undefined,
                  search: search || undefined,
                  sort,
                  order: orderValue,
                })
              }
            >
              Export CSV
            </Btn> */}
            <Btn variant="primary">+ New Order</Btn>
          </>
        }
      />

      {/* Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: 'Pending', value: 90 },
          { label: 'Processing', value: 270 },
          { label: 'Delivered', value: 38 },
          { label: 'Cancelled', value: 12 },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => {
              setStatus(s.label.toLowerCase());
              setPage('1');
            }}
            style={{
              background: '#0d0d18',
              border: '1px solid #1a1a28',
              borderRadius: 10,
              padding: '14px 16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 11 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <TableCard>
        <div style={{ padding: 16 }}>
          <DataTableToolbar
            search={search ?? ''}
            onSearch={(val) => {
              setSearch(val);
              setPage('1');
            }}
            searchPlaceholder="Search orders..."
            filters={[
              {
                key: 'status',
                placeholder: 'All statuses',
                value: status ?? '',
                options: STATUS_FILTER_OPTIONS,
                onChange: (v) => {
                  setStatus(v);
                  setPage('1');
                },
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          data={orders}
          total={total}
          page={Number(page)}
          limit={15}
          isLoading={isLoading}
          sort={sort}
          order={orderValue}
          onPageChange={(p) => setPage(String(p))}
          onSortChange={(s, o) => {
            setSort(s);
            setOrder(o);
          }}
        />
      </TableCard>
    </div>
  );
}
