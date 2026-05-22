'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTenantInput, createTenantSchema } from '@/app/schemas/createTenant.schema';
import { generateSlug } from '@/app/utils/slug';
import { useCreateTenant } from '@/app/hooks/useCreateTenant';


export default function CreateTenantModal({ onClose }: any) {
  const { mutate, isPending } = useCreateTenant();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
  });

  const storeName = watch('storeName');
  const slug = generateSlug(storeName || '');

  const onSubmit = (data: CreateTenantInput) => {
    mutate(
      { ...data, slug },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-xl w-[420px] glow">
        <h2 className="text-xl mb-4 text-[var(--primary)]">Create Tenant</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          
          <input
            placeholder="Store Name"
            {...register('storeName')}
            className="input"
          />
          {errors.storeName && <p className="text-red-400 text-xs">{errors.storeName.message}</p>}

          <input
            placeholder="Owner Name"
            {...register('ownerName')}
            className="input"
          />

          <input
            placeholder="Email"
            {...register('ownerEmail')}
            className="input"
          />

          <input
            placeholder="Phone"
            {...register('ownerPhone')}
            className="input"
          />

          <input
            type="password"
            placeholder="Password"
            {...register('password')}
            className="input"
          />

          {/* 🔥 Auto slug preview */}
          <div className="text-xs text-[var(--muted)]">
            URL: <span className="text-[var(--primary)]">{slug}.yoursaas.com</span>
          </div>

          <button
            disabled={isPending}
            className="bg-[var(--primary)] text-black py-2 rounded-lg mt-2"
          >
            {isPending ? 'Creating...' : 'Create Tenant'}
          </button>
        </form>
      </div>
    </div>
  );
}