// ─────────────────────────────────────────────
// CHECKOUT SUMMARY ITEM
// ─────────────────────────────────────────────

export interface CheckoutSummaryItem {
  productId: string;
  productName: string;
  productSku: string;
  slug: string;
  image?: string;

  quantity: number;
  unitPrice: number;
  priceSnapshot: number;
  lineTotal: number;

  priceChanged: boolean;
  priceDelta: number;

  inStock: boolean;
  stockAvailable: number;
  stockWarning: boolean;
}

// ─────────────────────────────────────────────
// CHECKOUT SUMMARY
// ─────────────────────────────────────────────

export interface CheckoutSummary {
  items: CheckoutSummaryItem[];

  itemCount: number;

  subtotal: number;
  tax: number;
  shipping: number;
  total: number;

  freeShippingEligible: boolean;
  freeShippingRemainingAmount: number;

  hasStockIssues: boolean;
  hasPriceChanges: boolean;
}

// ─────────────────────────────────────────────
// REQUEST DTO
// ─────────────────────────────────────────────

export interface CheckoutSummaryDto {
  selectedProductIds?: string[];
}