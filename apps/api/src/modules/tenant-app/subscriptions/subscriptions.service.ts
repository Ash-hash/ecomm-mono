import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { getModel } from 'src/common/utils/get-model.util';
import { paginate } from 'src/common/helpers/paginate.helper';
import { UserSchema } from '../users/user.schema';
import { PaymentSchema } from '../payments/payment.schema';
import { SubscriptionSchema, UserPlan } from './subscription.schema';

const PLAN_ORDER: UserPlan[] = ['free', 'starter', 'pro', 'enterprise'];

export const USER_PLANS: Record<UserPlan, any> = {
  free: {
    key: 'free',
    name: 'Free',
    tagline: 'Start shopping with basic benefits',
    monthlyPrice: 0,
    annualPrice: 0,
    color: '#6b7280',
    popular: false,
    features: ['Standard checkout', 'Order history', 'Wishlist'],
    limits: {
      freeShipping: false,
      expressShipping: false,
      memberPricing: false,
      prioritySupport: false,
      bulkDiscounts: false,
      apiAccess: false,
    },
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    tagline: 'Useful perks for regular buyers',
    monthlyPrice: 199,
    annualPrice: 1990,
    color: '#2563eb',
    popular: false,
    features: ['Member pricing', 'Priority offers', 'Faster support'],
    limits: {
      freeShipping: false,
      expressShipping: false,
      memberPricing: true,
      prioritySupport: false,
      bulkDiscounts: false,
      apiAccess: false,
    },
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    tagline: 'Best value for frequent shoppers',
    monthlyPrice: 499,
    annualPrice: 4990,
    color: '#10b981',
    popular: true,
    features: ['Free shipping', 'Member pricing', 'Priority support'],
    limits: {
      freeShipping: true,
      expressShipping: false,
      memberPricing: true,
      prioritySupport: true,
      bulkDiscounts: true,
      apiAccess: false,
    },
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    tagline: 'Advanced access for B2B buyers',
    monthlyPrice: 1499,
    annualPrice: 14990,
    color: '#7c3aed',
    popular: false,
    features: ['API access', 'Bulk discounts', 'Express shipping'],
    limits: {
      freeShipping: true,
      expressShipping: true,
      memberPricing: true,
      prioritySupport: true,
      bulkDiscounts: true,
      apiAccess: true,
    },
  },
};

function planDetail(plan: UserPlan) {
  const item = USER_PLANS[plan];
  const annualMonthlyEq = item.annualPrice ? Math.round(item.annualPrice / 12) : 0;
  const annualSavingPct =
    item.monthlyPrice > 0
      ? Math.round((1 - item.annualPrice / (item.monthlyPrice * 12)) * 100)
      : 0;
  return {
    ...item,
    pricing: {
      monthly: item.monthlyPrice,
      annual: item.annualPrice,
      annualSavingPct,
      annualMonthlyEq,
    },
  };
}

@Injectable()
export class SubscriptionsService {
  getPlans() {
    return { data: PLAN_ORDER.map(planDetail) };
  }

  getPlan(key: UserPlan) {
    if (!USER_PLANS[key]) throw new NotFoundException('Plan not found');
    return { data: planDetail(key) };
  }

