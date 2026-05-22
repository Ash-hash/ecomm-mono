// ─── super-admin/super-admin.module.ts ───────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminController } from './super-admin.controller';
import { TenantModule } from '../tenant/tenant.module';
import { User, UserSchema } from 'src/modules/tenant-app/users/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({}),
    ConfigModule,
    TenantModule,
  ],
  controllers: [SuperAdminController],
  providers:   [SuperAdminAuthService],
  exports:     [SuperAdminAuthService],
})
export class SuperAdminModule {}
