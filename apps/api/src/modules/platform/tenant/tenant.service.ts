// ─── tenant/tenant.service.ts ─────────────────────────────────────────────────
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

import { Tenant, TenantDocument, TENANT_PLANS } from './tenant.schema';
import {
  RegisterTenantDto,
  ConnectRazorpayDto,
  UpdateTenantDto,
  OverridePlanDto,
  SuspendTenantDto,
  InitiateSaasPaymentDto,
  VerifySaasPaymentDto,
  TenantsQueryDto,
} from './dto/tenant.dto';
import { UserSchema } from 'src/modules/tenant-app/users/user.schema';
import { ProductSchema } from 'src/modules/tenant-app/products/product.schema';
import { CategorySchema } from 'src/modules/tenant-app/categories/category.schema';
import { OrderSchema } from 'src/modules/tenant-app/orders/order.schema';
import { CartSchema } from 'src/modules/tenant-app/cart/cart.schema';
import { OfferSchema } from 'src/modules/tenant-app/offers/offer.schema';
import { StoreConfigSchema } from 'src/modules/tenant-app/store/store-config.schema';
import { SubscriptionSchema } from 'src/modules/tenant-app/subscriptions/subscription.schema';
import { PaymentSchema } from 'src/modules/tenant-app/payments/payment.schema';

@Injectable()
export class TenantService {
  private readonly saasRzp: Razorpay;

  private readonly saasKey: string;
  private readonly saasSecret: string;

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('SAAS_RAZORPAY_KEY_ID');
    const secret = this.config.get<string>('SAAS_RAZORPAY_KEY_SECRET');

    if (!key || !secret) {
      throw new Error('❌ SAAS Razorpay keys missing');
    }

    this.saasKey = key;
    this.saasSecret = secret;

    this.saasRzp = new Razorpay({
      key_id: key,
      key_secret: secret,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Registration / Onboarding
  // ═══════════════════════════════════════════════════════════════════════════

  async register(dto: RegisterTenantDto, res: any) {
    // Check slug uniqueness
    const slugExists = await this.tenantModel.findOne({
      slug: dto.slug.toLowerCase(),
    });
    if (slugExists)
      throw new ConflictException(`Store slug "${dto.slug}" is already taken`);

    const emailExists = await this.tenantModel.findOne({
      ownerEmail: dto.ownerEmail.toLowerCase(),
    });
    if (emailExists) throw new ConflictException('Email already registered');

    // Generate unique DB name for this tenant
    const dbName = `tenant_${dto.slug.replace(/-/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;

    // Create tenant record first
    const plan = dto.plan ?? 'starter';
    const planDetails = TENANT_PLANS[plan];
    const tenant = await this.tenantModel.create({
      storeName: dto.storeName,
      slug: dto.slug.toLowerCase(),
      ownerEmail: dto.ownerEmail.toLowerCase(),
      ownerName: dto.ownerName,
      ownerPhone: dto.ownerPhone,
      plan,
      billingCycle: dto.billingCycle ?? 'monthly',
      status: 'trial',
      dbName,
      limits: planDetails.limits,
      trialEndsAt: new Date(Date.now() + 14 * 86400_000),
      monthlyAmount: planDetails.monthlyPrice,
    });

    // Provision tenant database + seed admin user
    const { adminUser } = await this.provisionTenantDb(
      tenant,
      dto.ownerName,
      dto.ownerEmail,
      dto.password,
    );

    // Update tenant with ownerUserId
    tenant.ownerUserId = new Types.ObjectId(adminUser._id);
    await tenant.save();

    // Issue tokens for immediate login to their admin panel
    const tokens = await this.issueTenantTokens(
      tenant,
      adminUser._id.toString(),
      'admin',
    );
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      message: 'Store registered! 14-day free trial started.',
      data: {
        tenant: {
          id: tenant._id,
          slug: tenant.slug,
          storeName: tenant.storeName,
          plan: tenant.plan,
          status: tenant.status,
          trialEndsAt: tenant.trialEndsAt,
        },
        accessToken: tokens.accessToken,
        adminPanelUrl: `http://${tenant.slug}.yoursaas.com/dashboard`,
      },
    };
  }

