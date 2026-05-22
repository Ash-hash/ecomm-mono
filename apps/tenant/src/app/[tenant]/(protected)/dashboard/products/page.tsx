/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import { useQueryState } from 'nuqs';
import { ColumnDef } from '@tanstack/react-table';

import { DataTable, DataTableToolbar } from '../../../../components/data-table';

import {
  Badge,
  PageHeader,
  Btn,
  TableCard,
  formatINR,
} from '../../../../components/ui';

import {
  useProducts,
  useCategoriesFull,
  useDeleteProduct,
  useUpdateProductStatus,
} from '../../../../hooks';

import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/src/app/components/ui/ImageUploader';
import { Category, Product, ProductStatus } from '@repo/types';
import { tenantPath } from '@/src/app/utils/tenant';

// ─────────────────────────────────────────────────────────────
// Stock Pill
// ─────────────────────────────────────────────────────────────
function StockPill({ stock, threshold }: { stock: number; threshold: number }) {
  const isUnlimited = stock >= 9999;
  const isOut = stock === 0;
  const isLow = !isUnlimited && stock > 0 && stock <= threshold;

  const color = isOut ? '#f87171' : isLow ? '#f59e0b' : '#22c55e';
  const bg = isOut ? '#1a0808' : isLow ? '#1a1208' : '#071a0e';

  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${color}22`,
        padding: '2px 9px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {isUnlimited ? '∞' : stock} {isOut ? '· Out' : isLow ? '· Low' : ''}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const router = useRouter();
  const { data: categoryRes } = useCategoriesFull();
  const categories = categoryRes?.categories ?? [];
  const tree = categoryRes?.tree ?? [];

  // URL STATE
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [status, setStatus] = useQueryState('status', { defaultValue: '' });
  const [categoryId, setCategoryId] = useQueryState('category', {
    defaultValue: '',
  });

  function getCategoryPathLabel(path?: { name: string }[]) {
    if (!path || path.length === 0) return '—';

    return path.map((p) => p.name).join(' > ');
  }

  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [lowStock, setLowStock] = useQueryState('lowStock', {
    defaultValue: '',
  });

  function asBoolean(value?: string | null): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  function asProductStatus(value?: string | null): ProductStatus | undefined {
    if (value === 'active' || value === 'inactive' || value === 'archived') {
      return value;
    }
    return undefined;
  }

  const params = useMemo(
    () => ({
      page: Number(page),
      limit: 15,
      status: asProductStatus(status),
      categoryId: categoryId || undefined,
      search: search || undefined,
      lowStock: asBoolean(lowStock),
    }),
    [page, status, categoryId, search, lowStock],
  );
  // API
  const { data, isLoading } = useProducts(params);

  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateProductStatus();
  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const alertCount = products.filter(
    (p: any) =>
      p.stock === 0 || (p.stock > 0 && p.stock <= p.lowStockThreshold),
  ).length;

  // ─────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────
  const columns: ColumnDef<Product, any>[] = [
    {
      accessorKey: 'name',
      header: () => <span>Product</span>,
      cell: ({ row }) => (
        <div
          onClick={() => router.push(tenantPath(`/dashboard/products/${row.original._id}`))}
          style={{
            cursor: 'pointer',
            transition: '0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#c0c0d8', fontWeight: 500 }}>
              {row.original.name}
            </span>

            {row.original.featured && (
              <span
                style={{
                  background: '#071a0e',
                  color: '#22c55e',
                  border: '1px solid #22c55e22',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                ★ Featured
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#3a3a5a' }}>
            SKU: {row.original.sku}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: () => <span>Category</span>,
      cell: ({ row }) => {
        const path = row.original.categoryPath || [];
        const last = path.at(-1);

        if (!last) return '—';

        return (
          <div>
            <span>{last.name}</span>
            <span>
              {path
                .slice(0, -1)
                .map((p) => p.name)
                .join(' > ')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'main_image',
      header: () => <span>Image</span>,
      cell: ({ row }) => {
        const img = row.original.main_image;
        return img ? (
          <img
            src={getImageUrl(img)}
            style={{ width: 40, height: 40, borderRadius: 6 }}
          />
        ) : (
          '—'
        );
      },
    },
    {
      accessorKey: 'price',
      header: () => <span>Price</span>,
      cell: ({ getValue }) => (
        <span style={{ fontWeight: 600 }}>{formatINR(getValue())}</span>
      ),
    },
    {
      accessorKey: 'stock',
      header: () => <span>Stock</span>,
      cell: ({ row }) => (
        <StockPill
          stock={row.original.stock}
          threshold={row.original.lowStockThreshold}
        />
      ),
    },
    {
      accessorKey: 'status',
      header: () => <span>Status</span>,
      cell: ({ row }) => {
        const current = row.original.status;

        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge status={current} />

            <Btn
              size="sm"
              variant="secondary"
              onClick={() =>
                updateStatus.mutate({
                  id: row.original._id,
                  status: current === 'active' ? 'inactive' : 'active',
                })
              }
            >
              Toggle
            </Btn>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <Btn
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm(`Delete "${row.original.name}"?`)) {
              deleteProduct.mutate(row.original._id);
            }
          }}
        >
          Delete
        </Btn>
      ),
    },
  ];

  function buildCategoryOptions(categories: Category[]) {
    const map = new Map<string, Category>();

    categories.forEach((c) => map.set(c._id, c));

    function getPath(cat: Category): string {
      const path: string[] = [];
      let current: Category | undefined = cat;

      while (current) {
        path.unshift(current.name);
        current = current.parentId ? map.get(current.parentId) : undefined;
      }

      return path.join(' > ');
    }

    return categories.map((c) => ({
      label: getPath(c),
      value: c._id,
    }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Products"
        subtitle={`${total} products · ${alertCount} need attention`}
        actions={
          <>
            <Btn variant="secondary">Export</Btn>
            <Btn
              variant="primary"
              onClick={() => router.push(tenantPath('/dashboard/products/create'))}
            >
              + Add Product
            </Btn>
          </>
        }
      />

      {/* ALERT */}
      {alertCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          ⚠ {alertCount} products need restocking
        </div>
      )}

      {/* TABLE */}
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
                placeholder: 'Status',
                value: status ?? '',
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ],
                onChange: (v) => {
                  setStatus(v);
                  setPage('1');
                },
              },
              {
                key: 'category',
                placeholder: 'Category',
                value: categoryId ?? '',
                options: buildCategoryOptions(categories),
                onChange: (v) => {
                  setCategoryId(v);
                  setPage('1');
                },
              },
              {
                key: 'lowStock',
                placeholder: 'Stock',
                value: lowStock ?? '',
                options: [{ label: 'Low Stock', value: 'true' }],
                onChange: (v) => {
                  setLowStock(v);
                  setPage('1');
                },
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          data={products}
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
