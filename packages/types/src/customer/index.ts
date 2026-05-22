import type { User } from '../user';
import type { Product } from '../product';
import type { Address } from '../address';
import type { Subscription } from '../subscription';

export interface CustomerProfile extends User {
  totalOrders: number;
  totalSpent: number;
  subscription?: Subscription | null;
  wishlist: Product[];
  addresses: Address[];
}