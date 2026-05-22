import { Controller, Post, Body, Req, Res, Get } from '@nestjs/common';

import { TenantAuthService } from './tenant-auth.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('tenant/auth')
export class TenantAuthController {
  constructor(private readonly service: TenantAuthService) {}

  @Public()
  @Post('login')
  login(@Req() req, @Body() dto, @Res({ passthrough: true }) res) {
    return this.service.login(req, dto, res);
  }

  @Public()
  @Post('refresh')
  refresh(@Req() req, @Res({ passthrough: true }) res) {
    return this.service.refresh(req, res);
  }

  @Post('logout')
  logout(@Req() req, @Res({ passthrough: true }) res) {
    return this.service.logout(req, res);
  }

  @Get('me')
  getMe(@Req() req) {
    return {
      success: true,
      data: req.user,
    };
  }
}
