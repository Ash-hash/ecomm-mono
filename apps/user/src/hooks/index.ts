/* eslint-disable @typescript-eslint/no-explicit-any */
// ─── hooks/index.ts ───────────────────────────────────────────────────────────
// Single barrel — import everything from '@/hooks'
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { api } from '@repo/api-client';
import {
  guestAddToCart,
  guestUpdateQty,
  guestRemoveFromCart,
  guestSelectItems,
  guestToggleSelectAll,
  clearGuestCart,
  guestToggleWishlist,
  type GuestCartItem,
  applyGuestCoupon,
  removeGuestCoupon,
  clearGuestWishlist,
} from '@/src/store/commerceSlice';
import type {
  Address,
  AddressCreateDto,
  AddressUpdateDto,
  CartItem,
  CartResponse,
  CartSelectedSummary,
  Category,
  CheckoutSummary,
  CheckoutSummaryDto,
  CustomerProfile,
  GuestCartItemSyncDto,
  Order,
  PaginatedResponse,
  Payment,
  PlaceOrderDto,
  PlaceOrderResponse,
  Product,
  SelectCartItemsDto,
  StoreConfig,
  Subscription,
  UserPlan,
  VerifyPaymentDto,
  VerifyPaymentResponse,
} from '@repo/types';
import { checkAuth, isAuthed, subscribeAuthChange } from '@repo/auth';
import { QK } from '../../../../packages/shared/queryKeys';

