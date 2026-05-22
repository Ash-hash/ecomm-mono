// ─── catalog.module.ts ────────────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema }   from '../products/product.schema';
import { Category, CategorySchema } from '../categories/category.schema';
import { CatalogController }        from './catalog.controller';
import { CatalogService }           from './catalog.service';
import { StoreConfig, StoreConfigSchema } from '../store/store-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name,  schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: StoreConfig.name, schema: StoreConfigSchema }, 
    ]),
  ],
  controllers: [CatalogController],
  providers:   [CatalogService],
})
export class CatalogModule {}