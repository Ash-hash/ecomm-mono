// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { TenantModule } from './modules/platform/tenant/tenant.module';
import { SuperAdminModule } from './modules/platform/super-admin/super-admin.module';

import { TenantAuthModule } from './modules/tenant-app/auth/tenant-auth.module';
import { AuthModule } from './modules/tenant-app/auth/auth.module';
import { CatalogModule } from './modules/tenant-app/catalog/catalog.module';
import { ProductsModule } from './modules/tenant-app/products/products.module';
import { CategoriesModule } from './modules/tenant-app/categories/categories.module';
import { UsersModule } from './modules/tenant-app/users/users.module';
import { OrdersModule } from './modules/tenant-app/orders/orders.module';
import { PaymentsModule } from './modules/tenant-app/payments/payments.module';
import { StoreModule } from './modules/tenant-app/store/store.module';
import { OffersModule } from './modules/tenant-app/offers/offers.module';
import { CartModule } from './modules/tenant-app/cart/cart.module';
import { CustomerModule } from './modules/tenant-app/customer/customer.module';
import { SubscriptionsModule } from './modules/tenant-app/subscriptions/subscriptions.module';
import { DashboardModule } from './modules/tenant-app/dashboard/dashboard.module';
import { HealthController } from './common/health.controller';
import { UploadController } from './common/helpers/upload.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Platform Database (adminos)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI')!,
        dbName: 'adminos',
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
      }),
    }),

    JwtModule.register({ global: true }),

    // Platform Modules
    TenantModule,
    SuperAdminModule,

    // Tenant-scoped Modules
    AuthModule,
    TenantAuthModule,
    CatalogModule,
    ProductsModule,
    CategoriesModule,
    UsersModule,
    OrdersModule,
    PaymentsModule,
    StoreModule,
    OffersModule,
    CartModule,
    SubscriptionsModule,
    DashboardModule,
    CustomerModule,

  ],

  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [HealthController , UploadController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'super-admin/*path', method: RequestMethod.ALL },
        { path: 'tenants/*path', method: RequestMethod.ALL },
        { path: 'upload', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
