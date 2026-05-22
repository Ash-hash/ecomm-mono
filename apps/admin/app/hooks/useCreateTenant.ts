// hooks/useCreateTenant.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@repo/api-client';

export function useCreateTenant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      api.post('/tenants/register', data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}