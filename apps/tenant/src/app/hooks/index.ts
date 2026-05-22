/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { api, fetcher } from '@repo/api-client';

import type {
  Order,
  OrdersParams,
  OrderStatus,
  PaginatedResponse,
  Product,
  ProductsParams,
  Category,
  User,
  UsersParams,
  UserStatus,
  Subscription,
  SubStatus,
  Payment,
  PaymentsParams,
  DashboardStats,
  StoreConfig,
  CategoryRef,
  UserPlan,
  SubscriptionOverview,
  OfferStatus,
  OfferType,
  Offer,
  OfferAnalytics,
  OfferUsage,
  SubsParams,
} from '@repo/types';

import { toast } from 'sonner';

// ─── Keys factory — keeps query keys consistent and type-safe ─────────────────
export const keys = {
  dashboard: ['dashboard'] as const,
  orders: (p: OrdersParams) => ['orders', p] as const,
  order: (id: string) => ['orders', id] as const,
  products: (p: ProductsParams) => ['products', p] as const,
  product: (id: string) => ['products', id] as const,
  categories: () => ['categories-full'] as const,
  users: (p: UsersParams) => ['users', p] as const,
  user: (id: string) => ['users', id] as const,
  subscriptions: (p: SubsParams) => ['subscriptions', p] as const,
  payments: (p: PaymentsParams) => ['payments', p] as const,
  storeConfig: ['store-config'] as const,
};

export const AQK = {
  // Subscriptions
  subs: (p?: object) => ['admin', 'subscriptions', p] as const,
  subOne: (id: string) => ['admin', 'subscription', id] as const,
  subOverview: () => ['admin', 'subscriptions', 'overview'] as const,
  subExpiring: (days: number) =>
    ['admin', 'subscriptions', 'expiring', days] as const,

  // Offers
  offers: (p?: object) => ['admin', 'offers', p] as const,
  offerOne: (id: string) => ['admin', 'offer', id] as const,
  offerAnalytics: () => ['admin', 'offers', 'analytics'] as const,
  offerUsages: (id: string, p?: object) =>
    ['admin', 'offer', id, 'usages', p] as const,
} as const;

// ─── Dashboard ────────────────────────────────────────────────────────────────
// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () =>
      fetcher<DashboardStats>('/tenant/dashboard/stats'),

    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
