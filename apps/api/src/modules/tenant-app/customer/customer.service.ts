// src/modules/tenant-app/customer/customer.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { getModel } from '../../../common/utils/get-model.util';
import { UserSchema } from '../users/user.schema';
import { CartSchema } from '../cart/cart.schema';
import { OrderSchema } from '../orders/order.schema';
import { ProductSchema } from '../products/product.schema';
import { OfferSchema } from '../offers/offer.schema';
import { PaymentSchema } from '../payments/payment.schema';
import {
  AddCartItemDto,
  GuestCartItemDto,
  SelectCartItemsDto,
  CheckoutSummaryDto,
} from '../cart/dto/cart.dto';
import {
  AddressDto,
  CustomerOrdersQueryDto,
  PlaceOrderDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from './dto/customer.dto';
import { paginate } from '../../../common/helpers/paginate.helper';

const TAX_RATE = 0.18;
const FREE_SHIPPING_ABOVE = 999;
const FLAT_SHIPPING_FEE = 99;

function productIdOf(value: any) {
  return value?._id?.toString?.() ?? value?.toString?.();
}

@Injectable()
export class CustomerService {
  // ── Profile ─────────────────────────────────────────────────────────────
  async getProfile(req: any, userId: string) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(userId).populate('wishlist').lean();
    if (!user) throw new NotFoundException('User not found');

    const Order = getModel(req, 'Order', OrderSchema);
    const [totalOrders, spentRaw] = await Promise.all([
      Order.countDocuments({ customerId: userId }),
      Order.aggregate([
        { $match: { customerId: userId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    return {
      success: true,
      data: {
        ...user,
        totalOrders,
        totalSpent: spentRaw[0]?.total ?? 0,
      },
    };
  }

  async updateProfile(req: any, userId: string, dto: UpdateProfileDto) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findByIdAndUpdate(userId, dto, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, message: 'Profile updated', data: user };
  }

  // ── Cart Helpers ────────────────────────────────────────────────────────
  private async findOrCreateCart(req: any, userId: string) {
    const Cart = getModel(req, 'Cart', CartSchema);
    let cart = await Cart.findOne({ userId, status: 'active' });
    if (!cart) {
      cart = await Cart.create({ userId, items: [], status: 'active' });
    }
    return cart;
  }

  private async cartToResponse(req: any, cart: any) {
    await cart.populate('items.productId');

    const items = (cart.items as any[]).map((item: any) => {
      const p = item.productId;
      const livePrice = p?.price ?? item.priceSnapshot;
      const lineTotal = item.quantity * livePrice;
      return {
        productId: p?._id?.toString() ?? item.productId.toString(),
        product: p,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        livePrice,
        lineTotal,
        selected: item.selected,
        priceChanged: livePrice !== item.priceSnapshot,
        priceDelta: livePrice - item.priceSnapshot,
        inStock: (p?.stock ?? 0) >= item.quantity,
        stockAvailable: p?.stock ?? 0,
        stockWarning: (p?.stock ?? 0) <= (p?.lowStockThreshold ?? 5),
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.livePrice, 0);
    const tax = subtotal * TAX_RATE;
    const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : FLAT_SHIPPING_FEE;
    const total = subtotal + tax + shipping;

    const selectedItems = items.filter((i) => i.selected !== false);
    const selectedSubtotal = selectedItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const selectedTax = selectedSubtotal * TAX_RATE;
    const selectedShipping =
      selectedSubtotal > 0 && selectedSubtotal < FREE_SHIPPING_ABOVE
        ? FLAT_SHIPPING_FEE
        : 0;

    return {
      success: true,
      data: {
        cartId: cart.cartId ?? cart._id.toString(),
        items,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal,
        tax,
        shipping,
        total,
        selectedSummary: {
          itemCount: selectedItems.reduce((sum, i) => sum + i.quantity, 0),
          subtotal: selectedSubtotal,
          tax: selectedTax,
          shipping: selectedShipping,
          total: selectedSubtotal + selectedTax + selectedShipping,
          freeShippingEligible: selectedSubtotal >= FREE_SHIPPING_ABOVE,
          freeShippingRemainingAmount:
            selectedSubtotal < FREE_SHIPPING_ABOVE
              ? FREE_SHIPPING_ABOVE - selectedSubtotal
              : 0,
        },
        updatedAt: cart.updatedAt,
        hasPriceChanges: items.some((i) => i.priceChanged),
        hasStockIssues: items.some((i) => !i.inStock),
      },
    };
  }

  // ── Cart Endpoints ──────────────────────────────────────────────────────
  async getCart(req: any, userId: string) {
    const cart = await this.findOrCreateCart(req, userId);
    return this.cartToResponse(req, cart);
  }

  async addToCart(req: any, userId: string, dto: AddCartItemDto) {
    const cart = await this.findOrCreateCart(req, userId);
    const Product = getModel(req, 'Product', ProductSchema);
    const product = await Product.findById(dto.productId);

    if (!product || product.deleted || product.status !== 'active') {
      throw new NotFoundException('Product not available');
    }

    const existing = cart.items.find((i: any) => i.productId.toString() === dto.productId);

    if (existing) {
      existing.quantity += dto.quantity;
      existing.priceSnapshot = product.price;
    } else {
      cart.items.push({
        productId: dto.productId,
        quantity: dto.quantity,
        priceSnapshot: product.price,
        selected: true,
      });
    }

    await cart.save();
    return this.cartToResponse(req, cart);
  }

  async updateCartQty(req: any, userId: string, productId: string, quantity: number) {
    const cart = await this.findOrCreateCart(req, userId);
    const item = cart.items.find((i: any) => i.productId.toString() === productId);
    if (!item) throw new NotFoundException('Item not in cart');

    item.quantity = quantity;
    await cart.save();
    return this.cartToResponse(req, cart);
  }

  async removeFromCart(req: any, userId: string, productId: string) {
    const cart = await this.findOrCreateCart(req, userId);
    cart.items = cart.items.filter((i: any) => i.productId.toString() !== productId);
    await cart.save();
    return this.cartToResponse(req, cart);
  }

  async selectCartItems(req: any, userId: string, dto: SelectCartItemsDto) {
    const cart = await this.findOrCreateCart(req, userId);
    cart.items.forEach((item: any) => {
      if (dto.productIds.includes(item.productId.toString())) {
        item.selected = dto.selected;
      }
    });
    await cart.save();
    return this.cartToResponse(req, cart);
  }

  async toggleSelectAll(req: any, userId: string, selected: boolean) {
    const cart = await this.findOrCreateCart(req, userId);
    cart.items.forEach((item: any) => (item.selected = selected));
    await cart.save();
    return this.cartToResponse(req, cart);
  }

  async syncGuestCart(req: any, userId: string, guestItems: GuestCartItemDto[]) {
    const cart = await this.findOrCreateCart(req, userId);
    const Product = getModel(req, 'Product', ProductSchema);

    for (const gi of guestItems) {
      const product = await Product.findById(gi.productId);
      if (!product || product.deleted || product.status !== 'active') continue;

      const existing = cart.items.find((i: any) => i.productId.toString() === gi.productId);

      if (existing) {
        existing.quantity = Math.max(existing.quantity, gi.quantity);
        if (gi.selected !== false) existing.selected = true;
      } else {
        cart.items.push({
          productId: gi.productId,
          quantity: gi.quantity,
          priceSnapshot: product.price,
          selected: gi.selected !== false,
        });
      }
    }

    await cart.save();
    return this.cartToResponse(req, cart);
  }

  async getCheckoutSummary(req: any, userId: string, dto: CheckoutSummaryDto) {
    const cart = await this.findOrCreateCart(req, userId);
    const Product = getModel(req, 'Product', ProductSchema);

    let items = cart.items as any[];
    if (dto.selectedProductIds?.length) {
      items = items.filter((i) => dto.selectedProductIds!.includes(i.productId.toString()));
    } else {
      items = items.filter((i) => i.selected !== false);
    }

    const enriched = await Promise.all(
      items.map(async (item) => {
        const p = await Product.findById(item.productId).lean();
        const livePrice = p?.price ?? item.priceSnapshot;
        return {
          ...item,
          livePrice,
          priceChanged: livePrice !== item.priceSnapshot,
          inStock: (p?.stock ?? 0) >= item.quantity,
        };
      }),
    );

    const subtotal = enriched.reduce((sum, i) => sum + i.quantity * i.livePrice, 0);
    const tax = subtotal * TAX_RATE;
    const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : FLAT_SHIPPING_FEE;
    const total = subtotal + tax + shipping;

    return {
      success: true,
      data: {
        items: enriched,
        subtotal,
        tax,
        shipping,
        total,
        hasPriceChanges: enriched.some((i) => i.priceChanged),
        hasStockIssues: enriched.some((i) => !i.inStock),
      },
    };
  }

  async clearCart(req: any, userId: string) {
    const Cart = getModel(req, 'Cart', CartSchema);
    await Cart.deleteOne({ userId, status: 'active' });
    return { success: true, message: 'Cart cleared' };
  }

  // ── Place Order ─────────────────────────────────────────────────────────
  async placeOrder(req: any, userId: string, dto: PlaceOrderDto) {
    const Cart = getModel(req, 'Cart', CartSchema);
    const Product = getModel(req, 'Product', ProductSchema);
    const Order = getModel(req, 'Order', OrderSchema);
    const Offer = getModel(req, 'Offer', OfferSchema);
    const User = getModel(req, 'User', UserSchema);

    const cart = await Cart.findOne({ userId, status: 'active' }).populate('items.productId');
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let orderItems: any[] = [];
    const checkedOutProductIds: string[] = [];

    if (dto.productId && dto.quantity) {
      // Buy Now
      const product = await Product.findById(dto.productId);
      if (!product || product.stock < dto.quantity) {
        throw new UnprocessableEntityException('Product unavailable or insufficient stock');
      }
      orderItems.push({
        productId: product._id,
        productName: product.name,
        productSku: product.sku,
        quantity: dto.quantity,
        unitPrice: product.price,
        total: product.price * dto.quantity,
      });
      checkedOutProductIds.push(product._id.toString());
    } else {
      if (!cart?.items?.length) throw new BadRequestException('Cart is empty');
      // Normal Cart Checkout
      let selected = cart.items.filter((i: any) => i.selected !== false);
      if (dto.selectedProductIds?.length) {
        selected = selected.filter((i: any) =>
          dto.selectedProductIds!.includes(productIdOf(i.productId)),
        );
      }

      for (const item of selected) {
        const p = item.productId;
        if (p.stock < item.quantity) {
          throw new UnprocessableEntityException(`Only ${p.stock} left for ${p.name}`);
        }
        orderItems.push({
          productId: p._id,
          productName: p.name,
          productSku: p.sku,
          quantity: item.quantity,
          unitPrice: p.price,
          total: p.price * item.quantity,
        });
        checkedOutProductIds.push(p._id.toString());
      }
    }

    if (!orderItems.length) throw new BadRequestException('No items selected');

    const subtotal = orderItems.reduce((sum, i) => sum + i.total, 0);
    let tax = subtotal * TAX_RATE;
    let shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : FLAT_SHIPPING_FEE;
    let discountAmount = 0;

    if (dto.couponCode) {
      const offer = await Offer.findOne({ code: dto.couponCode.toUpperCase(), status: 'active' });
      if (offer) discountAmount = Math.min(offer.value ?? 0, subtotal);
    }

    const total = subtotal + tax + shipping - discountAmount;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const order = await Order.create({
      orderNumber,
      customerId: userId,
      customerName: user.name || user.phone || 'Customer',
      customerEmail: user.email || `${user.phone || user._id}@customer.local`,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      discountAmount,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: dto.paymentMethod ?? 'online',
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
    });

    if ((dto.paymentMethod ?? 'online') === 'cod') {
      await Promise.all(
        orderItems.map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          }),
        ),
      );
    }

    if (cart && (dto.paymentMethod ?? 'online') === 'cod') {
      cart.items = cart.items.filter(
        (item: any) => !checkedOutProductIds.includes(productIdOf(item.productId)),
      );
      if (cart.items.length) await cart.save();
      else await Cart.deleteOne({ _id: cart._id });
    }

    user.lastOrderAt = new Date();
    await user.save();

    return {
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber || order._id,
        total,
      },
    };
  }

  async getOrders(req: any, userId: string, query: CustomerOrdersQueryDto) {
    const Order = getModel(req, 'Order', OrderSchema);
    const filter: any = { customerId: userId };
    if (query.status) filter.status = query.status;
    return paginate(Order, filter, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  async getPayments(req: any, userId: string, query: any) {
    const Payment = getModel(req, 'Payment', PaymentSchema);
    return paginate(Payment, { userId }, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  async getWishlist(req: any, userId: string) {
    const User = getModel(req, 'User', UserSchema);
    const Product = getModel(req, 'Product', ProductSchema);
    const user = await User.findById(userId).populate({
      path: 'wishlist',
      model: Product,
      match: { deleted: false, status: 'active' },
    });
    if (!user) throw new NotFoundException('User not found');
    return { data: user.wishlist ?? [] };
  }

  async addWishlistItem(req: any, userId: string, productId: string) {
    const User = getModel(req, 'User', UserSchema);
    const Product = getModel(req, 'Product', ProductSchema);
    const product = await Product.findById(productId);
    if (!product || product.deleted) throw new NotFoundException('Product not found');
    await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: product._id } });
    return { message: 'Added to wishlist', data: { productId } };
  }

  async removeWishlistItem(req: any, userId: string, productId: string) {
    const User = getModel(req, 'User', UserSchema);
    await User.findByIdAndUpdate(userId, { $pull: { wishlist: productId } });
    return { message: 'Removed from wishlist', data: { productId } };
  }

  async syncWishlist(req: any, userId: string, productIds: string[]) {
    const User = getModel(req, 'User', UserSchema);
    const Product = getModel(req, 'Product', ProductSchema);
    const products = await Product.find({
      _id: { $in: productIds },
      deleted: false,
      status: 'active',
    }).select('_id');
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: { $each: products.map((p: any) => p._id) } },
    });
    return { synced: products.length };
  }

  async getAddresses(req: any, userId: string) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    return { data: user.addresses ?? [] };
  }

  async addAddress(req: any, userId: string, dto: AddressDto) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (dto.isDefault || !user.addresses?.length) {
      user.addresses.forEach((a: any) => (a.isDefault = false));
      dto.isDefault = true;
    }
    user.addresses.push(dto as any);
    await user.save();
    const address = user.addresses[user.addresses.length - 1];
    return { message: 'Address added', data: address };
  }

  async updateAddress(req: any, userId: string, id: string, dto: UpdateAddressDto) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const address = user.addresses.id(id);
    if (!address) throw new NotFoundException('Address not found');
    if (dto.isDefault) user.addresses.forEach((a: any) => (a.isDefault = false));
    Object.assign(address, dto);
    await user.save();
    return { message: 'Address updated', data: address };
  }

  async deleteAddress(req: any, userId: string, id: string) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const before = user.addresses.length;
    user.addresses = user.addresses.filter((a: any) => a._id.toString() !== id);
    if (before === user.addresses.length) throw new NotFoundException('Address not found');
    if (user.addresses.length && !user.addresses.some((a: any) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    return { message: 'Address deleted', data: null };
  }

  async setDefaultAddress(req: any, userId: string, id: string) {
    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const address = user.addresses.id(id);
    if (!address) throw new NotFoundException('Address not found');
    user.addresses.forEach((a: any) => (a.isDefault = a._id.toString() === id));
    await user.save();
    return { message: 'Default address updated', data: address };
  }
}
