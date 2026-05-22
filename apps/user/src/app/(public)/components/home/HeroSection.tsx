'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, StoreConfig } from '@repo/types';
import { getImageUrl } from '@/src/utils/image';

interface Props {
  featured: Product[];
  store?: StoreConfig;
}

const DEFAULT_WORDS = ['Fresh.', 'Useful.', 'Trusted.', 'Yours.'];

export default function HeroSection({ featured, store }: Props) {
  const [index, setIndex] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const words =
    store?.brandConfig?.heroWords?.filter((word) => word.trim()) ??
    DEFAULT_WORDS;

  useEffect(() => {
    const img = setInterval(() => {
      if (featured.length) {
        setIndex((i) => (i + 1) % featured.length);
      }
    }, 5000);

    const wordTimer = setInterval(() => {
      setWordIdx((i) => (i + 1) % Math.max(words.length, 1));
    }, 1500);

    return () => {
      clearInterval(img);
      clearInterval(wordTimer);
    };
  }, [featured.length, words.length]);
  const product = featured[index];

  const image = product?.main_image
    ? getImageUrl(product.main_image)
    : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30';
  const bannerImage = store?.storeBanner ? getImageUrl(store.storeBanner) : image;
  const title = store?.seo?.metaTitle || store?.storeName || 'Curated goods for modern living';
  const description =
    store?.seo?.metaDescription ||
    'Discover premium collections crafted for modern lifestyles. Limited offers available today.';

  return (
    <section className="relative overflow-hidden bg-nature">
      <Image
        src={bannerImage}
        alt={store?.storeName ?? 'Store banner'}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-[var(--bg)]/80" />
      <div className="container-main relative grid md:grid-cols-2 gap-12 md:gap-16 items-center py-16 md:py-28">
        {/* PRODUCT SIDE */}
        <div className="relative flex justify-center items-center mt-10 md:mt-0">
          {/* glow */}
          <div
            className="absolute w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] md:w-[420px] md:h-[420px] rounded-full blur-3xl opacity-70"
            style={{ background: 'var(--leaf-soft)' }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={image}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.7 }}
              className="relative z-10"
            >
              {/* frame */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="card p-6 md:p-7 shadow-md relative"
              >
                {/* badge top */}
                <div
                  className="absolute top-1 left-3 md:left-5
          text-[10px] sm:text-xs
          px-2.5 sm:px-3 py-0.3
          rounded-full
          bg-[var(--primary-soft)]
          text-[var(--primary)]
          font-medium
          backdrop-blur-sm
          shadow-sm
        "
                >
                  🚚 Free Shipping
                </div>

                {/* badge bottom */}
                <div
                  className="absolute bottom-1 right-3 md:right-5
          text-[10px] sm:text-xs
          px-2.5 sm:px-3 py-0.3
          rounded-full
          bg-[var(--accent)]
          text-white
          font-medium
          shadow-sm
        "
                >
                  🔥 40% OFF
                </div>

                {/* image */}
                <div
                  className="relative
          w-[200px] h-[240px]
          sm:w-[250px] sm:h-[300px]
          md:w-[340px] md:h-[420px]
          rounded-xl overflow-hidden
          bg-nature-2
        "
                >
                  <Image
                    src={image}
                    alt="Featured product"
                    fill
                    priority
                    className="object-contain p-4 md:p-6"
                  />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* TEXT SIDE */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-6xl leading-tight mb-5 md:mb-6">
            {title}
            <br />
            <AnimatePresence mode="wait">
              <motion.span
                key={words[wordIdx] ?? DEFAULT_WORDS[0]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-leaf"
              >
                {words[wordIdx] ?? DEFAULT_WORDS[0]}
              </motion.span>
            </AnimatePresence>
          </h1>

          <p className="text-soft mb-8 md:mb-10 max-w-md mx-auto md:mx-0 text-sm md:text-base">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
            <Link
              href="/products"
              className="btn-primary flex items-center justify-center gap-2"
            >
              Explore Collection <ArrowRight size={16} />
            </Link>

            <Link href="/offers" className="btn-outline text-center">
              View Deals
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
