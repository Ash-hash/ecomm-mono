import { IsOptional, IsIn, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination.dto';

export class PaymentsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['success','failed','pending','refunded','partially_refunded']) status?: string;
  @IsOptional() @IsIn(['razorpay','stripe','paypal']) gateway?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}

export class RefundDto {
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  amount?: number;
}
