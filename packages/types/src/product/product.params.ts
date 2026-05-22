import { PaginationParams } from '../common';
import { ProductStatus } from './product.types';

export interface ProductsParams extends PaginationParams {
  status?: ProductStatus;
  categoryId?: string;
}