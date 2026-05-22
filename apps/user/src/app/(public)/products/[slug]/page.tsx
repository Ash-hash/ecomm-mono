/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Leaf,
  Languages,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from 'lucide-react';

import {
  useAddToCart,
  useCart,
  useProduct,
  useSelectCartItems,
  useStoreInfo,
  useToggleWishlist,
  useWishlist,
} from '@/src/hooks';
import { cn, formatCurrency } from '@/src/lib/utils';
import { getTenantUrl } from '@/src/utils/image';

type ProductImage = string | null | undefined;

function getImageSrc(src?: ProductImage) {
  if (!src) return '';
  return getTenantUrl(src);
}

function normalizeTel(phone?: string | null) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-stone-200', className)} />
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
        <div className="space-y-4">
          <SkeletonBlock className="aspect-square w-full rounded-[1.75rem]" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock
                key={i}
                className="h-[72px] w-[72px] shrink-0 rounded-2xl"
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-11 w-3/4 rounded-2xl" />
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-14 w-52 rounded-2xl" />
          <SkeletonBlock className="h-4 w-56" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-3 w-full" />
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <SkeletonBlock className="h-12 flex-1 rounded-full" />
            <SkeletonBlock className="h-12 flex-1 rounded-full" />
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <SkeletonBlock className="h-12 w-12 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : (params?.slug ?? '');

  const { data, isLoading } = useProduct(slug);
  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  const { data: store } = useStoreInfo();
  const selectCartItems = useSelectCartItems();

  const { isInWishlist } = useWishlist();
  const { toggle: toggleWishlist, isPending: wishlistPending } =
    useToggleWishlist();

  const product = data;
  const productId = product?._id ?? '';

  const storeData = useMemo(() => {
    const raw = (store as any)?.data ?? store ?? {};
    return {
      name: raw?.storeName || raw?.name || 'Your Store',
      phone: raw?.storePhone || raw?.phone || raw?.contactNumber || '',
      address: raw?.storeAddress || raw?.address || '',
      logo: raw?.storeLogo || raw?.logo || raw?.image || '',
    };
  }, [store]);

  const images = useMemo(() => {
    if (!product) return [];
    return [product.main_image, ...(product.images ?? [])].filter(
      Boolean,
    ) as string[];
  }, [product]);

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [translating, setTranslating] = useState(false);
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [buyNowPending, setBuyNowPending] = useState(false);

  useEffect(() => {
    setActiveImage(0);
    setQty(1);
    setLang('en');
    setTranslatedDesc(null);
    setAdded(false);
    setBuyNowPending(false);
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    setWishlisted(isInWishlist(product._id));
  }, [product, isInWishlist]);

  const qtyInCart =
    cart?.items.find((i) => i.productId === product?._id)?.quantity ?? 0;
  const stock = product?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 8;

  const discount = useMemo(() => {
    if (!product?.compareAtPrice || !product?.price) return 0;
    const raw = Math.round((1 - product.price / product.compareAtPrice) * 100);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }, [product?.compareAtPrice, product?.price]);

  const currentDesc =
    lang === 'hi'
      ? product?.description_hi || translatedDesc || product?.description || ''
      : product?.description || '';

  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }, []);

  const lowStock = isLowStock;

  const primaryImage = getImageSrc(images[activeImage]);

  const canIncreaseQty = !isOutOfStock && qty < stock;

  const handleTranslate = async () => {
    if (!product) return;

    if (lang === 'hi') {
      setLang('en');
      return;
    }

    const hiText = product.description_hi || translatedDesc;
    if (hiText) {
      setLang('hi');
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: product.description || '',
          targetLang: 'hi',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setTranslatedDesc(json.translation);
        setLang('hi');
      }
    } finally {
      setTranslating(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || isOutOfStock || addToCart.isPending) return;

    try {
      await addToCart.mutate({
        productId: product._id,
        quantity: qty,
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          main_image: product.main_image ?? '',
          slug: product.slug,
          stock: product.stock,
        },
      });

      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    } catch {
      // keep UI quiet; mutation hook can surface global errors
    }
  };

  const selectOnlyThisItem = async () => {
    if (!product) return;

    const allIds = (cart?.items ?? [])
      .map((item) => item.productId)
      .filter(Boolean);

    if (allIds.length > 0) {
      await selectCartItems.mutate({
        productIds: allIds,
        selected: false,
      });
    }

    await selectCartItems.mutate({
      productIds: [product._id],
      selected: true,
    });
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock || buyNowPending) return;

    setBuyNowPending(true);

    router.push(
      `/checkout?buyNow=true` + `&productId=${product._id}` + `&qty=${qty}`,
    );
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || 'Product',
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // ignore silently
      }
    }
  };

  const handleWishlist = async () => {
    if (!product || wishlistPending) return;
    setWishlisted((w) => !w);
    toggleWishlist(product);
  };

  const prevImage = () => {
    if (!images.length) return;
    setActiveImage((i) => (i - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    if (!images.length) return;
    setActiveImage((i) => (i + 1) % images.length);
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <ProductSkeleton />
      </div>
    );
  }

  const inWishlist = wishlisted || isInWishlist(product._id);
  const telHref = normalizeTel(storeData.phone);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E3A2F]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-stone-400 sm:text-xs">
          <Link href="/" className="transition-colors hover:text-[#2D7A4F]">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/products"
            className="transition-colors hover:text-[#2D7A4F]"
          >
            Products
          </Link>
          {product.categoryName && (
            <>
              <span>/</span>
              <Link
                href={`/products?category=${encodeURIComponent(product.categoryName)}`}
                className="transition-colors hover:text-[#2D7A4F]"
              >
                {product.categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="max-w-[220px] truncate font-medium text-stone-600">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <section className="space-y-4">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#E2D9CE] bg-[#F3EEE7] shadow-[0_20px_50px_rgba(0,0,0,0.06)] aspect-square min-h-[320px] sm:min-h-[420px]">
              {primaryImage ? (
                <>
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    priority={activeImage === 0}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                  />

                  {discount > 0 && (
                    <span className="absolute left-4 top-4 z-10 rounded-full bg-[#C8882A] px-3 py-1 text-[11px] font-semibold text-white shadow">
                      {discount}% OFF
                    </span>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/90 text-[#1E3A2F] shadow hover:bg-white"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/90 text-[#1E3A2F] shadow hover:bg-white"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-3 py-1 text-[11px] tracking-wide text-white backdrop-blur-sm">
                    {activeImage + 1} / {images.length}
                  </span>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#F3EEE7]">
                  <Package className="text-stone-400" size={42} />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-2 transition-all sm:h-[76px] sm:w-[76px]',
                      i === activeImage
                        ? 'border-[#2D7A4F] shadow-md'
                        : 'border-[#E2D9CE] hover:border-[#C8B49A]',
                    )}
                  >
                    <Image
                      src={getImageSrc(img)}
                      alt=""
                      fill
                      sizes="76px"
                      loading="lazy"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Leaf size={12} className="text-[#2D7A4F]" />
              <span className="leading-relaxed">
                Curated by{' '}
                <strong className="font-serif text-stone-600">
                  {storeData.name}
                </strong>{' '}
                · Grown with love in India
              </span>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8882A]">
                {product.categoryName || 'Product'}
              </p>

              <h1 className="font-serif text-[clamp(1.75rem,5vw,2.9rem)] font-semibold leading-tight text-[#1E3A2F]">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < 4
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-stone-300 text-stone-300'
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-stone-500">
                  4.5 <span className="text-stone-400">(128 reviews)</span>
                </span>
                <span className="hidden text-stone-300 sm:inline">·</span>
                <span className="text-xs font-medium text-[#2D7A4F]">
                  1,247 happy customers
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-serif text-4xl font-semibold text-[#1E3A2F]">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-lg text-stone-400 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                  <span className="rounded-full bg-[#2D7A4F] px-3 py-1 text-[11px] font-semibold text-white">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    !isOutOfStock ? 'bg-[#2D7A4F]' : 'bg-red-500',
                  )}
                />
                <span
                  className={cn(
                    'font-medium',
                    !isOutOfStock ? 'text-[#2D7A4F]' : 'text-red-600',
                  )}
                >
                  {!isOutOfStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {!isOutOfStock && (
                <>
                  <span className="text-stone-300">|</span>
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <MapPin size={11} />
                    <span>
                      Delivery by{' '}
                      <strong className="text-stone-700">{deliveryDate}</strong>
                    </span>
                  </div>
                </>
              )}
            </div>

            {lowStock && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle size={14} className="shrink-0" />
                Only <strong>{stock}</strong> left — order soon!
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Description
                </span>

                <button
                  type="button"
                  onClick={handleTranslate}
                  disabled={translating}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2D7A4F] px-3.5 py-1.5 text-xs font-medium text-[#2D7A4F] transition hover:bg-[#2D7A4F] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Languages size={12} />
                  {translating
                    ? 'Translating…'
                    : lang === 'hi'
                      ? 'Read in English'
                      : 'हिंदी में पढ़ें'}
                </button>
              </div>

              <p
                className={cn(
                  'whitespace-pre-line text-[14.5px] leading-relaxed text-stone-600',
                  lang === 'hi' && 'font-medium',
                )}
              >
                {currentDesc}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-14 text-sm text-stone-500">Qty</span>
                <div className="inline-flex overflow-hidden rounded-2xl border border-[#E2D9CE] bg-white">
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center text-[#1E3A2F] transition hover:bg-[#F3EEE7] disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="grid h-11 w-12 place-items-center border-x border-[#E2D9CE] bg-white text-sm font-semibold text-[#1E3A2F]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center text-[#1E3A2F] transition hover:bg-[#F3EEE7] disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => setQty((q) => Math.min(stock, q + 1))}
                    disabled={!canIncreaseQty}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="hidden md:flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addToCart.isPending}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-medium transition-all',
                    isOutOfStock
                      ? 'cursor-not-allowed bg-stone-200 text-stone-400'
                      : added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-900 text-white hover:bg-neutral-700',
                    addToCart.isPending && 'cursor-wait opacity-75',
                  )}
                >
                  {addToCart.isPending ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Adding…
                    </>
                  ) : added ? (
                    <>
                      <Check size={15} strokeWidth={2.5} />
                      Added to Cart
                    </>
                  ) : qtyInCart > 0 ? (
                    <>
                      <ShoppingCart size={15} />
                      In Cart · {qtyInCart}
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={15} />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={
                    isOutOfStock || buyNowPending || addToCart.isPending
                  }
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all',
                    isOutOfStock
                      ? 'cursor-not-allowed bg-stone-300'
                      : 'bg-[#C8882A] hover:bg-[#b57724]',
                    (buyNowPending || addToCart.isPending) &&
                      'cursor-wait opacity-80',
                  )}
                >
                  {buyNowPending ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Buy Now
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleWishlist}
                  aria-label={
                    inWishlist ? 'Remove from wishlist' : 'Add to wishlist'
                  }
                  disabled={wishlistPending}
                  className={cn(
                    'grid h-12 w-12 place-items-center rounded-full border transition-all',
                    inWishlist
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : 'border-[#E2D9CE] bg-white text-stone-500 hover:bg-[#F3EEE7]',
                    wishlistPending && 'cursor-wait opacity-60',
                  )}
                >
                  <Heart
                    size={16}
                    className={cn(inWishlist && 'fill-red-500 text-red-500')}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share product"
                  className="grid h-12 w-12 place-items-center rounded-full border border-[#E2D9CE] bg-white text-stone-500 transition hover:bg-[#F3EEE7]"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: <Truck size={18} />,
                  title: 'Free Delivery',
                  sub: 'above ₹499',
                },
                {
                  icon: <ShieldCheck size={18} />,
                  title: 'Secure',
                  sub: 'Payment',
                },
                {
                  icon: <RotateCcw size={18} />,
                  title: 'Easy',
                  sub: 'Returns',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-[#E2D9CE] bg-white/70 p-4 text-center shadow-[0_10px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm"
                >
                  <span className="text-[#2D7A4F]">{item.icon}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1E3A2F]">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-stone-500">{item.sub}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#E2D9CE] bg-white/70 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm">
              <div className="flex items-start gap-3">
                {storeData.logo ? (
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#E2D9CE] bg-[#F3EEE7]">
                    <Image
                      src={getImageSrc(storeData.logo)}
                      alt={storeData.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#E2D9CE] bg-[#F3EEE7] text-[#2D7A4F]">
                    <Leaf size={18} />
                  </div>
                )}

                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-[#1E3A2F]">
                    {storeData.name}
                  </p>

                  {storeData.address && (
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-stone-500">
                      <MapPin size={12} className="mt-[1px] shrink-0" />
                      <span className="whitespace-pre-line">
                        {storeData.address}
                      </span>
                    </p>
                  )}

                  {storeData.phone && telHref && (
                    <a
                      href={`tel:${telHref}`}
                      className="mt-1 inline-flex text-xs text-stone-500 transition hover:text-[#2D7A4F]"
                    >
                      Contact: {storeData.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#E2D9CE] pt-4 text-xs text-stone-400">
              {product.sku && (
                <span className="font-mono">
                  SKU: <strong className="text-stone-500">{product.sku}</strong>
                </span>
              )}
              <span>
                Category:{' '}
                <strong className="text-stone-500">
                  {product.categoryName || '—'}
                </strong>
              </span>
              <span>
                Brand:{' '}
                <strong className="font-serif text-stone-500">
                  {storeData.name}
                </strong>
              </span>
            </div>
          </section>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E2D9CE] bg-[rgba(250,247,242,0.96)] px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-2xl border border-[#E2D9CE] bg-white">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center text-[#1E3A2F] transition hover:bg-[#F3EEE7] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="grid h-11 w-12 place-items-center border-x border-[#E2D9CE] bg-white text-sm font-semibold text-[#1E3A2F]">
              {qty}
            </span>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center text-[#1E3A2F] transition hover:bg-[#F3EEE7] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setQty((q) => Math.min(stock, q + 1))}
              disabled={!canIncreaseQty}
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || addToCart.isPending}
            className={cn(
              'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-all',
              isOutOfStock
                ? 'cursor-not-allowed bg-stone-200 text-stone-400'
                : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-900 text-white hover:bg-neutral-700',
              addToCart.isPending && 'cursor-wait opacity-75',
            )}
          >
            {addToCart.isPending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Adding…
              </>
            ) : added ? (
              <>
                <Check size={15} strokeWidth={2.5} />
                Added
              </>
            ) : (
              <>
                <ShoppingCart size={15} />
                Add
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock || buyNowPending || addToCart.isPending}
            className={cn(
              'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-all',
              isOutOfStock
                ? 'cursor-not-allowed bg-stone-300'
                : 'bg-[#C8882A] hover:bg-[#b57724]',
              (buyNowPending || addToCart.isPending) &&
                'cursor-wait opacity-80',
            )}
          >
            {buyNowPending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Zap size={14} />
                Buy Now
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            disabled={wishlistPending}
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-all',
              inWishlist
                ? 'border-red-200 bg-red-50 text-red-500'
                : 'border-[#E2D9CE] bg-white text-stone-500 hover:bg-[#F3EEE7]',
              wishlistPending && 'cursor-wait opacity-60',
            )}
          >
            <Heart
              size={15}
              className={cn(inWishlist && 'fill-red-500 text-red-500')}
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#E2D9CE] bg-white text-stone-500"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
