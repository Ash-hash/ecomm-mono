/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Btn, PageHeader, TableCard } from '../../../../../components/ui';
import { useCreateProduct, useCategoriesFull } from '../../../../../hooks';
import ProductForm from '@/src/app/components/product/ProductForm';
import { tenantPath } from '@/src/app/utils/tenant';

export default function CreateProductPage() {
  const router = useRouter();

  const { data } = useCategoriesFull();
  const categories = data?.categories || [];
  // const tree = data?.tree || [];
  const createProduct = useCreateProduct();

  const [form, setForm] = useState({
    name: '',
    name_hi: '',
    localIdentity: '',
    sku: '',
    price: '',
    stock: '',
    categoryId: '',
    main_image: '',
    images: [] as string[],
    description: '',
    featured: false,
    description_hi: '',
  });

  function update(key: string, value: any) {
    setForm((p: any) => ({ ...p, [key]: value }));
  }

  function handleSubmit() {
    // Basic validation
    if (!form.name || !form.price || !form.categoryId) {
      alert('Fill required fields');
      return;
    }

    createProduct.mutate(
      {
        name: form.name,
        name_hi: form.name_hi,
        localIdentity: form.localIdentity,

        sku: form.sku,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        categoryId: form.categoryId,

        main_image: form.main_image,
        images: form.images,

        description: form.description,
        description_hi: form.description_hi,

        featured: form.featured,
      },
      {
        onSuccess: () => {
          router.push(tenantPath('/dashboard/products'));
        },
      },
    );
  }

  return (
    <div>
      <PageHeader title="Create Product" />

      <ProductForm
        form={form}
        update={update}
        categories={categories || []}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
