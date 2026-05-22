// src/modules/tenant-app/store/store.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { RequestContext } from 'src/common/decorators/request-context.decorator';


@Controller('store')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('config')
  getConfig(@RequestContext() ctx) {
    return this.storeService.getConfig(ctx.req);
  }

  @Patch('config')
  updateConfig(@RequestContext() ctx, @Body() dto) {
    return this.storeService.updateConfig(ctx.req, dto);
  }
}