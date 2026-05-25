// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SuperAdminAuthService } from './modules/platform/super-admin/super-admin-auth.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    cors: false, // handled manually below
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',

  'https://ecomm-mono-admin.vercel.app',
  'https://ecomm-mono-user.vercel.app',
  'https://ecomm-mono-tenant.vercel.app',
];

const dynamicVercelRegex =
  /^https:\/\/ecomm-mono-(admin|tenant|user)(-.*)?\.vercel\.app$/;


app.enableCors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
  allowedOrigins.includes(origin) ||
  dynamicVercelRegex.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    }
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-tenant-slug',
    'x-cart-id',
  ],

  exposedHeaders: ['x-cart-id'],
});

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Static files
  app.useStaticAssets(join(process.cwd(), '../../storage/uploads'), {
    prefix: '/uploads/',
  });

 

  if (config.get('NODE_ENV') !== 'production' || config.get('ENABLE_SWAGGER') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('E-commerce store API')
      .setDescription('API documentation for my multitenancy e-commerce store')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('swagger', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  if (config.get('SEED_SUPER_ADMIN') !== 'false') {
    try {
      await app.get(SuperAdminAuthService).seedSuperAdmin();
    } catch (e) {
      logger.error('Super admin seed failed', e instanceof Error ? e.stack : String(e));
    }
  }

const port = config.get<number>('PORT', 3000);
app.set('trust proxy', 1);

await app.listen(port, '0.0.0.0');
logger.log(`API started on port ${port}`);
logger.log(`Environment: ${config.get('NODE_ENV', 'development')}`);
}

bootstrap();
