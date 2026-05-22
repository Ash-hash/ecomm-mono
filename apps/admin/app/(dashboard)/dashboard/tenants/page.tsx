'use client';

import { Button } from '@/app/component/ui/Button';
import CreateTenantModal from '@/app/component/ui/CreateTenantModal';
import { adminApi } from '@/app/features/api';
import { useTenants } from '@/app/hooks/useTenants';
import { useState } from 'react';

export default function TenantsPage() {
  const { data, refetch } = useTenants();
  const [open, setOpen] = useState(false);

  const tenants = data || [];

  const suspend = async (id: string) => {
    await adminApi.suspendTenant(id, 'Violation');
    refetch();
  };

  const reactivate = async (id: string) => {
    await adminApi.reactivateTenant(id);
    refetch();
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="flex justify-between mb-6">
        <h1 className="text-xl">Tenants</h1>

        <button
          onClick={() => setOpen(true)}
          className="bg-[var(--primary)] text-black px-4 py-2 rounded"
        >
          + Create Tenant
        </button>
      </div>
      <table className="w-full">
        <thead className="bg-black/30">
          <tr className="text-[var(--muted)] text-sm">
            <th className="p-4">Store</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tenants.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-10 text-gray-400">
                🚀 No tenants yet. Create your first tenant.
              </td>
            </tr>
          ) : (
            tenants.map((t: any) => (
              <tr
                key={t._id}
                className="border-t border-[var(--border)] hover:bg-white/5 transition"
              >
                <td className="p-4">
                  <div>
                    <p className="font-semibold">{t.storeName}</p>
                    <p className="text-xs text-[var(--muted)]">{t.slug}</p>
                  </div>
                </td>

                <td className="text-[var(--primary)]">{t.plan}</td>

                <td>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      t.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : t.status === 'trial'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>

                <td className="flex gap-2">
                  {t.status !== 'suspended' ? (
                    <Button onClick={() => suspend(t._id)}>Suspend</Button>
                  ) : (
                    <Button onClick={() => reactivate(t._id)}>
                      Reactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {open && <CreateTenantModal onClose={() => setOpen(false)} />}
    </div>
  );
}