function useAuthedQueryEnabled() {
  const [enabled, setEnabled] = useState(() => isAuthed());

  useEffect(() => {
    let mounted = true;

    checkAuth().then((ok) => {
      if (mounted) setEnabled(ok);
    });

    const unsubscribe = subscribeAuthChange(() => {
      setEnabled(isAuthed());
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return enabled;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types — Offers & Plans (frontend-only, mirror backend exactly)
// ─────────────────────────────────────────────────────────────────────────────

export type OfferType = 'percentage' | 'fixed' | 'free_shipping' | 'bxgy';
export type OfferStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

/** Returned by GET /offers/public — no usage/admin data */
export interface PublicOffer {
  _id: string;
  title: string;
  description: string;
  code: string;
  type: OfferType;
  value: number;
  maxDiscountAmount: number;
  minOrderValue: number;
  bannerImage?: string | null;
  expiresAt?: string | null;
  bxgyConfig?: {
    buyQuantity: number;
    getQuantity: number;
    getDiscountPct: number;
  } | null;
}

/** Returned by POST /offers/apply */
export interface CouponValidationResult {
  valid: boolean;
  offerId: string;
  code: string;
  type: OfferType;
  discountAmount: number;
  discountPct?: number;
  freeShipping: boolean;
  title: string;
  description: string;
  message: string;
}

/** Single plan from GET /subscriptions/plans */
export interface PlanDetail {
  key: UserPlan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  color: string;
  popular: boolean;
  features: string[];
  pricing: {
    monthly: number;
    annual: number;
    annualSavingPct: number;
    annualMonthlyEq: number;
  };
  limits: {
    freeShipping: boolean;
    expressShipping: boolean;
    memberPricing: boolean;
    prioritySupport: boolean;
    bulkDiscounts: boolean;
    apiAccess: boolean;
  };
}

/** Returned by GET /customer/subscription/compare */
export interface PlanComparison {
  currentPlan: UserPlan;
  plans: (PlanDetail & {
    isCurrent: boolean;
    isUpgrade: boolean;
    isDowngrade: boolean;
  })[];
}

/** Input for POST /offers/apply */
export interface ApplyCouponInput {
  code: string;
  cartSubtotal: number;
  productIds?: string[];
  categoryIds?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────────────────────





// ═══════════════════════════════════════════════════════════════════════════════
// CATALOG  (public)
// ═══════════════════════════════════════════════════════════════════════════════

export const useStoreInfo = () =>
  useQuery<StoreConfig>({
    queryKey: QK.catalog.store,
    queryFn: async () => {
      const res = await api.get<{ data: StoreConfig }>('/catalog/store');
      return (res as any).data ?? res;
    },
    staleTime: 5 * 60_000,
  });

export function useProducts(params?: Record<string, unknown>) {
  return useQuery<PaginatedResponse<Product>>({
    queryKey: QK.catalog.products(params),
    queryFn: () =>
      api.get<PaginatedResponse<Product>>('/catalog/products', params as any),
  });
}

export function useProductById(id: string) {
  return useQuery<Product>({
    queryKey: ['productById', id],
    queryFn: () => api.get<Product>(`/catalog/products/${id}`),
    enabled: !!id,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery<Product[]>({
    queryKey: QK.catalog.featured(limit),
    queryFn: () =>
      api.get<Product[]>('/catalog/products/featured', { limit }),
    staleTime: 2 * 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: QK.catalog.product(slug),
    queryFn: () =>
      api.get<Product>(`/catalog/products/${encodeURIComponent(slug)}`),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: QK.catalog.categories,

    queryFn: async () => {
      const res = await api.get<Category[]>(
        '/catalog/categories'
      );

      return res ?? [];
    },

    staleTime: 5 * 60_000,
  });
}



export function useQuickSearch(q: string) {
  return useQuery<Product[]>({
    queryKey: QK.catalog.search(q),
    queryFn: () =>
      api.get<Product[]>('/catalog/products/search', { q }),
    enabled: q.length > 2,
  });
}



// ═══════════════════════════════════════════════════════════════════════════════
// OFFERS  (public + customer)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /offers/public
 * All active public offers — no auth required.
 * Used by offers page, homepage banners, and checkout coupon strip.
 */
export function usePublicOffers() {
  return useQuery<PublicOffer[]>({
    queryKey: QK.offers.public,
    queryFn: async () => {
      const res = await api.get<{ data: PublicOffer[] }>('/offers/public');
      return (res as any)?.data ?? (res as any) ?? [];
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * POST /offers/apply
 * Validates a coupon code without redeeming it.
 * Returns { discountAmount, freeShipping, message } for the UI.
 * Actual redemption is recorded server-side after payment confirmation.
 */
export function useApplyCoupon() {
  return useMutation<CouponValidationResult, Error, ApplyCouponInput>({
    mutationFn: (input) =>
      api.post<CouponValidationResult>('/offers/apply', input),
  });
}

/**
 * Stateful coupon field — wraps useApplyCoupon with local code + result state.
 * Drop this into any component that needs a coupon input + apply button.
 *
 * @example
 *   const coupon = useCouponField(cart.selectedSummary.subtotal);
 *   <input value={coupon.code} onChange={e => coupon.setCode(e.target.value)} />
 *   <button onClick={coupon.handleApply}>Apply</button>
 *   {coupon.isApplied && <p>{coupon.message}</p>}
 *   {coupon.error && <p className="text-red-500">{coupon.error}</p>}
 *   // use coupon.discountAmount and coupon.freeShipping in the order total
 */
export function useAuthedCouponField(
  cartSubtotal: number,
  options?: { productIds?: string[]; categoryIds?: string[] },
) {
  const [code, setCodeRaw] = useState('');
  const [result, setResult] = useState<CouponValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useApplyCoupon();

  const setCode = useCallback(
    (v: string) => {
      setCodeRaw(v.toUpperCase());
      if (result || error) {
        setResult(null);
        setError(null);
      }
    },
    [result, error],
  );

  const handleApply = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setResult(null);
    try {
      const res = await mutation.mutateAsync({
        code: trimmed,
        cartSubtotal,
        productIds: options?.productIds,
        categoryIds: options?.categoryIds,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message ?? 'Invalid coupon code');
    }
  }, [code, cartSubtotal, mutation, options]);

  const handleRemove = useCallback(() => {
    setCodeRaw('');
    setResult(null);
    setError(null);
  }, []);

  return {
    /** Current code string (always uppercase) */
    code,
    setCode,
    handleApply,
    handleRemove,
    isPending: mutation.isPending,
    /** true once a valid coupon has been applied */
    isApplied: !!result,
    result,
    error,
    /** INR amount to subtract from order total */
    discountAmount: result?.discountAmount ?? 0,
    /** true when the coupon grants free shipping */
    freeShipping: result?.freeShipping ?? false,
    /** Human-readable summary e.g. "20% off applied" */
    message: result?.message ?? '',
    hasUserRestrictions: false as const,
  };
}

export function useGuestCouponField(cartSubtotal: number) {
  const dispatch = useAppDispatch();
  const stored = useAppSelector((s) => s.commerce.guestCoupon);
  const [code, setCodeRaw] = useState(stored?.code ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const setCode = useCallback((v: string) => {
    setCodeRaw(v.toUpperCase());
    setError(null);
  }, []);

  const handleApply = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setPending(true);
    try {
      // Hits GET /offers/validate — no auth required
      const res = await api.get<{
        valid: boolean;
        guestPreview: boolean;
        code: string;
        type: string;
        discountAmount: number;
        freeShipping: boolean;
        message: string;
        hasUserRestrictions: boolean;
      }>('/offers/validate', { code: trimmed, subtotal: cartSubtotal });

      dispatch(
        applyGuestCoupon({
          code: res.code,
          type: res.type,
          discountAmount: res.discountAmount,
          freeShipping: res.freeShipping,
          message: res.message,
          hasUserRestrictions: res.hasUserRestrictions,
        }),
      );
    } catch (err: any) {
      setError(err?.message ?? 'Invalid coupon code');
      dispatch(removeGuestCoupon());
    } finally {
      setPending(false);
    }
  }, [code, cartSubtotal, dispatch]);

  const handleRemove = useCallback(() => {
    setCodeRaw('');
    setError(null);
    dispatch(removeGuestCoupon());
  }, [dispatch]);

  return {
    code,
    setCode,
    handleApply,
    handleRemove,
    isPending: pending,
    isApplied: !!stored,
    result: stored,
    error,
    discountAmount: stored?.discountAmount ?? 0,
    freeShipping: stored?.freeShipping ?? false,
    message: stored?.message ?? '',
    hasUserRestrictions: stored?.hasUserRestrictions ?? false,
  };
}

export function useCouponField(cartSubtotal: number) {
  const authed = isAuthed();
  const guestCoupon = useGuestCouponField(cartSubtotal);
  const authedCoupon = useAuthedCouponField(cartSubtotal); // existing useCouponField logic

  return authed ? authedCoupon : guestCoupon;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLAN CATALOGUE  (public)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /subscriptions/plans
 * Full plan catalogue with pricing for both billing cycles.
 * No auth required — used by pricing page, homepage CTA, upgrade modals.
 */
export function useSubscriptionPlans(billingCycle?: 'monthly' | 'annual') {
  return useQuery<PlanDetail[]>({
    queryKey: QK.subscriptions.plans(billingCycle),
    queryFn: async () => {
      const params = billingCycle ? { billingCycle } : {};
      const res = await api.get<{ data: PlanDetail[] }>(
        '/subscriptions/plans',
        params as any,
      );
      return (res as any)?.data ?? (res as any) ?? [];
    },
    staleTime: 10 * 60_000,
  });
}

/**
 * GET /subscriptions/plans/:key
 * Single plan detail — used by upgrade confirmation modals.
 */
export function useSubscriptionPlan(key: UserPlan | '') {
  return useQuery<PlanDetail>({
    queryKey: QK.subscriptions.plan(key),
    queryFn: () => api.get<PlanDetail>(`/subscriptions/plans/${key}`),
    enabled: !!key,
    staleTime: 10 * 60_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export function useCustomerProfile() {
  const enabled = useAuthedQueryEnabled();

  return useQuery<CustomerProfile>({
    queryKey: QK.customer.profile,
    queryFn: () => api.get<CustomerProfile>('/customer/profile'),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { name?: string; email?: string; avatarUrl?: string }
  >({
    mutationFn: (data) =>
      api.patch('/customer/profile', data, { successMsg: 'Profile updated!' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.profile }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

export function useCustomerOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const enabled = useAuthedQueryEnabled();

  return useQuery<PaginatedResponse<Order>>({
    queryKey: QK.customer.orders(params),
    queryFn: () => api.get<PaginatedResponse<Order>>('/customer/orders', params as any),
    enabled,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation<PlaceOrderResponse, Error, PlaceOrderDto>({
    mutationFn: (dto) => api.post<PlaceOrderResponse>('/customer/orders', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.orders() }),
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation<VerifyPaymentResponse, Error, VerifyPaymentDto>({
    mutationFn: (dto) =>
      api.post<VerifyPaymentResponse>('/payments/verify', dto, {
        skipAuth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.cart });
      qc.invalidateQueries({ queryKey: QK.customer.orders() });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export function useCustomerPayments(params?: {
  page?: number;
  limit?: number;
}) {
  const enabled = useAuthedQueryEnabled();

  return useQuery<PaginatedResponse<Payment>>({
    queryKey: QK.customer.payments(params),
    queryFn: () =>
      api.get<PaginatedResponse<Payment>>('/customer/payments', params as any),
    enabled,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS  (customer self-service)
// ═══════════════════════════════════════════════════════════════════════════════

export function useActiveSubscription() {
  const enabled = useAuthedQueryEnabled();

  return useQuery<Subscription | null>({
    queryKey: QK.customer.subscription,
    queryFn: async () => {
      try {
        const res = await api.get<{ data: Subscription }>(
          '/customer/subscription',
        );
        return (res as any)?.data ?? res ?? null;
      } catch {
        return null;
      }
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useSubscriptionHistory() {
  const enabled = useAuthedQueryEnabled();

  return useQuery<Subscription[]>({
    queryKey: QK.customer.subHistory,
    queryFn: async () => {
      const res = await api.get<{ data: Subscription[] }>(
        '/customer/subscription/history',
      );
      return (res as any)?.data ?? (res as any) ?? [];
    },
    enabled,
  });
}

/**
 * GET /customer/subscription/compare
 * All plans annotated with isCurrent / isUpgrade / isDowngrade.
 * Powers the upgrade modal — no need to hardcode plan order on the frontend.
 */
export function useComparePlans() {
  const enabled = useAuthedQueryEnabled();

  return useQuery<PlanComparison>({
    queryKey: QK.customer.subCompare,
    queryFn: async () => {
      const res = await api.get<{ data: PlanComparison }>(
        '/customer/subscription/compare',
      );
      return (res as any)?.data ?? res;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useUpgradeSubscription() {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { plan: string; billingCycle: 'monthly' | 'annual'; gateway?: string }
  >({
    mutationFn: (data) =>
      api.post('/customer/subscription/upgrade', data, {
        successMsg: 'Plan upgraded!',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.subscription });
      qc.invalidateQueries({ queryKey: QK.customer.subCompare });
      qc.invalidateQueries({ queryKey: QK.customer.profile });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, void>({
    mutationFn: () =>
      api.delete('/customer/subscription', {
        successMsg: 'Subscription will cancel at period end.',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.subscription });
      qc.invalidateQueries({ queryKey: QK.customer.subCompare });
    },
  });
}

/**
 * POST /customer/subscription/reactivate
 * Undo a scheduled cancellation — only works before period end.
 */
export function useReactivateSubscription() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, void>({
    mutationFn: () =>
      api.post(
        '/customer/subscription/reactivate',
        {},
        {
          successMsg: 'Subscription reactivated!',
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.subscription });
      qc.invalidateQueries({ queryKey: QK.customer.subCompare });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════════════════════════

function useServerCart() {
  const isLoggedIn = isAuthed();
  return useQuery({
    queryKey: QK.customer.cart,
    queryFn: () => api.get<CartResponse>('/customer/cart'),
    enabled: isLoggedIn,
    retry: false,
    staleTime: 0, // 👈 CRITICAL
    refetchOnMount: true, // 👈 CRITICAL
  });
}

function guestItemsToCartResponse(guestCart: GuestCartItem[]): CartResponse {
  const items: CartItem[] = guestCart.map((i) => ({
    productId: i.productId,
    product: i.product as any,
    quantity: i.quantity,
    priceSnapshot: i.priceSnapshot,
    livePrice: i.product.price,
    lineTotal: +(i.quantity * i.product.price).toFixed(2),
    selected: i.selected,
    priceChanged: false,
    priceDelta: 0,
    inStock: i.product.stock >= i.quantity,
    stockAvailable: i.product.stock,
    stockWarning: i.product.stock <= 5,
  }));

  const selectedItems = items.filter((i) => i.selected);
  const calcTotals = (subset: CartItem[]) => {
    const subtotal = +subset.reduce((s, i) => s + i.lineTotal, 0).toFixed(2);
    const tax = +(subtotal * 0.18).toFixed(2);
    const shipping = subtotal > 0 && subtotal < 999 ? 99 : 0;
    const total = +(subtotal + tax + shipping).toFixed(2);
    return { subtotal, tax, shipping, total };
  };

  const allTotals = calcTotals(items);
  const selTotals = calcTotals(selectedItems);
  const selectedSummary: CartSelectedSummary = {
    itemCount: selectedItems.reduce((s, i) => s + i.quantity, 0),
    ...selTotals,
    freeShippingEligible: selTotals.subtotal >= 999,
    freeShippingRemainingAmount:
      selTotals.subtotal < 999 ? +(999 - selTotals.subtotal).toFixed(2) : 0,
  };

  return {
    cartId: 'guest',
    items,
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    updatedAt: new Date().toISOString(),
    ...allTotals,
    selectedSummary,
    hasStockIssues: items.some((i) => !i.inStock),
    hasPriceChanges: false,
  };
}

export function useCart() {
  const authed = isAuthed();
  const serverCart = useServerCart();
  const guestCart = useAppSelector((s) => s.commerce.guestCart);
  const guestCartResponse = useMemo(
    () => guestItemsToCartResponse(guestCart),
    [guestCart],
  );
  if (authed) return serverCart;
  return { data: guestCartResponse, isLoading: false, isError: false };
}

export function useAddToCart() {
  const authed = isAuthed();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  const serverMutation = useMutation<
    CartResponse,
    Error,
    { productId: string; quantity: number }
  >({
    mutationFn: (data) => api.post<CartResponse>('/customer/cart/items', data),
    onSuccess: () => {qc.invalidateQueries({ queryKey: QK.customer.cart });qc.refetchQueries({ queryKey: QK.customer.cart });},
  });

  function mutate(
    data: {
      productId: string;
      quantity: number;
      product?: GuestCartItem['product'];
    },
    callbacks?: { onSuccess?: () => void; onError?: (err: Error) => void },
  ) {
    if (authed) {
      serverMutation.mutate(
        { productId: data.productId, quantity: data.quantity },
        callbacks,
      );
    } else {
      if (!data.product) {
        console.warn('[useAddToCart] `product` is required for guest cart');
        return;
      }
      dispatch(
        guestAddToCart({
          productId: data.productId,
          quantity: data.quantity,
          priceSnapshot: data.product.price,
          selected: true,
          product: data.product,
        }),
      );
      callbacks?.onSuccess?.();
    }
  }

  return { mutate, isPending: serverMutation.isPending };
}

export function useUpdateQty() {
  const authed = isAuthed();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  const serverMutation = useMutation<
    CartResponse,
    Error,
    { productId: string; quantity: number }
  >({
    mutationFn: ({ productId, quantity }) =>
      api.patch<CartResponse>(`/customer/cart/items/${productId}`, {
        quantity,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.cart }),
  });

  function mutate(
    data: { productId: string; quantity: number },
    callbacks?: { onSuccess?: () => void },
  ) {
    if (authed) serverMutation.mutate(data, callbacks);
    else {
      dispatch(guestUpdateQty(data));
      callbacks?.onSuccess?.();
    }
  }

  return { mutate, isPending: serverMutation.isPending };
}

export function useRemoveFromCart() {
  const authed = isAuthed();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  const serverMutation = useMutation<CartResponse, Error, string>({
    mutationFn: (productId) =>
      api.delete<CartResponse>(`/customer/cart/items/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.cart }),
  });

  function mutate(productId: string, callbacks?: { onSuccess?: () => void }) {
    if (authed) serverMutation.mutate(productId, callbacks);
    else {
      dispatch(guestRemoveFromCart(productId));
      callbacks?.onSuccess?.();
    }
  }

  return { mutate, isPending: serverMutation.isPending };
}

export function useSelectCartItems() {
  const authed = isAuthed();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  const serverMutation = useMutation<CartResponse, Error, SelectCartItemsDto>({
    mutationFn: (dto) =>
      api.patch<CartResponse>('/customer/cart/items/selection', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.cart }),
  });

  function mutate(
    dto: SelectCartItemsDto,
    callbacks?: { onSuccess?: () => void },
  ) {
    if (authed) serverMutation.mutate(dto, callbacks);
    else {
      dispatch(guestSelectItems(dto));
      callbacks?.onSuccess?.();
    }
  }

  return { mutate, isPending: serverMutation.isPending };
}

export function useToggleSelectAll() {
  const authed = isAuthed();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  const selectAllMutation = useMutation<CartResponse, Error, void>({
    mutationFn: () => api.patch<CartResponse>('/customer/cart/select-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.cart }),
  });

  const deselectAllMutation = useMutation<CartResponse, Error, void>({
    mutationFn: () => api.patch<CartResponse>('/customer/cart/deselect-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.cart }),
  });

  function selectAll(callbacks?: { onSuccess?: () => void }) {
    if (authed) selectAllMutation.mutate(undefined, callbacks);
    else {
      dispatch(guestToggleSelectAll(true));
      callbacks?.onSuccess?.();
    }
  }

  function deselectAll(callbacks?: { onSuccess?: () => void }) {
    if (authed) deselectAllMutation.mutate(undefined, callbacks);
    else {
      dispatch(guestToggleSelectAll(false));
      callbacks?.onSuccess?.();
    }
  }

  return {
    selectAll,
    deselectAll,
    isPending: selectAllMutation.isPending || deselectAllMutation.isPending,
  };
}

export function useCheckoutSummary() {
  return useMutation<CheckoutSummary, Error, CheckoutSummaryDto>({
    mutationFn: (dto) =>
      api.post<CheckoutSummary>('/customer/cart/checkout-summary', dto),
  });
}

export function useSyncGuestCart() {
  const qc = useQueryClient();
  return useMutation<CartResponse, Error, { items: GuestCartItemSyncDto[] }>({
    mutationFn: (body) => api.post<CartResponse>('/customer/cart/sync', body),
    onSuccess: (data) => qc.setQueryData(QK.customer.cart, data),
  });
}

export async function syncOnLogin(store: any) {
  const { guestCart, guestWishlist } = store.getState().commerce;
  try {
    if (guestCart.length > 0) {
      await api.patch('/customer/cart/deselect-all');

      await api.post('/customer/cart/sync', {
        items: guestCart.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          selected: true,
        })),
      });
    }
  } catch (err) {
    console.warn('Cart sync failed:', err);
  }

  try {
    if (guestWishlist.length > 0) {
      await api.post('/customer/wishlist/sync', {
        productIds: guestWishlist.map((p: any) => p._id),
      });
    }
  } catch (err) {
    console.warn('Wishlist sync failed:', err);
  }

  store.dispatch(clearGuestCart());
  store.dispatch(clearGuestWishlist());
}

export function useClearCart() {
  const authed = isAuthed();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  const serverMutation = useMutation<{ message: string }, Error, void>({
    mutationFn: () => api.delete('/customer/cart'),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.cart }),
  });

  function mutate(callbacks?: { onSuccess?: () => void }) {
    if (authed) serverMutation.mutate(undefined, callbacks);
    else {
      dispatch(clearGuestCart());
      callbacks?.onSuccess?.();
    }
  }

  return { mutate, isPending: serverMutation.isPending };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WISHLIST
// ═══════════════════════════════════════════════════════════════════════════════

function useServerWishlist() {
  const isLoggedIn = isAuthed();
  return useQuery({
    queryKey: QK.customer.wishlist,
    queryFn: async () => {
      const res = await api.get<{ data: Product[] }>('/customer/wishlist');
      return (res as any)?.data ?? [];
    },
    enabled: isLoggedIn,
    staleTime: 3 * 60_000,
  });
}

export function useWishlist() {
  const authed = isAuthed();
  const serverWishlist = useServerWishlist();
  const guestWishlist = useAppSelector((s) => s.commerce.guestWishlist);

  const wishlist: Product[] = authed
    ? ((serverWishlist.data as unknown as Product[]) ?? [])
    : guestWishlist;

  const isInWishlist = (productId: string) =>
    wishlist.some((p) => p._id === productId);

  return {
    wishlist,
    isInWishlist,
    isLoading: authed ? serverWishlist.isLoading : false,
  };
}

export function useToggleWishlist() {
  const authed = isAuthed();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const { isInWishlist } = useWishlist();

  const addMutation = useMutation<unknown, Error, string>({
    mutationFn: (productId) =>
      api.post('/customer/wishlist/items', { productId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.wishlist }),
  });

  const removeMutation = useMutation<unknown, Error, string>({
    mutationFn: (productId) =>
      api.delete(`/customer/wishlist/items/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.wishlist }),
  });

  function toggle(product: Product) {
    if (authed) {
      if (isInWishlist(product._id)) removeMutation.mutate(product._id);
      else addMutation.mutate(product._id);
    } else {
      dispatch(guestToggleWishlist(product));
    }
  }

  return {
    toggle,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}

export function useSyncWishlist() {
  const qc = useQueryClient();
  return useMutation<{ synced: number }, Error, { productIds: string[] }>({
    mutationFn: (body) => api.post('/customer/wishlist/sync', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customer.wishlist }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADDRESSES
// ═══════════════════════════════════════════════════════════════════════════════

export function useAddresses() {
  const enabled = useAuthedQueryEnabled();

  return useQuery<Address[]>({
    queryKey: QK.customer.addresses,
    queryFn: async () => {
      const res = await api.get<{ data: Address[] }>('/customer/addresses');
      return (res as any)?.data ?? [];
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation<
    { message: string; data: Address },
    Error,
    AddressCreateDto
  >({
    mutationFn: (dto) => api.post('/customer/addresses', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.addresses });
      qc.invalidateQueries({ queryKey: QK.customer.profile });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation<
    { message: string; data: Address },
    Error,
    { id: string; dto: AddressUpdateDto }
  >({
    mutationFn: ({ id, dto }) => api.patch(`/customer/addresses/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.addresses });
      qc.invalidateQueries({ queryKey: QK.customer.profile });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.delete(`/customer/addresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.addresses });
      qc.invalidateQueries({ queryKey: QK.customer.profile });
    },
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation<{ message: string; data: Address }, Error, string>({
    mutationFn: (id) => api.patch(`/customer/addresses/${id}/default`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.customer.addresses });
      qc.invalidateQueries({ queryKey: QK.customer.profile });
    },
  });
}

// In hooks/index.ts
