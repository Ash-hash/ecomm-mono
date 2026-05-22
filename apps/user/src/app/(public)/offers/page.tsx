/* eslint-disable @typescript-eslint/no-explicit-any */
// app/offers/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  Tag,
  Percent,
  Truck,
  Gift,
  Copy,
  CheckCheck,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  X,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { usePublicOffers, type PublicOffer, type OfferType } from '@/src/hooks';
import { formatCurrency } from '@/src/lib/utils';
import Image from 'next/image';

const TYPE_CONFIG = {
  percentage: {
    label: 'Percentage',
    icon: Percent,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    pill: 'bg-blue-50 text-blue-700 border-blue-200',
    valueFn: (o: any) => `${o.value}% OFF`,
  },
  fixed: {
    label: 'Fixed Amount',
    icon: Tag,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    valueFn: (o: any) => `${formatCurrency(o.value)} OFF`,
  },
  free_shipping: {
    label: 'Free Shipping',
    icon: Truck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    pill: 'bg-violet-50 text-violet-700 border-violet-200',
    valueFn: () => 'FREE SHIPPING',
  },
  bxgy: {
    label: 'Buy X Get Y',
    icon: Gift,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
    valueFn: (o: any) =>
      o.bxgyConfig
        ? `B${o.bxgyConfig.buyQuantity} G${o.bxgyConfig.getQuantity}`
        : 'BUY X GET Y',
  },
} as const;

const TABS = [
  { key: 'all', label: 'All Deals', icon: Sparkles },
  { key: 'percentage', label: 'Percentage', icon: Percent },
  { key: 'fixed', label: 'Fixed Amount', icon: Tag },
  { key: 'free_shipping', label: 'Free Shipping', icon: Truck },
  { key: 'bxgy', label: 'Buy X Get Y', icon: Gift },
] as const;

