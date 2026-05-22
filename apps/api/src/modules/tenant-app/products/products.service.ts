import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { getModel } from 'src/common/utils/get-model.util';
import { ProductSchema } from './product.schema';
import { CategorySchema } from '../categories/category.schema';
import { paginate } from 'src/common/helpers/paginate.helper';

@Injectable()
export class ProductsService {
  private slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  // ─────────────────────────────────────────────
  // CREATE PRODUCT
  // ─────────────────────────────────────────────
  async create(req: any, dto: any) {
    const Product = getModel(req, 'Product', ProductSchema);
    const Category = getModel(req, 'Category', CategorySchema);

    const categoryId = dto.categoryId ?? dto.category;
    if (categoryId) {
      const exists = await Category.findById(categoryId);
      if (!exists) {
        throw new BadRequestException('Invalid category');
      }
      dto.categoryId = exists._id;
      dto.categoryName = exists.name;
      dto.categoryPath = [
        ...(exists.categoryPath ?? []),
        { _id: exists._id.toString(), name: exists.name },
      ];
      delete dto.category;
    }

    if (!dto.slug && dto.name) {
      dto.slug = this.slugify(dto.name);
    }

    return Product.create(dto);
  }

  // ─────────────────────────────────────────────
  // GET ALL PRODUCTS (WITH FILTER + SEARCH)
  // ─────────────────────────────────────────────
  async findAll(req: any, query: any) {
    const Product = getModel(req, 'Product', ProductSchema);
    const Category = getModel(req, 'Category', CategorySchema);

    const filter: any = {};

    // 🔍 SEARCH
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    // 📂 FILTER BY CATEGORY
    if (query.categoryId || query.category) {
      filter.categoryId = query.categoryId ?? query.category;
    }

    // 💰 PRICE FILTER
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = query.minPrice;
      if (query.maxPrice) filter.price.$lte = query.maxPrice;
    }

    // 📦 STOCK FILTER
    if (query.inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    return paginate(Product, filter, {
      page: query.page,
      limit: query.limit,
      sort: this.buildSort(query),
      populate: {
        path: 'categoryId',
        model: Category,
        select: 'name slug',
      },
    });
  }

  // ─────────────────────────────────────────────
  // GET SINGLE PRODUCT
  // ─────────────────────────────────────────────
  async findOne(req: any, id: string) {
    const Product = getModel(req, 'Product', ProductSchema);
    const Category = getModel(req, 'Category', CategorySchema);

    const product = await Product.findById(id)
      .populate({
        path: 'categoryId',
        model: Category,
        select: 'name slug',
      })
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // ─────────────────────────────────────────────
  // UPDATE PRODUCT
  // ─────────────────────────────────────────────
  async update(req: any, id: string, dto: any) {
    const Product = getModel(req, 'Product', ProductSchema);
    const Category = getModel(req, 'Category', CategorySchema);

    const categoryId = dto.categoryId ?? dto.category;
    if (categoryId) {
      const exists = await Category.findById(categoryId);
      if (!exists) {
        throw new BadRequestException('Invalid category');
      }
      dto.categoryId = exists._id;
      dto.categoryName = exists.name;
      dto.categoryPath = [
        ...(exists.categoryPath ?? []),
        { _id: exists._id.toString(), name: exists.name },
      ];
      delete dto.category;
    }

    const product = await Product.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // ─────────────────────────────────────────────
  // DELETE PRODUCT
  // ─────────────────────────────────────────────
  async remove(req: any, id: string) {
    const Product = getModel(req, 'Product', ProductSchema);

    const product = await Product.findByIdAndUpdate(
      id,
      { deleted: true, status: 'archived' },
      { new: true },
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product deleted' };
  }

  // ─────────────────────────────────────────────
  // SORT BUILDER (PRODUCTION)
  // ─────────────────────────────────────────────
  private buildSort(query: any) {
    if (!query.sort) return { createdAt: -1 };

    const order = query.order === 'asc' ? 1 : -1;

    return {
      [query.sort]: order,
    };
  }
}
