/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useQueryState } from 'nuqs';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import {
  Tag,
  Percent,
  Truck,
  Gift,
  BarChart2,
  Eye,
  EyeOff,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

import { DataTable, DataTableToolbar } from '../../../../components/data-table';
import {
  Badge,
  PageHeader,
  Btn,
  TableCard,
  Card,
  formatINR,
  formatDate,
} from '../../../../components/ui';

import {
  useOffers,
  useCreateOffer,
  useUpdateOffer,
  useToggleOffer,
  useDeleteOffer,
  useOfferAnalytics,
} from '../../../../hooks'; // ← adjust to your hooks path
import { CreateOfferPayload, Offer, OfferStatus, OfferType } from '@repo/types';
import Image from 'next/image';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  OfferType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  percentage: {
    label: 'Percentage',
    icon: Percent,
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  fixed: { label: 'Fixed', icon: Tag, color: '#10b981', bg: '#ecfdf5' },
  free_shipping: {
    label: 'Free Shipping',
    icon: Truck,
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  bxgy: { label: 'Buy X Get Y', icon: Gift, color: '#f59e0b', bg: '#fffbeb' },
};

const STATUS_CONFIG: Record<
  OfferStatus,
  { label: string; dot: string; cls: string }
> = {
  active: {
    label: 'Active',
    dot: 'bg-emerald-500',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-zinc-400',
    cls: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  },
  scheduled: {
    label: 'Scheduled',
    dot: 'bg-sky-500',
    cls: 'bg-sky-50 text-sky-700 border border-sky-200',
  },
  expired: {
    label: 'Expired',
    dot: 'bg-red-400',
    cls: 'bg-red-50 text-red-600 border border-red-200',
  },
};

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Expired', value: 'expired' },
];

const TYPE_OPTIONS = [
  { label: 'Percentage', value: 'percentage' },
  { label: 'Fixed', value: 'fixed' },
  { label: 'Free Shipping', value: 'free_shipping' },
  { label: 'Buy X Get Y', value: 'bxgy' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full',
        cfg.cls,
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics strip
// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsStrip() {
  const { data: analytics } = useOfferAnalytics();

  if (!analytics) return null;

  const topOffers = analytics.topOffers ?? [];
  const recent = analytics.recentUsages ?? [];

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Totals */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 lg:col-span-1">
        <p className="text-[13px] font-semibold text-[var(--text-strong)]">
          Summary
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              l: 'Total Redemptions',
              v: (analytics.totalRedemptions ?? 0).toLocaleString('en-IN'),
            },
            {
              l: 'Total Discounted',
              v: formatINR(analytics.totalDiscounted ?? 0),
            },
          ].map((s) => (
            <div key={s.l} className="bg-[var(--bg-2)] rounded-xl px-4 py-3">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide mb-1">
                {s.l}
              </p>
              <p className="text-[18px] font-bold mono text-[var(--text-strong)]">
                {s.v}
              </p>
            </div>
          ))}
        </div>

        {/* Top offers */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
            Top Codes
          </p>
          <div className="space-y-2">
            {topOffers.slice(0, 5).map((o, i) => (
              <div key={o._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] w-4">
                    #{i + 1}
                  </span>
                  <span className="text-[12.5px] font-semibold mono text-[var(--text-strong)]">
                    {o.code}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {o.usageCount} uses
                </span>
              </div>
            ))}
            {topOffers.length === 0 && (
              <p className="text-[12px] text-[var(--text-muted)] text-center py-2">
                No redemptions yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent usages */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 lg:col-span-2">
        <p className="text-[13px] font-semibold text-[var(--text-strong)] mb-4">
          Recent Redemptions
        </p>
        {recent.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)] text-center py-8">
            No redemptions yet
          </p>
        ) : (
          <div className="space-y-2">
            {recent.slice(0, 8).map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold mono bg-[var(--bg-2)] px-2 py-0.5 rounded-lg text-[var(--text-muted)]">
                    {r.code}
                  </span>
                  <span className="text-[12px] text-[var(--text-soft)]">
                    Order #{(r.orderId as string).slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-emerald-600 mono">
                    -{formatINR(r.discountApplied)}
                  </p>
                  <p className="text-[10.5px] text-[var(--text-muted)]">
                    {formatDate(r.usedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create / Edit drawer
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateOfferPayload = {
  title: '',
  description: '',
  code: '',
  type: 'percentage',
  value: 0,
  maxDiscountAmount: 0,
  minOrderValue: 0,
  usageLimit: 0,
  perUserLimit: 1,
  isPublic: false,
  status: 'active',
  bannerImage: undefined,
};

function OfferDrawer({
  editing,
  onClose,
}: {
  editing: Offer | null;
  onClose: () => void;
}) {
  const isEdit = !!editing;
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const [form, setForm] = useState<CreateOfferPayload>(
    editing
      ? {
          title: editing.title,
          description: editing.description,
          code: editing.code,
          type: editing.type,
          value: editing.value,
          maxDiscountAmount: editing.maxDiscountAmount,
          minOrderValue: editing.minOrderValue,
          usageLimit: editing.usageLimit,
          perUserLimit: editing.perUserLimit,
          isPublic: editing.isPublic,
          status: editing.status as any,
          startsAt: editing.startsAt ?? undefined,
          expiresAt: editing.expiresAt ?? undefined,
          allowedPlans: editing.allowedPlans,
          newUsersOnly: editing.newUsersOnly,
          bxgyConfig: editing.bxgyConfig ?? undefined,
          bannerImage: editing.bannerImage ?? undefined,
        }
      : EMPTY_FORM,
  );
  const [preview, setPreview] = useState<string | null>(
    typeof form.bannerImage === 'string' ? form.bannerImage : null,
  );

  const busy = createOffer.isPending || updateOffer.isPending;

  function set<K extends keyof CreateOfferPayload>(
    k: K,
    v: CreateOfferPayload[K],
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function buildFormData(payload: CreateOfferPayload) {
    const fd = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === 'bannerImage' && value instanceof File) {
        fd.append('bannerImage', value);
      } else if (typeof value === 'object') {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, String(value));
      }
    });

    return fd;
  }

  async function handleSubmit() {
    const payload = await buildFormData(form);

    if (isEdit && editing) {
      await updateOffer.mutateAsync({
        id: editing._id,
        payload,
      });
    } else {
      await createOffer.mutateAsync(payload);
    }

    onClose();
  }

  const inputCls =
    'w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-strong)] outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all';
  const labelCls =
    'block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-[var(--surface)] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <h2 className="text-[16px] font-bold text-[var(--text-strong)]">
            {isEdit ? 'Edit Offer' : 'Create Offer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-2)] transition-colors"
          >
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title + description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input
                className={inputCls}
                placeholder="Summer Sale 20%"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                className={inputCls}
                placeholder="Customer-facing tagline"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Coupon Banner</label>

            <div className="flex items-center gap-4">
              {preview && (
                <div className="relative">
                  <Image
                    src={preview}
                    alt="Offer banner preview"
                    width={144}
                    height={80}
                    className="w-36 h-20 object-cover rounded-lg border border-[var(--border)]"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      set('bannerImage', undefined as any);
                    }}
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <label className="cursor-pointer px-3 py-2 border border-[var(--border)] rounded-lg text-[12px] font-semibold hover:bg-[var(--bg-2)]">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    set('bannerImage', file);

                    const reader = new FileReader();
                    reader.onload = () => setPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Recommended size: 800 × 400
            </p>
          </div>

          {/* Code + type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Code * (UPPERCASE)</label>
              <input
                className={inputCls}
                placeholder="SUMMER20"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select
                className={inputCls}
                value={form.type}
                onChange={(e) => set('type', e.target.value as OfferType)}
              >
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value fields */}
          {form.type !== 'free_shipping' && form.type !== 'bxgy' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  {form.type === 'percentage' ? 'Discount %' : 'Discount ₹'}
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.value}
                  onChange={(e) => set('value', Number(e.target.value))}
                />
              </div>
              {form.type === 'percentage' && (
                <div>
                  <label className={labelCls}>
                    Max Discount ₹ (0 = no cap)
                  </label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.maxDiscountAmount}
                    onChange={(e) =>
                      set('maxDiscountAmount', Number(e.target.value))
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* BXGY config */}
          {form.type === 'bxgy' && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-[var(--bg-2)] rounded-xl border border-[var(--border)]">
              <div>
                <label className={labelCls}>Buy Qty</label>
                <input
                  type="number"
                  className={inputCls}
                  min={1}
                  value={form.bxgyConfig?.buyQuantity ?? 1}
                  onChange={(e) =>
                    set('bxgyConfig', {
                      ...form.bxgyConfig,
                      buyQuantity: Number(e.target.value),
                      getQuantity: form.bxgyConfig?.getQuantity ?? 1,
                    })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Get Qty</label>
                <input
                  type="number"
                  className={inputCls}
                  min={1}
                  value={form.bxgyConfig?.getQuantity ?? 1}
                  onChange={(e) =>
                    set('bxgyConfig', {
                      ...form.bxgyConfig,
                      buyQuantity: form.bxgyConfig?.buyQuantity ?? 1,
                      getQuantity: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Get Discount %</label>
                <input
                  type="number"
                  className={inputCls}
                  min={1}
                  max={100}
                  value={form.bxgyConfig?.getDiscountPct ?? 100}
                  onChange={(e) =>
                    set('bxgyConfig', {
                      ...form.bxgyConfig,
                      buyQuantity: form.bxgyConfig?.buyQuantity ?? 1,
                      getQuantity: form.bxgyConfig?.getQuantity ?? 1,
                      getDiscountPct: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Min order + limits */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Min Order ₹</label>
              <input
                type="number"
                className={inputCls}
                value={form.minOrderValue}
                onChange={(e) => set('minOrderValue', Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Total Uses (0=∞)</label>
              <input
                type="number"
                className={inputCls}
                value={form.usageLimit}
                onChange={(e) => set('usageLimit', Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Per User (0=∞)</label>
              <input
                type="number"
                className={inputCls}
                value={form.perUserLimit}
                onChange={(e) => set('perUserLimit', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Starts At</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.startsAt ? form.startsAt.slice(0, 16) : ''}
                onChange={(e) =>
                  set(
                    'startsAt',
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  )
                }
              />
            </div>
            <div>
              <label className={labelCls}>Expires At</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
                onChange={(e) =>
                  set(
                    'expiresAt',
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  )
                }
              />
            </div>
          </div>

          {/* Status + public */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => set('status', e.target.value as any)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => set('isPublic', !form.isPublic)}
                  className={clsx(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                    form.isPublic
                      ? 'bg-[var(--primary)] border-[var(--primary)]'
                      : 'border-[var(--border)]',
                  )}
                >
                  {form.isPublic && (
                    <span className="w-2 h-2 rounded-sm bg-white" />
                  )}
                </div>
                <span className="text-[13px] text-[var(--text-soft)]">
                  Show in storefront
                </span>
              </label>
            </div>
          </div>

          {/* Allowed plans */}
          <div>
            <label className={labelCls}>Allowed Plans (empty = all)</label>
            <div className="flex gap-2 flex-wrap">
              {(['free', 'starter', 'pro', 'enterprise'] as const).map((p) => {
                const selected = (form.allowedPlans ?? []).includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      set(
                        'allowedPlans',
                        selected
                          ? (form.allowedPlans ?? []).filter((x) => x !== p)
                          : [...(form.allowedPlans ?? []), p],
                      )
                    }
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize border transition-all',
                      selected
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* New users only */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => set('newUsersOnly', !form.newUsersOnly)}
              className={clsx(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                form.newUsersOnly
                  ? 'bg-[var(--primary)] border-[var(--primary)]'
                  : 'border-[var(--border)]',
              )}
            >
              {form.newUsersOnly && (
                <span className="w-2 h-2 rounded-sm bg-white" />
              )}
            </div>
            <span className="text-[13px] text-[var(--text-soft)]">
              New users only
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-6 py-4 flex gap-3">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            className="flex-1"
            disabled={busy || !form.title || !form.code}
            onClick={handleSubmit}
          >
            {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Offer'}
          </Btn>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete confirm dialog
// ─────────────────────────────────────────────────────────────────────────────

function DeleteDialog({
  offer,
  onClose,
}: {
  offer: Offer;
  onClose: () => void;
}) {
  const deleteOffer = useDeleteOffer();
  const hasHistory = offer.usageCount > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--text-strong)]">
              {hasHistory ? 'Deactivate Offer?' : 'Delete Offer?'}
            </p>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-1">
              <strong className="mono">{offer.code}</strong>
              {hasHistory
                ? ` has ${offer.usageCount} redemption${offer.usageCount !== 1 ? 's' : ''} — it will be deactivated instead of deleted.`
                : ' will be permanently removed.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="danger"
            className="flex-1"
            disabled={deleteOffer.isPending}
            onClick={async () => {
              await deleteOffer.mutateAsync(offer._id);
              onClose();
            }}
          >
            {deleteOffer.isPending ? '…' : hasHistory ? 'Deactivate' : 'Delete'}
          </Btn>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [status, setStatus] = useQueryState('status', { defaultValue: '' });
  const [type, setType] = useQueryState('type', { defaultValue: '' });
  const [search, setSearch] = useQueryState('search', { defaultValue: '' });

  const [drawerOffer, setDrawerOffer] = useState<Offer | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  const params = useMemo(
    () => ({
      page: Number(page),
      limit: 15,
      status: (status as OfferStatus) || undefined,
      type: (type as OfferType) || undefined,
      search: search || undefined,
    }),
    [page, status, type, search],
  );

  const { data, isLoading } = useOffers(params);
  const toggleOffer = useToggleOffer();

  const offers = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: ColumnDef<Offer, any>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => {
          const cfg = TYPE_CONFIG[row.original.type];
          return (
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bg }}
              >
                <cfg.icon size={13} style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-[13px] font-bold mono text-[var(--text-strong)]">
                  {row.original.code}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">
                  {row.original.title}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => {
          const cfg = TYPE_CONFIG[getValue() as OfferType];
          return (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row }) => {
          const o = row.original;
          if (o.type === 'free_shipping')
            return (
              <span className="text-[13px] text-[var(--text-muted)]">
                Free ship
              </span>
            );
          if (o.type === 'bxgy') {
            const b = o.bxgyConfig;
            return (
              <span className="text-[12.5px] text-[var(--text-soft)]">
                B{b?.buyQuantity}G{b?.getQuantity}
              </span>
            );
          }
          return (
            <div>
              <p className="text-[13.5px] font-semibold mono text-[var(--text-strong)]">
                {o.type === 'percentage' ? `${o.value}%` : formatINR(o.value)}
              </p>
              {o.type === 'percentage' && (o.maxDiscountAmount ?? 0) > 0 && (
                <p className="text-[10.5px] text-[var(--text-muted)]">
                  max {formatINR(o.maxDiscountAmount ?? 0)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'usageCount',
        header: 'Uses',
        cell: ({ getValue, row }) => {
          const count = getValue() as number;
          const limit = row.original.usageLimit;
          return (
            <div>
              <p className="text-[13.5px] font-semibold mono text-[var(--text-strong)]">
                {count.toLocaleString('en-IN')}
              </p>
              {(limit ?? 0) > 0 && (
                <p className="text-[10.5px] text-[var(--text-muted)]">
                  of {(limit ?? 0).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue, row }) => (
          <div className="space-y-1">
            <OfferStatusBadge status={getValue() as OfferStatus} />
            {row.original.isPublic && (
              <p className="text-[10px] text-sky-600 flex items-center gap-1">
                <Eye size={9} /> Public
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'expiresAt',
        header: 'Expires',
        cell: ({ getValue }) => {
          const v = getValue();
          if (!v)
            return (
              <span className="text-[12px] text-[var(--text-muted)]">
                Never
              </span>
            );
          const past = new Date(v).getTime() < Date.now();
          return (
            <span
              className={clsx(
                'text-[12px]',
                past ? 'text-red-500' : 'text-[var(--text-soft)]',
              )}
            >
              {formatDate(v)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const o = row.original;
          const busy = toggleOffer.isPending;
          return (
            <div className="flex items-center gap-1.5">
              {/* Toggle */}
              <button
                onClick={() => toggleOffer.mutate(o._id)}
                disabled={busy || o.status === 'expired'}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-2)] transition-colors disabled:opacity-40"
                title={o.status === 'active' ? 'Deactivate' : 'Activate'}
              >
                {o.status === 'active' ? (
                  <ToggleRight size={16} className="text-emerald-500" />
                ) : (
                  <ToggleLeft size={16} className="text-[var(--text-muted)]" />
                )}
              </button>

              {/* Edit */}
              <Btn
                size="sm"
                variant="secondary"
                onClick={() => setDrawerOffer(o)}
              >
                Edit
              </Btn>

              {/* Delete */}
              <button
                onClick={() => setDeleteTarget(o)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        },
      },
    ],
    [toggleOffer],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers & Coupons"
        subtitle={`${total.toLocaleString('en-IN')} offers`}
        actions={
          <Btn onClick={() => setDrawerOffer('new')}>
            <Plus size={15} />
            Create Offer
          </Btn>
        }
      />

      {/* ── Analytics ─────────────────────────────────────────────────── */}
      <AnalyticsStrip />

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <TableCard>
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <DataTableToolbar
            searchPlaceholder="Search code or title…"
            search={search ?? ''}
            onSearch={(v) => {
              setSearch(v);
              setPage('1');
            }}
            filters={[
              {
                key: 'status',
                placeholder: 'Filter status',
                value: status ?? '',
                options: STATUS_OPTIONS,
                onChange: (v) => {
                  setStatus(v);
                  setPage('1');
                },
              },
              {
                key: 'type',
                placeholder: 'Filter type',
                value: type ?? '',
                options: TYPE_OPTIONS,
                onChange: (v) => {
                  setType(v);
                  setPage('1');
                },
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          data={offers}
          total={total}
          page={Number(page)}
          limit={15}
          isLoading={isLoading}
          onPageChange={(p) => setPage(String(p))}
        />
      </TableCard>

      {/* ── Drawer ────────────────────────────────────────────────────── */}
      {drawerOffer !== null && (
        <OfferDrawer
          editing={drawerOffer === 'new' ? null : drawerOffer}
          onClose={() => setDrawerOffer(null)}
        />
      )}

      {/* ── Delete dialog ──────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteDialog
          offer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
