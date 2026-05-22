'use client';

import React from 'react';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  // Order statuses
  pending: { bg: '#1a1208', color: '#f59e0b', label: 'Pending' },
  processing: { bg: '#0a1428', color: '#60a5fa', label: 'Processing' },
  shipped: { bg: '#0d1a2d', color: '#38bdf8', label: 'Shipped' },
  delivered: { bg: '#071a0e', color: '#22c55e', label: 'Delivered' },
  cancelled: { bg: '#1a0808', color: '#f87171', label: 'Cancelled' },
  refunded: { bg: '#1a0d2e', color: '#a78bfa', label: 'Refunded' },
  // User statuses
  active: { bg: '#071a0e', color: '#22c55e', label: 'Active' },
  banned: { bg: '#1a0808', color: '#f87171', label: 'Banned' },
  suspended: { bg: '#1a1208', color: '#f59e0b', label: 'Suspended' },
  // Payment
  success: { bg: '#071a0e', color: '#22c55e', label: 'Success' },
  failed: { bg: '#1a0808', color: '#f87171', label: 'Failed' },
  partially_refunded: {
    bg: '#1a0d2e',
    color: '#a78bfa',
    label: 'Part. Refunded',
  },
  // Product
  inactive: { bg: '#1a1208', color: '#94a3b8', label: 'Inactive' },
  archived: { bg: '#12121e', color: '#4b4b6b', label: 'Archived' },
  // Sub
  past_due: { bg: '#1a0808', color: '#f87171', label: 'Past Due' },
  trialing: { bg: '#0a1428', color: '#60a5fa', label: 'Trialing' },
  paused: { bg: '#1a1208', color: '#f59e0b', label: 'Paused' },
} as const;

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    bg: '#12121e',
    color: '#6b6b8b',
    label: status,
  };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        border: `1px solid ${s.color}22`,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: string;
  accent?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel = 'vs last month',
  icon,
  accent = '#a78bfa',
  loading,
}: StatCardProps) {
  const up = delta !== undefined && delta >= 0;

  if (loading) {
    return (
      <div
        style={{
          background: '#0d0d18',
          border: '1px solid #1a1a28',
          borderRadius: 14,
          padding: '20px 22px',
        }}
      >
        <div
          style={{
            height: 12,
            width: '50%',
            borderRadius: 6,
            background: '#1a1a28',
            marginBottom: 14,
          }}
        />
        <div
          style={{
            height: 28,
            width: '70%',
            borderRadius: 8,
            background: '#1a1a28',
            marginBottom: 10,
          }}
        />
        <div
          style={{
            height: 10,
            width: '40%',
            borderRadius: 6,
            background: '#1a1a28',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#0d0d18',
        border: '1px solid #1a1a28',
        borderRadius: 14,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            color: '#4b4b6b',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ fontSize: 16, opacity: 0.5 }}>{icon}</span>}
      </div>

      <div
        style={{
          color: '#f0f0f8',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}
      >
        {value}
      </div>

      {delta !== undefined && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
          }}
        >
          <span style={{ color: up ? '#22c55e' : '#f87171', fontWeight: 600 }}>
            {up ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
          </span>
          <span style={{ color: '#3a3a5a' }}>{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
      }}
    >
      <div>
        <h1
          style={{
            color: '#f0f0f8',
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.02em',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: '#4b4b6b', fontSize: 13, margin: '4px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const BTN_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: '#a78bfa',
    color: '#0a0a10',
    border: '1px solid #a78bfa',
  },
  secondary: {
    background: '#12121e',
    color: '#d0d0e0',
    border: '1px solid #2a2a3e',
  },
  ghost: {
    background: 'transparent',
    color: '#9090b0',
    border: '1px solid transparent',
  },
  danger: {
    background: '#1a0808',
    color: '#f87171',
    border: '1px solid #f8717144',
  },
};

export function Btn({
  variant = 'secondary',
  size = 'md',
  children,
  style,
  disabled,
  ...rest
}: BtnProps) {
  return (
    <button
      disabled={disabled}
      style={{
        ...BTN_STYLES[variant],
        borderRadius: 9,
        padding: size === 'sm' ? '5px 12px' : '9px 18px',
        fontSize: size === 'sm' ? 12 : 13,
        fontWeight: variant === 'primary' ? 700 : 500,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        letterSpacing: variant === 'primary' ? '0.02em' : 0,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        {label && <span style={{ fontSize: 14 }}>{label}</span>}
      </label>

      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          cursor: 'pointer',
          background: value ? '#a78bfa' : '#1e1e2e',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Table card wrapper ───────────────────────────────────────────────────────
export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0d0d18',
        border: '1px solid #1a1a28',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: '#0d0d18',
        border: '1px solid #1a1a28',
        borderRadius: 14,
        padding: '22px 24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <div>
      {label && (
        <label
          style={{
            color: '#4b4b6b',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 7,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          background: '#0a0a12',
          border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : '#1e1e2e'}`,
          borderRadius: 9,
          padding: '10px 14px',
          color: '#f0f0f8',
          fontSize: 13,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
          ...style,
        }}
        onFocus={(e) => {
          if (!error)
            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)';
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = '#1e1e2e';
        }}
        {...rest}
      />
      {error && (
        <div style={{ color: '#f87171', fontSize: 12, marginTop: 5 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
}
export function Select({ label, options, style, ...rest }: SelectProps) {
  return (
    <div>
      {label && (
        <label
          style={{
            color: '#4b4b6b',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 7,
          }}
        >
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%',
          background: '#0a0a12',
          border: '1px solid #1e1e2e',
          borderRadius: 9,
          padding: '10px 14px',
          color: '#d0d0e0',
          fontSize: 13,
          outline: 'none',
          fontFamily: 'inherit',
          cursor: 'pointer',
          ...style,
        }}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '4px 0',
      }}
    >
      <div style={{ flex: 1, height: 1, background: '#1a1a28' }} />
      {label && (
        <span
          style={{ color: '#2a2a3e', fontSize: 11, letterSpacing: '0.06em' }}
        >
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: '#1a1a28' }} />
    </div>
  );
}

// ─── Money formatter ──────────────────────────────────────────────────────────
export function formatINR(amount?: number | null) {
  return `₹${(amount ?? 0).toLocaleString('en-IN')}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
