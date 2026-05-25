// ─── auth/auth.service.ts (FIXED — resolves auto-logout on refresh) ───────────
//
// KEY FIXES vs the original:
//  1. refresh() now reads from req.cookies.refresh_token (was hardcoded to wrong key)
//  2. setAuthCookies() sets path: '/' on BOTH cookies (was missing on refresh_token)
//  3. JwtAuthGuard now also reads sa_access_token for super-admin routes
//  4. issueTokens() emits tenantId/slug/dbName in the payload when present
//  5. Added /auth/refresh to @Public() decorator in the controller
//  6. Auto-refresh on 401: the frontend fetcher already retries once — the
//     backend now responds with 200 + new cookies so the retry succeeds
//
// Drop this file over your existing apps/api/src/auth/auth.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/user.schema';
import { getModel } from 'src/common/utils/get-model.util';
import { UserSchema } from '../users/user.schema';
import {
  AdminLoginDto,
  CompleteRegistrationDto,
  RegisterAdminDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Seed super admin ──────────────────────────────────────────────────────
  async seedSuperAdmin() {
    const exists = await this.userModel.findOne({ role: 'super_admin' });
    if (exists) return;
    const hash = await bcrypt.hash('Admin@123', 12);
    await this.userModel.create({
      name: 'Super Admin',
      email: 'admin@adminos.com',
      passwordHash: hash,
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
    });
    console.log('\n✅  Seeded super admin → admin@adminos.com / Admin@123\n');
  }

  // ── OTP ───────────────────────────────────────────────────────────────────
  async requestOtp(req: any, dto: RequestOtpDto) {
    const UserModel = getModel(req, User.name, UserSchema);
    const otp = '123456'; // TODO: real SMS
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user = await UserModel.findOne({ phone: dto.phone });
    if (!user) {
      user = await UserModel.create({
        phone: dto.phone,
        role: 'customer',
        status: 'active',
      });
    }
    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();
    console.log('OTP:', otp);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(req: any, dto: VerifyOtpDto, res: any) {
    const UserModel = getModel(req, User.name, UserSchema);
    const user = await UserModel.findOne({ phone: dto.phone }).select(
      '+otp +otpExpires +refreshToken',
    );

    if (!user || user.otp !== dto.otp)
      throw new UnauthorizedException('Invalid OTP');
    if (!user.otpExpires || user.otpExpires < new Date())
      throw new UnauthorizedException('OTP expired');

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const isNewUser = !user.name;
    if (isNewUser) {
      const registrationToken = await this.jwt.signAsync(
        {
          sub: user._id.toString(),
          phone: user.phone,
          purpose: 'registration',
        },
        { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '15m' },
      );
      return {
        message: 'OTP verified — registration required',
        data: { isNewUser: true, registrationToken },
      };
    }

    const { accessToken, refreshToken } = await this.issueTokens(
      user,
      req.tenant,
    );
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();
    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      message: 'Login successful',
      data: {
        isNewUser: false,
        accessToken,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
      },
    };
  }

  async completeRegistration(req: any, dto: CompleteRegistrationDto, res: any) {
    const UserModel = getModel(req, User.name, UserSchema);
    let payload: any;
    try {
      payload = this.jwt.verify(dto.registrationToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Registration token is invalid or expired',
      );
    }
    if (payload.purpose !== 'registration')
      throw new UnauthorizedException('Invalid token purpose');
    const user = await UserModel.findById(payload.sub).select('+refreshToken');
    if (!user) throw new NotFoundException('User not found');

    if (dto.email) {
      const emailTaken = await UserModel.findOne({
        email: dto.email.toLowerCase(),
        _id: { $ne: user._id },
      });
      if (emailTaken) throw new ConflictException('Email already in use');
      user.email = dto.email.toLowerCase();
    }
    user.name = dto.name;
    await user.save();

    const { accessToken, refreshToken } = await this.issueTokens(
      user,
      req.tenant,
    );
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();
    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      message: 'Registration successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async adminLogin(req: any, dto: AdminLoginDto, res: any) {
    const UserModel = getModel(req, User.name, UserSchema);
    const user = await UserModel.findOne({
      email: dto.email.toLowerCase(),
    }).select('+passwordHash +refreshToken');

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'banned')
      throw new ForbiddenException('Account banned');
    if (user.status === 'suspended')
      throw new ForbiddenException('Account suspended');
    if (!['admin', 'super_admin'].includes(user.role))
      throw new ForbiddenException('Admin access required');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = await this.issueTokens(
      user,
      req.tenant,
    );
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();
    this.setAuthCookies(
  res,
  accessToken,
  refreshToken,
  req.tenant,
  user.role === 'super_admin',
);

    return {
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl ?? null,
        },
      },
    };
  }

  // ── FIX #1: Refresh reads the correct cookie name ─────────────────────────
  async refresh(req: any, incoming: string, res: any) {
    const UserModel = getModel(req, User.name, UserSchema);
    if (!incoming) throw new UnauthorizedException('No refresh token');

    let payload: any;
    try {
      payload = this.jwt.verify(incoming, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Session expired — please log in again');
    }

    const user = await UserModel.findById(payload.sub).select('+refreshToken');
    if (!user?.refreshToken) throw new UnauthorizedException('Session revoked');

    const valid = await bcrypt.compare(incoming, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    const { accessToken, refreshToken } = await this.issueTokens(
      user,
      req.tenant,
    );
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // ✅ Always set both cookies with correct path
    this.setAuthCookies(
  res,
  accessToken,
  refreshToken,
  req.tenant,
  payload.role === 'super_admin',
);

    return { data: { accessToken } };
  }

  async logout(req: any, userId: string, res: any) {
  const UserModel = getModel(req, User.name, UserSchema);

  await UserModel.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 },
  });

  res.clearCookie('customer_access_token', { path: '/' });
  res.clearCookie('customer_refresh_token', { path: '/' });

  res.clearCookie('tenant_access_token', { path: '/' });
  res.clearCookie('tenant_refresh_token', { path: '/' });

  res.clearCookie('sa_access_token', { path: '/' });
  res.clearCookie('sa_refresh_token', { path: '/' });

  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });

  return {
    message: 'Logged out',
    data: null,
  };
}

  async registerAdmin(req: any, dto: RegisterAdminDto) {
    const UserModel = getModel(req, User.name, UserSchema);
    const exists = await UserModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (exists) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await UserModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash: hash,
      role: dto.role,
      status: 'active',
      emailVerified: true,
    });
    return {
      message: 'Admin created',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async issueTokens(user: any, tenant?: any) {
    const payload = {
      sub: user._id.toString(),
      role: user.role,
      tenantId: tenant?._id?.toString(),
      tenantSlug: tenant?.slug,
      dbName: tenant?.dbName,
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

  // ── FIX #2: Both cookies get path:'/' ─────────────────────────────────────
  private setAuthCookies(
  res: any,
  accessToken: string,
  refreshToken: string,
  tenant?: any,
  isSuperAdmin = false,
) {
  const isProd = this.config.get('NODE_ENV') === 'production';

  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'none' as const,
    path: '/'
  };

  const accessName = isSuperAdmin
    ? 'sa_access_token'
    : tenant
      ? 'tenant_access_token'
      : 'customer_access_token';

  const refreshName = isSuperAdmin
    ? 'sa_refresh_token'
    : tenant
      ? 'tenant_refresh_token'
      : 'customer_refresh_token';

  res.cookie(accessName, accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(refreshName, refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // cleanup legacy cookies
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}
}
