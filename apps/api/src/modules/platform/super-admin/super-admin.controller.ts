// ─── super-admin/super-admin.controller.ts ───────────────────────────────────
import {
  Controller, Get, Post, Body, Req, Res, HttpCode, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { LoginDto } from './dto/super-admin-login.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

/**
 * POST /api/super-admin/auth/login   — platform super-admin login
 * POST /api/super-admin/auth/refresh — refresh token
 * POST /api/super-admin/auth/logout  — logout
 * GET  /api/super-admin/auth/me      — current user
 */
@Controller('super-admin/auth')
export class SuperAdminController {
  constructor(private readonly authService: SuperAdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body() dto : LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto.email, dto.password, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req as any).cookies?.sa_refresh_token;
    return this.authService.refresh(token, res);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@RequestContext() ctx, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(ctx.user.sub, res);
  }
  @ApiBearerAuth('access-token')
  @Get('me')
  me(@RequestContext() ctx) {
    return this.authService.me(ctx.user.sub);
  }
}
