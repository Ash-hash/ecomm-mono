import { IsEmail, IsString, MinLength, IsPhoneNumber } from 'class-validator';

export class TenantLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RequestOtpDto {
  @IsPhoneNumber('IN')
  phone: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  otp: string;
}