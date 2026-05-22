export const QK = {

  // ───────────────── CUSTOMER (USER APP) ─────────────────
  customer: {
    profile: ['customer', 'profile'] as const,
    orders: (p?: object) => ['customer', 'orders', p] as const,
    payments: (p?: object) => ['customer', 'payments', p] as const,
    subscription: ['customer', 'subscription'] as const,
    subHistory: ['customer', 'subscription', 'history'] as const,
    subCompare: ['customer', 'subscription', 'compare'] as const,
    wishlist: ['customer', 'wishlist'] as const,
    addresses: ['customer', 'addresses'] as const,
    cart: ['cart'] as const,
  },

  // ───────────────── CATALOG (PUBLIC) ─────────────────
  catalog: {
    products: (p?: object) => ['catalog', 'products', p] as const,
    product: (slug: string) => ['catalog', 'product', slug] as const,
    featured: (limit: number) => ['catalog', 'featured', limit] as const,
    search: (q: string) => ['catalog', 'search', q] as const,
    categories: ['catalog', 'categories'] as const,
    store: ['catalog', 'store'] as const,
  },

  // ───────────────── OFFERS ─────────────────
  offers: {
    public: ['offers', 'public'] as const,
  },

  // ───────────────── SUBSCRIPTIONS (PUBLIC) ─────────────────
  subscriptions: {
    plans: (cycle?: string) => ['subscriptions', 'plans', cycle] as const,
    plan: (key: string) => ['subscriptions', 'plan', key] as const,
  },

  // ───────────────── ADMIN ─────────────────
  admin: {
    dashboard: ['admin', 'dashboard'] as const,

    products: (p?: object) => ['admin', 'products', p] as const,
    product: (id: string) => ['admin', 'product', id] as const,

    orders: (p?: object) => ['admin', 'orders', p] as const,
    order: (id: string) => ['admin', 'order', id] as const,

    users: (p?: object) => ['admin', 'users', p] as const,
    user: (id: string) => ['admin', 'user', id] as const,

    payments: (p?: object) => ['admin', 'payments', p] as const,

    offers: (p?: object) => ['admin', 'offers', p] as const,

    subscriptions: (p?: object) => ['admin', 'subscriptions', p] as const,
  },
} as const;