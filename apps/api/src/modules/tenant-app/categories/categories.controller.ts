// ─── categories.controller.ts ─────────────────────────────────────────────────
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode,
} from '@nestjs/common';

import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/common/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { RequestContext } from 'src/common/decorators/request-context.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get() findAll(@RequestContext() ctx) { return this.categoriesService.findAll(ctx); }
  @Post() create(@RequestContext() ctx, @Body() dto: CreateCategoryDto) { return this.categoriesService.create(ctx, dto); }
  @Patch(':id') update(@RequestContext() ctx, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCategoryDto) { return this.categoriesService.update(ctx, id, dto); }
  @Delete(':id') @HttpCode(200) remove(@RequestContext() ctx, @Param('id', ParseObjectIdPipe) id: string) { return this.categoriesService.remove(ctx, id); }
}
