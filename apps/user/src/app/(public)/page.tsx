/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import { useCategories, useFeaturedProducts } from '@/src/hooks';

import HeroSection from './components/home/HeroSection';
import CategorySection from './components/home/CategorySection';
import FeaturedSection from './components/home/FeaturedSection';
import TestimonialsSection from './components/home/TestimonialsSection';
import CTASection from './components/home/CTASection';
import Footer from './components/home/Footer';
import CircularCategorySection from './components/home/CircularCategorySection';
import { useStoreInfo } from '@/src/hooks';

export default function HomePage() {
  const { data: featuredData, isLoading } = useFeaturedProducts(16);
  const { data: categoriesData } = useCategories();
  const { data: storeInfo } = useStoreInfo();

  const featured = useMemo(() => featuredData ?? [], [featuredData]);
  const categories = useMemo(
    () => categoriesData ?? [],
    [categoriesData],
  );
  const subCategories = useMemo(() => {
    if (!categories.length) return [];

    return categories.flatMap((cat: any) => cat.children ?? []);
  }, [categories]);

  return (
      <div className="min-h-screen">
      <CircularCategorySection categories={categories} />
      <HeroSection featured={featured} store={storeInfo} />
      <FeaturedSection products={featured} isLoading={isLoading} />
      <CategorySection categories={subCategories} />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
