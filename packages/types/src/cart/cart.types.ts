// ─────────────────────────────────────────────
// CART ITEM (ENRICHED)
// ─────────────────────────────────────────────

export interface CartItem {
  productId: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    main_image?: string;
    images?: string[];
    stock: number;
  } | null;

  quantity: number;

  priceSnapshot: number;
  livePrice: number;
  lineTotal: number;

  selected: boolean;

  priceChanged: boolean;
  priceDelta: number;

  inStock: boolean;
  stockAvailable: number;
  stockWarning: boolean;
}

// ─────────────────────────────────────────────
// CART TOTALS
// ─────────────────────────────────────────────

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface CartSelectedSummary extends CartTotals {
  itemCount: number;
  freeShippingEligible: boolean;
  freeShippingRemainingAmount: number;
}

// ─────────────────────────────────────────────
// CART RESPONSE
// ─────────────────────────────────────────────

export interface CartResponse extends CartTotals {
  cartId: string;
  items: CartItem[];
  totalItems: number;
  updatedAt: string;

  selectedSummary: CartSelectedSummary;

  hasStockIssues: boolean;
  hasPriceChanges: boolean;
}

// ─────────────────────────────────────────────
// DTOs (YOU WERE MISSING THESE)
// ─────────────────────────────────────────────

export interface SelectCartItemsDto {
  productIds: string[];
  selected: boolean;
}

export interface GuestCartItemSyncDto {
  productId: string;
  quantity: number;
  selected?: boolean;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
  priceSnapshot: number;
  selected: boolean; // ← new: persisted checkbox state
  product: {
    _id: string;
    name: string;
    price: number;
    main_image: string;
    slug: string;
    stock: number;
  };
}