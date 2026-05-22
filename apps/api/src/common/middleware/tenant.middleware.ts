import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { TenantService } from 'src/modules/platform/tenant/tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantService: TenantService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async use(req: Request & any, _res: Response, next: NextFunction) {
    try {
      // ── 1. Skip platform routes ───────────────────────────────
      if (this.isPlatformRoute(req)) {
        return next();
      }

      // ── 2. Extract tenant slug ────────────────────────────────
      const slug = this.extractTenantSlug(req);

      if (!slug) {
        throw new BadRequestException('Tenant slug missing');
      }

      // ── 3. Resolve tenant ─────────────────────────────────────
      const tenant = await this.tenantService.resolveBySlug(slug);

      if (!tenant) {
        throw new NotFoundException(`Tenant "${slug}" not found`);
      }

      // ── 4. Attach tenant context ──────────────────────────────
      req.tenant = tenant;

      // ── 5. Attach tenant DB connection (cached) ───────────────
      req.db = this.connection.useDb(tenant.dbName, {
        useCache: true,
      });

      // ── 6. Safety: attach tenantId for quick access ───────────
      req.tenantId = tenant._id.toString();

      next();
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────

 // src/common/middleware/tenant.middleware.ts
private isPlatformRoute(req: Request): boolean {
  const url = req.originalUrl;
  return (
    url.startsWith('/api/super-admin') ||
    url.startsWith('/api/tenants') ||
    url.startsWith('/api/health') ||
    url.startsWith('/api/upload')
  );
}

 private extractTenantSlug(req: Request): string | null {
  const headerSlug = req.headers['x-tenant-slug'] as string;
  if (headerSlug) return headerSlug;

  const host = req.headers.host;
  if (!host) return null;

  const parts = host.split('.');

  // localhost
  if (host.includes('localhost')) {
    return parts.length >= 2 && parts[0] ? parts[0] : null;
  }

  // production
  return parts.length >= 3 && parts[0] ? parts[0] : null;
}
}