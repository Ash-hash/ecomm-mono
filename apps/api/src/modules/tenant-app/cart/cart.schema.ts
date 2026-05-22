// ─── cart.schema.ts ───────────────────────────────────────────────────────────
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

// ── Cart Item sub-document ─────────────────────────────────────────────────────
@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  /** Price snapshotted when item was added — guards against mid-session price changes */
  @Prop({ required: true })
  priceSnapshot: number;

  /**
   * Persisted selection state.
   *
   * • New items are selected by default.
   * • PATCH /customer/cart/items/select  updates individual items.
   * • PATCH /customer/cart/select-all    bulk-toggles all items.
   * • POST  /customer/orders can override with an explicit selectedProductIds[].
   */
  @Prop({ default: true })
  selected: boolean;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

// ── Cart document ──────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Cart {
  /** Stable client-facing ID (different from Mongo _id) */
  @Prop({ unique: true, sparse: true })
  cartId: string;

  /** null for guest carts; populated after login sync */
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({
    default: 'active',
    enum: ['active', 'completed', 'abandoned'],
  })
  status: string;

  /** MongoDB TTL — auto-deletes the document after this timestamp */
  @Prop({
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  })
  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ userId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });