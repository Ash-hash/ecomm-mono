import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    private config: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();

    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      const isPlatformSuperAdmin =
        payload.role === 'super_admin' && Boolean(req.cookies?.sa_access_token);

      if (isPlatformSuperAdmin) {
        req.user = payload;
        return true;
      }

      if (!req.tenant) {
        throw new UnauthorizedException('Tenant missing');
      }

      // Ensure string-to-string comparison
      if (String(payload.tenantId) !== String(req.tenant._id)) {
        throw new ForbiddenException('Cross-tenant access denied');
      }

      req.user = payload;
      return true;
    } catch (err) {
      // ✅ Don't swallow intentional 403/401
      if (
        err instanceof ForbiddenException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: any): string | null {
    const url = req.originalUrl ?? req.url ?? '';

    if (req.cookies?.sa_access_token) return req.cookies.sa_access_token;

    if (this.isCustomerRoute(url)) {
      return (
        req.cookies?.customer_access_token ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.split(' ')[1]
          : null)
      );
    }

    return (
      req.cookies?.tenant_access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null)
    );
  }

  private isCustomerRoute(url: string): boolean {
    return (
      url.startsWith('/api/auth') ||
      url.startsWith('/api/customer') ||
      url.startsWith('/api/offers/apply') ||
      url.startsWith('/api/payments/create-order') ||
      url.startsWith('/api/payments/verify')
    );
  }
}
