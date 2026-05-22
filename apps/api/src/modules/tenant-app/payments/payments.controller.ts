// src/modules/tenant-app/payments/payments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  Query,
  Param,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequestContext } from '../../../common/decorators/request-context.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@RequestContext() ctx, @Query() query: any) {
    return this.paymentsService.findAll(ctx.req, query);
  }

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  createRazorpayOrder(
    @RequestContext() ctx,
    @Body('orderId') orderId: string,
  ) {
    return this.paymentsService.createRazorpayOrder(ctx.req, orderId);
  }

  @Post('verify')
  verifyPayment(@RequestContext() ctx, @Body() dto: any) {
    return this.paymentsService.verifyPayment(ctx.req, dto);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  refund(
    @RequestContext() ctx,
    @Param('id') id: string,
    @Body() body: { amount?: number },
  ) {
    return this.paymentsService.refund(ctx.req, id, body?.amount);
  }
}
