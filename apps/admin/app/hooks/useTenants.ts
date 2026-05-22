import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../features/api";

// hooks/useTenants.ts
export function useTenants(params?: any) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const res = await adminApi.getTenants(params);
      return res.data; // ✅ ONLY ARRAY
    },
  });
}