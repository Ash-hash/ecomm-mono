/* eslint-disable @typescript-eslint/no-unused-expressions */
// ─── tenant/tenant.service.ts ─────────────────────────────────────────────────
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
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
  private readonly logger = new Logger(TenantService.name);
  private readonly saasRzp: Razorpay | null;

  private readonly saasKey: string | null;
  private readonly saasSecret: string | null;

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('SAAS_RAZORPAY_KEY_ID');
    const secret = this.config.get<string>('SAAS_RAZORPAY_KEY_SECRET');

    this.saasKey = key ?? null;
    this.saasSecret = secret ?? null;
    this.saasRzp =
      key && secret
        ? new Razorpay({
            key_id: key,
            key_secret: secret,
          })
        : null;
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
      customDomain: dto.customDomain ?? '',
      logoUrl: dto.logoUrl ?? '',
      razorpay: dto.razorpay
        ? {
            keyId: dto.razorpay.keyId,
            keySecret: dto.razorpay.keySecret,
            isVerified: false,
            verifiedAt: null,
          }
        : null,
    });

    // Provision tenant database + seed admin user
    const { adminUser } = await this.provisionTenantDb(
      tenant,
      dto.ownerName,
      dto.ownerEmail,
      dto.password,
      {
        logoUrl: dto.logoUrl,
      },
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
    options: { logoUrl?: string } = {},
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
      storeLogo: options.logoUrl ?? tenant.logoUrl ?? '',
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
    if (!this.saasRzp || !this.saasKey) {
      throw new BadRequestException(
        'SaaS Razorpay is not configured. Add SAAS_RAZORPAY_KEY_ID and SAAS_RAZORPAY_KEY_SECRET to enable paid plan checkout.',
      );
    }

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
    if (!this.saasSecret) {
      throw new BadRequestException(
        'SaaS Razorpay is not configured. Add SAAS_RAZORPAY_KEY_SECRET to verify paid plan checkout.',
      );
    }

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

 

  async seedDemoTenants(): Promise<void> {
    if (this.config.get<string>('SEED_DEMO_TENANTS', 'true') === 'false') {
      return;
    }

    const demos = this.getDemoTenantCatalogs();

    for (const demo of demos) {
      const existing = await this.tenantModel.findOne({ slug: demo.slug });
      const tenant =
        existing ??
        (await this.tenantModel.create({
          storeName: demo.storeName,
          slug: demo.slug,
          ownerEmail: demo.ownerEmail,
          ownerName: demo.ownerName,
          ownerPhone: demo.ownerPhone,
          plan: 'growth',
          billingCycle: 'monthly',
          status: 'active',
          dbName: `tenant_${demo.slug.replace(/-/g, '_')}`,
          logoUrl: demo.logoUrl,
          customDomain: demo.customDomain,
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          limits: TENANT_PLANS.growth.limits,
          trialEndsAt: new Date(Date.now() + 30 * 86400_000),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400_000),
          monthlyAmount: TENANT_PLANS.growth.monthlyPrice,
          onboardingComplete: true,
          razorpay: null,
        }));

      await this.seedDemoTenantDb(tenant, demo);
    }
  }

  private async seedDemoTenantDb(tenant: TenantDocument, demo: DemoTenantSeed) {
    const tenantConn = this.connection.useDb(tenant.dbName, { useCache: true });
    const UserModel = (tenantConn.models.User ?? tenantConn.model('User', UserSchema)) as any;
    const CategoryModel =
      (tenantConn.models.Category ?? tenantConn.model('Category', CategorySchema)) as any;
    const ProductModel =
      (tenantConn.models.Product ?? tenantConn.model('Product', ProductSchema)) as any;
    const StoreConfigModel =
      (tenantConn.models.StoreConfig ??
      tenantConn.model('StoreConfig', StoreConfigSchema)) as any;
    tenantConn.models.Order ?? tenantConn.model('Order', OrderSchema);
    tenantConn.models.Cart ?? tenantConn.model('Cart', CartSchema);
    tenantConn.models.Offer ?? tenantConn.model('Offer', OfferSchema);
    tenantConn.models.Subscription ??
      tenantConn.model('Subscription', SubscriptionSchema);
    tenantConn.models.Payment ?? tenantConn.model('Payment', PaymentSchema);

    await UserModel.collection.dropIndex('addresses.phone_1').catch(() => undefined);

    const passwordHash = await bcrypt.hash(demo.adminPassword, 12);
    const adminUser = await UserModel.findOneAndUpdate(
      { email: demo.ownerEmail },
      {
        $setOnInsert: {
          name: demo.ownerName,
          email: demo.ownerEmail,
          phone: demo.ownerPhone,
          passwordHash,
          role: 'admin',
          status: 'active',
          emailVerified: true,
        },
      },
      { new: true, upsert: true },
    );

    await UserModel.findOneAndUpdate(
      { phone: demo.customerPhone },
      {
        $setOnInsert: {
          name: demo.customerName,
          phone: demo.customerPhone,
          email: demo.customerEmail,
          role: 'customer',
          status: 'active',
          emailVerified: true,
          addresses: [
            {
              label: 'home',
              fullName: demo.customerName,
              phone: demo.customerPhone,
              addressLine1: demo.addressLine1,
              city: demo.city,
              state: demo.state,
              pincode: demo.pincode,
              country: 'India',
              isDefault: true,
            },
          ],
        },
      },
      { upsert: true },
    );

    const storeConfig = {
      storeName: demo.storeName,
      storeEmail: demo.ownerEmail,
      storePhone: demo.ownerPhone,
      storeMobile: demo.ownerPhone,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      maintenanceMode: false,
      allowGuestCheckout: true,
      lowStockAlert: 10,
      taxRate: 18,
      shippingFlatRate: 79,
      freeShippingThreshold: 999,
      storeLogo: demo.logoUrl,
      storeBanner: demo.bannerUrl,
      brandConfig: demo.brandConfig,
      storeLocation: {
        addressLine1: demo.addressLine1,
        city: demo.city,
        state: demo.state,
        postalCode: demo.pincode,
        country: 'India',
      },
      seo: {
        metaTitle: `${demo.storeName} | Demo Store`,
        metaDescription: demo.description,
        ogImage: demo.bannerUrl,
      },
      gateways: {},
      smtp: {},
    };

    await StoreConfigModel.findOneAndUpdate({}, storeConfig, {
      upsert: true,
      new: true,
    });

    const rootCategories: Record<string, any> = {};
    for (const [categoryIndex, category] of demo.categories.entries()) {
      const root = await CategoryModel.findOneAndUpdate(
        { slug: category.slug },
        {
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          isActive: true,
          isNavBarEnable: true,
          sortOrder: categoryIndex + 1,
          parentId: null,
          categoryPath: [],
        },
        { upsert: true, new: true },
      );
      rootCategories[category.slug] = root;

      for (const [subIndex, subcategory] of category.subcategories.entries()) {
        const sub = await CategoryModel.findOneAndUpdate(
          { slug: subcategory.slug },
          {
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description,
            image: subcategory.image,
            isActive: true,
            sortOrder: subIndex + 1,
            parentId: root._id,
            categoryPath: [{ _id: root._id.toString(), name: root.name }],
          },
          { upsert: true, new: true },
        );

        for (const [productIndex, product] of subcategory.products.entries()) {
          await ProductModel.findOneAndUpdate(
            { slug: product.slug },
            {
              ...product,
              categoryId: sub._id,
              categoryName: sub.name,
              categoryPath: [
                { _id: root._id.toString(), name: root.name },
                { _id: sub._id.toString(), name: sub.name },
              ],
              status: 'active',
              deleted: false,
              featured: productIndex === 0,
              lowStockThreshold: 5,
            },
            { upsert: true, new: true },
          );
        }
      }
    }

    if (!tenant.ownerUserId && adminUser?._id) {
      tenant.ownerUserId = new Types.ObjectId(adminUser._id);
      await tenant.save();
    }

    this.logger.log(`Demo tenant ready: ${demo.slug}`);
  }

  private getDemoTenantCatalogs(): DemoTenantSeed[] {
    return [
      buildDemoTenantSeed({
        kind: 'candle',
        storeName: 'GlowNest Candles',
        slug: 'candle-demo',
        ownerName: 'Aarav Mehta',
        ownerEmail: 'owner@glownest.demo',
        ownerPhone: '+919000000101',
        customerName: 'Neha Candle',
        customerEmail: 'neha@glownest.demo',
        customerPhone: '9000000101',
        customDomain: '',
        logoUrl:
          'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=256&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1600&q=80',
        description: 'Hand-poured candles, wax melts, holders, and gifting sets.',
        brandConfig: {
          primaryColor: '#8A4F35',
          secondaryColor: '#F6D6A8',
          accentColor: '#2F6F73',
          heroWords: ['Glow', 'Scent', 'Calm'],
          fontHeading: 'Playfair Display',
          fontBody: 'Inter',
          borderRadius: 'md',
        },
      }),
      buildDemoTenantSeed({
        kind: 'flower',
        storeName: 'Bloom & Stem',
        slug: 'flower-demo',
        ownerName: 'Isha Kapoor',
        ownerEmail: 'owner@bloomstem.demo',
        ownerPhone: '+919000000202',
        customerName: 'Riya Bloom',
        customerEmail: 'riya@bloomstem.demo',
        customerPhone: '9000000202',
        customDomain: '',
        logoUrl:
          'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=256&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=80',
        description: 'Fresh bouquets, occasion flowers, plants, and floral gifts.',
        brandConfig: {
          primaryColor: '#C23B68',
          secondaryColor: '#F7CED7',
          accentColor: '#237A57',
          heroWords: ['Fresh', 'Bloom', 'Gift'],
          fontHeading: 'Cormorant Garamond',
          fontBody: 'Inter',
          borderRadius: 'lg',
        },
      }),
    ];
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

  async findOne(id: string): Promise<any> {
    const tenant = (await this.tenantModel.findById(id).lean()) as any;
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
    sameSite: 'none' as const,
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

type DemoProductSeed = {
  name: string;
  slug: string;
  description: string;
  localIdentity: string;
  price: number;
  compareAtPrice: number;
  cost: number;
  sku: string;
  stock: number;
  main_image: string;
  images: string[];
  tags: string[];
};

type DemoTenantSeed = {
  kind: 'candle' | 'flower';
  storeName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  adminPassword: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customDomain: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  brandConfig: Record<string, any>;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  categories: {
    name: string;
    slug: string;
    description: string;
    image: string;
    subcategories: {
      name: string;
      slug: string;
      description: string;
      image: string;
      products: DemoProductSeed[];
    }[];
  }[];
};

function buildDemoTenantSeed(input: Omit<DemoTenantSeed, 'adminPassword' | 'addressLine1' | 'city' | 'state' | 'pincode' | 'categories'>): DemoTenantSeed {
  const isCandle = input.kind === 'candle';
  const image = isCandle
    ? 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80'
    : 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80';
  const catalog = isCandle ? candleCatalog() : flowerCatalog();

  return {
    ...input,
    adminPassword: 'Demo@12345',
    addressLine1: isCandle ? '12 Artisan Market Road' : '44 Garden Arcade',
    city: isCandle ? 'Jaipur' : 'Bengaluru',
    state: isCandle ? 'Rajasthan' : 'Karnataka',
    pincode: isCandle ? '302001' : '560001',
    categories: catalog.map((category, categoryIndex) => ({
      name: category.name,
      slug: `${input.kind}-${slugify(category.name)}`,
      description: category.description,
      image,
      subcategories: category.subcategories.map((subcategory, subcategoryIndex) => ({
        name: subcategory.name,
        slug: `${input.kind}-${slugify(category.name)}-${slugify(subcategory.name)}`,
        description: subcategory.description,
        image,
        products: subcategory.products.map((product, productIndex) => ({
          name: product.name,
          slug: `${input.kind}-${slugify(product.name)}`,
          description: product.description,
          localIdentity: product.localIdentity,
          price: product.price,
          compareAtPrice: product.price + 200,
          cost: Math.round(product.price * 0.55),
          sku: `${input.kind.slice(0, 3).toUpperCase()}-${categoryIndex + 1}${subcategoryIndex + 1}${productIndex + 1}`,
          stock: 40 + productIndex * 15,
          main_image: image,
          images: [image],
          tags: [input.kind, slugify(category.name), slugify(subcategory.name)],
        })),
      })),
    })),
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function candleCatalog() {
  return [
    {
      name: 'Scented Candles',
      description: 'Signature fragrances for everyday rooms.',
      subcategories: [
        productGroup('Floral Scents', 'Soft bloom-forward fragrances.', [
          ['Rose Garden Jar Candle', 'Fresh rose, geranium, and warm musk.', 'Gulab candle', 699],
          ['Jasmine Moon Tin Candle', 'Night jasmine with creamy sandalwood.', 'Chameli candle', 649],
        ]),
        productGroup('Woody Scents', 'Grounded, cozy, and warm notes.', [
          ['Cedar Amber Soy Candle', 'Cedarwood, amber, and vanilla smoke.', 'Cedar candle', 799],
          ['Sandalwood Hearth Candle', 'Mysore sandalwood with clove warmth.', 'Chandan candle', 849],
        ]),
        productGroup('Fresh Scents', 'Clean fragrances for work and living areas.', [
          ['Linen Breeze Candle', 'Cotton, citrus peel, and white tea.', 'Fresh linen candle', 599],
          ['Rain Mint Candle', 'Mint leaf, rainwater, and vetiver.', 'Pudina candle', 629],
        ]),
        productGroup('Festive Scents', 'Celebration-ready seasonal aromas.', [
          ['Diwali Spice Candle', 'Cardamom, saffron, and sweet resin.', 'Diwali candle', 899],
          ['Kesar Vanilla Candle', 'Saffron, vanilla bean, and tonka.', 'Kesar candle', 849],
        ]),
      ],
    },
    {
      name: 'Decor Candles',
      description: 'Candles designed as display pieces.',
      subcategories: [
        productGroup('Pillar Candles', 'Tall statement candles.', [
          ['Ivory Ribbed Pillar', 'Ribbed unscented pillar for centerpieces.', 'Pillar candle', 499],
          ['Terracotta Pillar Pair', 'Warm clay-toned decorative pair.', 'Mitti pillar', 749],
        ]),
        productGroup('Taper Candles', 'Elegant dinner table tapers.', [
          ['Blush Dinner Tapers', 'Set of two slim blush tapers.', 'Dinner candle', 399],
          ['Gold Dust Tapers', 'Celebration tapers with gold finish.', 'Golden taper', 549],
        ]),
        productGroup('Floating Candles', 'Water bowl and event decor candles.', [
          ['Lotus Floating Candles', 'Set of six lotus-shaped floaters.', 'Kamal floating candle', 449],
          ['Pearl Cup Floaters', 'Pearl-finish floating candle cups.', 'Pearl floater', 499],
        ]),
        productGroup('Sculptural Candles', 'Artful shapes for shelves.', [
          ['Bubble Cube Candle', 'Modern bubble cube in soy wax.', 'Bubble candle', 599],
          ['Twist Column Candle', 'Twisted column candle for decor.', 'Twist candle', 649],
        ]),
      ],
    },
    {
      name: 'Wax Melts',
      description: 'Flameless fragrance cubes and warmers.',
      subcategories: [
        productGroup('Soy Wax Melts', 'Clean-burning soy wax melt bars.', [
          ['Lavender Soy Melt Bar', 'Lavender fields and soft herbs.', 'Lavender melt', 299],
          ['Coffee Soy Melt Bar', 'Roasted coffee and brown sugar.', 'Coffee melt', 329],
        ]),
        productGroup('Beeswax Melts', 'Natural honey-toned wax melts.', [
          ['Honeycomb Melt Pods', 'Honey, beeswax, and citrus zest.', 'Madhu melt', 349],
          ['Propolis Spice Melts', 'Warm spice and natural beeswax.', 'Beeswax melt', 379],
        ]),
        productGroup('Aroma Cubes', 'Easy portioned fragrance cubes.', [
          ['Spa Mint Aroma Cubes', 'Mint, eucalyptus, and clean steam.', 'Spa cube', 279],
          ['Cocoa Orange Cubes', 'Cocoa shell and orange peel.', 'Cocoa cube', 299],
        ]),
        productGroup('Melt Warmers', 'Electric and ceramic melt warmers.', [
          ['Ceramic Petal Warmer', 'Compact ceramic warmer with dish.', 'Ceramic warmer', 1199],
          ['Matte Stone Warmer', 'Minimal warmer with stone finish.', 'Stone warmer', 1399],
        ]),
      ],
    },
    {
      name: 'Gift Sets',
      description: 'Curated candle gifts for every occasion.',
      subcategories: [
        productGroup('Mini Candle Sets', 'Small jars for fragrance discovery.', [
          ['Mini Floral Trio', 'Rose, jasmine, and mogra mini jars.', 'Mini trio', 999],
          ['Mini Woods Trio', 'Cedar, oud, and sandalwood minis.', 'Wood trio', 1099],
        ]),
        productGroup('Festive Hampers', 'Ready-to-gift celebration boxes.', [
          ['Diwali Glow Hamper', 'Candles, melts, and brass diya holder.', 'Diwali hamper', 1799],
          ['Wedding Favor Box', 'Two mini candles in premium wrap.', 'Wedding favor', 1299],
        ]),
        productGroup('Wellness Boxes', 'Relaxation-led gift bundles.', [
          ['Calm Evening Box', 'Lavender candle, melt bar, and matches.', 'Calm box', 1499],
          ['Sleep Ritual Box', 'Chamomile candle and pillow mist combo.', 'Sleep box', 1599],
        ]),
        productGroup('Corporate Gifts', 'Bulk-ready branded gifts.', [
          ['Desk Glow Set', 'Compact jar candle with thank-you card.', 'Desk gift', 899],
          ['Premium Client Hamper', 'Large candle, melts, and wick trimmer.', 'Client hamper', 2499],
        ]),
      ],
    },
  ];
}

function flowerCatalog() {
  return [
    {
      name: 'Fresh Bouquets',
      description: 'Hand-tied fresh flower arrangements.',
      subcategories: [
        productGroup('Rose Bouquets', 'Classic rose-led bouquets.', [
          ['Red Rose Classic Bouquet', 'Twelve red roses with seasonal greens.', 'Lal gulab bouquet', 999],
          ['Blush Rose Wrap', 'Pink roses wrapped in soft kraft.', 'Pink gulab bouquet', 899],
        ]),
        productGroup('Lily Bouquets', 'Elegant lily arrangements.', [
          ['White Lily Grace', 'White lilies with eucalyptus.', 'Lily bouquet', 1299],
          ['Pink Lily Charm', 'Pink lilies with baby breath.', 'Pink lily bouquet', 1199],
        ]),
        productGroup('Mixed Bouquets', 'Colorful daily gifting bouquets.', [
          ['Sunshine Mixed Bouquet', 'Gerbera, rose, and carnation mix.', 'Mixed phool bouquet', 849],
          ['Pastel Garden Wrap', 'Soft pastel seasonal blooms.', 'Pastel bouquet', 1099],
        ]),
        productGroup('Premium Bouquets', 'Large luxury arrangements.', [
          ['Orchid Luxe Bouquet', 'Purple orchids with tropical greens.', 'Orchid bouquet', 1799],
          ['Royal Bloom Bouquet', 'Roses, lilies, and imported fillers.', 'Royal bouquet', 2199],
        ]),
      ],
    },
    {
      name: 'Occasion Flowers',
      description: 'Flowers matched to special moments.',
      subcategories: [
        productGroup('Birthday Flowers', 'Bright birthday-ready flowers.', [
          ['Birthday Pop Bouquet', 'Colorful gerberas and roses.', 'Birthday bouquet', 949],
          ['Confetti Bloom Box', 'Mixed blooms in a reusable box.', 'Birthday box', 1199],
        ]),
        productGroup('Anniversary Flowers', 'Romantic anniversary picks.', [
          ['Forever Roses Basket', 'Red and pink roses in basket.', 'Anniversary basket', 1499],
          ['Love Note Bouquet', 'Roses with a handwritten card.', 'Love bouquet', 1299],
        ]),
        productGroup('Congratulations Flowers', 'Fresh flowers for wins.', [
          ['Cheers Lily Basket', 'Lilies, roses, and palm leaves.', 'Congrats basket', 1399],
          ['Bright Win Bouquet', 'Yellow roses and gerberas.', 'Congrats bouquet', 999],
        ]),
        productGroup('Sympathy Flowers', 'Quiet and respectful arrangements.', [
          ['Peace White Bouquet', 'White roses and lilies.', 'Peace bouquet', 1199],
          ['Serene Basket', 'Soft whites and fresh greens.', 'Serene basket', 1299],
        ]),
      ],
    },
    {
      name: 'Plants',
      description: 'Living gifts and easy-care greens.',
      subcategories: [
        productGroup('Indoor Plants', 'Low-maintenance house plants.', [
          ['Money Plant Ceramic Pot', 'Money plant in white ceramic pot.', 'Money plant', 599],
          ['Snake Plant Mini', 'Compact snake plant for desks.', 'Snake plant', 699],
        ]),
        productGroup('Flowering Plants', 'Plants that bloom beautifully.', [
          ['Peace Lily Plant', 'Peace lily in nursery pot.', 'Peace lily', 799],
          ['Anthurium Red Plant', 'Red anthurium in ceramic pot.', 'Anthurium', 999],
        ]),
        productGroup('Succulents', 'Small sculptural succulents.', [
          ['Succulent Trio', 'Three assorted succulents.', 'Succulent set', 749],
          ['Jade Plant Mini', 'Lucky jade plant in clay pot.', 'Jade plant', 449],
        ]),
        productGroup('Plant Gift Sets', 'Plants paired with extras.', [
          ['Green Desk Gift', 'Mini plant with care card.', 'Plant gift', 899],
          ['Wellness Plant Hamper', 'Plant, candle, and greeting card.', 'Green hamper', 1499],
        ]),
      ],
    },
    {
      name: 'Floral Gifts',
      description: 'Flowers paired with treats and keepsakes.',
      subcategories: [
        productGroup('Flower Boxes', 'Premium boxed flower gifts.', [
          ['Pink Rose Hatbox', 'Pink roses in round hatbox.', 'Rose box', 1499],
          ['Mixed Bloom Box', 'Seasonal blooms in gift box.', 'Flower box', 1299],
        ]),
        productGroup('Flower Cakes', 'Flowers with celebration cakes.', [
          ['Rose Cake Combo', 'Half kg cake with rose bouquet.', 'Cake combo', 1699],
          ['Lily Chocolate Combo', 'Lilies with assorted chocolates.', 'Chocolate combo', 1899],
        ]),
        productGroup('Dried Flowers', 'Long-lasting preserved flowers.', [
          ['Dried Lavender Bunch', 'Fragrant dried lavender stems.', 'Dried lavender', 699],
          ['Preserved Rose Dome', 'Single preserved rose in dome.', 'Rose dome', 1599],
        ]),
        productGroup('Subscription Flowers', 'Recurring fresh flowers.', [
          ['Weekly Desk Blooms', 'Four weekly mini bouquets.', 'Weekly flowers', 2499],
          ['Monthly Home Flowers', 'Four premium home deliveries.', 'Monthly flowers', 3999],
        ]),
      ],
    },
  ];
}

function productGroup(
  name: string,
  description: string,
  products: [string, string, string, number][],
) {
  return {
    name,
    description,
    products: products.map(([productName, productDescription, localIdentity, price]) => ({
      name: productName,
      description: productDescription,
      localIdentity,
      price,
    })),
  };
}
