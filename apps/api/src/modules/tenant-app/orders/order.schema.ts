// ─── order.schema.ts ──────────────────────────────────────────────────────────
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type OrderPaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

// ── Shipping Address sub-document ─────────────────────────────────────────────
@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ enum: ['home', 'work', 'other'], default: 'home' })
  label: string;

  @Prop({ required: true }) fullName: string;
  @Prop({ required: true }) phone: string;
  @Prop({ required: true }) addressLine1: string;
  @Prop({ default: '' }) addressLine2: string;
  @Prop({ default: '' }) landmark: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) state: string;
  @Prop({ required: true }) pincode: string;
  @Prop({ default: 'India' }) country: string;
  @Prop({ type: Number, default: null }) lat: number | null;
  @Prop({ type: Number, default: null }) lng: number | null;
}
export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

// ── Order Item sub-document ───────────────────────────────────────────────────
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true }) productId: Types.ObjectId;
  @Prop({ required: true }) productName: string;
  @Prop({ required: true }) productSku: string;
  @Prop({ required: true }) quantity: number;
  @Prop({ required: true }) unitPrice: number;
  @Prop({ required: true }) total: number;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// ── Order document ────────────────────────────────────────────────────────────
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true }) customerName: string;
  @Prop({ required: true }) customerEmail: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ required: true }) subtotal: number;
  @Prop({ default: 0 }) tax: number;
  @Prop({ default: 0 }) shipping: number;
  @Prop({ required: true }) total: number;

  @Prop({
    enum: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ],
    default: 'pending',
  })
  status: OrderStatus;

  @Prop({
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'pending',
  })
  paymentStatus: OrderPaymentStatus;

  @Prop() paymentMethod: string;

  /** Structured shipping address — replaces the old plain-string field */
  @Prop({ type: ShippingAddressSchema })
  shippingAddress: ShippingAddress;

  @Prop() notes: string;

  @Prop() couponCode?: string;
  @Prop({ default: 0 }) discountAmount?: number;
  @Prop({ default: false }) freeShippingApplied?: boolean;
  @Prop({ type: Types.ObjectId, ref: 'Offer' })
  offerId?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ total: -1 });
