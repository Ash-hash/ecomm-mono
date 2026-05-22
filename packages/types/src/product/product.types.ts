export type ProductStatus = 'active' | 'inactive' | 'archived';

export interface CategoryRef {
  _id: string;
  name: string;
}

export interface Product {
  _id: string;
  name: string;
  name_hi: string;
  localIdentity: string;
  slug: string;
  description?: string;
  description_hi?: string;
  categoryId?: string | CategoryRef;
  categoryName?: string;
  categoryPath?: { _id: string; name: string }[];
  price: number;
  compareAtPrice?: number;
  cost?: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  main_image?: string;
  images?: string[];
  status: ProductStatus;
  featured: boolean;
  deleted: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

