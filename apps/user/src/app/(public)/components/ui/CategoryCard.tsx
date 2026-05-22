'use client';

import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { Category } from '@repo/types';
import { getImageUrl } from '@/src/utils/image';

interface Props {
  category: Category;
}

export default function CategoryCard({ category }: Props) {
  const img = category.image
    ? getImageUrl(category.image)
    : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8';

  return (
    <Link
      href={{
        pathname: '/products',
        query: { cat: category.slug },
      }}
      className="group block"
    >
      <div
        className={clsx(
          'relative h-60 md:h-64 rounded-[28px] overflow-hidden',
          'border border-neutral-200',
          'shadow-[0_10px_35px_rgba(0,0,0,0.08)]',
          'hover:shadow-[0_28px_70px_rgba(0,0,0,0.18)]',
          'transition-all duration-500',
        )}
      >
        {/* IMAGE */}
        <Image
          src={img}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* SOFT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* GLASS PANEL */}
        <div className="absolute bottom-4 left-4 right-4 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm md:text-base font-semibold tracking-wide">
                {category.name}
              </h3>

              <p className="text-white/80 text-xs mt-1">
                {category.productCount || 0} products
              </p>
            </div>

            <span className="text-white text-xl opacity-70 group-hover:translate-x-1 transition">
              →
            </span>
          </div>
        </div>

        {/* LIGHT EFFECT */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.18),transparent_60%)]" />
      </div>
    </Link>
  );
}
