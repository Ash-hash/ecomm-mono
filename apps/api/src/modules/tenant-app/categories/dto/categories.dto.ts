// categories.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsMongoId() parentId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional()
  @IsBoolean()
  isNavBarEnable?: boolean;
  @IsOptional() @IsNumber() @Type(() => Number) sortOrder?: number;
  @IsOptional() @IsString() image?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