  // ── Provision tenant DB with schemas + seed admin ─────────────────────────
  private async provisionTenantDb(
    tenant: TenantDocument,
    name: string,
    email: string,
    password: string,
  ) {
    const tenantConn = this.connection.useDb(tenant.dbName, { useCache: true });



    // Register models in tenant DB
    const UserModel = tenantConn.model('User', UserSchema);
    tenantConn.model('Product', ProductSchema);
    tenantConn.model('Category', CategorySchema);
    tenantConn.model('Order', OrderSchema);
    tenantConn.model('Cart', CartSchema);
    tenantConn.model('Offer', OfferSchema);
    tenantConn.model('StoreConfig', StoreConfigSchema);
    tenantConn.model('Subscription', SubscriptionSchema);
    tenantConn.model('Payment', PaymentSchema);

    await UserModel.collection.dropIndex('addresses.phone_1').catch(() => undefined);

    // Seed admin user
    const hash = await bcrypt.hash(password, 12);
    const adminUser = await UserModel.create({
      name: name,
      email: email.toLowerCase(),
      passwordHash: hash,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });

    // Seed default store config
    const StoreConfigModel = tenantConn.model('StoreConfig');
    await StoreConfigModel.create({
      storeName: tenant.storeName,
      storeEmail: email.toLowerCase(),
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      taxRate: 0.18,
      shippingFlatRate: 99,
      freeShippingThreshold: 999,
      allowGuestCheckout: true,
    });

    return { adminUser };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Tenant Login (for their admin panel)
  // ═══════════════════════════════════════════════════════════════════════════

  async tenantAdminLogin(
    slug: string,
    email: string,
    password: string,
    res: any,
  ) {
    const tenant = await this.tenantModel.findOne({ slug: slug.toLowerCase() });
    if (!tenant) throw new NotFoundException('Store not found');

    if (tenant.status === 'suspended')
      throw new ForbiddenException(
        `Store suspended: ${tenant.suspensionReason}`,
      );
    if (tenant.status === 'cancelled')
      throw new ForbiddenException('Store account has been cancelled');

    // Get tenant DB connection
    const tenantConn = this.connection.useDb(tenant.dbName, { useCache: true });
  
    const UserModel = tenantConn.model('User', UserSchema);

    const user = await UserModel.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash +refreshToken',
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!['admin', 'super_admin'].includes(user.role))
      throw new ForbiddenException('Admin access required');

    const tokens = await this.issueTenantTokens(
      tenant,
      user._id.toString(),
      user.role,
    );
    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Update last active
    await this.tenantModel.findByIdAndUpdate(tenant._id, {
      lastActiveAt: new Date(),
    });

    return {
      message: 'Login successful',
      data: {
        tenant: {
          slug: tenant.slug,
          storeName: tenant.storeName,
          plan: tenant.plan,
          status: tenant.status,
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SaaS Payment — Tenant subscribes to a plan
  // ═══════════════════════════════════════════════════════════════════════════

  async initiatePayment(tenantId: string, dto: InitiateSaasPaymentDto) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const planDetails = TENANT_PLANS[dto.plan];
    const amount =
      dto.billingCycle === 'annual'
        ? planDetails.annualPrice
        : dto.billingCycle === 'onetime'
          ? planDetails.onetimePrice
          : planDetails.monthlyPrice;

    const rzpOrder = await this.saasRzp.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `saas_${tenantId}_${Date.now()}`,
      notes: {
        tenantId: tenantId,
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        storeName: tenant.storeName,
      },
    });

    return {
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: this.saasKey,
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        planName: planDetails.name,
        storeName: tenant.storeName,
      },
    };
  }

