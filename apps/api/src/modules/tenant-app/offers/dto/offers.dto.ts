// ─── offers/dto/offers.dto.ts ─────────────────────────────────────────────────
import {
  IsString, IsNotEmpty, IsIn, IsOptional, IsNumber, Min, Max,
  IsBoolean, IsArray, IsMongoId, IsDateString, IsUppercase,
  Matches, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination.dto';

// ── BXGY config ───────────────────────────────────────────────────────────────

export class BxgyConfigDto {
  @IsNumber() @Min(1) buyQuantity: number;
  @IsNumber() @Min(1) getQuantity: number;
  @IsOptional() @IsNumber() @Min(1) @Max(100) getDiscountPct?: number;
}

// ── Create offer ──────────────────────────────────────────────────────────────

export class CreateOfferDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  /** 3–20 chars, uppercase letters / digits / underscore / hyphen */
  @IsString()
  @IsUppercase()
  @Matches(/^[A-Z0-9_-]{3,20}$/, {
    message: 'code must be 3–20 uppercase letters, digits, _ or -',
  })
  code: string;

  @IsIn(['percentage', 'fixed', 'free_shipping', 'bxgy'])
  type: 'percentage' | 'fixed' | 'free_shipping' | 'bxgy';

  @IsOptional() @IsNumber() @Min(0)
  value?: number;

  @IsOptional() @IsNumber() @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => BxgyConfigDto)
  bxgyConfig?: BxgyConfigDto;

  @IsOptional() @IsNumber() @Min(0)
  minOrderValue?: number;

  @IsOptional() @IsIn(['all', 'product', 'category', 'plan'])
  applicableTo?: 'all' | 'product' | 'category' | 'plan';

  @IsOptional() @IsArray() @IsMongoId({ each: true })
  applicableIds?: string[];

  @IsOptional() @IsArray()
  @IsIn(['free', 'starter', 'pro', 'enterprise'], { each: true })
  allowedPlans?: string[];

  @IsOptional() @IsBoolean() @Type(() => Boolean)
  newUsersOnly?: boolean;

  @IsOptional() @IsDateString()
  startsAt?: string;

  @IsOptional() @IsDateString()
  expiresAt?: string;

  @IsOptional() @IsNumber() @Min(0)
  usageLimit?: number;

  @IsOptional() @IsNumber() @Min(0)
  perUserLimit?: number;

  @IsOptional() @IsIn(['active', 'inactive', 'scheduled'])
  status?: 'active' | 'inactive' | 'scheduled';

  @IsOptional() @IsBoolean() @Type(() => Boolean)
  isPublic?: boolean;

  @IsOptional() @IsString()
  bannerImage?: string;
}

// ── Update offer (all fields optional) ───────────────────────────────────────

export class UpdateOfferDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['percentage', 'fixed', 'free_shipping', 'bxgy']) type?: string;
  @IsOptional() @IsNumber() @Min(0) value?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?: number;
  @IsOptional() @ValidateNested() @Type(() => BxgyConfigDto) bxgyConfig?: BxgyConfigDto;
  @IsOptional() @IsNumber() @Min(0) minOrderValue?: number;
  @IsOptional() @IsIn(['all', 'product', 'category', 'plan']) applicableTo?: string;
  @IsOptional() @IsArray() @IsMongoId({ each: true }) applicableIds?: string[];
  @IsOptional() @IsArray() @IsIn(['free','starter','pro','enterprise'], { each: true }) allowedPlans?: string[];
  @IsOptional() @IsBoolean() @Type(() => Boolean) newUsersOnly?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsNumber() @Min(0) usageLimit?: number;
  @IsOptional() @IsNumber() @Min(0) perUserLimit?: number;
  @IsOptional() @IsIn(['active', 'inactive', 'scheduled', 'expired']) status?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) isPublic?: boolean;
  @IsOptional() @IsString() bannerImage?: string;
}

// ── Admin query ───────────────────────────────────────────────────────────────

export class OffersQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['active','inactive','scheduled','expired']) status?: string;
  @IsOptional() @IsIn(['percentage','fixed','free_shipping','bxgy']) type?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) isPublic?: boolean;
}

// ── Customer apply coupon ─────────────────────────────────────────────────────

export class ApplyCouponDto {
  @IsString() @IsNotEmpty() @IsUppercase()
  code: string;

  /** Subtotal of the cart items to be checked out (for discount calculation) */
  @IsNumber() @Min(0) @Type(() => Number)
  cartSubtotal: number;

  /** Product IDs in the cart — used for scoped offer validation */
  @IsOptional() @IsArray() @IsMongoId({ each: true })
  productIds?: string[];

  /** Category IDs present in the cart */
  @IsOptional() @IsArray() @IsMongoId({ each: true })
  categoryIds?: string[];
}