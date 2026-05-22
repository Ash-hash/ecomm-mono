// ─── store/commerceSlice.ts ───────────────────────────────────────────────────
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@repo/types';

// ── Guest cart item ───────────────────────────────────────────────────────────
//
// Mirrors GuestCartItemSyncDto on the backend, plus the embedded product
// snapshot needed to render the cart UI without a network call.
//
// `selected` is persisted so the "sync on login" call can restore the exact
// checkbox state the guest had into the server cart.

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

// In commerceSlice.ts

export interface GuestCoupon {
  code: string;
  type: string;
  discountAmount: number;
  freeShipping: boolean;
  message: string;
  hasUserRestrictions: boolean; // if true, show a soft warning
}

// Add to initial state:

// Add reducers:
// applyGuestCoupon: (state, action: PayloadAction<GuestCoupon>) => {
//   state.guestCoupon = action.payload;
// },
// removeGuestCoupon: (state) => {
//   state.guestCoupon = null;
// },

// ── State ─────────────────────────────────────────────────────────────────────

export interface CommerceState {
  guestCart: GuestCartItem[];
  guestWishlist: Product[];
  guestCoupon: GuestCoupon | null;
}

const initialState: CommerceState = {
  guestCart: [],
  guestWishlist: [],
  guestCoupon: null as GuestCoupon | null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const commerceSlice = createSlice({
  name: 'commerce',
  initialState,

  reducers: {
    // ── Cart: add ─────────────────────────────────────────────────────────────
    guestAddToCart(state, action: PayloadAction<GuestCartItem>) {
      const existing = state.guestCart.find(
        (i) => i.productId === action.payload.productId,
      );
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + action.payload.quantity,
          action.payload.product.stock,
        );
        // Refresh price snapshot on re-add
        existing.priceSnapshot = action.payload.priceSnapshot;
      } else {
        state.guestCart.push({ ...action.payload, selected: true });
      }
    },

    // ── Cart: quantity ────────────────────────────────────────────────────────
    guestUpdateQty(
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) {
      const item = state.guestCart.find(
        (i) => i.productId === action.payload.productId,
      );
      if (item) item.quantity = action.payload.quantity;
    },

    // ── Cart: remove ──────────────────────────────────────────────────────────
    guestRemoveFromCart(state, action: PayloadAction<string>) {
      state.guestCart = state.guestCart.filter(
        (i) => i.productId !== action.payload,
      );
    },

    // ── Cart: select / deselect specific items ────────────────────────────────
    //
    // Mirrors PATCH /customer/cart/items/select.
    // Pass { productIds: string[], selected: boolean }.
    guestSelectItems(
      state,
      action: PayloadAction<{ productIds: string[]; selected: boolean }>,
    ) {
      for (const item of state.guestCart) {
        if (action.payload.productIds.includes(item.productId)) {
          item.selected = action.payload.selected;
        }
      }
    },

    // ── Cart: select / deselect ALL ───────────────────────────────────────────
    //
    // Mirrors PATCH /customer/cart/select-all and /customer/cart/deselect-all.
    guestToggleSelectAll(state, action: PayloadAction<boolean>) {
      state.guestCart.forEach((item) => {
        item.selected = action.payload;
      });
    },

    // ── Cart: clear ───────────────────────────────────────────────────────────
    clearGuestCart(state) {
      state.guestCart = [];
    },

    // ── Wishlist ──────────────────────────────────────────────────────────────
    guestToggleWishlist(state, action: PayloadAction<Product>) {
      const idx = state.guestWishlist.findIndex(
        (p) => p._id === action.payload._id,
      );
      if (idx > -1) state.guestWishlist.splice(idx, 1);
      else state.guestWishlist.push(action.payload);
    },

    clearGuestWishlist(state) {
      state.guestWishlist = [];
    },

    applyGuestCoupon: (state, action: PayloadAction<GuestCoupon>) => {
      state.guestCoupon = action.payload;
    },
    removeGuestCoupon: (state) => {
      state.guestCoupon = null;
    },
  },
});

export const {
  guestAddToCart,
  guestUpdateQty,
  guestRemoveFromCart,
  guestSelectItems,
  guestToggleSelectAll,
  clearGuestCart,
  guestToggleWishlist,
  clearGuestWishlist,
  applyGuestCoupon,
  removeGuestCoupon,
} = commerceSlice.actions;

export default commerceSlice.reducer;
