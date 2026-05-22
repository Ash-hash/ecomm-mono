import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/common/guards/roles.guard';
import { RequestContext } from 'src/common/decorators/request-context.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  // ── ADMIN ─────────────────────────────
  @Get()
  @Roles('admin')
  findAll(@RequestContext() ctx, @Query() query: any) {
    return this.service.findAll(ctx.req, query);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@RequestContext() ctx, @Param('id') id: string) {
    return this.service.findOne(ctx.req, id);
  }

  @Patch(':id/status')
  @Roles('admin')
  updateStatus(
    @RequestContext() ctx,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.updateStatus(ctx.req, id, status);
  }
}
