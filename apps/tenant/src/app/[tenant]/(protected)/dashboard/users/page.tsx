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
  useUsers,
  useUser,
  useOrders,
  useUpdateUserStatus,
} from '../../../../hooks';
import { User, UserPlan, UserStatus } from '@repo/types';


// ─────────────────────────────────────────────────────────────
// Plan Colors
// ─────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  free: '#4b4b6b',
  starter: '#60a5fa',
  pro: '#a78bfa',
  enterprise: '#f59e0b',
};

// ─────────────────────────────────────────────────────────────
// User Panel
// ─────────────────────────────────────────────────────────────
function UserPanel({
  user,
  orders,
  onClose,
  onAction,
}: {
  user: User;
  orders: any[];
  onClose: () => void;
  onAction: (id: string, status: UserStatus) => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', zIndex: 50 }}>
      <div
        style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      <div
        style={{
          width: 380,
          background: '#0f0f18',
          padding: 20,
        }}
      >
        <h3>{user.name}</h3>
        <p>{user.email}</p>

        <Badge status={user.status} />

        <div>Total Orders: {user.totalOrders}</div>
        <div>Total Spent: {formatINR(user?.totalSpent || 0)}</div>

        <hr />

        <div>
          <strong>Recent Orders</strong>
          {orders?.length ? (
            orders.slice(0, 5).map((o) => (
              <div key={o.id}>
                {formatINR(o.total)} — {formatDate(o.createdAt)}
              </div>
            ))
          ) : (
            <div>No orders</div>
          )}
        </div>

        <Btn onClick={() => onAction(user._id, 'banned')}>
          Ban
        </Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function UsersPage() {
  // URL STATE
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [status, setStatus] = useQueryState('status', { defaultValue: '' });
  const [plan, setPlan] = useQueryState('plan', { defaultValue: '' });
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });

  // PANEL STATE
  const [openId, setOpenId] = useState<string | null>(null);

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


 const params = useMemo(() => ({
  page: Number(page),
  limit: 15,
  status: asUserStatus(status),
  plan: asUserPlan(plan),
  search: search || undefined,
}), [page, status, plan, search]);

const { data, isLoading } = useUsers(params);
  const { data: selectedUser } = useUser(openId ?? '');
  const { data: userOrders } = useOrders({
  userId: openId ?? undefined,
  page: 1,
  limit: 5,
});

  const updateStatus = useUpdateUserStatus();

  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  // ACTION
  const handleAction = (id: string, newStatus: UserStatus) => {
    updateStatus.mutate({ id, status: newStatus });
  };

  // ─────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────
  const columns: ColumnDef<User, any>[] = [
    {
      accessorKey: 'name',
      header: () => <span>User</span>,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div>
            <div>{u.name}</div>
            <div style={{ fontSize: 11 }}>{u.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'plan',
      header: () => <span>Plan</span>,
      cell: ({ getValue }) => (
        <span style={{ color: PLAN_COLORS[getValue()] }}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'totalSpent',
      header: () => <span>Spent</span>,
      cell: ({ getValue }) => formatINR(getValue()),
    },
    {
      accessorKey: 'status',
      header: () => <span>Status</span>,
      cell: ({ getValue }) => <Badge status={getValue()} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <Btn onClick={() => setOpenId(u._id)}>
            View
          </Btn>
        );
      },
    },
  ];

  return (
    <div>
      {openId && selectedUser && (
        <UserPanel
          user={selectedUser}
          orders={userOrders?.data ?? []}
          onClose={() => setOpenId(null)}
          onAction={handleAction}
        />
      )}

      <PageHeader
        title="Users"
        subtitle={`${total} users`}
      />

      <TableCard>
        <div style={{ padding: 16 }}>
          <DataTableToolbar
            search={search ?? ''}
            onSearch={(val) => {
              setSearch(val);
              setPage('1');
            }}
            filters={[
              {
                key: 'status',
                placeholder: 'Select status',
                value: status ?? '',
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Banned', value: 'banned' },
                ],
                onChange: (v) => {
                  setStatus(v);
                  setPage('1');
                },
              },
              {
                key: 'plan',
                placeholder: 'Select plan',
                value: plan ?? '',
                options: [
                  { label: 'Pro', value: 'pro' },
                  { label: 'Starter', value: 'starter' },
                ],
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
          data={users}
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