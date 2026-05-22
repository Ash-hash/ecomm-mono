// ─── offers/offer.schema.ts ───────────────────────────────────────────────────
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

export type OfferType      = 'percentage' | 'fixed' | 'free_shipping' | 'bxgy';
export type OfferStatus    = 'active' | 'inactive' | 'scheduled' | 'expired';
export type OfferApplicable = 'all' | 'product' | 'category' | 'plan';

// ── Usage record — one entry per redemption ───────────────────────────────────
@Schema({ _id: false })
export class OfferUsage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  discountApplied: number;   // INR amount actually discounted

  @Prop({ default: () => new Date() })
  usedAt: Date;
}
export const OfferUsageSchema = SchemaFactory.createForClass(OfferUsage);

// ── Buy X Get Y config (for bxgy type) ───────────────────────────────────────
@Schema({ _id: false })
export class BxgyConfig {
  @Prop({ required: true, min: 1 })
  buyQuantity: number;        // buy X items…
  @Prop({ required: true, min: 1 })
  getQuantity: number;        // …get Y items free
  @Prop({ default: 100 })
  getDiscountPct: number;     // discount on the free items (100 = fully free)
}
export const BxgyConfigSchema = SchemaFactory.createForClass(BxgyConfig);

// ── Main offer document ───────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Offer {
  // ── Identity ───────────────────────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  title: string;               // admin-facing name  e.g. "Summer Sale 20%"

  @Prop({ default: '' })
  description: string;         // customer-facing tagline

  @Prop({
    required:  true,
    unique:    true,
    uppercase: true,
    trim:      true,
    match:     /^[A-Z0-9_-]{3,20}$/,
  })
  code: string;                // coupon code e.g. "SUMMER20"

  // ── Type & value ──────────────────────────────────────────────────────────
  @Prop({ enum: ['percentage', 'fixed', 'free_shipping', 'bxgy'], required: true })
  type: OfferType;

  /** Discount value — percentage (0–100) or fixed INR amount */
  @Prop({ default: 0, min: 0 })
  value: number;

  /** Cap on the max discount for percentage offers (0 = no cap) */
  @Prop({ default: 0, min: 0 })
  maxDiscountAmount: number;

  /** BXGY config — only populated when type === 'bxgy' */
  @Prop({ type: BxgyConfigSchema, default: null })
  bxgyConfig: BxgyConfig | null;

  // ── Eligibility ───────────────────────────────────────────────────────────
  @Prop({ default: 0, min: 0 })
  minOrderValue: number;       // minimum cart subtotal to be eligible

  @Prop({ enum: ['all', 'product', 'category', 'plan'], default: 'all' })
  applicableTo: OfferApplicable;

  /** Product / category / plan ObjectIds to which the offer is scoped */
  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  applicableIds: Types.ObjectId[];

  /** Only allow specific user plans to redeem (empty = all plans) */
  @Prop({ type: [String], enum: ['free', 'starter', 'pro', 'enterprise'], default: [] })
  allowedPlans: string[];

  /** Only allow first-time buyers to redeem */
  @Prop({ default: false })
  newUsersOnly: boolean;

  // ── Validity window ───────────────────────────────────────────────────────
  @Prop({ type : Date})
  startsAt: Date | null;

  @Prop({ type : Date})
  expiresAt: Date | null;

  // ── Limits ────────────────────────────────────────────────────────────────
  /** Max total redemptions (0 = unlimited) */
  @Prop({ default: 0, min: 0 })
  usageLimit: number;

  /** Max times a single user can use it (0 = unlimited) */
  @Prop({ default: 1, min: 0 })
  perUserLimit: number;

  @Prop({ default: 0 })
  usageCount: number;           // incremented atomically on each redemption

  // ── Status ────────────────────────────────────────────────────────────────
  @Prop({ enum: ['active', 'inactive', 'scheduled', 'expired'], default: 'active' })
  status: OfferStatus;

  @Prop({ default: false })
  isPublic: boolean;            // show in storefront banner / promotions strip

  @Prop({ default: '' })
  bannerImage: string;          // optional image for public offers

  // ── Usage records ─────────────────────────────────────────────────────────
  @Prop({ type: [OfferUsageSchema], default: [] })
  usages: OfferUsage[];

  // ── Audit ─────────────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId | null;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

OfferSchema.index({ status: 1 });
OfferSchema.index({ isPublic: 1 });
OfferSchema.index({ expiresAt: 1 });
OfferSchema.index({ applicableTo: 1 });
OfferSchema.index({ 'usages.userId': 1 });