  async verifyPayment(tenantId: string, dto: VerifySaasPaymentDto) {
    // Verify Razorpay signature
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', this.saasSecret)
      .update(body)
      .digest('hex');
    if (expected !== dto.razorpaySignature)
      throw new BadRequestException('Payment verification failed');

    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const planDetails = TENANT_PLANS[dto.plan];
    const amount =
      dto.billingCycle === 'annual'
        ? planDetails.annualPrice
        : dto.billingCycle === 'onetime'
          ? planDetails.onetimePrice
          : planDetails.monthlyPrice;

    const now = new Date();
    const periodStart = now;
    const periodEnd =
      dto.billingCycle === 'annual'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : dto.billingCycle === 'onetime'
          ? new Date(now.getFullYear() + 100, 0, 1) // effectively perpetual
          : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    tenant.plan = dto.plan;
    tenant.billingCycle = dto.billingCycle;
    tenant.status = 'active';
    tenant.limits = planDetails.limits as any;
    tenant.monthlyAmount = planDetails.monthlyPrice;
    tenant.currentPeriodStart = periodStart;
    tenant.currentPeriodEnd = periodEnd;
    tenant.billingHistory.push({
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpayOrderId: dto.razorpayOrderId,
      amount: amount * 100,
      status: 'paid',
      paidAt: now,
      description: `${planDetails.name} plan — ${dto.billingCycle}`,
    });

    await tenant.save();

    return {
      message: `Subscribed to ${planDetails.name} plan!`,
      data: {
        tenant: {
          id: tenant._id,
          plan: tenant.plan,
          status: tenant.status,
          currentPeriodEnd: tenant.currentPeriodEnd,
        },
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Razorpay Integration for Tenant
  // ═══════════════════════════════════════════════════════════════════════════

  async connectRazorpay(tenantId: string, dto: ConnectRazorpayDto) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Test the credentials with a minimal API call
    try {
      const rzp = new Razorpay({
        key_id: dto.keyId,
        key_secret: dto.keySecret,
      });
      await rzp.orders.all({ count: 1 }); // lightweight call to verify creds
    } catch {
      throw new BadRequestException(
        'Invalid Razorpay credentials — please check your Key ID and Secret',
      );
    }

    tenant.razorpay = {
      keyId: dto.keyId,
      keySecret: dto.keySecret,
      isVerified: true,
      verifiedAt: new Date(),
    };
    await tenant.save();

    return {
      message: 'Razorpay connected and verified!',
      data: { isVerified: true, keyId: dto.keyId },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Super-Admin: Tenant CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async findAll(query: TenantsQueryDto) {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { storeName: { $regex: query.search, $options: 'i' } },
        { ownerEmail: { $regex: query.search, $options: 'i' } },
        { ownerName: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.status) filter.status = query.status;
    if (query.plan) filter.plan = query.plan;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.tenantModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.tenantModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const tenant = await this.tenantModel.findById(id).lean();
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Attach live metrics from tenant DB
    try {
      const tenantConn = this.connection.useDb(tenant.dbName, {
        useCache: true,
      });

      const UserModel = tenantConn.model('User', UserSchema);
      const OrderModel = tenantConn.model('Order', OrderSchema);
      const ProductModel = tenantConn.model('Product', ProductSchema);

      const [customers, orders, products, revenueRaw] = await Promise.all([
        UserModel.countDocuments({ role: 'customer' }),
        OrderModel.countDocuments({}),
        ProductModel.countDocuments({ deleted: false }),
        OrderModel.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

      return {
        data: {
          ...tenant,
          metrics: {
            customers,
            orders,
            products,
            revenue: revenueRaw[0]?.total ?? 0,
          },
        },
      };
    } catch {
      return { data: { ...tenant, metrics: null } };
    }
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return { message: 'Tenant updated', data: tenant };
  }

  async overridePlan(id: string, dto: OverridePlanDto) {
    const tenant = await this.tenantModel.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const planDetails = TENANT_PLANS[dto.plan];
    const now = new Date();
    const periodEnd =
      dto.billingCycle === 'annual'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : dto.billingCycle === 'onetime'
          ? new Date(now.getFullYear() + 100, 0, 1)
          : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    tenant.plan = dto.plan;
    tenant.billingCycle = dto.billingCycle;
    tenant.status = 'active';
    tenant.limits = planDetails.limits as any;
    tenant.monthlyAmount = dto.customAmount ?? planDetails.monthlyPrice;
    tenant.currentPeriodStart = now;
    tenant.currentPeriodEnd = periodEnd;

    await tenant.save();
    return { message: `Plan overridden to ${dto.plan}`, data: tenant };
  }

  async suspend(id: string, dto: SuspendTenantDto) {
    const tenant = await this.tenantModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'suspended',
          suspensionReason: dto.reason ?? '',
          suspendedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return { message: 'Tenant suspended', data: tenant };
  }

  async reactivate(id: string) {
    const tenant = await this.tenantModel.findByIdAndUpdate(
      id,
      { $set: { status: 'active', suspensionReason: '', suspendedAt: null } },
      { new: true },
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return { message: 'Tenant reactivated', data: tenant };
  }

  async remove(id: string) {
    const tenant = await this.tenantModel.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Drop tenant database entirely
    try {
      const tenantConn = this.connection.useDb(tenant.dbName, {
        useCache: true,
      });
      await tenantConn.dropDatabase();
    } catch {
      /* ok if DB doesn't exist yet */
    }

    await this.tenantModel.findByIdAndDelete(id);
    return { message: 'Tenant and all data permanently deleted', data: null };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Super-Admin Dashboard Stats
  // ═══════════════════════════════════════════════════════════════════════════

  async getSuperAdminStats() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      newThisMonth,
      newLastMonth,
      planBreakdown,
      recentTenants,
    ] = await Promise.all([
      this.tenantModel.countDocuments({}),
      this.tenantModel.countDocuments({ status: 'active' }),
      this.tenantModel.countDocuments({ status: 'trial' }),
      this.tenantModel.countDocuments({ status: 'suspended' }),
      this.tenantModel.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      this.tenantModel.countDocuments({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),
      this.tenantModel.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
      this.tenantModel.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Sum MRR from active tenants
    const mrrRaw = await this.tenantModel.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, mrr: { $sum: '$monthlyAmount' } } },
    ]);

    const mrr = mrrRaw[0]?.mrr ?? 0;
    const pct = (a: number, b: number) =>
      b === 0 ? 0 : parseFloat((((a - b) / b) * 100).toFixed(1));

    return {
      data: {
        overview: {
          totalTenants,
          activeTenants,
          trialTenants,
          suspendedTenants,
          newThisMonth,
          newLastMonth,
          newDelta: pct(newThisMonth, newLastMonth),
          mrr,
          arr: mrr * 12,
        },
        planBreakdown: planBreakdown.map((p: any) => ({
          plan: p._id,
          count: p.count,
        })),
        recentTenants,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Tenant context resolver (used by middleware)
  // ═══════════════════════════════════════════════════════════════════════════

  async resolveBySlug(slug: string): Promise<TenantDocument | null> {
    return this.tenantModel
      .findOne({ slug: slug.toLowerCase() })
      .select('+razorpay.keySecret');
  }

  async resolveById(id: string): Promise<TenantDocument | null> {
    return this.tenantModel.findById(id).select('+razorpay.keySecret');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Token helpers
  // ═══════════════════════════════════════════════════════════════════════════

  private async issueTenantTokens(
    tenant: TenantDocument,
    userId: string,
    role: string,
  ) {
    const payload = {
      sub: userId,
      tenantId: tenant._id.toString(),
      slug: tenant.slug,
      dbName: tenant.dbName,
      role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private setAuthCookies(
  res: any,
  accessToken: string,
  refreshToken: string,
) {
  const isProd = this.config.get('NODE_ENV') === 'production';

  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookie('tenant_access_token', accessToken, {
    ...opts,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('tenant_refresh_token', refreshToken, {
    ...opts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // cleanup old cookies
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}
}
