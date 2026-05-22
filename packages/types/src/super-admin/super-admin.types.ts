// types/index.ts  (or wherever you keep shared types)

import { PaginatedResponse } from "../common";

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type TenantPlan = 'starter' | 'growth' | 'pro' | 'enterprise';

export interface Tenant {
  _id: string;
  storeName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  plan: TenantPlan;
  status: TenantStatus;
  monthlyAmount: number;
  createdAt: string;
}

// Updated PlatformStats to match real API response structure
export interface PlatformStatsResponse {
  data: {
    overview: {
      totalTenants: number;
      activeTenants: number;
      trialTenants: number;
      mrr: number;
    };
  };
}


export type TenantsResponse = PaginatedResponse<Tenant>;

// Optional: Flat type for convenience
export type PlatformStatsOverview = PlatformStatsResponse['data']['overview'];