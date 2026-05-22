/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Heart,
  Search,
  User,
  LayoutDashboard,
  Package,
  Zap,
  LogOut,
  ChevronDown,
  CreditCard,
  ShoppingBag,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';

import NavItem from './NavItem';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import { useNavbar } from './useNavbar';
import {
  useCart,
  useWishlist,
  useCategories,
  useCustomerProfile,
  useStoreInfo,
} from '@/src/hooks';

import { categoriesToNavItems } from './categoryToNav';
import { STATIC_NAV_ITEMS } from './config';
import CartDrawer from '../CartDrawer';
import WishlistDrawer from '../WishlistDrawer';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@repo/api-client';
import { setAuthed } from '@repo/auth';
import { QK } from '../../../../../../../packages/shared/queryKeys';
import { getImageUrl } from '@/src/utils/image';

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro ⚡',
  enterprise: 'Enterprise',
};
const PLAN_STYLE: Record<string, string> = {
  free: 'bg-[var(--bg-3)] text-[var(--text-muted)]',
  starter: 'bg-blue-50 text-blue-600',
  pro: 'bg-amber-50 text-amber-700 font-semibold',
  enterprise: 'bg-violet-50 text-violet-700',
};

const ACCOUNT_LINKS = [
  { href: '/account', icon: LayoutDashboard, label: 'Overview' },
  { href: '/account/orders', icon: Package, label: 'My Orders' },
  { href: '/account/addresses', icon: MapPin, label: 'Manage Addresses' },
  { href: '/account/subscription', icon: Zap, label: 'Subscription' },
  { href: '/account/payments', icon: CreditCard, label: 'Payments' },
];

