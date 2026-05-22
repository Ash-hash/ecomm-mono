import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;
export type ProductStatus = 'active' | 'inactive' | 'archived';

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;
  

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ trim: true })
  name_hi: string;

  @Prop({ trim: true })
  description_hi: string;

  // ✅ Local identity (example: Desi name / regional name)
  @Prop({ trim: true })
  localIdentity: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop()
  categoryName: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  compareAtPrice: number;

  @Prop()
  cost: number;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ default: 10 })
  lowStockThreshold: number;

  @Prop({ type: String, default: '' })
  main_image: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ['active', 'inactive', 'archived'], default: 'active' })
  status: ProductStatus;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: [
      {
        _id: String,
        name: String,
      },
    ],
    default: [],
  })

  categoryPath: { _id: string; name: string }[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);


ProductSchema.index({
  name: 'text',
  name_hi: 'text',
  localIdentity: 'text',
  sku: 'text',
  description: 'text',
});

// ProductSchema.index({ slug: 1 });
// ProductSchema.index({ sku: 1 });
ProductSchema.index({ status: 1, deleted: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ createdAt: -1 });
