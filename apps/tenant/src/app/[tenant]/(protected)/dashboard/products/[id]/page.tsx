/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCategoriesFull, useProduct, useUpdateProduct } from '@/src/app/hooks';
import { PageHeader, TableCard, Btn } from '@/src//app/components/ui';
import { getImageUrl } from '@/src/app/components/ui/ImageUploader';
import { useEffect, useState } from 'react';
import ProductForm from '@/src/app/components/product/ProductForm';
import { Category } from '@repo/types';
import { tenantPath } from '@/src/app/utils/tenant';

function buildCategoryTree(categoryId: string, categories: Category[]) {
  const current = categories.find((c) => c._id === categoryId);

  let child = '';
  let sub = '';
  let parent = '';

  if (!current) return {};

  if (!current.parentId) {
    parent = current._id;
  } else {
    child = current._id;
    const parent1 = categories.find((c) => c._id === current.parentId);

    if (parent1?.parentId) {
      sub = parent1._id;
      parent = parent1.parentId;
    } else {
      sub = current._id;
      parent = parent1?._id || '';
      child = '';
    }
  }

  return {
    parentCategoryId: parent,
    subCategoryId: sub,
    childCategoryId: child,
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, isLoading } = useProduct(id as string);
  const product = data?.data;
  const [isEdit, setIsEdit] = useState(false);
  const { data: thisdata } = useCategoriesFull();
  const categories = thisdata?.categories || [];
  const tree = thisdata?.tree || [];

  const updateProduct = useUpdateProduct(); // create this hook

  const [form, setForm] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (product && categories && !initialized) {
      const tree = buildCategoryTree(
        product.categoryId?._id || product.categoryId,
        categories,
      );

      setForm({
        id: product._id,

        name: product.name,
        name_hi: product.name_hi || '',
        localIdentity: product.localIdentity || '',

        sku: product.sku,
        price: product.price,
        stock: product.stock,

        categoryId: product.categoryId?._id,
        categoryName: product.categoryName || '',

        parentCategoryId: tree.parentCategoryId,
        subCategoryId: tree.subCategoryId,
        childCategoryId: tree.childCategoryId,
        status: product.status || 'active', 

        main_image: product.main_image,
        images: product.images || [],

        description: product.description || '',
        description_hi: product.description_hi || '',

        featured: product.featured || false,
      });

      setInitialized(true);
    }
  }, [product, categories, initialized]);

  function update(key: string, value: any) {
    setForm((p: any) => ({ ...p, [key]: value }));
  }

  function handleUpdate() {
    if (!product) return;

    const { parentCategoryId, subCategoryId, childCategoryId, ...rest } = form;

    updateProduct.mutate(rest, {
      onSuccess: () => {
        router.push(tenantPath('/dashboard/products'));
      },
    });
  }

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={product.categoryName || '—'}
        actions={
          <>
            <Btn onClick={() => setIsEdit(!isEdit)}>
              {isEdit ? 'Cancel' : 'Edit'}
            </Btn>
            <Btn onClick={() => router.back()}>Back</Btn>
          </>
        }
      />

      <TableCard>
        <div style={{ padding: 20 }}>
          {isEdit && form ? (
            <ProductForm
              form={form}
              update={update}
              categories={categories || []}
              onSubmit={handleUpdate}
              isEdit
            />
          ) : (
            <>
              {/* VIEW MODE */}
              <img
                src={getImageUrl(product.main_image)}
                style={{ width: 200, borderRadius: 10 }}
              />

              <p>
                <b>SKU:</b> {product.sku}
              </p>
              <p>
                <b>Price:</b> ₹{product.price}
              </p>
              <p>
                <b>Stock:</b> {product.stock}
              </p>
              <p>
                <b>Description:</b> {product.description}
              </p>
            </>
          )}
        </div>
      </TableCard>
    </div>
  );
}
