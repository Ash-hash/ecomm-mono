// ─── offers/offers.service.ts ─────────────────────────────────────────────────
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './offer.schema';
import { Order, OrderDocument } from '../orders/order.schema';
import { User, UserDocument } from '../users/user.schema';
import {
  CreateOfferDto,
  UpdateOfferDto,
  OffersQueryDto,
  ApplyCouponDto,
} from './dto/offers.dto';
import { paginate } from 'src/common/helpers/paginate.helper';

// ─────────────────────────────────────────────────────────────────────────────
// Validation result returned to the frontend
// ─────────────────────────────────────────────────────────────────────────────

export interface CouponValidationResult {
  valid: boolean;
  offerId: string;
  code: string;
  type: string;
  discountAmount: number; // INR amount to deduct from the order
  discountPct?: number; // only for percentage offers
  freeShipping: boolean;
  title: string;
  description: string;
  message: string; // human-readable summary e.g. "₹200 off applied"
}

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC — storefront endpoints
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /offers/public
   * Returns all isPublic + active offers for the storefront promotions strip,
   * homepage banners, etc.  No sensitive usage data returned.
   */
  async getPublicOffers() {
    const now = new Date();
    const offers = await this.offerModel
      .find({
        status: 'active',
        isPublic: true,
        $and: [
          { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
          { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
        ],
      })
      .select(
        'title description code type value maxDiscountAmount minOrderValue bannerImage expiresAt',
      )
      .sort({ createdAt: -1 })
      .lean();

    return { data: offers };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CUSTOMER — apply / validate coupon
  // ═════════════════════════════════════════════════════════════════════════

  async validatePublicOffer(code: string, cartSubtotal: number) {
    const offer = await this.offerModel
      .findOne({ code: code.toUpperCase().trim() })
      .select(
        'title description code type value maxDiscountAmount minOrderValue bxgyConfig status startsAt expiresAt allowedPlans newUsersOnly',
      )
      .lean();
    function formatCurrency(amount: number, currency = 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }

    if (!offer) throw new NotFoundException(`Coupon "${code}" not found`);

    const now = new Date();
    if (offer.status !== 'active')
      throw new BadRequestException('This coupon is no longer active');
    if (offer.startsAt && new Date(offer.startsAt) > now)
      throw new BadRequestException('This coupon is not valid yet');
    if (offer.expiresAt && new Date(offer.expiresAt) < now)
      throw new BadRequestException('This coupon has expired');
    if (cartSubtotal < offer.minOrderValue)
      throw new UnprocessableEntityException(
        `Min. order of ₹${offer.minOrderValue} required`,
      );

    // ⚠ Per-user limit, plan check, and new-users-only are SKIPPED here.
    // They are enforced at order creation once the user authenticates.

    // Calculate discount (same logic as full validateCoupon)
    let discountAmount = 0;
    let freeShipping = false;

    if (offer.type === 'percentage') {
      const raw = (cartSubtotal * offer.value) / 100;
      discountAmount =
        offer.maxDiscountAmount > 0
          ? +Math.min(raw, offer.maxDiscountAmount).toFixed(2)
          : +raw.toFixed(2);
    } else if (offer.type === 'fixed') {
      discountAmount = Math.min(offer.value, cartSubtotal);
    } else if (offer.type === 'free_shipping') {
      freeShipping = true;
    }

    // Flag honestly that this is a guest preview
    return {
      valid: true,
      guestPreview: true, // ← tells the frontend this isn't fully validated
      offerId: (offer as any)._id.toString(),
      code: offer.code,
      type: offer.type,
      discountAmount,
      freeShipping,
      title: offer.title,
      description: offer.description,
      message:
        offer.type === 'free_shipping'
          ? 'Free shipping applied!'
          : `${formatCurrency(discountAmount)} off applied`,
      // Inform the UI about restrictions that will be re-checked later
      hasUserRestrictions: offer.allowedPlans.length > 0 || offer.newUsersOnly,
    };
  }

  /**
   * POST /offers/apply
   *
   * Validates a coupon code against the current cart state WITHOUT redeeming it.
   * Returns the discount amount so the frontend can show it in the order summary.
   * Actual redemption (recording usage) happens in placeOrder / verifyPayment.
   *
   * Checks in order:
   *   1. Code exists
   *   2. Status is active
   *   3. Validity window
   *   4. Usage limits (global + per-user)
   *   5. Min order value
   *   6. Scope (product / category / plan restrictions)
   *   7. New-users-only
   *   8. Allowed plans
   */
  async validateCoupon(
    userId: string,
    dto: ApplyCouponDto,
  ): Promise<CouponValidationResult> {
    const offer = await this.offerModel
      .findOne({
        code: dto.code.toUpperCase().trim(),
      })
      .lean();

    if (!offer) {
      throw new NotFoundException(`Coupon "${dto.code}" not found`);
    }

    const now = new Date();

    // ── 1. Status ────────────────────────────────────────────────────────────
    if (offer.status !== 'active') {
      throw new BadRequestException('This coupon is no longer active');
    }

    // ── 2. Validity window ───────────────────────────────────────────────────
    if (offer.startsAt && new Date(offer.startsAt) > now) {
      throw new BadRequestException('This coupon is not valid yet');
    }
    if (offer.expiresAt && new Date(offer.expiresAt) < now) {
      throw new BadRequestException('This coupon has expired');
    }

    // ── 3. Global usage limit ────────────────────────────────────────────────
    if (offer.usageLimit > 0 && offer.usageCount >= offer.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    // ── 4. Per-user usage limit ──────────────────────────────────────────────
    if (offer.perUserLimit > 0) {
      const userUses = offer.usages.filter(
        (u) => u.userId.toString() === userId,
      ).length;
      if (userUses >= offer.perUserLimit) {
        throw new BadRequestException(
          `You have already used this coupon ${userUses} time(s)`,
        );
      }
    }

    // ── 5. Minimum order value ───────────────────────────────────────────────
    if (dto.cartSubtotal < offer.minOrderValue) {
      throw new UnprocessableEntityException(
        `Minimum order value of ₹${offer.minOrderValue} required for this coupon`,
      );
    }

    // ── 6. Scope validation ──────────────────────────────────────────────────
    if (offer.applicableTo !== 'all' && offer.applicableIds.length > 0) {
      const applicableStr = offer.applicableIds.map((id) => id.toString());

      if (offer.applicableTo === 'product') {
        const cartProducts = dto.productIds ?? [];
        const overlap = cartProducts.some((pid) => applicableStr.includes(pid));
        if (!overlap) {
          throw new UnprocessableEntityException(
            'This coupon is not applicable to the items in your cart',
          );
        }
      }

      if (offer.applicableTo === 'category') {
        const cartCategories = dto.categoryIds ?? [];
        const overlap = cartCategories.some((cid) =>
          applicableStr.includes(cid),
        );
        if (!overlap) {
          throw new UnprocessableEntityException(
            'This coupon is not applicable to any category in your cart',
          );
        }
      }
    }

    // ── 7. New-users-only ────────────────────────────────────────────────────
    if (offer.newUsersOnly) {
      const orderCount = await this.orderModel.countDocuments({
        customerId: new Types.ObjectId(userId),
        paymentStatus: 'paid',
      });
      if (orderCount > 0) {
        throw new BadRequestException(
          'This coupon is for first-time buyers only',
        );
      }
    }

    // ── 8. Allowed plans ─────────────────────────────────────────────────────
    if (offer.allowedPlans.length > 0) {
      const user = await this.userModel.findById(userId).select('plan').lean();
      if (!user || !offer.allowedPlans.includes(user.plan)) {
        throw new BadRequestException(
          `This coupon requires a ${offer.allowedPlans.join(' or ')} plan`,
        );
      }
    }

    // ── Calculate discount ───────────────────────────────────────────────────
    let discountAmount = 0;
    let discountPct: number | undefined;
    let freeShipping = false;

    if (offer.type === 'percentage') {
      discountPct = offer.value;
      const raw = (dto.cartSubtotal * offer.value) / 100;
      discountAmount =
        offer.maxDiscountAmount > 0
          ? Math.min(raw, offer.maxDiscountAmount)
          : raw;
      discountAmount = +discountAmount.toFixed(2);
    } else if (offer.type === 'fixed') {
      discountAmount = Math.min(offer.value, dto.cartSubtotal);
    } else if (offer.type === 'free_shipping') {
      freeShipping = true;
      discountAmount = 0; // shipping value resolved at order creation
    } else if (offer.type === 'bxgy' && offer.bxgyConfig) {
      // BXGY: discount = getQuantity × cheapest item price ÷ buyQuantity
      // Simplified: just surface the config — actual calculation in placeOrder
      discountAmount = 0;
    }

    const message =
      offer.type === 'free_shipping'
        ? 'Free shipping applied!'
        : offer.type === 'bxgy'
          ? `Buy ${offer.bxgyConfig?.buyQuantity} get ${offer.bxgyConfig?.getQuantity} free applied!`
          : `${offer.type === 'percentage' ? `${offer.value}%` : `₹${discountAmount}`} off applied`;

    return {
      valid: true,
      offerId: (offer as any)._id.toString(),
      code: offer.code,
      type: offer.type,
      discountAmount,
      discountPct,
      freeShipping,
      title: offer.title,
      description: offer.description,
      message,
    };
  }

  /**
   * Atomically record a redemption. Called by OrdersService / PaymentsService
   * after payment is confirmed — NOT by the customer directly.
   */
  async redeemCoupon(
    offerId: string,
    userId: string,
    orderId: string,
    discountApplied: number,
  ) {
    await this.offerModel.updateOne(
      { _id: new Types.ObjectId(offerId) },
      {
        $inc: { usageCount: 1 },
        $push: {
          usages: {
            userId: new Types.ObjectId(userId),
            orderId: new Types.ObjectId(orderId),
            discountApplied,
            usedAt: new Date(),
          },
        },
      },
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN — CRUD + analytics
  // ══════════════════════════════════════════════════════════════════════════

  async findAll(query: OffersQueryDto) {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { code: { $regex: query.search, $options: 'i' } },
        { title: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.status !== undefined) filter.status = query.status;
    if (query.type !== undefined) filter.type = query.type;
    if (query.isPublic !== undefined) filter.isPublic = query.isPublic;

    return paginate<Offer>(this.offerModel, filter, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  async findOne(id: string) {
    const offer = await this.offerModel.findById(id).lean();
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async create(dto: CreateOfferDto, adminId: string) {
    // Code uniqueness
    const exists = await this.offerModel.exists({ code: dto.code });
    if (exists)
      throw new ConflictException(`Code "${dto.code}" already exists`);

    // Percentage range validation
    if (dto.type === 'percentage' && (dto.value ?? 0) > 100) {
      throw new BadRequestException('Percentage value cannot exceed 100');
    }

    // BXGY requires config
    if (dto.type === 'bxgy' && !dto.bxgyConfig) {
      throw new BadRequestException('bxgyConfig is required for bxgy offers');
    }

    const offer = await this.offerModel.create({
      ...dto,
      usageCount: 0,
      usages: [],
      createdBy: new Types.ObjectId(adminId),
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      status:
        dto.startsAt && new Date(dto.startsAt) > new Date()
          ? 'scheduled'
          : (dto.status ?? 'active'),
    });

    return { message: 'Offer created', data: offer };
  }

  async update(id: string, dto: UpdateOfferDto) {
    const offer = await this.offerModel.findById(id);
    if (!offer) throw new NotFoundException('Offer not found');

    Object.assign(offer, {
      ...dto,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : offer.startsAt,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : offer.expiresAt,
    });

    await offer.save();
    return { message: 'Offer updated', data: offer };
  }

  async remove(id: string) {
    const offer = await this.offerModel.findById(id);
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.usageCount > 0) {
      // Soft-delete: mark inactive rather than destroying audit trail
      offer.status = 'inactive';
      await offer.save();
      return { message: 'Offer deactivated (has redemption history)' };
    }
    await this.offerModel.findByIdAndDelete(id);
    return { message: 'Offer deleted' };
  }

  /** Toggle active ↔ inactive quickly */
  async toggleStatus(id: string) {
    const offer = await this.offerModel.findById(id);
    if (!offer) throw new NotFoundException('Offer not found');

    offer.status = offer.status === 'active' ? 'inactive' : 'active';
    await offer.save();
    return { message: `Offer ${offer.status}`, data: { status: offer.status } };
  }

  /**
   * GET /offers/analytics
   * Admin overview: total redemptions, revenue saved, top codes.
   */
  async getAnalytics() {
    const [totals, topOffers, recentUsages] = await Promise.all([
      // Aggregate totals
      this.offerModel.aggregate([
        { $unwind: { path: '$usages', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: null,
            totalRedemptions: { $sum: 1 },
            totalDiscounted: { $sum: '$usages.discountApplied' },
          },
        },
      ]),

      // Top 5 most-used offers
      this.offerModel
        .find({ usageCount: { $gt: 0 } })
        .sort({ usageCount: -1 })
        .limit(5)
        .select('code title type value usageCount')
        .lean(),

      // Last 10 redemptions across all offers
      this.offerModel.aggregate([
        { $unwind: '$usages' },
        { $sort: { 'usages.usedAt': -1 } },
        { $limit: 10 },
        {
          $project: {
            code: 1,
            title: 1,
            userId: '$usages.userId',
            orderId: '$usages.orderId',
            discountApplied: '$usages.discountApplied',
            usedAt: '$usages.usedAt',
          },
        },
      ]),
    ]);

    const t = totals[0] ?? { totalRedemptions: 0, totalDiscounted: 0 };

    return {
      data: {
        totalRedemptions: t.totalRedemptions,
        totalDiscounted: +t.totalDiscounted.toFixed(2),
        topOffers,
        recentUsages,
      },
    };
  }

  /**
   * GET /offers/:id/usages
   * Paginated usage log for a single offer — for auditing.
   */
  async getUsages(id: string, page = 1, limit = 20) {
    const offer = await this.offerModel.findById(id).lean();
    if (!offer) throw new NotFoundException('Offer not found');

    const start = (page - 1) * limit;
    const usages = offer.usages
      .slice()
      .sort(
        (a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime(),
      );

    return {
      data: usages.slice(start, start + limit),
      meta: {
        page,
        limit,
        total: usages.length,
        totalPages: Math.ceil(usages.length / limit),
      },
    };
  }

  /**
   * Auto-expire offers whose expiresAt has passed.
   * Call from a @Cron job in a scheduled task module, e.g.:
   *   @Cron('0 * * * *')  // every hour
   *   async autoExpire() { await this.offersService.expireStale(); }
   */
  async expireStale() {
    const result = await this.offerModel.updateMany(
      {
        status: { $in: ['active', 'scheduled'] },
        expiresAt: { $lte: new Date() },
      },
      { $set: { status: 'expired' } },
    );
    return result.modifiedCount;
  }
}
