import { z } from 'zod';

export const createTenantSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerEmail: z.email('Please enter a valid email'),
  ownerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;