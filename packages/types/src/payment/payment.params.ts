import { PaginationParams } from '../common';
import { PaymentStatus } from './payment.types';

export interface PaymentsParams extends PaginationParams {
  status?: PaymentStatus;
  userId?: string;
  gateway?: 'razorpay' | 'stripe' | 'paypal';
}