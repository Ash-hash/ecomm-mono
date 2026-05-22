import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { Roles } from 'src/common/guards/roles.guard';
import { SubscriptionsService } from './subscriptions.service';
import { UserPlan } from './subscription.schema';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Public()
  @Get('plans')
  plans() {
    return this.service.getPlans();
  }

  @Public()
  @Get('plans/:key')
  plan(@Param('key') key: UserPlan) {
    return this.service.getPlan(key);
  }

  @Get('overview')
  @Roles('admin')
  overview(@RequestContext() ctx) {
    return this.service.overview(ctx.req);
  }

  @Get('expiring')
  @Roles('admin')
  expiring(@RequestContext() ctx, @Query('days') days?: string) {
    return this.service.expiring(ctx.req, Number(days) || 7);
  }

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

  @Post(':id/cancel')
  @Roles('admin')
  @HttpCode(200)
  cancel(@RequestContext() ctx, @Param('id') id: string, @Body() body: any) {
    return this.service.cancelByAdmin(ctx.req, id, body);
  }
}
