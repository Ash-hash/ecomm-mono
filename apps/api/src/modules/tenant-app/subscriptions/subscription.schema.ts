import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;
export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused';

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' })
  plan: UserPlan;

  @Prop({ enum: ['active', 'cancelled', 'past_due', 'trialing', 'paused'], default: 'active' })
  status: SubStatus;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ enum: ['monthly', 'annual'], default: 'monthly' })
  billingCycle: 'monthly' | 'annual';

  @Prop({ enum: ['razorpay', 'stripe', 'paypal'], default: 'razorpay' })
  gateway: 'razorpay' | 'stripe' | 'paypal';

  @Prop({ default: '' })
  gatewaySubId: string;

  @Prop({ default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ type: Date, default: () => new Date() })
  currentPeriodStart: Date;

  @Prop({ type: Date, default: () => new Date(Date.now() + 30 * 86400_000) })
  currentPeriodEnd: Date;

  @Prop({ type: Object, default: null })
  planSnapshot: Record<string, any> | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
SubscriptionSchema.index({ createdAt: -1 });
