/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Btn } from '@/src/app/components/ui';
import ImageUploader from '@/src/app/components/ui/ImageUploader';
import { Category } from '@repo/types';
import { useEffect, useMemo } from 'react';

type Props = {
  form: any;
  update: (key: string, value: any) => void;
  categories: Category[];
  onSubmit: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
};

export default function ProductForm({
  form,
  update,
  categories,
  onSubmit,
  isLoading,
  isEdit,
}: Props) {
  const level1 = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  const level2 = useMemo(
    () => categories.filter((c) => c.parentId === form.parentCategoryId),
    [categories, form.parentCategoryId],
  );

  const level3 = useMemo(
    () => categories.filter((c) => c.parentId === form.subCategoryId),
    [categories, form.subCategoryId],
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* BASIC */}
      <input
        placeholder="Product Name"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <label>Product Name (Hindi)</label>
        <input
          value={form.name_hi}
          onChange={(e) => update('name_hi', e.target.value)}
          placeholder="उत्पाद का नाम"
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <label>Local Identity</label>
        <input
          value={form.localIdentity}
          onChange={(e) => update('localIdentity', e.target.value)}
          placeholder="Local / Desi name"
        />
      </div>

      <input
        placeholder="SKU"
        value={form.sku}
        onChange={(e) => update('sku', e.target.value)}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => update('price', e.target.value)}
        />

        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => update('stock', e.target.value)}
        />
      </div>

      {/* CATEGORY */}
      {/* LEVEL 1 */}
      <select
        value={form.parentCategoryId || ''}
        onChange={(e) => {
          const value = e.target.value;

          update('parentCategoryId', value);
          update('subCategoryId', '');
          update('childCategoryId', '');
          update('categoryId', value);

          const cat = categories.find((c) => c._id === value);
          update('categoryName', cat?.name || '');
        }}
      >
        <option value="">Select Category</option>
        {level1.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* LEVEL 2 */}
      <select
        value={form.subCategoryId || ''}
        disabled={!form.parentCategoryId}
        onChange={(e) => {
          const value = e.target.value;

          update('subCategoryId', value);
          update('childCategoryId', '');
          update('categoryId', value);

          const cat = categories.find((c) => c._id === value);
          update('categoryName', cat?.name || '');
        }}
      >
        <option value="">Select Sub Category</option>
        {level2.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* LEVEL 3 */}
      <select
        value={form.childCategoryId || ''}
        disabled={!form.subCategoryId}
        onChange={(e) => {
          const value = e.target.value;

          update('childCategoryId', value);
          update('categoryId', value);

          const cat = categories.find((c) => c._id === value);
          update('categoryName', cat?.name || '');
        }}
      >
        <option value="">Select Child Category</option>
        {level3.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* FEATURED */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => update('featured', e.target.checked)}
        />
        Featured Product
      </label>

      {/* IMAGES */}
      <div>
        <p>Main Image</p>
        <ImageUploader
          images={form.main_image ? [form.main_image] : []}
          multiple={false}
          onChange={(urls) => update('main_image', urls[0] || '')}
        />
      </div>

      <div>
        <p>Gallery</p>
        <ImageUploader
          images={form.images}
          onChange={(urls) => update('images', urls)}
        />
      </div>

      {/* DESCRIPTION */}
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => update('description', e.target.value)}
      />
      <textarea
        value={form.description_hi}
        onChange={(e) => update('description_hi', e.target.value)}
        placeholder="हिंदी विवरण"
      />

      {/* SUBMIT */}
      <Btn onClick={onSubmit} variant="primary">
        {isEdit ? 'Update Product' : 'Create Product'}
      </Btn>
    </div>
  );
}
