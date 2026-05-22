// products.dto.ts
import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination.dto';

export class ProductsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['active','inactive','archived'])
  status?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  lowStock?: string; // 'true'
}

export class CreateProductDto {
  @IsString()   name:        string;
  @IsString()   sku:         string;
  @IsNumber() @Min(0) @Type(() => Number) price: number;
  @IsOptional() @IsString() name_hi?: string;
  @IsOptional() @IsString() localIdentity?: string;
  @IsOptional() @IsString() description_hi?: string;


  @IsOptional() @IsString()   description?:        string;
  @IsOptional() @IsString()   categoryId?:         string;
  @IsOptional() @IsString()   categoryName?:       string;
  @IsOptional() @IsNumber() @Type(() => Number) compareAtPrice?: number;
  @IsOptional() @IsNumber() @Type(() => Number) cost?:           number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) stock?:  number;
  @IsOptional() @IsNumber() @Type(() => Number) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsArray()   @IsString({ each: true }) tags?:   string[];
  @IsOptional() @IsString()   main_image?: string;
  @IsOptional() @IsArray()   @IsString({ each: true }) images?: string[];
  @IsOptional() @IsIn(['active','inactive']) status?: string;
}

export class UpdateProductDto extends CreateProductDto {}


