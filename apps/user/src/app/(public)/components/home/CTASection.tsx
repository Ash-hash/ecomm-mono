'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, Heart, Zap, Gift, Star, Check } from 'lucide-react';
import clsx from 'clsx';
import { useCustomerProfile } from '@/src/hooks';
import { isAuthed } from '@repo/auth';

// ── Static data ───────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Gift,
    title: 'Exclusive Offers',
    desc:  'Member-only deals & early sale access',
    color: 'text-rose-500',
    bg:    'bg-rose-50',
  },
  {
    icon: Package,
    title: 'Order Tracking',
    desc:  'Real-time updates from dispatch to door',
    color: 'text-sky-500',
    bg:    'bg-sky-50',
  },
  {
    icon: Heart,
    title: 'Saved Wishlists',
    desc:  'Curate and revisit your favourites',
    color: 'text-rose-400',
    bg:    'bg-rose-50',
  },
  {
    icon: Zap,
    title: 'Faster Checkout',
    desc:  'Saved addresses, one-tap reorder',
    color: 'text-amber-500',
    bg:    'bg-amber-50',
  },
];

const AVATARS = [
  { initials: 'RK', bg: 'bg-emerald-600'  },
  { initials: 'AP', bg: 'bg-teal-500'     },
  { initials: 'MS', bg: 'bg-emerald-400'  },
  { initials: 'SV', bg: 'bg-green-600'    },
  { initials: 'NJ', bg: 'bg-emerald-700'  },
];

const PERKS_LOGGED_IN = [
  'Access exclusive member prices',
  'Free shipping on eligible orders',
  'Priority customer support',
  'Early launch notifications',
];

// ── Social proof strip ────────────────────────────────────────────────────────

function SocialProof() {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {AVATARS.map((a) => (
          <div
            key={a.initials}
            className={clsx(
              'w-8 h-8 rounded-full border-2 border-white flex items-center justify-center',
              'text-[10px] font-bold text-white flex-shrink-0',
              a.bg,
            )}
          >
            {a.initials}
          </div>
        ))}
      </div>

      {/* Stars + count */}
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-[11px] text-[var(--text-muted)] mt-0.5 whitespace-nowrap">
          Trusted by <strong className="text-[var(--text-soft)]">50,000+</strong> shoppers
        </span>
      </div>
    </div>
  );
}

// ── Benefit pill ──────────────────────────────────────────────────────────────

