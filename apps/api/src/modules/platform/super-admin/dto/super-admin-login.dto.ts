import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {

  @ApiProperty({
    example: 'platform@yoursaas.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SuperAdmin@123',
  })
  @IsString()
  password: string;
}