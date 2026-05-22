// ─── tenant/tenant.schema.ts ──────────────────────────────────────────────────
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type TenantPlan   = 'starter' | 'growth' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual' | 'onetime';

// ── Razorpay credentials (encrypted at rest in prod) ─────────────────────────
@Schema({ _id: false })
export class RazorpayConfig {
  @Prop({ required: true })
  keyId: string;

  @Prop({ required: true, select: false }) // hide from general queries
  keySecret: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: Date, default: null })
  verifiedAt: Date | null;
}
export const RazorpayConfigSchema = SchemaFactory.createForClass(RazorpayConfig);

// ── Billing record ────────────────────────────────────────────────────────────
@Schema({ _id: false })
export class TenantBillingRecord {
  @Prop({ required: true })
  razorpayPaymentId: string;

  @Prop({ required: true })
  razorpayOrderId: string;

  @Prop({ required: true })
  amount: number; // INR paise

  @Prop({ enum: ['paid', 'failed', 'refunded'], default: 'paid' })
  status: string;

  @Prop({ default: () => new Date() })
  paidAt: Date;

  @Prop()
  description: string;
}
export const TenantBillingRecordSchema = SchemaFactory.createForClass(TenantBillingRecord);

// ── Plan limits ───────────────────────────────────────────────────────────────
@Schema({ _id: false })
export class PlanLimits {
  @Prop({ default: 100 })
  maxProducts: number;

  @Prop({ default: 5 })
  maxCategories: number;

  @Prop({ default: 1 })
  maxAdminUsers: number;

  @Prop({ default: false })
  customDomain: boolean;

  @Prop({ default: false })
  analyticsAccess: boolean;

  @Prop({ default: false })
  apiAccess: boolean;

  @Prop({ default: false })
  prioritySupport: boolean;

  @Prop({ default: 1 }) // GB
  storageLimit: number;
}
export const PlanLimitsSchema = SchemaFactory.createForClass(PlanLimits);

// ── Main Tenant document ──────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Tenant {
  // ── Identity ───────────────────────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  storeName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // used as subdomain: slug.yoursaas.com

  @Prop({ required: true, unique: true, lowercase: true })
  ownerEmail: string;

  @Prop({ required: true })
  ownerName: string;

  @Prop({ required: true })
  ownerPhone: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  ownerUserId: Types.ObjectId | null; // links to the admin user in their DB

  // ── Plan & billing ────────────────────────────────────────────────────────
  @Prop({ enum: ['starter', 'growth', 'pro', 'enterprise'], default: 'starter' })
  plan: TenantPlan;

  @Prop({ enum: ['trial', 'active', 'suspended', 'cancelled'], default: 'trial' })
  status: TenantStatus;

  @Prop({ enum: ['monthly', 'annual', 'onetime'], default: 'monthly' })
  billingCycle: BillingCycle;

  @Prop({ type: Date, default: () => new Date(Date.now() + 14 * 86400_000) })
  trialEndsAt: Date;

  @Prop({ type: Date, default: null })
  currentPeriodStart: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodEnd: Date | null;

  @Prop({ default: 0 })
  monthlyAmount: number; // INR

  @Prop({ type: [TenantBillingRecordSchema], default: [] })
  billingHistory: TenantBillingRecord[];

  // ── Razorpay ──────────────────────────────────────────────────────────────
  @Prop({ type: RazorpayConfigSchema, default: null })
  razorpay: RazorpayConfig | null;

  // ── Store config ──────────────────────────────────────────────────────────
  @Prop({ default: '' })
  logoUrl: string;

  @Prop({ default: '' })
  customDomain: string;

  @Prop({ default: '' })
  timezone: string;

  @Prop({ default: 'INR' })
  currency: string;

  // ── Database isolation ────────────────────────────────────────────────────
  @Prop({ required: true, unique: true })
  dbName: string; // e.g. "tenant_acmestore_xyz" — each tenant gets its own DB

  // ── Plan limits ───────────────────────────────────────────────────────────
  @Prop({ type: PlanLimitsSchema })
  limits: PlanLimits;

  // ── Suspension ────────────────────────────────────────────────────────────
  @Prop({ default: '' })
  suspensionReason: string;

  @Prop({ type: Date, default: null })
  suspendedAt: Date | null;

  // ── Metadata ──────────────────────────────────────────────────────────────
  @Prop({ default: false })
  onboardingComplete: boolean;

  @Prop({ type: Date, default: null })
  lastActiveAt: Date | null;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// TenantSchema.index({ slug: 1 },        { unique: true });
// TenantSchema.index({ ownerEmail: 1 },  { unique: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ plan: 1 });
TenantSchema.index({ trialEndsAt: 1 });
TenantSchema.index({ currentPeriodEnd: 1 });

// ── Plan definitions ──────────────────────────────────────────────────────────
export const TENANT_PLANS: Record<TenantPlan, {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  onetimePrice: number;
  limits: Partial<PlanLimits>;
}> = {
  starter: {
    name: 'Starter',
    monthlyPrice: 999,
    annualPrice: 9990,
    onetimePrice: 4999,
    limits: {
      maxProducts: 50,
      maxCategories: 5,
      maxAdminUsers: 1,
      customDomain: false,
      analyticsAccess: false,
      apiAccess: false,
      prioritySupport: false,
      storageLimit: 1,
    },
  },
  growth: {
    name: 'Growth',
    monthlyPrice: 2499,
    annualPrice: 24990,
    onetimePrice: 12999,
    limits: {
      maxProducts: 500,
      maxCategories: 20,
      maxAdminUsers: 3,
      customDomain: true,
      analyticsAccess: true,
      apiAccess: false,
      prioritySupport: false,
      storageLimit: 5,
    },
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 4999,
    annualPrice: 49990,
    onetimePrice: 24999,
    limits: {
      maxProducts: 2000,
      maxCategories: 100,
      maxAdminUsers: 10,
      customDomain: true,
      analyticsAccess: true,
      apiAccess: true,
      prioritySupport: true,
      storageLimit: 20,
    },
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 9999,
    annualPrice: 99990,
    onetimePrice: 49999,
    limits: {
      maxProducts: 999999,
      maxCategories: 999999,
      maxAdminUsers: 999999,
      customDomain: true,
      analyticsAccess: true,
      apiAccess: true,
      prioritySupport: true,
      storageLimit: 100,
    },
  },
};
