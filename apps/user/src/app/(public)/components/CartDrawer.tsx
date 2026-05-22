'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import clsx from 'clsx';
import {
  useCart,
  useUpdateQty,
  useRemoveFromCart,
  useSelectCartItems,
  useToggleSelectAll,
} from '@/src/hooks';
import { formatCurrency } from '@/src/lib/utils';
import { CartItem } from '@repo/types';
import { getImageUrl } from '@/src/utils/image';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { data: cart, isLoading } = useCart();
  const updateQty   = useUpdateQty();
  const removeItem  = useRemoveFromCart();
  const selectItems = useSelectCartItems();
  const { selectAll, deselectAll, isPending: isSelectAllPending } = useToggleSelectAll();

  // ── Derived state ─────────────────────────────────────────────────────────

  const items           = cart?.items ?? [];
  const selectedItems   = items.filter((i) => i.selected);
  const selectedSummary = cart?.selectedSummary;
  const totalItems      = cart?.totalItems ?? 0;
  const selectedCount   = selectedSummary?.itemCount ?? 0;
  const allSelected     = items.length > 0 && items.every((i) => i.selected);
  const noneSelected    = selectedCount === 0;
  const isEmpty         = !cart || items.length === 0;
  const hasPriceChanges = cart?.hasPriceChanges ?? false;
  const hasStockIssues  = cart?.hasStockIssues ?? false;

  // ── Keyboard close ────────────────────────────────────────────────────────

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleToggleItem(productId: string, currentSelected: boolean) {
    selectItems.mutate({ productIds: [productId], selected: !currentSelected });
  }

  function handleSelectAll() {
    if (allSelected) deselectAll();
    else selectAll();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={clsx(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-neutral-800" />
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
              Cart
            </h2>
            {!isEmpty && (
              <span className="px-2 py-0.5 text-xs font-medium bg-neutral-900 text-white rounded-full">
                {totalItems}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Select all / deselect all */}
            {!isEmpty && (
              <button
                onClick={handleSelectAll}
                disabled={isSelectAllPending || selectItems.isPending}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50',
                  allSelected
                    ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                )}
              >
                {allSelected ? (
                  <><CheckSquare size={13} /> Deselect all</>
                ) : (
                  <><Square size={13} /> Select all</>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 transition text-neutral-500"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Warnings ───────────────────────────────────────────────────── */}
        {!isEmpty && (hasPriceChanges || hasStockIssues) && (
          <div className="flex-shrink-0 px-4 pt-3 space-y-2">
            {hasPriceChanges && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Prices of some items have changed since you added them to the cart.
                </p>
              </div>
            )}
            {hasStockIssues && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertTriangle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">
                  Some items have insufficient stock. Please update quantities.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Selection counter ──────────────────────────────────────────── */}
        {!isEmpty && totalItems > 0 && (
          <div className="flex-shrink-0 px-6 py-2 bg-neutral-50 border-b border-neutral-100">
            <p className="text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700">{selectedCount}</span>
              {' '}of{' '}
              <span className="font-semibold text-neutral-700">{totalItems}</span>
              {' '}items selected
              {noneSelected && (
                <span className="ml-1 text-amber-600 font-medium">
                  — select items to checkout
                </span>
              )}
            </p>
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <CartSkeleton />
          ) : isEmpty ? (
            <EmptyCart onClose={onClose} />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQty={(qty) =>
                    updateQty.mutate({ productId: item.productId, quantity: qty })
                  }
                  onRemove={() => removeItem.mutate(item.productId)}
                  onToggleSelect={() =>
                    handleToggleItem(item.productId, item.selected)
                  }
                  isUpdating={updateQty.isPending}
                  isRemoving={removeItem.isPending}
                  isSelectPending={selectItems.isPending}
                />
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {!isEmpty && !isLoading && (
          <div className="border-t border-neutral-100 px-6 py-5 space-y-4 bg-white flex-shrink-0">

            {/* Selected totals */}
            {selectedSummary && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>
                    Subtotal
                    <span className="text-xs ml-1 text-neutral-400">
                      ({selectedCount} item{selectedCount !== 1 ? 's' : ''})
                    </span>
                  </span>
                  <span className="text-neutral-700">
                    {formatCurrency(selectedSummary.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-500">
                  <span>GST (18%)</span>
                  <span className="text-neutral-700">
                    {formatCurrency(selectedSummary.tax)}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-500">
                  <span>Shipping</span>
                  <span>
                    {selectedSummary.shipping === 0 ? (
                      <span className="text-green-600 font-medium">
                        {selectedSummary.subtotal > 0 ? 'Free 🎉' : '—'}
                      </span>
                    ) : (
                      <span className="text-neutral-700">
                        {formatCurrency(selectedSummary.shipping)}
                      </span>
                    )}
                  </span>
                </div>

                {/* Free shipping progress */}
                {selectedSummary.freeShippingRemainingAmount > 0 && selectedSummary.subtotal > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg space-y-1.5">
                    <p className="text-xs text-amber-700">
                      Add{' '}
                      <span className="font-semibold">
                        {formatCurrency(selectedSummary.freeShippingRemainingAmount)}
                      </span>{' '}
                      more to get free shipping
                    </p>
                    <div className="h-1 bg-amber-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((selectedSummary.subtotal) / (selectedSummary.subtotal + selectedSummary.freeShippingRemainingAmount)) * 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-neutral-900 text-base pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span>{formatCurrency(selectedSummary.total)}</span>
                </div>
              </div>
            )}

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={onClose}
              aria-disabled={noneSelected}
              className={clsx(
                'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-medium transition-all',
                noneSelected
                  ? 'bg-neutral-200 text-neutral-400 pointer-events-none cursor-not-allowed'
                  : 'bg-neutral-900 text-white hover:bg-neutral-700',
              )}
            >
              {noneSelected ? (
                'Select items to checkout'
              ) : (
                <>
                  Checkout ({selectedCount} item{selectedCount !== 1 ? 's' : ''})
                  <ArrowRight size={16} />
                </>
              )}
            </Link>

            <Link
              href="/products"
              onClick={onClose}
              className="block w-full text-sm text-neutral-500 hover:text-neutral-800 transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CartItemRow
// ─────────────────────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
  onToggleSelect,
  isUpdating,
  isRemoving,
  isSelectPending,
}: {
  item:             CartItem;
  onUpdateQty:      (qty: number) => void;
  onRemove:         () => void;
  onToggleSelect:   () => void;
  isUpdating:       boolean;
  isRemoving:       boolean;
  isSelectPending:  boolean;
}) {
  return (
    <li
      className={clsx(
        'flex gap-3 px-4 py-4 transition-colors',
        item.selected ? 'bg-white' : 'bg-neutral-50/70',
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onToggleSelect}
        disabled={isSelectPending || isRemoving}
        aria-label={item.selected ? 'Deselect item' : 'Select item'}
        className="flex-shrink-0 mt-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-40 transition-colors"
      >
        {item.selected ? (
          <CheckSquare size={18} className="text-neutral-900" />
        ) : (
          <Square size={18} />
        )}
      </button>

      {/* Image */}
      <Link
        href={`/products/${item.product?.slug}`}
        className={clsx(
          'relative h-[72px] w-[72px] shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 transition-opacity',
          !item.selected && 'opacity-50',
        )}
      >
        {item.product?.main_image ? (
          <Image
            src={getImageUrl(item.product.main_image)}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="72px"
          />
        ) : (
          <Package size={22} className="m-auto text-neutral-400" />
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product?.slug}`}
          className={clsx(
            'block text-sm font-medium hover:opacity-70 truncate mb-0.5 transition-opacity',
            item.selected ? 'text-neutral-900' : 'text-neutral-400',
          )}
        >
          {item.product?.name ?? 'Product'}
        </Link>

        {/* Price info */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-neutral-400">
            {formatCurrency(item.livePrice)} each
          </span>
          {item.priceChanged && (
            <span
              className={clsx(
                'flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded',
                item.priceDelta > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-green-50 text-green-600',
              )}
            >
              {item.priceDelta > 0 ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {item.priceDelta > 0 ? '+' : ''}
              {formatCurrency(Math.abs(item.priceDelta))}
            </span>
          )}
        </div>

        {/* Stock warning */}
        {!item.inStock && (
          <p className="text-[10px] text-rose-500 font-medium mb-1.5">
            Only {item.stockAvailable} in stock
          </p>
        )}
        {item.inStock && item.stockWarning && (
          <p className="text-[10px] text-amber-600 font-medium mb-1.5">
            Only {item.stockAvailable} left!
          </p>
        )}

        {/* Qty stepper + remove + line total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 border border-neutral-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                item.quantity > 1 ? onUpdateQty(item.quantity - 1) : onRemove()
              }
              disabled={isUpdating || isRemoving}
              className="p-1.5 hover:bg-neutral-100 transition disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="px-2.5 text-sm font-medium min-w-[1.75rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(item.quantity + 1)}
              disabled={
                isUpdating ||
                isRemoving ||
                item.quantity >= (item.stockAvailable ?? 99)
              }
              className="p-1.5 hover:bg-neutral-100 transition disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={clsx(
                'text-sm font-semibold',
                item.selected ? 'text-neutral-900' : 'text-neutral-400',
              )}
            >
              {formatCurrency(item.lineTotal)}
            </span>
            <button
              onClick={onRemove}
              disabled={isRemoving}
              className="text-neutral-300 hover:text-rose-500 transition disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty + Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-5 pb-24">
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
        <ShoppingBag size={32} className="text-neutral-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-neutral-900 mb-1">
          Your cart is empty
        </p>
        <p className="text-sm text-neutral-500">
          Looks like you haven&apos;t added anything yet.
        </p>
      </div>
      <Link
        href="/products"
        onClick={onClose}
        className="px-6 py-3 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors"
      >
        Start Shopping
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <ul className="px-4 divide-y divide-neutral-100">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex gap-3 py-4 animate-pulse">
          <div className="w-5 h-5 rounded bg-neutral-200 mt-1 flex-shrink-0" />
          <div className="h-[72px] w-[72px] rounded-xl bg-neutral-200 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-neutral-200 rounded w-3/4" />
            <div className="h-3 bg-neutral-200 rounded w-1/4" />
            <div className="h-7 bg-neutral-200 rounded w-1/3 mt-3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
