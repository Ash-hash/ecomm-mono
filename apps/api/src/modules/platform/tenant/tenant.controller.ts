// ─── tenant/tenant.controller.ts ─────────────────────────────────────────────
import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, Req, Res, HttpCode, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TenantService } from './tenant.service';
import {
  RegisterTenantDto, ConnectRazorpayDto, UpdateTenantDto,
  OverridePlanDto, SuspendTenantDto, InitiateSaasPaymentDto,
  VerifySaasPaymentDto, TenantsQueryDto,
} from './dto/tenant.dto';
import { Roles, RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';

/**
 * ── Public ────────────────────────────────────────────────────────────────────
 * POST  /api/tenants/register           — new store registration
 * POST  /api/tenants/:slug/login         — tenant admin login
 * GET   /api/tenants/plans               — available SaaS plans
 *
 * ── Tenant (authenticated) ───────────────────────────────────────────────────
 * GET   /api/tenants/me                  — current tenant info
 * POST  /api/tenants/me/payment/initiate — start SaaS plan payment
 * POST  /api/tenants/me/payment/verify   — verify & activate plan
 * POST  /api/tenants/me/razorpay         — connect store's Razorpay keys
 * GET   /api/tenants/me/billing          — billing history
 *
 * ── Super-Admin ───────────────────────────────────────────────────────────────
 * GET   /api/tenants                     — list all tenants
 * GET   /api/tenants/stats               — platform stats
 * GET   /api/tenants/:id                 — single tenant detail
 * PATCH /api/tenants/:id                 — update tenant meta
 * PATCH /api/tenants/:id/plan            — override plan
 * PATCH /api/tenants/:id/suspend         — suspend
 * PATCH /api/tenants/:id/reactivate      — reactivate
 * DELETE /api/tenants/:id                — delete + drop DB
 */
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('plans')
  getPlans() {
    const { TENANT_PLANS } = require('./tenant.schema');
    return {
      data: Object.entries(TENANT_PLANS).map(([key, plan]: [string, any]) => ({
        key,
        name:         plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice:  plan.annualPrice,
        onetimePrice: plan.onetimePrice,
        limits:       plan.limits,
      })),
    };
  }

  @Public()
  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterTenantDto, @Res({ passthrough: true }) res: Response) {
    return this.tenantService.register(dto, res);
  }

  @Public()
  @Post(':slug/login')
  @HttpCode(200)
  tenantLogin(
    @Param('slug') slug: string,
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.tenantService.tenantAdminLogin(slug, body.email, body.password, res);
  }

  // ── Current tenant (authenticated) ─────────────────────────────────────────

  @Get('me')
  getMe(@RequestContext() user: any) {
    return this.tenantService.findOne(user.tenantId);
  }

  @Get('me/billing')
  getBilling(@RequestContext() ctx) {
    return this.tenantService.findOne(ctx.user.tenantId).then((r: any) => ({
      data: r.data?.billingHistory ?? [],
    }));
  }

  @Post('me/payment/initiate')
  @HttpCode(200)
  initiatePayment(@RequestContext() ctx, @Body() dto: InitiateSaasPaymentDto) {
    return this.tenantService.initiatePayment(ctx.user.tenantId, dto);
  }

  @Post('me/payment/verify')
  @HttpCode(200)
  verifyPayment(@RequestContext() ctx, @Body() dto: VerifySaasPaymentDto) {
    return this.tenantService.verifyPayment(ctx.user.tenantId, dto);
  }

  @Post('me/razorpay')
  @HttpCode(200)
  connectRazorpay(@RequestContext() ctx, @Body() dto: ConnectRazorpayDto) {
    return this.tenantService.connectRazorpay(ctx.user.tenantId, dto);
  }

  // ── Super-Admin ─────────────────────────────────────────────────────────────

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getStats() {
    return this.tenantService.getSuperAdminStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  findAll(@Query() query: TenantsQueryDto) {
    return this.tenantService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Patch(':id/plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  overridePlan(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: OverridePlanDto) {
    return this.tenantService.overridePlan(id, dto);
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @HttpCode(200)
  suspend(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: SuspendTenantDto) {
    return this.tenantService.suspend(id, dto);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @HttpCode(200)
  reactivate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantService.reactivate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @HttpCode(200)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantService.remove(id);
  }
}
