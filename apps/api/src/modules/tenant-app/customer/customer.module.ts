// ─── customer.module.ts ───────────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema }                   from '../users/user.schema';
import { Order, OrderSchema }                 from '../orders/order.schema';
import { Payment, PaymentSchema }             from '../payments/payment.schema';
import { Product, ProductSchema }             from '../products/product.schema';
import { CustomerController }                 from './customer.controller';
import { CustomerService }                    from './customer.service';
import { RazorpayService } from '../payments/razorpay.service';
import { OffersModule } from '../offers/offers.module';
import { CartModule } from '../cart/cart.module';
import { Cart, CartSchema } from '../cart/cart.schema';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,         schema: UserSchema },
      { name: Order.name,        schema: OrderSchema },
      { name: Payment.name,      schema: PaymentSchema },
      { name: Product.name,      schema: ProductSchema },
      { name: Cart.name,         schema: CartSchema },  
    ]),
    CartModule, 
    OffersModule,
    SubscriptionsModule,
  ],
  controllers: [CustomerController],
  providers:   [CustomerService , RazorpayService],
})
export class CustomerModule {}
