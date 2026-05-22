import { PaginationParams } from '../common';
import { OrderStatus } from './order.types';


export interface OrdersParams extends PaginationParams {
  status?: OrderStatus;
  userId?: string;
}