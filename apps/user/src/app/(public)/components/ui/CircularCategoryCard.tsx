/* eslint-disable @next/next/no-img-element */
'use client';

import { Category } from '@repo/types';
import Link from 'next/link';
import { getTenantUrl } from '@/src/utils/image';

interface Props {
  category: Category;
}

export default function CircularCategoryCard({ category }: Props) {
  const img = category.image
    ? getTenantUrl(category.image)
    : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8';

  return (
    <Link href={`/products?categoryId=${category._id}`}>
      <div className="flex flex-col items-center text-center group cursor-pointer w-24">

        {/* Circle Image */}
        <div className="relative">

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-[var(--primary)] blur-md opacity-0 group-hover:opacity-35 transition duration-300"></div>

          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-[var(--border)] shadow-sm group-hover:border-[var(--primary)] group-hover:shadow-lg transition">

            <img
              src={img}
              loading="lazy"
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />

          </div>

        </div>

        {/* Category Name */}
        <p className="mt-3 text-sm font-semibold text-[var(--text-strong)] group-hover:text-[var(--primary)] transition">
          {category.name}
        </p>

        {/* Product Count */}
        <span className="text-xs text-[var(--text-muted)]">
          {category.productCount || 0} items
        </span>

      </div>
    </Link>
  );
}
