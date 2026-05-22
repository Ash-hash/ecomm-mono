// ─── offers/offers.module.ts ──────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Offer, OfferSchema }   from './offer.schema';
import { Order, OrderSchema }   from '../orders/order.schema';
import { User,  UserSchema  }   from '../users/user.schema';
import {
  PublicOffersController,
  CustomerOffersController,
  AdminOffersController,
} from './offers.controller';
import { OffersService } from './offers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name,  schema: UserSchema  },
    ]),
  ],
  controllers: [
    PublicOffersController,    // GET /offers/public        — no auth
    CustomerOffersController,  // POST /offers/apply        — authed customer
    AdminOffersController,     // CRUD /offers              — admin only
  ],
  providers: [OffersService],
  exports:   [OffersService],  // exported so OrdersService can call redeemCoupon()
})
export class OffersModule {}