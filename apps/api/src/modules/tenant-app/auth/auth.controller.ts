/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  AdminLoginDto,
  CompleteRegistrationDto,
  RegisterAdminDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './auth.dto';
import { Roles } from 'src/common/guards/roles.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestContext } from 'src/common/decorators/request-context.decorator';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/complete-registration
   * Called after verifyOtp returns { isNewUser: true }.
   * Accepts registrationToken + name + optional email.
   * Returns full accessToken on success.
   */
  @Public()
  @Post('complete-registration')
  @HttpCode(200)
  completeRegistration(
    @Req() req: Request,
    @Body() dto: CompleteRegistrationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.completeRegistration(req, dto, res);
  }

  /**
   * POST /api/auth/register
   * Anyone can create a customer account.
   */
  // @Public()
  // @Post('register')
  // @HttpCode(201)
  // register(@Body() dto: RegisterCustomerDto) {
  //   return this.authService.registerCustomer(dto);
  // }

  // ── Public: customer login (all roles) ───────────────────────────────────
  /**
   * POST /api/auth/login
   * Login for customers and admins alike.
   * Returns accessToken + sets httpOnly refresh cookie.
   */

  @Post('request-otp')
  @Public()
  requestOtp(@Req() req: Request, @Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(req, dto);
  }

  @Post('verify-otp')
  @Public()
  verifyOtp(
    @Req() req: Request,
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyOtp(req, dto, res);
  }

  // ── Public: admin-only login ──────────────────────────────────────────────
  /**
   * POST /api/auth/admin/login
   * Identical to /login but explicitly rejects non-admin roles with 403.
   * Useful to clearly separate the admin panel login from the store login.
   */
  @Public()
  @Post('admin/login')
  @HttpCode(200)
  adminLogin(
    @Req() req: Request,
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.adminLogin(req, dto, res);
  }

  @Post('refresh')
  @Public()
  refresh(@Req() req, @Res({ passthrough: true }) res) {
    const token = req.cookies?.customer_refresh_token;
    return this.authService.refresh(req, token, res);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@RequestContext() ctx, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(ctx.req, ctx.user.sub, res);
  }

  // ── Protected: get current user identity ─────────────────────────────────
  /**
   * GET /api/auth/me
   * Returns the JWT payload of the currently authenticated user.
   */
  // @Get('me')
  // me(@CurrentUser() user: any) {
  //   return { data: user };
  // }

  @Get('me')
  getMe(@Req() req) {
    return {
      data: req.user,
    };
  }

  // ── Protected (super_admin): create an admin account ─────────────────────
  @Post('admin/register')
  @Roles('super_admin')
  registerAdmin(@Req() req: Request, @Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(req, dto);
  }
}
