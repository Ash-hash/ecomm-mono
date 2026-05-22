'use client';
import { cn } from '@/src/lib/utils';
import React from 'react';

// ── Button ─────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type BtnSize    = 'sm' | 'md' | 'lg';

const btnBase = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-[8px] transition-all duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-[--gold] text-[#0a0808] hover:bg-[--gold-hover]',
  outline: 'bg-transparent border border-[--line] text-[--soft] hover:border-[--muted] hover:text-[--prose]',
  ghost:   'bg-transparent text-[--soft] hover:bg-[--ink-3] hover:text-[--prose]',
  danger:  'bg-transparent border border-rose-500/20 text-rose-400 hover:bg-rose-500/10',
};
const btnSizes: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
}

export function Button({ variant = 'outline', size = 'md', loading, className, children, disabled, ...p }: ButtonProps) {
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
type BadgeVariant = 'delivered' | 'shipped' | 'processing' | 'pending' | 'cancelled' | 'refunded' | 'active' | 'paused' | 'past_due' | 'trialing' | 'gold';

const badgeStyles: Record<BadgeVariant, string> = {
  delivered:  'bg-emerald-500/10 text-emerald-400',
  shipped:    'bg-sky-500/10 text-sky-400',
  processing: 'bg-amber-500/10 text-amber-400',
  pending:    'bg-[--soft]/10 text-[--soft]',
  cancelled:  'bg-rose-500/10 text-rose-400',
  refunded:   'bg-violet-500/10 text-violet-400',
  active:     'bg-emerald-500/10 text-emerald-400',
  paused:     'bg-[--soft]/10 text-[--soft]',
  past_due:   'bg-rose-500/10 text-rose-400',
  trialing:   'bg-sky-500/10 text-sky-400',
  gold:       'bg-[--gold-dim] text-[--gold] border border-[--gold-line]',
};

const LABELS: Record<string, string> = {
  delivered: 'Delivered', shipped: 'Shipped', processing: 'Processing',
  pending: 'Pending', cancelled: 'Cancelled', refunded: 'Refunded',
  active: 'Active', paused: 'Paused', past_due: 'Past due', trialing: 'Trial',
};

export function Badge({ variant, label, className }: { variant: BadgeVariant; label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full', badgeStyles[variant], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label ?? LABELS[variant] ?? variant}
    </span>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[--ink-3] rounded animate-pulse', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-[--ink-2] border border-[--line] rounded-[10px] p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...p }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-medium uppercase tracking-[0.08em] text-[--dim]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'px-3.5 py-2.5 text-[13.5px] rounded-[8px] bg-[--ink-3] border border-[--line] text-[--prose] placeholder:text-[--muted] transition-colors focus:border-[--gold-line]',
          error && 'border-rose-500/50',
          className,
        )}
        {...p}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...p }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[--dim]">{label}</label>}
      <select
        className={cn('px-3.5 py-2.5 text-[13.5px] rounded-[8px] bg-[--ink-3] border border-[--line] text-[--prose] transition-colors focus:border-[--gold-line] cursor-pointer', className)}
        {...p}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[--ink-2] border border-[--line] rounded-[18px] p-6', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('font-serif text-[18px] font-medium text-[--bright] tracking-[0.01em] mb-5', className)}>
      {children}
    </h2>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-[--line]', className)} />;
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function Empty({ icon, title, desc, action }: { icon: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4 opacity-30">{icon}</div>
      <div className="font-serif text-xl text-[--prose] mb-1.5">{title}</div>
      {desc && <p className="text-sm text-[--dim]">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
