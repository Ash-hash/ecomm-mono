/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

const sortMap: Record<string, string> = {
  featured: 'createdAt',
  'price-asc': 'price',
  'price-desc': 'price',
  rating: 'createdAt',
};

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Heart, Star, ArrowUpDown, X } from 'lucide-react';
import Image from 'next/image';

import { useCategories, useProducts } from '@/src/hooks';
import { useRouter } from 'next/navigation';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/ui/ProductCard';
import ProductCardSkeleton from '../components/ui/ProductCardSkeleton';
export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const categorySlug = searchParams.get('cat') ?? '';
  const priceMin = searchParams.get('priceMin') ?? '';
  const priceMax = searchParams.get('priceMax') ?? '';
  const sort = searchParams.get('sort') ?? 'featured';

  function updateParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) params.delete(key);
    else params.set(key, value);;

    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function changePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());

    router.push(`/products?${params.toString()}`);
  }

  const { data, isLoading } = useProducts({
    search,
    category: categorySlug,
    priceMin,
    priceMax,
    sort: sortMap[sort] ?? 'createdAt',
    page,
    limit: 20,
  });

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData ?? [];

  function flattenCategories(categories: any[]) {
    const result: any[] = [];

    categories.forEach((cat) => {
      result.push(cat);

      if (cat.children?.length) {
        cat.children.forEach((child: any) => {
          result.push({
            ...child,
            parent: cat,
          });
        });
      }
    });

    return result;
  }

  const allCategories = flattenCategories(categories);

  const currentCategory = allCategories.find((c) => c.slug === categorySlug);

  const parentCategory = currentCategory?.parent ?? currentCategory;

  const subCategories = parentCategory?.children ?? [];

  let products = data?.data ?? [];
  const totalPages = data?.meta.totalPages;
  const totalProducts = data?.meta?.total ?? 0;
  const start = (page - 1) * 20 + 1;
  const end = Math.min(page * 20, totalProducts);

  if (sort === 'price-asc')
    products = [...products].sort((a, b) => a.price - b.price);

  if (sort === 'price-desc')
    products = [...products].sort((a, b) => b.price - a.price);

  const breadcrumbItems = [{ label: 'All Products', href: '/products' }];

  if (parentCategory) {
    breadcrumbItems.push({
      label: parentCategory.name,
      href: `/products?cat=${parentCategory.slug}`,
    });
  }

  if (categorySlug && parentCategory && parentCategory.slug !== categorySlug) {
    const sub = parentCategory.children?.find(
      (c: any) => c.slug === categorySlug,
    );

    if (sub) {
      breadcrumbItems.push({
        label: sub.name,
        href: '',
      });
    }
  }

  function addToCart(id: string) {
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 1200);
  }

  if (isLoading) {
    return <div className="p-10 text-center">Loading products...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold mb-2">
          {categorySlug
            ? (categories.find((c) => c.slug === categorySlug)?.name ??
              'Products')
            : 'All Products'}
        </h1>
        <Breadcrumb items={breadcrumbItems} />
        <p className="text-gray-500 text-sm">
          {totalProducts} product{totalProducts !== 1 ? 's' : ''}
        </p>
      </div>
      {search && (
        <div className="mb-4 text-sm text-gray-500">
          Showing results for <span className="font-medium">{search}</span>
        </div>
      )}
      {/* FILTER BAR */}
      <div className="mb-10 rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
        {/* TOP ROW */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* CATEGORY CHIPS */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() =>
                    updateParam(
                      'cat',
                      cat.slug === categorySlug ? '' : cat.slug,
                    )
                  }
                  className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap
            transition-all duration-200 border

            ${
              cat.slug === parentCategory?.slug
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent shadow'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }
            `}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* SORT */}
          <div className="flex items-center gap-2 md:ml-auto bg-white border rounded-lg px-3 py-2 shadow-sm">
            <ArrowUpDown size={16} className="text-gray-500" />

            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="text-sm bg-transparent outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* SUBCATEGORY SECTION */}
        {subCategories.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Sub Categories
            </div>

            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {subCategories.map((sub: any) => (
                  <button
                    key={sub._id}
                    onClick={() => updateParam('cat', sub.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap
              transition-all duration-200 border

              ${
                sub.slug === categorySlug
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }
              `}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      <p className="text-gray-500 text-sm mt-3">
        Showing {start}-{end} of {totalProducts} products
      </p>
      {totalPages && totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-2 flex-wrap">
          <button
            disabled={page === 1}
            onClick={() => changePage(page - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;

            return (
              <button
                key={p}
                onClick={() => changePage(p)}
                className={`px-4 py-2 rounded-lg border text-sm
          ${
            p === page
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white hover:bg-gray-100'
          }`}
              >
                {p}
              </button>
            );
          })}

          <button
            disabled={page === totalPages}
            onClick={() => changePage(page + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
