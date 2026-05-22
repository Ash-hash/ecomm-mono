// src/modules/tenant-app/catalog/catalog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductSchema } from '../products/product.schema';
import { CategorySchema } from '../categories/category.schema';
import { StoreConfigSchema } from '../store/store-config.schema';
import { CatalogQueryDto } from './dto/catalog.dto';
import { paginate } from '../../../common/helpers/paginate.helper';
import { getModel } from '../../../common/utils/get-model.util';

@Injectable()
export class CatalogService {
  async getProducts(req: any, query: CatalogQueryDto) {
    const Product = getModel(req, 'Product', ProductSchema);
    const Category = getModel(req, 'Category', CategorySchema);
    const filter: any = { deleted: false, status: 'active' };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.category) {
      const category = await Category.findOne({
        slug: query.category,
        isActive: { $ne: false },
      }).lean();
      if (!category) {
        return {
          success: true,
          data: [],
          meta: {
            total: 0,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
            totalPages: 0,
          },
        };
      }
      const children = await Category.find({
        parentId: category._id,
        isActive: { $ne: false },
      })
        .select('_id')
        .lean();
      filter.categoryId = {
        $in: [category._id, ...children.map((child: any) => child._id)],
      };
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      filter.price = {};
      if (query.priceMin !== undefined) filter.price.$gte = query.priceMin;
      if (query.priceMax !== undefined) filter.price.$lte = query.priceMax;
    }
    if (query.tags) {
      filter.tags = {
        $in: query.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
    }
    if (query.featured === 'true') filter.featured = true;

    const result = await paginate(Product, filter, {
      page: query.page,
      limit: query.limit,
      sort: { [query.sort ?? 'createdAt']: query.order === 'asc' ? 1 : -1 },
    });

    return { success: true, ...result };
  }

  async getFeaturedProducts(req: any, limit: number) {
    const Product = getModel(req, 'Product', ProductSchema);
    const products = await Product.find({
      deleted: false,
      status: 'active',
      featured: true,
    })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 24))
      .lean();
    return { success: true, data: products };
  }

  async searchProducts(req: any, q: string) {
    const Product = getModel(req, 'Product', ProductSchema);
    const term = q.trim();
    if (term.length < 2) return { success: true, data: [] };

    const products = await Product.find({
      deleted: false,
      status: 'active',
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
        { localIdentity: { $regex: term, $options: 'i' } },
      ],
    })
      .limit(10)
      .lean();
    return { success: true, data: products };
  }

  async getProductBySlug(req: any, slug: string) {
    const Product = getModel(req, 'Product', ProductSchema);
    const or: any[] = [{ slug }];
    if (/^[a-f\d]{24}$/i.test(slug)) or.push({ _id: slug });
    const product = await Product.findOne({
      $or: or,
      deleted: false,
      status: 'active',
    }).lean();
    if (!product) throw new NotFoundException('Product not found');
    return { success: true, data: product };
  }

  async getCategories(req: any) {
    const Category = getModel(req, 'Category', CategorySchema);
    const Product = getModel(req, 'Product', ProductSchema);
    const categories = await Category.find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    const byId = new Map(
      categories.map((category: any) => [
        category._id.toString(),
        { ...category, children: [] },
      ]),
    );
    const roots: any[] = [];

    for (const category of byId.values()) {
      const parentId = category.parentId?.toString();
      if (parentId && byId.has(parentId)) {
        byId.get(parentId).children.push(category);
      } else {
        roots.push(category);
      }
    }

    const countProducts = async (category: any): Promise<number> => {
      const childCounts = await Promise.all(
        (category.children ?? []).map((child: any) => countProducts(child)),
      );
      const ownCount = await Product.countDocuments({
        deleted: false,
        status: 'active',
        categoryId: category._id,
      });
      category.productCount = ownCount + childCounts.reduce((sum, count) => sum + count, 0);
      return category.productCount;
    };

    await Promise.all(roots.map((category) => countProducts(category)));

    return { success: true, data: roots };
  }

  async getStoreInfo(req: any) {
    const Store = getModel(req, 'StoreConfig', StoreConfigSchema);
    const config = await Store.findOne().lean();
    return { success: true, data: config ?? null };
  }
}
