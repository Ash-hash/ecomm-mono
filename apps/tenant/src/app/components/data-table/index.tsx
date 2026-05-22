'use client';

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

// ─── Sub-components ────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 20px' }}>
          <div
            style={{
              height: 14,
              borderRadius: 6,
              background: 'linear-gradient(90deg, #1a1a28 25%, #22223a 50%, #1a1a28 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '60%' : i % 3 === 0 ? '40%' : '75%',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function EmptyState({ message = 'No results found' }: { message?: string }) {
  return (
    <tr>
      <td colSpan={999} style={{ textAlign: 'center', padding: '56px 20px' }}>
        <div style={{ color: '#2a2a3e', fontSize: 32, marginBottom: 12 }}>⊡</div>
        <div style={{ color: '#4b4b6b', fontSize: 13 }}>{message}</div>
      </td>
    </tr>
  );
}

// ─── Column Header with sort ──────────────────────────────────────────────────
export function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  column: string;
  currentSort?: string;
  currentOrder?: 'asc' | 'desc';
  onSort?: (col: string, ord: 'asc' | 'desc') => void;
}) {
  const active = currentSort === column;
  const nextOrder = active && currentOrder === 'asc' ? 'desc' : 'asc';
  return (
    <button
      onClick={() => onSort?.(column, nextOrder)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: active ? '#a78bfa' : '#4b4b6b',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: 'inherit',
        padding: 0,
        transition: 'color 0.15s',
      }}
    >
      {label}
      <span style={{ fontSize: 10, opacity: active ? 1 : 0.3 }}>
        {active ? (currentOrder === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = () => {
    const arr: (number | '...')[] = [];
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) arr.push(1, 2, 3, 4, 5, '...', totalPages);
    else if (page >= totalPages - 3) arr.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    else arr.push(1, '...', page - 1, page, page + 1, '...', totalPages);
    return arr;
  };

  const btnBase: React.CSSProperties = {
    minWidth: 32, height: 32, borderRadius: 7, border: '1px solid #1e1e2e',
    background: 'transparent', color: '#6b6b8b', fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderTop: '1px solid #12121e',
      }}
    >
      <span style={{ color: '#4b4b6b', fontSize: 12 }}>
        Showing <span style={{ color: '#9090b0' }}>{from}–{to}</span> of{' '}
        <span style={{ color: '#9090b0' }}>{total}</span> results
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          style={{ ...btnBase, opacity: page === 1 ? 0.3 : 1 }}
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >←</button>
        {pages().map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ ...btnBase, cursor: 'default', border: 'none' }}>…</span>
          ) : (
            <button
              key={p}
              style={{
                ...btnBase,
                background: p === page ? '#a78bfa' : 'transparent',
                color: p === page ? '#0a0a10' : '#6b6b8b',
                borderColor: p === page ? '#a78bfa' : '#1e1e2e',
                fontWeight: p === page ? 700 : 400,
              }}
              onClick={() => onPage(p as number)}
            >{p}</button>
          )
        )}
        <button
          style={{ ...btnBase, opacity: page === totalPages ? 0.3 : 1 }}
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
        >→</button>
      </div>
    </div>
  );
}

// ─── Main DataTable ────────────────────────────────────────────────────────────
interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  total: number;
  page: number;
  limit?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  onPageChange: (p: number) => void;
  onSortChange?: (sort: string, order: 'asc' | 'desc') => void;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  limit = 15,
  isLoading,
  emptyMessage,
  sort,
  order,
  onPageChange,
  onSortChange,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
  });

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .dt-row:hover td { background: rgba(167,139,250,0.03) !important; }
        .dt-row { transition: background 0.1s; }
      `}</style>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ background: '#0a0a12' }}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      textAlign: 'left',
                      padding: '13px 20px',
                      borderBottom: '1px solid #1a1a28',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, {
                          ...header.getContext(),
                          // pass sort helpers via meta
                          currentSort: sort,
                          currentOrder: order,
                          onSort: onSortChange,
                        })}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={columns.length} />
                ))
              : table.getRowModel().rows.length === 0
              ? <EmptyState message={emptyMessage} />
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="dt-row">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ padding: '13px 20px', borderBottom: '1px solid #0f0f1a' }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPage={onPageChange}
        />
      )}
    </>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
interface FilterOption { label: string; value: string }
interface ToolbarFilter {
  key: string;
  placeholder: string;
  value: string;
  options: FilterOption[];
  onChange: (v: string) => void;
}

interface DataTableToolbarProps {
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  actions?: React.ReactNode;
}

export function DataTableToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters = [],
  actions,
}: DataTableToolbarProps) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        flexWrap: 'wrap', marginBottom: 16,
      }}
    >
      {onSearch && (
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
            color: '#334155', fontSize: 14, pointerEvents: 'none',
          }}>⌕</span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%', background: '#0f0f18', border: '1px solid #1e1e2e',
              borderRadius: 9, padding: '9px 14px 9px 34px', color: '#d0d0e0',
              fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#1e1e2e')}
          />
        </div>
      )}

      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          style={{
            background: '#0f0f18', border: '1px solid #1e1e2e', borderRadius: 9,
            padding: '9px 14px', color: f.value ? '#d0d0e0' : '#4b4b6b',
            fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <option value="">{f.placeholder}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
}
