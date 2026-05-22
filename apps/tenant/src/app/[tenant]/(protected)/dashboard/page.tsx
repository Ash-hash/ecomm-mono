/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { DashboardStats } from '@repo/types';
import { StatCard, Card, Badge, formatINR, formatDate } from '../../../components/ui';
import { useDashboardStats } from '../../../hooks';

// ─── Mini sparkline chart ─────────────────────────────────────────────────────
function Sparkline({
  data,
  color = '#a78bfa',
  height = 44,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 100,
    H = 100;
  const pts = data
    .map(
      (v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`,
    )
    .join(' ');
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
    >
      <defs>
        <linearGradient
          id={`spark-${color.replace('#', '')}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({
  data = [],
  color = '#a78bfa',
}: {
  data?: { month: string; value: number }[];
  color?: string;
}) {
  if (!data.length) {
    return (
      <div
        style={{
          height: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4b4b6b',
          fontSize: 12,
        }}
      >
        No chart data
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 5,
        height: 110,
        padding: '0 2px',
      }}
    >
      {data.map((d, i) => {
        const isLast = i === data.length - 1;

        return (
          <div
            key={d.month}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              title={`${d.month}: ${formatINR(d.value * 1000)}`}
              style={{
                width: '100%',
                height: `${(d.value / max) * 94}px`,
                borderRadius: '4px 4px 2px 2px',
                background: isLast ? color : `${color}38`,
              }}
            />
            <span
              style={{
                color: '#2a2a3e',
                fontSize: 9,
                whiteSpace: 'nowrap',
              }}
            >
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton fallback ────────────────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const stats: DashboardStats | null = data ?? null;

  if (!stats) {
    return <div>Loading...</div>; // or skeleton
  }
  // Using mock data for now:

  const ACTIVITY_COLORS: Record<string, string> = {
    order: '#60a5fa',
    user: '#22c55e',
    payment: '#f87171',
    stock: '#f59e0b',
    sub: '#a78bfa',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
        }}
      >
        <StatCard
          label="Revenue MTD"
          value={formatINR(stats?.revenue?.value ?? 0)}
          delta={stats?.revenue?.delta}
          accent="#a78bfa"
          loading={isLoading}
        />
        <StatCard
          label="Orders"
          value={stats?.orders?.value?.toLocaleString() ?? '0'}
          delta={stats?.orders?.delta}
          accent="#60a5fa"
          loading={isLoading}
        />
        <StatCard
          label="Customers"
          value={stats?.customers?.value?.toLocaleString() ?? '0'}
          delta={stats?.customers?.delta}
          accent="#34d399"
          loading={isLoading}
        />
        <StatCard
          label="Avg. Order Value"
          value={formatINR(stats?.avgOrderValue?.value) ?? '₹0'}
          delta={stats?.avgOrderValue?.delta}
          accent="#f59e0b"
          loading={isLoading}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}
      >
        {/* Revenue bar chart */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  color: '#f0f0f8',
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                Revenue Overview
              </div>
              <div style={{ color: '#2a2a3e', fontSize: 12, marginTop: 3 }}>
                Last 12 months · ₹ in thousands
              </div>
            </div>
            <div
              style={{
                color: '#a78bfa',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              ₹8.3L
            </div>
          </div>
          <BarChart data={stats?.revenueChart} color="#a78bfa" />
        </Card>

        {/* Order status breakdown */}
        <Card>
          <div
            style={{
              color: '#f0f0f8',
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "'Syne', sans-serif",
              marginBottom: 20,
            }}
          >
            Order Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats?.orderStatusBreakdown?.map((s: any) => {
              const colors: Record<string, string> = {
                delivered: '#22c55e',
                processing: '#60a5fa',
                pending: '#f59e0b',
                cancelled: '#f87171',
              };
              const c = colors[s.status] ?? '#6b6b8b';
              return (
                <div key={s.status}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        color: '#6b6b8b',
                        fontSize: 12,
                        textTransform: 'capitalize',
                      }}
                    >
                      {s.status}
                    </span>
                    <span style={{ color: c, fontSize: 12, fontWeight: 600 }}>
                      {s.pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: '#12121e',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${s.pct}%`,
                        height: '100%',
                        background: c,
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}
      >
        {/* Top products */}
        <Card>
          <div
            style={{
              color: '#f0f0f8',
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "'Syne', sans-serif",
              marginBottom: 18,
            }}
          >
            Top Products by Revenue
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stats?.topProducts?.map((p: any, i: any) => {
              const maxRev = stats?.topProducts?.[0]?.revenue ?? 1;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 0',
                    borderBottom:
                      i < stats?.topProducts?.length - 1
                        ? '1px solid #0f0f1a'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: '#12121e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4b4b6b',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: '#c0c0d8',
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        height: 3,
                        background: '#12121e',
                        borderRadius: 3,
                        marginTop: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(p?.revenue / maxRev) * 100}%`,
                          height: '100%',
                          background: '#a78bfa',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        color: '#f0f0f8',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {formatINR(p?.revenue)}
                    </div>
                    <div
                      style={{ color: '#3a3a5a', fontSize: 11, marginTop: 2 }}
                    >
                      {p?.orders} orders
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <div
            style={{
              color: '#f0f0f8',
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "'Syne', sans-serif",
              marginBottom: 18,
            }}
          >
            Recent Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stats?.recentOrders?.map((a: any, i: any) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '11px 0',
                  borderBottom:
                    i < stats?.recentOrders.length - 1
                      ? '1px solid #0f0f1a'
                      : 'none',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: ACTIVITY_COLORS[a.type] ?? '#6b6b8b',
                    marginTop: 5,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ color: '#9090b0', fontSize: 12, lineHeight: 1.5 }}
                  >
                    Order #{a.id} by Order #{a.id} by {a.customer}
                  </div>
                  <div style={{ color: '#2a2a3e', fontSize: 11, marginTop: 3 }}>
                    {formatDate(a.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
