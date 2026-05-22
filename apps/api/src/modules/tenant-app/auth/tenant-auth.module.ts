import { Module } from '@nestjs/common';
import { TenantAuthController } from './tenant-auth.controller';
import { TenantAuthService } from './tenant-auth.service';

@Module({
  controllers: [TenantAuthController],
  providers: [TenantAuthService],
})
export class TenantAuthModule {}