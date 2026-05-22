/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable jsx-a11y/alt-text */
'use client';

type SearchCategoryItem = {
  name: string;
  slug: string;
  type: 'category' | 'subcategory';
  parent?: string;
};

import { Search, X, ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useCategories, useQuickSearch } from '@/src/hooks';
import { useDebounce } from '@/src/hooks/debounce';
import Image from 'next/image';
import { getTenantUrl } from '@/src/utils/image';

export default function SearchBar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 350);

  const { data, isLoading } = useQuickSearch(debouncedQuery);

  const products = data ?? [];
  const { data: categoriesData } = useCategories();

  const allCategories = useMemo(() => {
    if (!categoriesData) return [];

    const list: SearchCategoryItem[] = [];

    categoriesData.forEach((cat) => {
      list.push({
        name: cat.name,
        slug: cat.slug,
        type: 'category',
      });

     (cat.children ?? []).forEach((sub: any) => {
  list.push({
    name: sub.name,
    slug: sub.slug,
    parent: cat.slug,
    type: 'subcategory',
  });
});
    });

    return list;
  }, [categoriesData]);

  const matchedCategories = allCategories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (val?: string) => {
    const q = val ?? query;
    if (!q.trim()) return;
    router.push(`/products?search=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  function highlight(text: string, q: string) {
    if (!q) return text;

    const parts = text.split(new RegExp(`(${q})`, 'gi'));

    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-black">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Search Panel */}
      <div
        className={clsx(
          'fixed top-0 left-0 right-0 z-[70]',
          'transition-all duration-400 ease-out',
          open ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
        )}
      >
        <div className="bg-[var(--surface)] border-b border-[var(--border)] shadow-2xl">
          {/* Input row */}
          <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
            <Search
              size={20}
              className="text-[var(--text-muted)] shrink-0 transition-colors duration-200"
              style={{ color: focused ? 'var(--text-strong)' : undefined }}
            />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search for products, styles, rooms…"
              className={clsx(
                'flex-1 bg-transparent outline-none',
                'text-[var(--text-strong)] text-base placeholder:text-[var(--text-muted)]',
                'font-[var(--font-body,inherit)]',
              )}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, products.length - 1));
                }

                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                }

                if (e.key === 'Enter') {
                  if (activeIndex >= 0) {
                    if (products[activeIndex]) {
                      router.push(`/products/${products[activeIndex].slug}`);
                      onClose();
                    }
                  } else {
                    handleSubmit();
                  }
                }
              }}
            />

            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
              >
                <X size={16} />
              </button>
            )}

            <button
              onClick={onClose}
              className={clsx(
                'ml-2 text-xs font-medium tracking-widest uppercase',
                'text-[var(--text-muted)] hover:text-[var(--text-strong)]',
                'transition-colors duration-200',
              )}
            >
              Esc
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border)] mx-6" />

          {query && matchedCategories.length > 0 && (
            <div className="max-w-3xl mx-auto px-6 pt-4">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
                Categories
              </p>

              {matchedCategories.slice(0, 4).map((c) => (
                <button
                  key={c.slug}
                  onClick={() => {
                    router.push(`/products?cat=${c.slug}`);
                    onClose();
                  }}
                  className="flex items-center justify-between py-2 text-sm hover:bg-gray-50 px-2 rounded"
                >
                  <span>{highlight(c.name, query)}</span>

                  <span className="text-xs text-gray-400 ml-10">
                    {c.type === 'subcategory' ? 'Subcategory' : 'Category'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {query && !isLoading && products.length > 0 && (
            <div className="max-w-3xl mx-auto px-6 py-4">
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
                Products
              </p>

              <div className="flex flex-col divide-y">
                {products.map((p: any, i: any) => (
                  <button
                    key={p._id}
                    onClick={() => {
                      router.push(`/products/${p.slug}`);
                      onClose();
                    }}
                    className={clsx(
                      'flex items-center gap-3 py-3 text-left hover:bg-gray-50',
                      activeIndex === i && 'bg-gray-100',
                    )}
                  >
                    <Image
                      src={getTenantUrl(p.main_image)}
                      alt="product"
                      width={48}
                      height={48}
                      className="object-cover rounded"
                    />

                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">
                        {highlight(p.name, query)}
                      </span>

                      <span className="text-xs text-gray-500">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
