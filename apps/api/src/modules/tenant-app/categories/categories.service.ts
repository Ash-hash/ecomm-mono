// ─── categories.service.ts ────────────────────────────────────────────────────
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CategorySchema } from './category.schema';
import { ProductSchema } from '../products/product.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { getModel } from 'src/common/utils/get-model.util';

function buildPathMap(categories: any[]) {
  const map = new Map();

  categories.forEach((c) => {
    map.set(c._id.toString(), c);
  });

  categories.forEach((c) => {
    const path: { _id: string; name: string }[] = [];
    let current = c;

    while (current) {
      path.unshift({
        _id: current._id.toString(),
        name: current.name,
      });

      current = current.parentId ? map.get(current.parentId.toString()) : null;
    }

    c._path = path;
  });
}

@Injectable()
export class CategoriesService {
  async findAll(ctx: any) {
    const Category = getModel(ctx, 'Category', CategorySchema);
    const cats = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $in: [
                        { $toString: '$$categoryId' },
                        {
                          $map: {
                            input: '$categoryPath',
                            as: 'cp',
                            in: '$$cp._id',
                          },
                        },
                      ],
                    },
                    { $eq: ['$deleted', false] },
                    { $ne: ['$status', 'archived'] },
                  ],
                },
              },
            },
            {
              $count: 'count',
            },
          ],
          as: 'productMeta',
        },
      },
      {
        $addFields: {
          productCount: {
            $ifNull: [{ $arrayElemAt: ['$productMeta.count', 0] }, 0],
          },
        },
      },
      {
        $project: {
          productMeta: 0,
        },
      },
    ]);

    // ─── TREE BUILD ─────────────────────────────
    const map = new Map<string, any>();

    cats.forEach((c) => {
      map.set(c._id.toString(), { ...c, children: [] });
    });

    const tree: any[] = [];

    cats.forEach((c) => {
      const node = map.get(c._id.toString());

      if (c.parentId) {
        const parent = map.get(c.parentId.toString());
        if (parent) parent.children.push(node);
      } else {
        tree.push(node);
      }
    });

    return {
      data: {
        categories: cats,
        tree,
      },
    };
  }

  async create(ctx: any, dto: CreateCategoryDto) {
    const Category = getModel(ctx, 'Category', CategorySchema);
    const exists = await Category.findOne({
      slug: dto.slug.toLowerCase(),
    });

    if (exists) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }
    const cats = (await Category.find().lean()) as any[];
    buildPathMap(cats);

    const parent = dto.parentId
      ? cats.find((c) => c._id.toString() === dto.parentId)
      : null;

    const categoryPath = parent
      ? [
          ...(parent.categoryPath || []),
          {
            _id: parent._id.toString(), // ✅ FIX
            name: parent.name,
          },
        ]
      : [];
    const cat = await Category.create({
      ...dto,
      slug: dto.slug.toLowerCase(),
      categoryPath,
    });

    return { message: 'Category created', data: cat };
  }

  async update(ctx: any, id: string, dto: UpdateCategoryDto) {
    const Category = getModel(ctx, 'Category', CategorySchema);
    const Product = getModel(ctx, 'Product', ProductSchema);
    const cat = await Category.findById(id);
    if (!cat) throw new NotFoundException('Category not found');

    if (dto.slug && dto.slug !== cat.slug) {
      const taken = await Category.findOne({
        slug: dto.slug.toLowerCase(),
        _id: { $ne: id },
      });

      if (taken) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
    }

    Object.assign(cat, dto);

    // 🔥 recompute path
    const cats = (await Category.find().lean()) as any[];
    buildPathMap(cats);

    const current = cats.find((c) => c._id.toString() === id);

    cat.categoryPath = current?.categoryPath || [];
    // inside CategoriesService.update()
    await Product.updateMany(
      { categoryId: id },
      {
        categoryName: cat.name,
        categoryPath: cat.categoryPath,
      },
    );

    await cat.save();

    return { message: 'Category updated', data: cat };
  }

  async remove(ctx: any, id: string) {
    const Category = getModel(ctx, 'Category', CategorySchema);
    const Product = getModel(ctx, 'Product', ProductSchema);
    const cat = await Category.findById(id);
    if (!cat) throw new NotFoundException('Category not found');
    // Unset categoryId on products in this category
    await Product.updateMany(
      { categoryId: id },
      { $unset: { categoryId: 1, categoryName: 1 } },
    );
    // Move children to top-level
    await Category.updateMany(
      { parentId: id },
      { $set: { parentId: cat.parentId || null } },
    );
    await Category.findByIdAndDelete(id);
    return { message: 'Category deleted', data: null };
  }
}
