// ─── catalog.dto.ts ───────────────────────────────────────────────────────────
import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination.dto';

export class CatalogQueryDto extends PaginationDto {
  /** Filter by category slug  e.g. ?category=electronics */
  @IsOptional() @IsString()
  category?: string;

  /** Filter by category ObjectId */
  @IsOptional() @IsString()
  categoryId?: string;

  /** Comma-separated tag list  e.g. ?tags=sale,new */
  @IsOptional() @IsString()
  tags?: string;

  /** Minimum price (inclusive) */
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  priceMin?: number;

  /** Maximum price (inclusive) */
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  priceMax?: number;

  /** Only featured products */
  @IsOptional() @IsIn(['true', 'false'])
  featured?: string;

  /** Sort field — narrows base class to allowed values only */
  @IsOptional() @IsIn(['price', 'name', 'createdAt', 'stock'])
  declare sort?: string;

  /** Sort direction — narrows base class to allowed values only */
  @IsOptional() @IsIn(['asc', 'desc'])
  declare order?: 'asc' | 'desc';
}