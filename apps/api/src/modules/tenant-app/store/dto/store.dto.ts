// store.dto.ts
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStoreConfigDto {
  // ── General ──────────────────────────────────────────────
  @IsOptional() @IsString() storeName?: string;
  @IsOptional() @IsString() storeEmail?: string;
  @IsOptional() @IsString() storePhone?: string;
  @IsOptional() @IsString() storeMobile?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsBoolean() allowGuestCheckout?: boolean;
  @IsOptional() @IsNumber() @Type(() => Number) lowStockAlert?: number;
  @IsOptional() @IsNumber() @Type(() => Number) taxRate?: number;
  @IsOptional() @IsNumber() @Type(() => Number) shippingFlatRate?: number;
  @IsOptional() @IsNumber() @Type(() => Number) freeShippingThreshold?: number;

  @IsOptional()
  @IsObject()
  storeLocation?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  // ── Branding ─────────────────────────────────────────────
  @IsOptional() @IsString() storeLogo?: string;
  @IsOptional() @IsString() storeBanner?: string;
  @IsOptional() @IsObject() brandConfig?: Record<string, any>;

  // ── Header / Footer ───────────────────────────────────────
  @IsOptional() @IsObject() storeHeaderConfig?: Record<string, any>;
  @IsOptional() @IsObject() storeFooterConfig?: Record<string, any>;

  // ── SEO ──────────────────────────────────────────────────
  @IsOptional() @IsObject() seo?: Record<string, any>;

  // ── Integrations ─────────────────────────────────────────
  @IsOptional() gateways?: Record<string, any>;
  @IsOptional() smtp?: Record<string, any>;
}
