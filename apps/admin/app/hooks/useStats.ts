// hooks/useStats.ts
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../features/api';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: adminApi.getStats,
  });
}