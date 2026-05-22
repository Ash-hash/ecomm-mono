// ─── orders.dto.ts ────────────────────────────────────────────────────────────
import { IsOptional, IsIn, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';

export class OrdersQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['pending','processing','shipped','delivered','cancelled','refunded'])
  status?: string;

  @IsOptional() @IsIn(['paid','pending','failed','refunded'])
  paymentStatus?: string;

  @IsOptional() @IsString()
  dateFrom?: string;

  @IsOptional() @IsString()
  dateTo?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(['pending','processing','shipped','delivered','cancelled','refunded'])
  status: string;
}