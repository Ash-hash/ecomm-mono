// ─── offers/offers.controller.ts ─────────────────────────────────────────────
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import {
  CreateOfferDto,
  UpdateOfferDto,
  OffersQueryDto,
  ApplyCouponDto,
} from './dto/offers.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/common/guards/roles.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC  /api/offers/public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * No auth required — storefront promotions strip, homepage banners.
 *
 * GET /api/offers/public
 */
@Public()
@Controller('offers')
export class PublicOffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('public')
  getPublic() {
    return this.offersService.getPublicOffers();
  }
    // GET /offers/validate?code=SUMMER20&subtotal=1500
  // PUBLIC — no auth required. Checks only identity-agnostic rules.
  @Get('validate')
  @Public()
  validatePublic(
    @Query('code') code: string,
    @Query('subtotal') subtotal: string,
  ) {
    return this.offersService.validatePublicOffer(
      code,
      parseFloat(subtotal) || 0,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER  /api/offers/apply
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticated customers apply a coupon during checkout.
 *
 * POST /api/offers/apply
 *   — validates without redeeming; returns discount amount for the order summary.
 */
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerOffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('apply')
  @HttpCode(200)
  apply(@RequestContext() ctx, @Body() dto: ApplyCouponDto) {
    return this.offersService.validateCoupon(ctx.user.sub, dto);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  /api/offers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET    /api/offers                  — paginated list (search, type, status, isPublic)
 * GET    /api/offers/analytics        — redemption analytics
 * GET    /api/offers/:id              — single offer detail
 * GET    /api/offers/:id/usages       — paginated usage log
 * POST   /api/offers                  — create new offer
 * PATCH  /api/offers/:id              — update offer
 * PATCH  /api/offers/:id/toggle       — quick active ↔ inactive toggle
 * DELETE /api/offers/:id              — delete (or deactivate if has history)
 */
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminOffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  findAll(@Query() q: OffersQueryDto) {
    return this.offersService.findAll(q);
  }

  @Get('analytics')
  analytics() {
    return this.offersService.getAnalytics();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.offersService.findOne(id);
  }

  @Get(':id/usages')
  getUsages(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.offersService.getUsages(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post()
  @HttpCode(201)
  create(@RequestContext() ctx, @Body() dto: CreateOfferDto) {
    return this.offersService.create(dto, ctx.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offersService.update(id, dto);
  }

  @Patch(':id/toggle')
  @HttpCode(200)
  toggle(@Param('id', ParseObjectIdPipe) id: string) {
    return this.offersService.toggleStatus(id);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.offersService.remove(id);
  }


}
