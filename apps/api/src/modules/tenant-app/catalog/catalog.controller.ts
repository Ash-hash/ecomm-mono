// src/modules/tenant-app/catalog/catalog.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto } from './dto/catalog.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestContext } from 'src/common/decorators/request-context.decorator';

@Controller('catalog')
@Public()   // All catalog routes are public (storefront)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  getProducts(@RequestContext() ctx, @Query() query: CatalogQueryDto) {
    return this.catalogService.getProducts(ctx.req, query);
  }

  @Get('products/featured')
  getFeaturedProducts(@RequestContext() ctx, @Query('limit') limit?: string) {
    return this.catalogService.getFeaturedProducts(ctx.req, Number(limit) || 8);
  }

  @Get('products/search')
  searchProducts(@RequestContext() ctx, @Query('q') q = '') {
    return this.catalogService.searchProducts(ctx.req, q);
  }

  @Get('products/:slug')
  getProduct(@RequestContext() ctx, @Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(ctx.req, slug);
  }

  @Get('categories')
  getCategories(@RequestContext() ctx) {
    return this.catalogService.getCategories(ctx.req);
  }

  @Get('store')
  getStoreInfo(@RequestContext() ctx) {
    return this.catalogService.getStoreInfo(ctx.req);
  }
}
