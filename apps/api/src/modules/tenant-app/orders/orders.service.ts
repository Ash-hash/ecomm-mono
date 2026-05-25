/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { getModel } from 'src/common/utils/get-model.util';
import { OrderSchema } from './order.schema';
import { ProductSchema } from '../products/product.schema';
import { CartSchema } from '../cart/cart.schema';
import { OfferSchema } from '../offers/offer.schema';
import { paginate } from 'src/common/helpers/paginate.helper';
@Injectable()
export class OrdersService {
  // ─────────────────────────────────────────────
  // CREATE ORDER FROM CART
  // ─────────────────────────────────────────────
  async createFromCart(req: any, userId: string, dto: any) {
    const Order = getModel(req, 'Order', OrderSchema);
    const Product = getModel(req, 'Product', ProductSchema);
    const Cart = getModel(req, 'Cart', CartSchema);
    const Offer = getModel(req, 'Offer', OfferSchema);
    // 1. Get cart
    const cart = (await Cart.findOne({ user: userId }).lean()) as any;
    if (!cart || !cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }
    // 2. Recalculate total (IMPORTANT)
    let total = 0;
    const items: {
      productId: any;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[] = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`${product.name} is out of stock`);
      }
      const price = product.price * item.quantity;
      total += price;
      items.push({
        productId: product._id,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
        total: product.price * item.quantity,
        quantity: item.quantity,
      });
    }
    // 3. Apply offer (optional)
    let discount = 0;
    if (dto.couponCode) {
      const offer = await Offer.findOne({
        code: dto.couponCode,
        isActive: true,
      });

      if (!offer) {
        throw new BadRequestException('Invalid coupon');
      }

      if (offer.minOrder && total < offer.minOrder) {
        throw new BadRequestException(
          `Minimum order ${offer.minOrder} required`,
        );
      }

      discount = Math.min(offer.discountAmount, total);
    }
    const finalAmount = total - discount;
    // 4. Create order
    const order = await Order.create({
      user: userId,
      items,
      total,
      discount,
      finalAmount,
      status: 'pending',
      paymentStatus: 'pending',
    });
    // 5. Reduce stock (IMPORTANT)
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }
    // 6. Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
    return order;
  }

  // ─────────────────────────────────────────────
  // GET USER ORDERS
  // ─────────────────────────────────────────────
  async getUserOrders(req: any, userId: string) {
    const Order = getModel(req, 'Order', OrderSchema);
    const Product = getModel(req, 'Product', ProductSchema);
    return Order.find({ user: userId })
      .populate({
        path: 'items.product',
        model: Product,
        select: 'name price images',
      })
      .sort({ createdAt: -1 })
      .lean();
  }
  // ─────────────────────────────────────────────
  // GET ALL ORDERS (ADMIN)
  // ─────────────────────────────────────────────
  async findAll(req: any, query: any) {
    const Order = getModel(req, 'Order', OrderSchema);
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    return paginate(Order, filter, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  async findOne(req: any, id: string) {
    const Order = getModel(req, 'Order', OrderSchema);
    const order = await Order.findById(id).lean();
    if (!order) throw new NotFoundException('Order not found');
    return { data: order };
  }
  // ─────────────────────────────────────────────
  // UPDATE ORDER STATUS (ADMIN)
  // ─────────────────────────────────────────────
  async updateStatus(req: any, id: string, status: string) {
    const Order = getModel(req, 'Order', OrderSchema);

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
