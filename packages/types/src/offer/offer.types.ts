import { PlanDetail } from "../subscription";
import { UserPlan } from "../user";

// offer.types.ts
export type OfferType =
  | 'percentage'
  | 'fixed'
  | 'free_shipping'
  | 'bxgy';

export type OfferStatus =
  | 'active'
  | 'inactive'
  | 'scheduled'
  | 'expired';

export interface BxgyConfig {
  buyQuantity: number;
  getQuantity: number;
  getDiscountPct?: number;
}

export interface Offer {
  _id: string;
  title: string;
  description?: string;
  code: string;

  type: OfferType;
  value: number;
  maxDiscountAmount?: number;

  minOrderValue?: number;

  usageLimit?: number;
  perUserLimit?: number;
  usageCount: number;

  applicableTo?: 'all' | 'product' | 'category' | 'plan';
  applicableIds?: string[];
  bxgyConfig?: BxgyConfig | null;
  allowedPlans?: string[];
  newUsersOnly?: boolean;

  startsAt?: string;
  expiresAt?: string;

  status: OfferStatus;
  isPublic: boolean;

  bannerImage?: string;

  createdAt: string;
  updatedAt: string;
}

export type CreateOfferPayload = {
  title: string;
  description?: string;
  code: string;
  type: OfferType;

  value?: number;
  maxDiscountAmount?: number;

  minOrderValue?: number;

  usageLimit?: number;
  perUserLimit?: number;

  applicableTo?: 'all' | 'product' | 'category' | 'plan';
  applicableIds?: string[];

  allowedPlans?: string[];
  newUsersOnly?: boolean;

  startsAt?: string;
  expiresAt?: string;

  status?: OfferStatus;
  isPublic?: boolean;

  bxgyConfig?: BxgyConfig;

  bannerImage?: File | string;
};

export interface OfferAnalytics {
  totalRedemptions: number;
  totalDiscounted: number;

  topOffers: {
    _id: string;
    code: string;
    usageCount: number;
  }[];

  recentUsages: {
    code: string;
    orderId: string;
    discountApplied: number;
    usedAt: string;
  }[];
}

export interface OfferUsage {
  _id: string;
  offerId: string;
  code: string;
  orderId: string;
  userId: string;

  discountApplied: number;

  createdAt: string;
}


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

export interface CouponValidationResult {
  valid: boolean;
  offerId: string;
  code: string;
  type: OfferType;
  discountAmount: number;
  freeShipping: boolean;
  message: string;
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