// ─── Orders ───────────────────────────────────────────────────────────────────
export function useOrders(params: OrdersParams) {
  return useQuery({
    queryKey: keys.orders(params),
    queryFn: () =>
      fetcher<PaginatedResponse<Order>>('/orders', {
        method: 'GET',
        // pass params as query string — adjust fetcher if needed
        body: undefined,
        headers: {},
        params: params as Record<
          string,
          string | number | boolean | null | undefined
        >,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: keys.order(id),
    queryFn: () => fetcher<Order>(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      fetcher<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────
export function useProducts(params: ProductsParams) {
  return useQuery({
    queryKey: keys.products(params),
    queryFn: () =>
      fetcher<PaginatedResponse<Product>>('/products', {
        method: 'GET',
        params: params as Record<
          string,
          string | number | boolean | null | undefined
        >,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetcher<any>(`/products/${id}`);
      return res; // 🔥 normalize here
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) =>
      fetcher<Product>('/products', { method: 'POST', body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) =>
      fetcher<Product>(`/products/${payload.id}`, {
        method: 'PATCH',
        body: payload,
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: keys.product(variables.id) });
      toast.success('Product updated');
    },
  });
}

export function useUpdateProductStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetcher(`/products/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),

    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: keys.product(variables.id) });
      toast.success('Status updated');
    },
  });
}

export function useToggleFeatured() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      fetcher<Product>(`/products/${id}/featured`, {
        method: 'PATCH',
        body: { isFeatured },
      }),

    onSuccess: (_, { id, isFeatured }) => {
      // 🔄 invalidate product list
      qc.invalidateQueries({ queryKey: ['products'] });

      // 🔄 invalidate single product
      qc.invalidateQueries({ queryKey: keys.product(id) });

      // ✅ UX feedback
      toast.success(
        isFeatured ? 'Marked as Featured ⭐' : 'Removed from Featured',
      );
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCategoriesFull() {
  return useQuery({
    queryKey: ['categories-full'],

    queryFn: async () => {
      return await fetcher<{
        categories: Category[];
        tree: any[];
      }>('/categories');
    },

    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Category>) =>
      fetcher<Category>('/categories', { method: 'POST', body: data }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.categories() });
      qc.invalidateQueries({ queryKey: ['categories-full'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      fetcher<Category>(`/categories/${id}`, {
        method: 'PATCH',
        body: data,
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.categories() });
      qc.invalidateQueries({ queryKey: ['categories-full'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/categories/${id}`, { method: 'DELETE' }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.categories() });
      qc.invalidateQueries({ queryKey: ['categories-full'] });
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useUsers(params: UsersParams) {
  return useQuery({
    queryKey: keys.users(params),
    queryFn: () =>
      fetcher<PaginatedResponse<User>>('/users', {
        method: 'GET',
        params: params as Record<
          string,
          string | number | boolean | null | undefined
        >,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: keys.user(id),
    queryFn: () => fetcher<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      fetcher<User>(`/users/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    // Optimistic update
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['users'] });
      const prev = qc.getQueriesData({ queryKey: ['users'] });
      qc.setQueriesData({ queryKey: ['users'] }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((u: User) =>
            u._id === id ? { ...u, status } : u,
          ),
        };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export function usePayments(params: PaymentsParams) {
  return useQuery({
    queryKey: keys.payments(params),
    queryFn: () =>
      fetcher<PaginatedResponse<Payment>>('/payments', {
        method: 'GET',
        params: params as Record<
          string,
          string | number | boolean | null | undefined
        >,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) =>
      fetcher(`/payments/${id}/refund`, {
        method: 'POST',
        body: { amount },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
}

// ─── Store Config ─────────────────────────────────────────────────────────────
export function useStoreConfig() {
  return useQuery({
    queryKey: keys.storeConfig,
    queryFn: () => fetcher<StoreConfig>('/store/config'),
    staleTime: 10 * 60_000,
  });
}

export function useUpdateStoreConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StoreConfig>) =>
      fetcher<StoreConfig>('/store/config', {
        method: 'PATCH',
        body: data,
      }),
    onSuccess: (data) => {
      qc.setQueryData(keys.storeConfig, data);
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ── List ──────────────────────────────────────────────────────────────────────

export function useSubscriptions(params?: {
  page?: number;
  limit?: number;
  status?: SubStatus;
  plan?: UserPlan;
  gateway?: string;
  search?: string;
}) {
  return useQuery<PaginatedResponse<Subscription>>({
    queryKey: AQK.subs(params),
    queryFn: () =>
      api.get<PaginatedResponse<Subscription>>('/subscriptions', params as any),
  });
}

// ── Single ────────────────────────────────────────────────────────────────────

export function useSubscription(id: string) {
  return useQuery<Subscription>({
    queryKey: AQK.subOne(id),
    queryFn: () => api.get<Subscription>(`/subscriptions/${id}`),
    enabled: !!id,
  });
}

// ── Overview analytics (MRR, ARR, churn, plan breakdown) ─────────────────────

export function useSubscriptionOverview() {
  return useQuery<SubscriptionOverview>({
    queryKey: AQK.subOverview(),
    queryFn: () => api.get<SubscriptionOverview>('/subscriptions/overview'),
    staleTime: 2 * 60_000,
  });
}

/** Alias kept for backward compat with the existing page */
export const useSubscriptionStats = useSubscriptionOverview;

// ── Expiring subscriptions ────────────────────────────────────────────────────

export function useExpiringSubscriptions(days = 7) {
  return useQuery<{ data: Subscription[]; count: number }>({
    queryKey: AQK.subExpiring(days),
    queryFn: () =>
      api.get<{ data: Subscription[]; count: number }>(
        '/subscriptions/expiring',
        { days } as any,
      ),
    staleTime: 5 * 60_000,
  });
}

// ── Cancel subscription (admin) ───────────────────────────────────────────────

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation<
    { message: string; data: null },
    Error,
    { id: string; immediately?: boolean; reason?: string }
  >({
    mutationFn: ({ id, immediately, reason }) =>
      api.post(
        `/subscriptions/${id}/cancel`,
        { immediately, reason },
        {
          successMsg: immediately
            ? 'Subscription cancelled immediately'
            : 'Subscription scheduled for cancellation',
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFER HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ── List ──────────────────────────────────────────────────────────────────────

export function useOffers(params?: {
  page?: number;
  limit?: number;
  status?: OfferStatus;
  type?: OfferType;
  isPublic?: boolean;
  search?: string;
}) {
  return useQuery<PaginatedResponse<Offer>>({
    queryKey: AQK.offers(params),
    queryFn: () => api.get<PaginatedResponse<Offer>>('/offers', params as any),
  });
}

// ── Single ────────────────────────────────────────────────────────────────────

export function useOffer(id: string) {
  return useQuery<Offer>({
    queryKey: AQK.offerOne(id),
    queryFn: () => api.get<Offer>(`/offers/${id}`),
    enabled: !!id,
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useOfferAnalytics() {
  return useQuery<OfferAnalytics>({
    queryKey: AQK.offerAnalytics(),
    queryFn: () => api.get<OfferAnalytics>('/offers/analytics'),
    staleTime: 2 * 60_000,
  });
}

// ── Usage log (paginated) ─────────────────────────────────────────────────────

export function useOfferUsages(
  id: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery<PaginatedResponse<OfferUsage>>({
    queryKey: AQK.offerUsages(id, params),
    queryFn: () =>
      api.get<PaginatedResponse<OfferUsage>>(
        `/offers/${id}/usages`,
        params as any,
      ),
    enabled: !!id,
  });
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateOffer() {
  const qc = useQueryClient();

  return useMutation<{ message: string; data: Offer }, Error, FormData>({
    mutationFn: (payload) =>
      api.post('/offers', payload, {
        successMsg: 'Offer created!',
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      qc.invalidateQueries({ queryKey: AQK.offerAnalytics() });
    },
  });
}
// ── Update ────────────────────────────────────────────────────────────────────

export function useUpdateOffer() {
  const qc = useQueryClient();

  return useMutation<
    { message: string; data: Offer },
    Error,
    { id: string; payload: FormData }
  >({
    mutationFn: ({ id, payload }) =>
      api.patch(`/offers/${id}`, payload, {
        successMsg: 'Offer updated!',
      }),

    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      qc.invalidateQueries({ queryKey: AQK.offerOne(id) });
      qc.invalidateQueries({ queryKey: AQK.offerAnalytics() });
    },
  });
}

// ── Toggle status ─────────────────────────────────────────────────────────────

export function useToggleOffer() {
  const qc = useQueryClient();
  return useMutation<
    { message: string; data: { status: OfferStatus } },
    Error,
    string
  >({
    mutationFn: (id) =>
      api.patch(`/offers/${id}/toggle`, {}, { successMsg: 'Status updated' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
    },
  });
}

// ── Delete / deactivate ───────────────────────────────────────────────────────

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) =>
      api.delete(`/offers/${id}`, { successMsg: 'Offer removed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      qc.invalidateQueries({ queryKey: AQK.offerAnalytics() });
    },
  });
}
