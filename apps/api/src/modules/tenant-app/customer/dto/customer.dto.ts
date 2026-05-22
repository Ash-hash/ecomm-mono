// ─── customer.dto.ts ──────────────────────────────────────────────────────────
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsArray,
  Min,
  Max,
  IsPhoneNumber,
  IsIn,
  IsBoolean,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination.dto';

// ── Profile ───────────────────────────────────────────────────────────────────
export class UpdateProfileDto {
  @IsOptional() @IsString()   name?:      string;
  @IsOptional() @IsEmail()    email?:     string;
  @IsOptional() @IsPhoneNumber() phone?:  string;
  @IsOptional() @IsString()   avatarUrl?: string;
}

// ── Shipping address (embedded in PlaceOrderDto) ──────────────────────────────
export class ShippingAddressDto {
  @IsOptional()
  @IsIn(['home', 'work', 'other'])
  label?: 'home' | 'work' | 'other';

  @IsString() fullName:     string;
  @IsString() phone:        string;
  @IsString() addressLine1: string;

  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() landmark?:     string;

  @IsString() city:  string;
  @IsString() state: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be exactly 6 digits' })
  pincode: string;

  @IsOptional() @IsString()  country?: string;
  @IsOptional() @IsNumber() @Min(-90)  @Max(90)  lat?: number | null;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) lng?: number | null;
}

// ── Place order / checkout ────────────────────────────────────────────────────
export class PlaceOrderDto {
  /**
   * Explicit product IDs to check out.
   *
   * • If provided  → only those cart items are included in the order.
   * • If omitted   → falls back to items with selected === true in the DB.
   * • If nothing is selected → all active cart items are used.
   *
   * This lets the frontend pass the current Redux selection as a safety net
   * without requiring the DB selection to be 100% in sync.
   */
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  selectedProductIds?: string[];

  @IsOptional()
  @IsMongoId()
  productId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() notes?:         string;
  @IsOptional() @IsString() couponCode?:    string;
}

// ── Order history query ───────────────────────────────────────────────────────
export class CustomerOrdersQueryDto extends PaginationDto {
  @IsOptional() status?: string;
}

// ── Subscription plan upgrade ─────────────────────────────────────────────────
export class UpgradePlanDto {
  @IsIn(['free', 'starter', 'pro', 'enterprise'])
  plan: 'free' | 'starter' | 'pro' | 'enterprise';

  @IsIn(['monthly', 'annual'])
  billingCycle: 'monthly' | 'annual';

  @IsOptional()
  @IsIn(['razorpay', 'stripe', 'paypal'])
  gateway?: 'razorpay' | 'stripe' | 'paypal';
}

// ── Address DTOs ──────────────────────────────────────────────────────────────
export class AddressDto {
  @IsOptional()
  @IsIn(['home', 'work', 'other'])
  label?: 'home' | 'work' | 'other';

  @IsString() fullName:     string;
  @IsString() phone:        string;
  @IsString() addressLine1: string;

  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() landmark?:     string;

  @IsString() city:  string;
  @IsString() state: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be exactly 6 digits' })
  pincode: string;

  @IsOptional() @IsString()  country?: string;
  @IsOptional() @IsNumber() @Min(-90)  @Max(90)  lat?: number | null;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) lng?: number | null;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsIn(['home', 'work', 'other']) label?: 'home' | 'work' | 'other';
  @IsOptional() @IsString() fullName?:     string;
  @IsOptional() @IsString() phone?:        string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() landmark?:     string;
  @IsOptional() @IsString() city?:         string;
  @IsOptional() @IsString() state?:        string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be exactly 6 digits' })
  pincode?: string;

  @IsOptional() @IsString()  country?:   string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}