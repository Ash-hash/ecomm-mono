import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './api';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });
}

export function useTenants(params: any) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: () => adminApi.getTenants(params),
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: any) =>
      adminApi.suspendTenant(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}