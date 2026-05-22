// ─── tenant/tenant.module.ts ──────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Tenant, TenantSchema } from './tenant.schema';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [TenantController],
  providers:   [TenantService],
  exports:     [TenantService, MongooseModule],
})
export class TenantModule {}
