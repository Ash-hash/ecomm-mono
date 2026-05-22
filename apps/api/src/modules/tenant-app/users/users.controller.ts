import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/common/guards/roles.guard';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { RequestContext } from 'src/common/decorators/request-context.decorator';
import { CurrentTenant } from 'src/common/decorators/tenant.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles('admin')
  findAll(@RequestContext() ctx, @Query() query: any) {
    return this.service.findAll(ctx, query);
  }

  @Get(':id')
  @Roles('admin')
  findOne(
    @RequestContext() ctx,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.service.findOne(ctx, id);
  }

  @Post()
  @Roles('admin')
  create(@RequestContext() ctx, @Body() dto) {
    return this.service.create(ctx, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @RequestContext() ctx,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto,
  ) {
    return this.service.update(ctx, id, dto);
  }

  @Patch(':id/status')
  @Roles('admin')
  updateStatus(
    @RequestContext() ctx,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.service.update(ctx, id, { status });
  }

  @Delete(':id')
  @Roles('admin')
  remove(
    @RequestContext() ctx,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.service.remove(ctx, id);
  }
}