  async findAll(req: any, query: any) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.plan) filter.plan = query.plan;
    if (query.gateway) filter.gateway = query.gateway;
    if (query.search) {
      filter.$or = [
        { userName: { $regex: query.search, $options: 'i' } },
        { userEmail: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(Subscription, filter, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  async findOne(req: any, id: string) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const sub = await Subscription.findById(id).lean();
    if (!sub) throw new NotFoundException('Subscription not found');
    return { data: sub };
  }

  async overview(req: any) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 86400_000);
    const [totalSubscribers, active, trialing, pastDue, recentChurn, expiringThisWeek, planAgg] =
      await Promise.all([
        Subscription.countDocuments({}),
        Subscription.countDocuments({ status: 'active' }),
        Subscription.countDocuments({ status: 'trialing' }),
        Subscription.countDocuments({ status: 'past_due' }),
        Subscription.countDocuments({
          status: 'cancelled',
          cancelledAt: { $gte: new Date(now.getTime() - 30 * 86400_000) },
        }),
        Subscription.countDocuments({
          status: { $in: ['active', 'trialing'] },
          currentPeriodEnd: { $lte: sevenDays },
        }),
        Subscription.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$plan', count: { $sum: 1 }, mrr: { $sum: '$amount' } } },
        ]),
      ]);

    const plans = PLAN_ORDER.map((plan) => {
      const row = planAgg.find((p: any) => p._id === plan);
      return { plan, count: row?.count ?? 0, mrr: row?.mrr ?? 0 };
    });
    const totalMrr = plans.reduce((sum, p) => sum + p.mrr, 0);

    return {
      data: {
        totalSubscribers,
        activeSubscribers: active,
        active,
        trialing,
        pastDue,
        mrr: totalMrr,
        totalMrr,
        arr: totalMrr * 12,
        churnRate: totalSubscribers ? Number(((recentChurn / totalSubscribers) * 100).toFixed(1)) : 0,
        recentChurn,
        expiringThisWeek,
        planBreakdown: plans.map(({ plan, count }) => ({ plan, count })),
        plans,
      },
    };
  }

  async expiring(req: any, days = 7) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const end = new Date(Date.now() + Number(days) * 86400_000);
    const data = await Subscription.find({
      status: { $in: ['active', 'trialing'] },
      currentPeriodEnd: { $lte: end },
    })
      .sort({ currentPeriodEnd: 1 })
      .lean();
    return { data, count: data.length };
  }

  async activeForCustomer(req: any, userId: string) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const sub = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trialing', 'past_due', 'paused'] },
    })
      .sort({ createdAt: -1 })
      .lean();
    return { data: sub ?? null };
  }

  async historyForCustomer(req: any, userId: string) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const data = await Subscription.find({ userId }).sort({ createdAt: -1 }).lean();
    return { data };
  }

  async compareForCustomer(req: any, userId: string) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    const currentPlan = (user.plan ?? 'free') as UserPlan;
    const currentIndex = PLAN_ORDER.indexOf(currentPlan);
    return {
      data: {
        currentPlan,
        plans: PLAN_ORDER.map((plan, index) => ({
          ...planDetail(plan),
          isCurrent: plan === currentPlan,
          isUpgrade: index > currentIndex,
          isDowngrade: index < currentIndex,
        })),
      },
    };
  }

  async upgradeCustomer(req: any, userId: string, dto: any) {
    const plan = dto.plan as UserPlan;
    if (!USER_PLANS[plan]) throw new BadRequestException('Invalid plan');

    const User = getModel(req, 'User', UserSchema);
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const Payment = getModel(req, 'Payment', PaymentSchema);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const detail = planDetail(plan);
    const amount = dto.billingCycle === 'annual' ? detail.annualPrice : detail.monthlyPrice;
    const now = new Date();
    const currentPeriodEnd =
      dto.billingCycle === 'annual'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await Subscription.updateMany(
      { userId: user._id, status: { $in: ['active', 'trialing', 'past_due', 'paused'] } },
      { $set: { status: 'cancelled', cancelledAt: now } },
    );

    const sub = await Subscription.create({
      userId: user._id,
      userName: user.name || user.phone || 'Customer',
      userEmail: user.email || `${user.phone || user._id}@customer.local`,
      plan,
      status: amount > 0 ? 'active' : 'trialing',
      amount,
      billingCycle: dto.billingCycle,
      gateway: dto.gateway ?? 'razorpay',
      gatewaySubId: `manual_${new Types.ObjectId().toString()}`,
      currentPeriodStart: now,
      currentPeriodEnd,
      planSnapshot: detail,
    });

    user.plan = plan;
    await user.save();

    if (amount > 0) {
      await Payment.create({
        transactionId: `sub_${sub._id}`,
        userId: user._id,
        userName: sub.userName,
        userEmail: sub.userEmail,
        subscriptionId: sub._id,
        amount,
        status: 'success',
        gateway: dto.gateway ?? 'razorpay',
        method: 'upi',
        gatewayPaymentId: `manual_${sub._id}`,
        metadata: { type: 'subscription', plan, billingCycle: dto.billingCycle },
      });
    }

    return { message: 'Subscription updated', data: sub };
  }

  async cancelCustomer(req: any, userId: string, options: any = {}) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const sub = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trialing', 'past_due', 'paused'] },
    }).sort({ createdAt: -1 });
    if (!sub) throw new NotFoundException('Active subscription not found');

    if (options.immediately) {
      sub.status = 'cancelled';
      sub.cancelledAt = new Date();
    } else {
      sub.cancelAtPeriodEnd = true;
    }
    await sub.save();
    return { message: 'Subscription cancellation updated', data: sub };
  }

  async cancelByAdmin(req: any, id: string, body: any) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const sub = await Subscription.findById(id);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (body?.immediately) {
      sub.status = 'cancelled';
      sub.cancelledAt = new Date();
    } else {
      sub.cancelAtPeriodEnd = true;
    }
    await sub.save();
    return { message: 'Subscription cancellation updated', data: sub };
  }

  async reactivateCustomer(req: any, userId: string) {
    const Subscription = getModel(req, 'Subscription', SubscriptionSchema);
    const sub = await Subscription.findOne({
      userId,
      cancelAtPeriodEnd: true,
      status: { $in: ['active', 'trialing', 'past_due', 'paused'] },
    }).sort({ createdAt: -1 });
    if (!sub) throw new NotFoundException('Cancellable subscription not found');
    sub.cancelAtPeriodEnd = false;
    await sub.save();
    return { message: 'Subscription reactivated', data: sub };
  }
}