function BenefitCard({
  icon: Icon, title, desc, color, bg,
}: typeof BENEFITS[number]) {
  return (
    <div className="flex items-start gap-3 text-left">
      <div className={clsx(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        bg,
      )}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[var(--text-strong)]">{title}</p>
        <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

// ── Guest CTA ─────────────────────────────────────────────────────────────────

function GuestCTA() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-[var(--surface)] border-y border-[var(--border)]">
      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[800px] h-[500px] rounded-full bg-emerald-50 blur-3xl opacity-60" />
      </div>

      <div className="container-main relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: copy ─────────────────────────────────────────── */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                  Free to join · No card required
                </span>
              </div>

              <h2 className="serif text-4xl md:text-5xl leading-tight text-[var(--text-strong)] mb-5">
                Shop smarter,{' '}
                <br className="hidden md:block" />
                <span className="text-emerald-700">not harder</span>
              </h2>

              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mb-8 max-w-md">
                Join 50,000+ thoughtful shoppers who save time, money, and effort
                with a free account. Unlock benefits the moment you sign up.
              </p>

              {/* Social proof */}
              <div className="mb-8">
                <SocialProof />
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  href="/register"
                  className="btn-primary flex items-center gap-2 px-6 py-3 text-sm shadow-sm hover:shadow-md transition-shadow"
                >
                  Create Free Account
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-[var(--text-soft)] hover:text-[var(--text-strong)] border-b border-[var(--border)] hover:border-[var(--text-strong)] transition-all pb-0.5"
                >
                  Already have an account? Sign in →
                </Link>
              </div>
            </div>

            {/* ── Right: benefit cards ────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] hover:border-emerald-200 hover:shadow-sm transition-all duration-200"
                >
                  <BenefitCard {...b} />
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// ── Logged-in CTA ─────────────────────────────────────────────────────────────

function LoggedInCTA({ name, plan }: { name: string; plan: string }) {
  const firstName   = name.split(' ')[0];
  const isPaidPlan  = plan !== 'free';

  return (
    <section className="relative py-24 md:py-28 overflow-hidden border-y border-[var(--border)]">
      {/* Dark gradient background */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[var(--text-strong)] via-[#1a2e1a] to-[#0f1f0f]"
      />
      {/* Subtle leaf texture overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #4ade80 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #34d399 0%, transparent 40%)`,
        }}
      />

      <div className="container-main relative">
        <div className="max-w-3xl mx-auto text-center">

          {/* Greeting badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 border border-white/15 mb-8">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {(firstName?.[0] ?? '').toUpperCase()}
            </div>
            <span className="text-[12px] text-white/70 font-medium">
              Welcome back,{' '}
              <span className="text-white font-semibold">{firstName}</span>
            </span>
            {/* Plan chip */}
            <span className={clsx(
              'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
              isPaidPlan
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'bg-white/10 text-white/50 border border-white/15',
            )}>
              {isPaidPlan ? `⚡ ${plan}` : plan}
            </span>
          </div>

          <h2 className="serif text-4xl md:text-[46px] text-white leading-tight mb-5">
            {isPaidPlan ? (
              <>Your premium perks<br className="hidden md:block" /> are active</>
            ) : (
              <>Unlock the full<br className="hidden md:block" /> <span className="text-emerald-400">member experience</span></>
            )}
          </h2>

          <p className="text-white/55 text-[15px] leading-relaxed mb-10 max-w-xl mx-auto">
            {isPaidPlan
              ? `You're on the ${plan} plan — enjoy exclusive pricing, priority support, and free shipping on all orders.`
              : 'Upgrade to a paid plan for free express shipping, exclusive member pricing, and early access to new collections.'}
          </p>

          {/* Perks checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-10 text-left">
            {PERKS_LOGGED_IN.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5">
                <div className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                  isPaidPlan ? 'bg-emerald-500' : 'bg-white/15',
                )}>
                  <Check size={9} className="text-white" strokeWidth={3} />
                </div>
                <span className={clsx(
                  'text-[12.5px]',
                  isPaidPlan ? 'text-white/80' : 'text-white/50',
                )}>
                  {perk}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isPaidPlan ? (
              <>
                <Link
                  href="/products"
                  className="flex items-center gap-2 px-7 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/40 active:scale-[0.98]"
                >
                  Shop New Arrivals
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white/40 text-white/70 hover:text-white text-sm font-medium rounded-xl transition-all"
                >
                  My Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/account/subscription"
                  className="flex items-center gap-2 px-7 py-3 bg-amber-400 hover:bg-amber-300 text-stone-900 text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-900/30 active:scale-[0.98]"
                >
                  <Zap size={15} fill="currentColor" />
                  Upgrade Plan
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/products"
                  className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white/40 text-white/70 hover:text-white text-sm font-medium rounded-xl transition-all"
                >
                  Continue Shopping
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CTASection() {
  const [authed, setAuthed]   = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: profile }     = useCustomerProfile();

  // Hydrate auth state client-side only to avoid SSR mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthed(isAuthed());
    setMounted(true);
  }, []);

  // Render nothing until mounted to prevent flash
  if (!mounted) {
    return (
      <section className="py-24 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="container-main">
          <div className="max-w-xl mx-auto space-y-4 animate-pulse">
            <div className="h-6 w-40 bg-[var(--bg-3)] rounded-full mx-auto" />
            <div className="h-12 w-3/4 bg-[var(--bg-3)] rounded-xl mx-auto" />
            <div className="h-4 w-2/3 bg-[var(--bg-3)] rounded mx-auto" />
            <div className="h-4 w-1/2 bg-[var(--bg-3)] rounded mx-auto" />
            <div className="h-11 w-48 bg-[var(--bg-3)] rounded-xl mx-auto mt-6" />
          </div>
        </div>
      </section>
    );
  }

  if (authed && profile) {
    return <LoggedInCTA name={profile.name ?? 'there'} plan={profile.plan ?? 'free'} />;
  }

  return <GuestCTA />;
}