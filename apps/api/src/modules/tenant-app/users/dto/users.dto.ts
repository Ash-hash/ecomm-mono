// users.dto.ts
import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/pagination.dto';

export class UsersQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['active','banned','suspended']) status?: string;
  @IsOptional() @IsIn(['free','starter','pro','enterprise']) plan?: string;
}

export class UpdateUserStatusDto {
  @IsIn(['active','banned','suspended'])
  status: string;
}