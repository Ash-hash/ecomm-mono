import { api } from '@repo/api-client';
import { PlatformStatsResponse, TenantsResponse, Tenant } from '@repo/types';

export const adminApi = {
  // Corrected: We expect the full wrapped response from fetcher
  getStats: () => api.get<PlatformStatsResponse>('/tenants/stats'),

  getTenants: (params?: any) => api.get<TenantsResponse>('/tenants', params),

  getTenantById: (id: string) => api.get<Tenant>(`/tenants/${id}`),

  suspendTenant: (id: string, reason?: string) =>
    api.patch(`/tenants/${id}/suspend`, { reason }),

  reactivateTenant: (id: string) => api.patch(`/tenants/${id}/reactivate`),
};