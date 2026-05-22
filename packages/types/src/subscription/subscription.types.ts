import { UserPlan } from '../user';

export type SubStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'trialing'
  | 'paused';

export interface Subscription {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: UserPlan;
  status: SubStatus;
  amount: number;
  billingCycle: 'monthly' | 'annual';
  gateway: 'razorpay' | 'stripe' | 'paypal';
  gatewaySubId: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  planSnapshot?: {
    name: string;
    amount: number;
    billingCycle: string;
    featuresSnapshot: string[];
  } | null;
}

export interface SubscriptionOverview {
  totalSubscribers: number;
  activeSubscribers: number;
  active?: number;
  trialing?: number;
  pastDue?: number;

  mrr: number;
  totalMrr?: number;
  arr: number;

  churnRate: number;
  recentChurn?: number;
  expiringThisWeek?: number;

  planBreakdown: {
    plan: UserPlan;
    count: number;
  }[];

  plans?: {
    plan: UserPlan;
    mrr: number;
    count: number;
  }[];
}

export interface PlanDetail {
  key: UserPlan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  color: string;
  popular: boolean;
  features: string[];
}
