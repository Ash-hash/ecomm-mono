// src/modules/tenant-app/customer/customer.controller.ts
import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  UpdateProfileDto,
  PlaceOrderDto,
  CustomerOrdersQueryDto,
  AddressDto,
  UpdateAddressDto,
  UpgradePlanDto,
} from './dto/customer.dto';
import {  RequestContext } from '../../../common/decorators/request-context.decorator';
import {
  AddCartItemDto,
  UpdateCartItemDto,
  SelectCartItemsDto,
  GuestCartItemDto,
  CheckoutSummaryDto,
} from '../cart/dto/cart.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('customer')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // ── Profile ─────────────────────────────────────────────────────────────
  @Get('profile')
  getProfile(@RequestContext() ctx) {
    return this.customerService.getProfile(ctx.req, ctx.user.sub);
  }

  @Patch('profile')
  updateProfile(@RequestContext() ctx, @Body() dto: UpdateProfileDto) {
    return this.customerService.updateProfile(ctx.req, ctx.user.sub, dto);
  }

  // ── Cart ────────────────────────────────────────────────────────────────
  @Get('cart')
  getCart(@RequestContext() ctx) {
    return this.customerService.getCart(ctx.req, ctx.user.sub);
  }

  @Post('cart/items')
  @HttpCode(201)
  addToCart(@RequestContext() ctx, @Body() dto: AddCartItemDto) {
    return this.customerService.addToCart(ctx.req, ctx.user.sub, dto);
  }

  @Patch('cart/items/selection')
  selectCartItems(@RequestContext() ctx, @Body() dto: SelectCartItemsDto) {
    return this.customerService.selectCartItems(ctx.req, ctx.user.sub, dto);
  }

  @Patch('cart/items/:productId')
  updateCartQty(
    @RequestContext() ctx,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.customerService.updateCartQty(ctx.req, ctx.user.sub, productId, dto.quantity);
  }

  @Delete('cart/items/:productId')
  @HttpCode(200)
  removeFromCart(@RequestContext() ctx, @Param('productId') productId: string) {
    return this.customerService.removeFromCart(ctx.req, ctx.user.sub, productId);
  }

  @Patch('cart/select-all')
  @HttpCode(200)
  selectAll(@RequestContext() ctx) {
    return this.customerService.toggleSelectAll(ctx.req, ctx.user.sub, true);
  }

  @Patch('cart/deselect-all')
  @HttpCode(200)
  deselectAll(@RequestContext() ctx) {
    return this.customerService.toggleSelectAll(ctx.req, ctx.user.sub, false);
  }

  @Post('cart/sync')
  @HttpCode(200)
  syncGuestCart(@RequestContext() ctx, @Body() body: { items: GuestCartItemDto[] }) {
    return this.customerService.syncGuestCart(ctx.req, ctx.user.sub, body.items || []);
  }

  @Post('cart/checkout-summary')
  @HttpCode(200)
  checkoutSummary(@RequestContext() ctx, @Body() dto: CheckoutSummaryDto) {
    return this.customerService.getCheckoutSummary(ctx.req, ctx.user.sub, dto);
  }

  @Delete('cart')
  @HttpCode(200)
  clearCart(@RequestContext() ctx) {
    return this.customerService.clearCart(ctx.req, ctx.user.sub);
  }

  // ── Orders ──────────────────────────────────────────────────────────────
  @Post('orders')
  @HttpCode(201)
  placeOrder(@RequestContext() ctx, @Body() dto: PlaceOrderDto) {
    return this.customerService.placeOrder(ctx.req, ctx.user.sub, dto);
  }

  @Get('orders')
  getOrders(@RequestContext() ctx, @Query() query: CustomerOrdersQueryDto) {
    return this.customerService.getOrders(ctx.req, ctx.user.sub, query);
  }

  @Get('payments')
  getPayments(@RequestContext() ctx, @Query() query: any) {
    return this.customerService.getPayments(ctx.req, ctx.user.sub, query);
  }

  @Get('wishlist')
  getWishlist(@RequestContext() ctx) {
    return this.customerService.getWishlist(ctx.req, ctx.user.sub);
  }

  @Post('wishlist/items')
  @HttpCode(201)
  addWishlistItem(@RequestContext() ctx, @Body('productId') productId: string) {
    return this.customerService.addWishlistItem(ctx.req, ctx.user.sub, productId);
  }

  @Delete('wishlist/items/:productId')
  @HttpCode(200)
  removeWishlistItem(@RequestContext() ctx, @Param('productId') productId: string) {
    return this.customerService.removeWishlistItem(ctx.req, ctx.user.sub, productId);
  }

  @Post('wishlist/sync')
  @HttpCode(200)
  syncWishlist(@RequestContext() ctx, @Body() body: { productIds: string[] }) {
    return this.customerService.syncWishlist(ctx.req, ctx.user.sub, body.productIds ?? []);
  }

  @Get('addresses')
  getAddresses(@RequestContext() ctx) {
    return this.customerService.getAddresses(ctx.req, ctx.user.sub);
  }

  @Post('addresses')
  @HttpCode(201)
  addAddress(@RequestContext() ctx, @Body() dto: AddressDto) {
    return this.customerService.addAddress(ctx.req, ctx.user.sub, dto);
  }

  @Patch('addresses/:id')
  updateAddress(@RequestContext() ctx, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.customerService.updateAddress(ctx.req, ctx.user.sub, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(200)
  deleteAddress(@RequestContext() ctx, @Param('id') id: string) {
    return this.customerService.deleteAddress(ctx.req, ctx.user.sub, id);
  }

  @Patch('addresses/:id/default')
  setDefaultAddress(@RequestContext() ctx, @Param('id') id: string) {
    return this.customerService.setDefaultAddress(ctx.req, ctx.user.sub, id);
  }

  @Get('subscription')
  activeSubscription(@RequestContext() ctx) {
    return this.subscriptionsService.activeForCustomer(ctx.req, ctx.user.sub);
  }

  @Get('subscription/history')
  subscriptionHistory(@RequestContext() ctx) {
    return this.subscriptionsService.historyForCustomer(ctx.req, ctx.user.sub);
  }

  @Get('subscription/compare')
  comparePlans(@RequestContext() ctx) {
    return this.subscriptionsService.compareForCustomer(ctx.req, ctx.user.sub);
  }

  @Post('subscription/upgrade')
  @HttpCode(200)
  upgradeSubscription(@RequestContext() ctx, @Body() dto: UpgradePlanDto) {
    return this.subscriptionsService.upgradeCustomer(ctx.req, ctx.user.sub, dto);
  }

  @Delete('subscription')
  @HttpCode(200)
  cancelSubscription(@RequestContext() ctx) {
    return this.subscriptionsService.cancelCustomer(ctx.req, ctx.user.sub);
  }

  @Post('subscription/reactivate')
  @HttpCode(200)
  reactivateSubscription(@RequestContext() ctx) {
    return this.subscriptionsService.reactivateCustomer(ctx.req, ctx.user.sub);
  }
}
