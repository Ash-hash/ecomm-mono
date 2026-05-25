// ─── super-admin/super-admin-auth.service.ts ─────────────────────────────────
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/modules/tenant-app/users/user.schema';

// Super admins live in the PLATFORM database (not any tenant DB)
// Reuse the User schema but in the default connection

@Injectable()
export class SuperAdminAuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, res: any) {
    const user = await this.userModel
      .findOne({
        email: email.toLowerCase(),
        role: 'super_admin',
      })
      .select('+passwordHash +refreshToken');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.jwt.sign(
      {
        sub: user._id,
        role: user.role,
        email: user.email,
      },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwt.sign(
      {
        sub: user._id,
        role: user.role,
        email: user.email,
      },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    // Save refresh token
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // Set secure cookie
    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      success: true,
      message: 'Login successful',

      data: {
        accessToken,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async refresh(incomingToken: string, res: any) {
    if (!incomingToken) throw new UnauthorizedException('No refresh token');

    let payload: any;
    try {
      payload = this.jwt.verify(incomingToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Session expired — please log in again');
    }

    // Must be super_admin
    if (payload.role !== 'super_admin')
      throw new ForbiddenException('Access denied');

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshToken');
    if (!user?.refreshToken) throw new UnauthorizedException('Session revoked');

    const valid = await bcrypt.compare(incomingToken, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    const { accessToken, refreshToken } = await this.issueTokens(user);
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    this.setAuthCookies(res, accessToken, refreshToken);
    return { data: { accessToken } };
  }

  async logout(userId: string, res: any) {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 },
    });
    res.clearCookie('sa_access_token', { path: '/' });
    res.clearCookie('sa_refresh_token', { path: '/' });
    return { message: 'Logged out', data: null };
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'super_admin')
      throw new ForbiddenException('Access denied');
    return { data: user };
  }

  async seedSuperAdmin() {
    const exists = await this.userModel.findOne({ role: 'super_admin' });
    if (exists) return;
    const hash = await bcrypt.hash('SuperAdmin@123', 12);
    await this.userModel.create({
      name: 'Platform Admin',
      email: 'platform@yoursaas.com',
      passwordHash: hash,
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
    });
    console.log(
      '\n✅  Seeded platform super-admin → platform@yoursaas.com / SuperAdmin@123\n',
    );
  }

  private async issueTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m') as any,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private setAuthCookies(res: any, accessToken: string, refreshToken: string) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const opts = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none' as const,
      path: '/',
    };
    // Use separate cookie names for super-admin to avoid conflicts with tenant cookies
    res.cookie('sa_access_token', accessToken, {
      ...opts,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('sa_refresh_token', refreshToken, {
      ...opts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
