export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  children: Category[];
  parentId?: string | null;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
  isNavBarEnable: boolean;
}