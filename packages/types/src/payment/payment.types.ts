export type PaymentStatus =
  | 'success'
  | 'failed'
  | 'pending'
  | 'refunded'
  | 'partially_refunded';

export interface Payment {
  _id: string;
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: 'razorpay' | 'stripe' | 'paypal';
  method: 'card' | 'upi' | 'netbanking' | 'wallet';
  gatewayPaymentId: string;
  refundedAmount: number;
  metadata?: Record<string, any>;
  createdAt: string;
}
export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export interface VerifyPaymentResponse {
  orderId: string;
  orderNumber: string;
  total: number;
}
