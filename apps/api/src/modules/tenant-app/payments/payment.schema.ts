import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;
export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded' | 'partially_refunded';

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true }) userName:  string;
  @Prop({ required: true }) userEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  subscriptionId: Types.ObjectId;

  @Prop({ required: true }) amount:   number;
  @Prop({ default: 'INR' }) currency: string;

  @Prop({ enum: ['success','failed','pending','refunded','partially_refunded'], default: 'pending' })
  status: PaymentStatus;

  @Prop({ enum: ['razorpay','stripe','paypal'], required: true })
  gateway: string;

  @Prop({ enum: ['card','upi','netbanking','wallet'], required: true })
  method: string;

  @Prop({ required: true })
  gatewayPaymentId: string;

  @Prop({ default: 0 })
  refundedAmount: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ gateway: 1 });
PaymentSchema.index({ createdAt: -1 });
