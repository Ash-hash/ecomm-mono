// ─── cart.dto.ts ──────────────────────────────────────────────────────────────
import {
  IsMongoId,
  IsNumber,
  Min,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Add item ──────────────────────────────────────────────────────────────────
export class AddCartItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

// ── Update quantity ───────────────────────────────────────────────────────────
export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

// ── Select / deselect a set of items ─────────────────────────────────────────
export class SelectCartItemsDto {
  /** The product IDs to mutate */
  @IsArray()
  @IsMongoId({ each: true })
  productIds: string[];

  /** true → mark selected; false → mark deselected */
  @IsBoolean()
  @Type(() => Boolean)
  selected: boolean;
}

// ── Guest cart item (used in sync payload) ────────────────────────────────────
export class GuestCartItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  /** Carry selection state from Redux */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  selected?: boolean;
}

// ── Checkout summary request ──────────────────────────────────────────────────
export class CheckoutSummaryDto {
  /**
   * Optional explicit override.
   * If omitted, the summary uses items where selected === true.
   */
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  selectedProductIds?: string[];
}