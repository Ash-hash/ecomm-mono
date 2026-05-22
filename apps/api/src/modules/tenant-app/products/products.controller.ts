import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { Roles, RolesGuard } from "src/common/guards/roles.guard";
import { ProductsService } from "./products.service";
import { PaginationDto } from "src/common/pagination.dto";
import { RequestContext } from "src/common/decorators/request-context.decorator";
import { Public } from "src/common/decorators/public.decorator";
import { ParseObjectIdPipe } from "src/common/pipes/parse-object-id.pipe";

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @Public()
  findAll(@RequestContext() ctx, @Query() query: PaginationDto) {
    return this.service.findAll(ctx, query);
  }

  @Get(':id')
  @Public()
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

  @Patch(':id/featured')
  @Roles('admin')
  updateFeatured(
    @RequestContext() ctx,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('isFeatured') isFeatured: boolean,
  ) {
    return this.service.update(ctx, id, { featured: Boolean(isFeatured) });
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
