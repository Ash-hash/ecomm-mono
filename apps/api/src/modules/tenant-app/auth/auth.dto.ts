import { IsEmail, IsString, MinLength, IsIn, IsPhoneNumber, IsOptional} from 'class-validator';

export class AdminLoginDto {
  @IsEmail({}, { message: 'Enter a valid email' })
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}


export class RequestOtpDto {
  @IsPhoneNumber('IN')
  phone: string;
}


// Customer OTP verify
export class VerifyOtpDto {
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  otp: string;
}


export class RegisterAdminDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(['admin', 'super_admin'])
  role: 'admin' | 'super_admin';
}

/** Public self-registration for customers */
export class CompleteRegistrationDto {
  /** The short-lived registration token returned by verifyOtp */
  @IsString()
  registrationToken: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
