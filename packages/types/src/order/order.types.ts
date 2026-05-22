import { Address } from "../address";

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderPaymentStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlaceOrderDto =
  | {
      productId: string;
      quantity: number;
      shippingAddress: Address;
      paymentMethod?: string;
      couponCode?: string;
    }
  | {
      selectedProductIds: string[];
      shippingAddress: Address;
      paymentMethod?: string;
      couponCode?: string;
    };

export interface PlaceOrderResponse {
  orderId: string;
  orderNumber: string;
  total: number;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
}
