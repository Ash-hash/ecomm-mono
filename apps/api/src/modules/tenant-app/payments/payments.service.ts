// src/modules/tenant-app/payments/payments.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { getModel } from '../../../common/utils/get-model.util';
import { OrderSchema } from '../orders/order.schema';
import { PaymentSchema } from './payment.schema';
import { ProductSchema } from '../products/product.schema';
import { CartSchema } from '../cart/cart.schema';
import { RazorpayService } from './razorpay.service';
import { paginate } from '../../../common/helpers/paginate.helper';

@Injectable()
export class PaymentsService {
  constructor(private razorpayService: RazorpayService) {}

  async findAll(req: any, query: any) {
    const Payment = getModel(req, 'Payment', PaymentSchema);
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.gateway) filter.gateway = query.gateway;
    return paginate(Payment, filter, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  async createRazorpayOrder(req: any, orderId: string) {
    const Order = getModel(req, 'Order', OrderSchema);
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === 'paid')
      throw new BadRequestException('Order already paid');

    const razorpay = this.razorpayService.getInstance(req.tenant);

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: `ord_${order._id}`,
    });

    return {
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
    };
  }

  async verifyPayment(req: any, dto: any) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = dto;

    const generatedSignature = crypto
      .createHmac('sha256', req.tenant.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const Order = getModel(req, 'Order', OrderSchema);
    const Payment = getModel(req, 'Payment', PaymentSchema);
    const Product = getModel(req, 'Product', ProductSchema);
    const Cart = getModel(req, 'Cart', CartSchema);

    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === 'paid')
      return { success: true, message: 'Already verified' };

    await Payment.create({
      transactionId: razorpay_payment_id,
      userId: order.customerId,
      userName: order.customerName, // ✅ ADD
      userEmail: order.customerEmail, // ✅ ADD
      orderId: order._id,
      amount: order.total,
      status: 'success',
      gateway: 'razorpay',
      method: 'upi', // or dynamic
      gatewayPaymentId: razorpay_payment_id,
    });

    order.paymentStatus = 'paid';
    order.status = 'processing';
    await order.save();

    await Promise.all(
      order.items.map((item: any) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        }),
      ),
    );

    const checkedOutProductIds = order.items.map((item: any) =>
      item.productId.toString(),
    );
    const cart = await Cart.findOne({ userId: order.customerId });
    if (cart) {
      cart.items = cart.items.filter(
        (item: any) => !checkedOutProductIds.includes(item.productId.toString()),
      );
      if (cart.items.length) await cart.save();
      else await Cart.deleteOne({ _id: cart._id });
    }

    return {
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
      },
    };
  }

  async refund(req: any, id: string, amount?: number) {
    const Payment = getModel(req, 'Payment', PaymentSchema);
    const Order = getModel(req, 'Order', OrderSchema);
    const payment = await Payment.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    if (!['success', 'partially_refunded'].includes(payment.status)) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    const refundAmount = Math.min(amount ?? payment.amount - payment.refundedAmount, payment.amount - payment.refundedAmount);
    if (refundAmount <= 0) throw new BadRequestException('Nothing left to refund');

    payment.refundedAmount += refundAmount;
    payment.status =
      payment.refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded';
    await payment.save();

    if (payment.orderId && payment.status === 'refunded') {
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: 'refunded',
        status: 'refunded',
      });
    }

    return { message: 'Refund recorded', data: payment };
  }
}
