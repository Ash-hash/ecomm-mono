import { Product } from "../product";

export interface SectionHeaderProps {
  title: string;
}

export interface CommerceState {
  cartCount: number;
  wishlist:  Product[];
}


export type CheckoutStatus =
  | 'idle'
  | 'reviewing'
  | 'processing'
  | 'verifying'
  | 'success'
  | 'failed';