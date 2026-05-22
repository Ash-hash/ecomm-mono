// src/modules/tenant-app/auth/tenant-auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { getModel } from '../../../common/utils/get-model.util';
import { UserSchema } from '../users/user.schema';

@Injectable()
export class TenantAuthService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(req: any, dto: { email: string; password: string }, res: any) {
    const User = getModel(req, 'User', UserSchema);

    const user = await User.findOne({ email: dto.email.toLowerCase() }).select('+passwordHash +refreshToken');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!['admin', 'super_admin'].includes(user.role)) {
      throw new UnauthorizedException('Admin access required');
    }

    const tokens = await this.issueTokens(user, req.tenant);

    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    this.setCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async refresh(req: any, res: any) {
    const token = req.cookies?.tenant_refresh_token;
    if (!token) throw new UnauthorizedException('No refresh token');

    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.config.get('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Session expired');
    }

    const User = getModel(req, 'User', UserSchema);
    const user = await User.findById(payload.sub).select('+refreshToken');

    if (!user?.refreshToken) throw new UnauthorizedException('Session revoked');

    const valid = await bcrypt.compare(token, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.issueTokens(user, req.tenant);

    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    this.setCookies(res, tokens.accessToken, tokens.refreshToken);

    return { success: true, data: { accessToken: tokens.accessToken } };
  }

  async logout(req: any, res: any) {
    res.clearCookie('tenant_access_token', { path: '/' });
    res.clearCookie('tenant_refresh_token', { path: '/' });
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { success: true, message: 'Logged out' };
  }

  private async issueTokens(user: any, tenant: any) {
    const payload = {
      sub: user._id.toString(),
      tenantId: tenant._id.toString(),
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private setCookies(res: any, accessToken: string, refreshToken: string) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const opts = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('tenant_access_token', accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
    res.cookie('tenant_refresh_token', refreshToken, { ...opts, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }
}
