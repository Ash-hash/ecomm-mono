'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Heart, ShoppingCart, Trash2, Package, HeartOff } from 'lucide-react';
import { useWishlist, useToggleWishlist, useAddToCart } from '@/src/hooks';
import { formatCurrency } from '@/src/lib/utils';
import { Product } from '@repo/types';
import { getImageUrl } from '@/src/utils/image';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

export default function WishlistDrawer({ open, onClose, onOpenCart }: Props) {
  const { wishlist } = useWishlist();
  const { toggle } = useToggleWishlist();
  const addToCart = useAddToCart();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  function handleAddToCart(product: Product) {
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
      { onSuccess: () => onOpenCart?.() },
    );
  }

  function handleAddAllToCart() {
    wishlist.forEach((p) => handleAddToCart(p));
    onOpenCart?.();
    onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl
          flex flex-col transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <Heart size={20} className="text-rose-500 fill-rose-500" />
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Wishlist</h2>
            {wishlist.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-rose-500 text-white rounded-full">
                {wishlist.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition text-neutral-500"
            aria-label="Close wishlist"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {wishlist.length === 0 ? (
            <EmptyWishlist onClose={onClose} />
          ) : (
            <ul className="divide-y divide-neutral-100 px-6">
              {wishlist.map((product) => (
                <WishlistItemRow
                  key={product._id}
                  product={product}
                  onToggle={() => toggle(product)}
                  onAddToCart={() => handleAddToCart(product)}
                  isAddingToCart={addToCart.isPending}
                />
              ))}
            </ul>
          )}
        </div>

        {wishlist.length > 0 && (
          <div className="border-t border-neutral-100 px-6 py-5 bg-white space-y-3">
            <button
              onClick={handleAddAllToCart}
              disabled={addToCart.isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700
                transition-colors disabled:opacity-60"
            >
              <ShoppingCart size={16} />
              Add All to Cart
            </button>
            <button
              onClick={onClose}
              className="w-full text-sm text-neutral-500 hover:text-neutral-800 transition-colors text-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function WishlistItemRow({
  product, onToggle, onAddToCart, isAddingToCart,
}: {
  product: Product;
  onToggle: () => void;
  onAddToCart: () => void;
  isAddingToCart: boolean;
}) {
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/products/${product.slug}`}
        className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 group"
      >
        {product.main_image ? (
          <Image
            src={getImageUrl(product.main_image)}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="96px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package size={24} className="text-neutral-400" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-medium text-neutral-900 hover:opacity-70 line-clamp-2 block mb-1"
          >
            {product.name}
          </Link>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs line-through text-neutral-400">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
          {product.stock === 0 && (
            <span className="text-xs text-red-500 font-medium mt-1 block">Out of stock</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onAddToCart}
            disabled={isAddingToCart || product.stock === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
              border border-neutral-200 text-xs font-medium text-neutral-700
              hover:bg-neutral-900 hover:text-white hover:border-neutral-900
              transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={13} />
            {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-400
              hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
            aria-label="Remove from wishlist"
          >
            <HeartOff size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyWishlist({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-5 pb-24">
      <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center">
        <Heart size={32} className="text-rose-300" />
      </div>
      <div>
        <p className="text-base font-semibold text-neutral-900 mb-1">Your wishlist is empty</p>
        <p className="text-sm text-neutral-500">Save items you love and come back anytime.</p>
      </div>
      <button
        onClick={onClose}
        className="px-6 py-3 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors"
      >
        Explore Products
      </button>
    </div>
  );
}
