// ─── tenant/dto/tenant.dto.ts ─────────────────────────────────────────────────
import {
  IsString, IsEmail, IsIn, IsOptional, IsBoolean,
  IsNumber, Min, MinLength, Matches, IsPhoneNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillingCycle, TenantPlan } from '../tenant.schema';

// ── Connect Razorpay credentials ──────────────────────────────────────────────
export class ConnectRazorpayDto {
  @IsString()
  @Matches(/^rzp_(live|test)_[A-Za-z0-9]+$/, { message: 'Invalid Razorpay Key ID format' })
  keyId: string;

  @IsString() @MinLength(20)
  keySecret: string;
}

// ── Self-registration (public) ────────────────────────────────────────────────
export class RegisterTenantDto {
  @IsString() @MinLength(2)
  storeName: string;

  /** becomes the subdomain slug */
  @IsString()
  @Matches(/^[a-z0-9-]{3,30}$/, { message: 'Slug must be 3-30 lowercase alphanumeric chars or hyphens' })
  slug: string;

  @IsString() @MinLength(2)
  ownerName: string;

  @IsEmail()
  ownerEmail: string;

  @IsPhoneNumber('IN')
  ownerPhone: string;

  @IsString() @MinLength(8)
  password: string;

  @IsOptional()
  @IsIn(['starter', 'growth', 'pro', 'enterprise'])
  plan?: TenantPlan;

  @IsOptional()
  @IsIn(['monthly', 'annual', 'onetime'])
  billingCycle?: BillingCycle;

  @IsOptional() @IsString()
  customDomain?: string;

  @IsOptional() @IsString()
  logoUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectRazorpayDto)
  razorpay?: ConnectRazorpayDto;
}



// ── Tenant update (admin-only fields) ────────────────────────────────────────
export class UpdateTenantDto {
  @IsOptional() @IsString() @MinLength(2) storeName?: string;
  @IsOptional() @IsEmail()               ownerEmail?: string;
  @IsOptional() @IsString()              ownerName?: string;
  @IsOptional() @IsString()              timezone?: string;
  @IsOptional() @IsString()              currency?: string;
  @IsOptional() @IsString()              customDomain?: string;
  @IsOptional() @IsBoolean()             onboardingComplete?: boolean;
}

// ── Super-admin plan override ─────────────────────────────────────────────────
export class OverridePlanDto {
  @IsIn(['starter', 'growth', 'pro', 'enterprise'])
  plan: TenantPlan;

  @IsIn(['monthly', 'annual', 'onetime'])
  billingCycle: BillingCycle;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  customAmount?: number;
}

// ── Suspension ────────────────────────────────────────────────────────────────
export class SuspendTenantDto {
  @IsOptional() @IsString()
  reason?: string;
}

// ── Initiate SaaS payment (tenant subscribes) ─────────────────────────────────
export class InitiateSaasPaymentDto {
  @IsIn(['starter', 'growth', 'pro', 'enterprise'])
  plan: TenantPlan;

  @IsIn(['monthly', 'annual', 'onetime'])
  billingCycle: BillingCycle;
}

// ── Verify SaaS payment ───────────────────────────────────────────────────────
export class VerifySaasPaymentDto {
  @IsString() razorpayPaymentId: string;
  @IsString() razorpayOrderId: string;
  @IsString() razorpaySignature: string;
  @IsIn(['starter', 'growth', 'pro', 'enterprise']) plan: TenantPlan;
  @IsIn(['monthly', 'annual', 'onetime']) billingCycle: BillingCycle;
}

// ── Onboarding wizard steps ───────────────────────────────────────────────────
export class OnboardingStoreInfoDto {
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() storePhone?: string;
  @IsOptional() @IsString() storeMobile?: string;
}

export class OnboardingRazorpayDto extends ConnectRazorpayDto {}

// ── Super-admin list query ────────────────────────────────────────────────────
export class TenantsQueryDto {
  @IsOptional() @Type(() => Number) page?:  number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 20;
  @IsOptional() @IsString()         search?: string;
  @IsOptional() @IsIn(['trial','active','suspended','cancelled']) status?: string;
  @IsOptional() @IsIn(['starter','growth','pro','enterprise'])    plan?: string;
  @IsOptional() @IsString()         sort?:  string;
  @IsOptional() @IsIn(['asc','desc']) order?: 'asc' | 'desc';
}
