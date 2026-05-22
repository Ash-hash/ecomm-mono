'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { formatCurrency } from '@/src/lib/utils';
import { useAddToCart, useWishlist, useToggleWishlist } from '@/src/hooks';
import { useCart } from '@/src/hooks';
import { Product } from '@repo/types';
import { getImageUrl } from '@/src/utils/image';

interface Props {
  product: Product;
  onCartOpen?: () => void;
}

export default function ProductCard({ product, onCartOpen }: Props) {
  const [added, setAdded] = useState(false);

  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  const { isInWishlist } = useWishlist();
  const { toggle, isPending: wishlistPending } = useToggleWishlist();

  const qtyInCart = cart?.items.find((i) => i.productId === product._id)?.quantity ?? 0;
  const inWishlist = isInWishlist(product._id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const primaryImage = product.main_image
    ? getImageUrl(product.main_image) : '/placeholder.jpg';
  const hoverImage = product.images?.[1]
    ? getImageUrl(product.images[1]) : primaryImage;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock || addToCart.isPending) return;
    addToCart.mutate(
      {
        productId: product._id,
        quantity: 1,
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          main_image: product.main_image ?? '',
          slug: product.slug,
          stock: product.stock,
        },
      },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
          onCartOpen?.();
        },
      },
    );
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (wishlistPending) return;
    toggle(product);
  }

  return (
    <article className="group relative bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-neutral-300 transition-all duration-300">
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        <Link href={`/products/${product.slug}`} tabIndex={-1} aria-label={product.name}>
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition duration-500',
              hoverImage !== primaryImage && 'group-hover:opacity-0',
              isOutOfStock && 'opacity-60',
            )}
          />
          {hoverImage !== primaryImage && (
            <Image
              src={hoverImage}
              alt={product.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <span className="bg-white/90 text-neutral-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-neutral-200 shadow">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badges — qty in cart takes priority over discount */}
        {qtyInCart > 0 ? (
          <span className="absolute top-3 left-3 bg-neutral-900 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow">
            {qtyInCart} in cart
          </span>
        ) : discount > 0 && !isOutOfStock ? (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow">
            -{discount}%
          </span>
        ) : null}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          disabled={wishlistPending}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full shadow-md border transition-all duration-200',
            'hover:scale-110 active:scale-95 disabled:opacity-50',
            inWishlist
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-neutral-200 hover:border-red-200 hover:bg-red-50',
          )}
        >
          <Heart
            size={15}
            className={cn(
              'transition-all duration-200',
              inWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-500',
            )}
          />
        </button>

        {/* Desktop hover add-to-cart */}
        {!isOutOfStock && (
          <div className="hidden md:block absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3">
            <button
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all duration-200',
                added ? 'bg-green-500 text-white'
                  : 'bg-neutral-900 text-white hover:bg-neutral-700',
                addToCart.isPending && 'opacity-70 cursor-wait',
              )}
            >
              {added ? (
                <><Check size={15} strokeWidth={2.5} />Added to Cart</>
              ) : addToCart.isPending ? (
                <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Adding…</>
              ) : (
                <><ShoppingCart size={15} />Add to Cart</>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1.5">
        {product.categoryName && (
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-medium">
            {product.categoryName}
          </p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-semibold text-neutral-900 hover:text-neutral-600 transition line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11} className={i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'} />
          ))}
          <span className="text-[11px] text-neutral-400">(4.5)</span>
        </div>
        {isLowStock && (
          <p className="text-[11px] font-medium text-orange-500">Only {product.stock} left!</p>
        )}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-base font-bold text-neutral-900">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs line-through text-neutral-400">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Mobile add-to-cart */}
        <button
          onClick={handleAddToCart}
          disabled={addToCart.isPending || isOutOfStock}
          className={cn(
            'md:hidden mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            isOutOfStock ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : added ? 'bg-green-500 text-white'
              : 'bg-neutral-900 text-white hover:bg-neutral-700',
            addToCart.isPending && 'opacity-70 cursor-wait',
          )}
        >
          {isOutOfStock ? 'Out of Stock' : added ? (
            <><Check size={14} strokeWidth={2.5} />Added!</>
          ) : (
            <><ShoppingCart size={14} />Add to Cart</>
          )}
        </button>
      </div>
    </article>
  );
}