function useCountdown(expiresAt?: string | null) {
  const [r, setR] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    if (!expiresAt) return;
    function tick() {
      const diff = new Date(expiresAt!).getTime() - new Date().getTime();
      if (diff <= 0) {
        setR({ d: 0, h: 0, m: 0, s: 0, expired: true });
        return;
      }
      setR({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return r;
}

function CopyButton({ code, disabled }: { code: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopy = useCallback(() => {
    if (disabled) return;
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [code, disabled]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      onClick={handleCopy}
      disabled={disabled}
      className={clsx(
        'group flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all duration-200',
        'border-2 border-dashed active:scale-95 select-none',
        disabled
          ? 'border-[var(--border)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
          : copied
            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
            : 'border-[var(--border-strong)] bg-[var(--bg-2)] text-[var(--text-strong)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]',
      )}
    >
      <span className="mono tracking-widest">{code}</span>
      {copied ? (
        <CheckCheck size={13} className="flex-shrink-0 text-emerald-600" />
      ) : (
        <Copy size={12} className="flex-shrink-0 opacity-50" />
      )}
    </button>
  );
}

function OfferCard({ offer, faded }: { offer: PublicOffer; faded?: boolean }) {
  const cfg = TYPE_CONFIG[offer.type];
  const Icon = cfg.icon;
  const cd = useCountdown(offer.expiresAt);
  const isExpired = cd.expired;
  const urgent = !!offer.expiresAt && !isExpired && cd.d === 0;

  return (
    <article
      className={clsx(
        'group relative flex flex-col rounded-2xl border overflow-hidden bg-[var(--surface)]',
        'transition-all duration-300',
        !faded && 'hover:shadow-2xl hover:-translate-y-1',
        faded && 'opacity-55',
        cfg.border,
      )}
    >
      {/* coupon perforation */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-transparent via-[var(--primary-soft)]/20 to-transparent pointer-events-none"/>
      <div className="absolute left-0 right-0 top-[130px] flex justify-between px-[-2px] pointer-events-none">
        <div className="w-5 h-5 bg-[var(--bg)] rounded-full -ml-2 border border-[var(--border)]" />
        <div className="w-5 h-5 bg-[var(--bg)] rounded-full -mr-2 border border-[var(--border)]" />
      </div>
      <div className={clsx('h-1 w-full', cfg.bg)} />

      {offer.bannerImage && !faded && (
        <div className="w-full h-32 overflow-hidden relative">
          <Image
            src={offer.bannerImage}
            alt={offer.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                cfg.bg,
              )}
            >
              <Icon size={18} className={cfg.color} />
            </div>
            <span
              className={clsx(
                'text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border',
                cfg.pill,
              )}
            >
              {cfg.label}
            </span>
          </div>
          {urgent && !isExpired && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
              <Clock size={9} />
              {cd.h}h {cd.m}m left
            </span>
          )}
          {isExpired && (
            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-3)] px-2 py-0.5 rounded-full">
              Expired
            </span>
          )}
        </div>

        <div className="bg-[var(--bg-2)] rounded-xl px-3 py-2 inline-block">
          <p
            className={clsx(
              'text-[28px] md:text-[30px] font-black tracking-tight leading-none',
              cfg.color,
            )}
          >
            {(cfg.valueFn as any)(offer)}
          </p>
          {offer.type === 'percentage' && offer.maxDiscountAmount > 0 && (
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Max discount {formatCurrency(offer.maxDiscountAmount)}
            </p>
          )}
          {offer.type === 'bxgy' && offer.bxgyConfig && (
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Buy {offer.bxgyConfig.buyQuantity}, get{' '}
              {offer.bxgyConfig.getQuantity} free
            </p>
          )}
        </div>

        <div className="flex-1">
          <p className="text-[14.5px] font-bold text-[var(--text-strong)] leading-snug">
            {offer.title}
          </p>
          {offer.description && (
            <p className="text-[12.5px] text-[var(--text-muted)] mt-1 leading-relaxed line-clamp-2">
              {offer.description}
            </p>
          )}
        </div>

        <div className="space-y-1">
          {offer.minOrderValue > 0 && (
            <p className="text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] flex-shrink-0" />
              Min. order {formatCurrency(offer.minOrderValue)}
            </p>
          )}
          {offer.expiresAt && !isExpired && cd.d >= 1 && (
            <p className="text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5">
              <Clock size={11} className="flex-shrink-0" />
              Expires in {cd.d}d {cd.h}h
            </p>
          )}
          {urgent && !isExpired && (
            <p className="text-[11.5px] text-rose-500 font-semibold flex items-center gap-1.5">
              <Zap size={11} className="flex-shrink-0" />
              {cd.h}:{String(cd.m).padStart(2, '0')}:
              {String(cd.s).padStart(2, '0')} remaining
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2 flex-wrap">
          <CopyButton code={offer.code} disabled={isExpired} />
          <Link
            href={isExpired ? '#' : '/products'}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all',
              isExpired
                ? 'text-[var(--text-muted)] cursor-not-allowed opacity-40'
                : 'text-[var(--primary)] hover:bg-[var(--primary-soft)] active:scale-95',
            )}
          >
            Shop now <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-[var(--bg-3)]" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-3)]" />
          <div className="h-5 w-24 rounded-full bg-[var(--bg-3)]" />
        </div>
        <div className="h-7 w-28 rounded-lg bg-[var(--bg-3)]" />
        <div className="space-y-1.5">
          <div className="h-4 w-3/4 rounded bg-[var(--bg-3)]" />
          <div className="h-3 w-full rounded bg-[var(--bg-3)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--bg-3)]" />
        </div>
        <div className="pt-3 border-t border-[var(--border)] flex gap-2">
          <div className="h-9 w-32 rounded-xl bg-[var(--bg-3)]" />
          <div className="h-9 w-20 rounded-xl bg-[var(--bg-3)]" />
        </div>
      </div>
    </div>
  );
}

function Hero({ count }: { count: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl px-8 py-12 md:py-16 mb-8 bg-gradient-to-br from-[var(--text-strong)] to-[#101a10]">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-[0.12]"
        style={{ background: 'var(--primary)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full blur-3xl opacity-[0.08]"
        style={{ background: '#34d399' }}
      />
      <div className="relative max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
            {count} live deal{count !== 1 ? 's' : ''} today
          </span>
        </div>
        <h1 className="serif text-4xl md:text-5xl text-white leading-tight mb-4">
          Deals & <span className="text-emerald-400">Exclusive</span>
          <br className="hidden md:block" /> Offers
        </h1>
        <p className="text-white/55 text-[15px] leading-relaxed mb-7">
          Copy any code and paste it at checkout. Discounts are applied
          instantly.
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { icon: ShieldCheck, label: 'Verified codes' },
            { icon: RefreshCw, label: 'Updated daily' },
            { icon: Clock, label: 'Auto-expiry' },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-1.5 text-[12px] text-white/45"
            >
              <t.icon size={13} className="text-emerald-400 flex-shrink-0" />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const { data: allOffers = [], isLoading } = usePublicOffers();
  const [activeType, setActiveType] = useState<OfferType | 'all'>('all');
  const [search, setSearch] = useState('');

  //   const now = Date.now();
  const now = new Date().getTime();
  const { active: activeRaw, expired } = allOffers.reduce<{
    active: PublicOffer[];
    expired: PublicOffer[];
  }>(
    (acc, o) => {
      const exp = o.expiresAt ? new Date(o.expiresAt).getTime() : Infinity;
      (exp > now ? acc.active : acc.expired).push(o);
      return acc;
    },
    { active: [], expired: [] },
  );

  const filterFn = (offers: PublicOffer[]) => {
    const q = search.trim().toLowerCase();
    return offers.filter((o) => {
      const matchType = activeType === 'all' || o.type === activeType;
      const matchSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  };

  const filteredActive = filterFn(activeRaw);
  const filteredExpired = filterFn(expired);
  const isFiltered = activeType !== 'all' || search.trim().length > 0;

  return (
    <div className="container-main py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] mb-6">
        <Link
          href="/"
          className="hover:text-[var(--primary)] transition-colors"
        >
          Home
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--text-soft)]">Offers & Deals</span>
      </nav>

      <Hero count={activeRaw.length} />

      {/* Toolbar */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-5 px-5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveType(key as any)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-semibold',
                'whitespace-nowrap border transition-all duration-200 flex-shrink-0 snap-start',
                activeType === key
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-soft)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* subtle scroll fade */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[var(--surface)] to-transparent" />
      </div>

      {/* Results count */}
      {!isLoading && isFiltered && (
        <div className="flex items-center gap-3 mb-5">
          <p className="text-[12.5px] text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-soft)]">
              {filteredActive.length}
            </span>{' '}
            active deal{filteredActive.length !== 1 ? 's' : ''}
            {activeType !== 'all' && (
              <>
                {' '}
                ·{' '}
                <span className="capitalize">
                  {TYPE_CONFIG[activeType as OfferType].label}
                </span>
              </>
            )}
            {search && (
              <>
                <span className="italic">{search}</span>
              </>
            )}
          </p>
          <button
            onClick={() => {
              setActiveType('all');
              setSearch('');
            }}
            className="text-[11.5px] text-[var(--primary)] font-medium hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Active offers */}
      {!isLoading && (
        <>
          {filteredActive.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredActive.map((o) => (
                <OfferCard key={o._id} offer={o} />
              ))}
            </div>
          ) : filteredExpired.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[var(--bg-2)] flex items-center justify-center mb-4">
                <Tag size={28} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[16px] font-semibold text-[var(--text-soft)] mb-2">
                {isFiltered
                  ? 'No matching deals'
                  : 'No active offers right now'}
              </p>
              <p className="text-[13px] text-[var(--text-muted)] max-w-xs">
                {isFiltered
                  ? 'Try a different filter — new deals drop every day.'
                  : 'Check back soon. Fresh deals arrive regularly.'}
              </p>
              {isFiltered && (
                <button
                  onClick={() => {
                    setActiveType('all');
                    setSearch('');
                  }}
                  className="mt-5 text-[13px] font-semibold text-[var(--primary)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : null}

          {/* Expired section */}
          {filteredExpired.length > 0 && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-[11.5px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  {filteredExpired.length} Expired Offer
                  {filteredExpired.length !== 1 ? 's' : ''}
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredExpired.map((o) => (
                  <OfferCard key={o._id} offer={o} faded />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Bottom CTA */}
      {!isLoading && filteredActive.length > 0 && (
        <div className="mt-16 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] px-8 py-10 text-center">
          <p className="text-[16px] font-bold text-[var(--text-strong)] mb-2">
            Ready to use a deal?
          </p>
          <p className="text-[13.5px] text-[var(--text-muted)] mb-7 max-w-sm mx-auto leading-relaxed">
            Copy the code, add items to your cart, and paste it at checkout.
            Discount applied instantly.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/products"
              className="flex items-center gap-2 px-7 py-3 bg-[var(--primary)] text-white text-[13.5px] font-semibold rounded-xl hover:bg-[var(--primary-hover)] transition-colors active:scale-[0.98]"
            >
              Browse Products <ArrowRight size={14} />
            </Link>
            <Link
              href="/checkout"
              className="flex items-center gap-2 px-6 py-3 border border-[var(--border)] text-[var(--text-soft)] text-[13px] font-medium rounded-xl hover:border-[var(--border-strong)] hover:text-[var(--text-strong)] transition-all"
            >
              Go to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