function Badge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  return (
    <span
      className={clsx(
        'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center',
        'text-[10px] font-bold text-white rounded-full px-1 tabular-nums shadow',
        color,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const { data: profile, isLoading } = useCustomerProfile();
  const initials =
    profile?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';
  const plan = profile?.plan ?? 'free';

  async function handleLogout() {
    setOpen(false);
    await authApi.logout();
    setAuthed(false);
    queryClient.setQueryData(QK.customer.profile, null);
    queryClient.removeQueries({ queryKey: QK.customer.cart });
    queryClient.removeQueries({ queryKey: QK.customer.wishlist });
    router.replace('/');
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-200',
          open
            ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-2)]',
        )}
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--primary)] text-white select-none flex-shrink-0">
          {isLoading ? '?' : initials}
        </div>
        <span className="hidden sm:block text-sm font-medium text-[var(--text-soft)] max-w-[100px] truncate">
          {isLoading ? '...' : (profile?.name?.split(' ')[0] ?? 'Account')}
        </span>
        <ChevronDown
          size={12}
          className={clsx(
            'text-[var(--text-muted)] transition-transform duration-200 hidden sm:block',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          className={clsx(
            'absolute right-0 top-full mt-2.5 w-[280px]',
            'bg-[var(--surface)] border border-[var(--border)]',
            'rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden z-50',
            'animate-in fade-in slide-in-from-top-2 duration-150',
          )}
        >
          <div className="px-5 py-4 bg-[var(--bg-2)] border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[14px] text-[var(--text-strong)] truncate">
                  {profile?.name ?? '...'}
                </div>
                <div className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                  {profile?.email ?? profile?.phone ?? ''}
                </div>
                <span
                  className={clsx(
                    'inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full',
                    PLAN_STYLE[plan],
                  )}
                >
                  {PLAN_LABEL[plan]}
                </span>
              </div>
            </div>
            <div className="flex mt-3 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex-1 text-center py-2.5">
                <div className="text-[15px] font-bold text-[var(--text-strong)]">
                  {profile?.totalOrders ?? 0}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                  Orders
                </div>
              </div>
            </div>
          </div>

          <div className="py-1.5">
            {ACCOUNT_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-5 py-2.5 text-[13.5px] text-[var(--text-soft)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-2)] transition-colors group"
              >
                <Icon
                  size={15}
                  strokeWidth={1.7}
                  className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0"
                />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[var(--border)] py-1.5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-5 py-2.5 text-[13.5px] text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors group"
            >
              <LogOut
                size={15}
                strokeWidth={1.7}
                className="group-hover:text-red-500 transition-colors"
              />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { mobileOpen, toggleMobile } = useNavbar();
  const pathname = usePathname();
  const [hideBanner, setHideBanner] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const lastScroll = useRef(0);
  const ticking = useRef(false);
  const mousePositions = useRef<{ x: number; y: number }[]>([]);

  // ── Counts ────────────────────────────────────────────────────────────────
  // Both hooks return the correct source (server vs Redux) transparently.
  const { data: cart } = useCart();
  const { wishlist } = useWishlist();
  const cartCount = cart?.totalItems ?? 0;
  const wishlistCount = wishlist.length;
  const { data: profile } = useCustomerProfile();

  const { data: storeInfo } = useStoreInfo();

  const logoUrl = getImageUrl(storeInfo?.storeLogo);
  const storeName = storeInfo?.storeName ?? 'StoreFront';

  const { data } = useCategories();
  const navItems = [
    ...categoriesToNavItems(data ?? [], 3),
    ...STATIC_NAV_ITEMS,
  ];

  // useEffect(() => {
  //   setAuthed(!!tokenStore.get());
  //   const handler = () => setAuthed(!!tokenStore.get());
  //   window.addEventListener('storage', handler);
  //   return () => window.removeEventListener('storage', handler);
  // }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositions.current.push({ x: e.clientX, y: e.clientY });
      if (mousePositions.current.length > 5) mousePositions.current.shift();
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      const current = window.scrollY;
      const diff = current - lastScroll.current;
      setScrolled(current > 20);
      if (Math.abs(diff) > 12) {
        setHideBanner(diff > 0 && current > 80);
        lastScroll.current = current;
      }
      ticking.current = false;
    };
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScroll);
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) toggleMobile();
    setActiveMenu(null);
    // setAuthed(!!tokenStore.get());
  }, [pathname]);

  return (
    <>
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="sticky top-0 z-50">
        {/* Announcement banner */}
        <div
          className={clsx(
            'bg-[var(--text-strong)] text-[var(--surface)] text-xs overflow-hidden',
            'transition-all duration-400 ease-[cubic-bezier(.4,0,.2,1)]',
            hideBanner
              ? 'max-h-0 opacity-0 -translate-y-2'
              : 'max-h-[36px] opacity-100 translate-y-0',
          )}
        >
          <div className="flex items-center justify-center h-9 overflow-hidden">
            <div className="flex gap-10 animate-marquee px-6 tracking-widest font-medium uppercase text-[10px] hover:[animation-play-state:paused]">
              <span>🚚 Free Shipping on Orders ₹999+</span>
              <span className="text-yellow-300">
                🔥 Flat 50% OFF – Limited Time
              </span>
              <span>💎 Premium Quality Guaranteed</span>
              <span>🚚 Free Shipping on Orders ₹999+</span>
              <span className="text-yellow-300">
                🔥 Flat 50% OFF – Limited Time
              </span>
              <span>💎 Premium Quality Guaranteed</span>
            </div>
          </div>
        </div>

        <nav
          className={clsx(
            'transition-all duration-300 backdrop-blur-xl border-b',
            scrolled
              ? 'bg-[var(--surface)]/95 border-[var(--border)] shadow-[0_1px_24px_rgba(0,0,0,0.07)]'
              : 'bg-[var(--surface)]/80 border-transparent',
          )}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-[var(--border)] group-hover:ring-[var(--text-muted)] transition-all duration-300">
                <Image
                  src={logoUrl}
                  alt={storeName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <span className="serif text-lg tracking-wide text-[var(--text-strong)] hidden sm:block">
                {storeName}
              </span>
            </Link>

            {/* Desktop nav */}
            <div
              className="hidden md:flex flex-1 items-center justify-center gap-7"
              onMouseLeave={() => setActiveMenu(null)}
            >
              {navItems.map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  mousePositions={mousePositions}
                  closeMenu={() => setActiveMenu(null)}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-2)] transition-all duration-200"
              >
                <Search size={18} />
              </button>

              {/* Wishlist */}
              <button
                onClick={() => setWishlistOpen(true)}
                className="relative p-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
                aria-label={`Wishlist (${wishlistCount})`}
              >
                <Heart size={18} />
                <Badge count={wishlistCount} color="bg-rose-500" />
              </button>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
                aria-label={`Cart (${cartCount})`}
              >
                <ShoppingBag size={18} />
                <Badge count={cartCount} color="bg-neutral-900" />
              </button>

              {/* Auth */}
              {profile ? (
                <UserMenu />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden md:flex items-center gap-1.5 ml-1 px-4 py-1.5 rounded-full text-sm font-medium tracking-wide border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text-strong)] hover:border-[var(--text-strong)] hover:bg-[var(--bg-2)] transition-all duration-200"
                  >
                    <User size={14} />
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="md:hidden p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-2)] transition-all duration-200"
                  >
                    <User size={18} />
                  </Link>
                </>
              )}

              <div className="md:hidden w-px h-5 bg-[var(--border)] mx-1" />

              <button
                onClick={toggleMobile}
                className="md:hidden p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-2)] transition-all duration-200"
              >
                <div className="relative w-[18px] h-[18px]">
                  <span
                    className={clsx(
                      'absolute inset-0 flex items-center justify-center transition-all duration-300',
                      mobileOpen
                        ? 'opacity-100 rotate-0'
                        : 'opacity-0 rotate-90 scale-50',
                    )}
                  >
                    <X size={18} />
                  </span>
                  <span
                    className={clsx(
                      'absolute inset-0 flex items-center justify-center transition-all duration-300',
                      mobileOpen
                        ? 'opacity-0 rotate-90 scale-50'
                        : 'opacity-100 rotate-0',
                    )}
                  >
                    <Menu size={18} />
                  </span>
                </div>
              </button>
            </div>
          </div>

          <MobileMenu open={mobileOpen} items={navItems} />
        </nav>

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        <WishlistDrawer
          open={wishlistOpen}
          onClose={() => setWishlistOpen(false)}
          onOpenCart={() => {
            setWishlistOpen(false);
            setCartOpen(true);
          }}
        />
      </div>
    </>
  );
}
