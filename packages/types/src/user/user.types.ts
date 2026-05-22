export type UserRole = 'customer' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'banned' | 'suspended';
export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan;
  emailVerified: boolean;
  avatarUrl?: string;
  lastOrderAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}
