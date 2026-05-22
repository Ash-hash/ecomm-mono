
import ProductCard from '../ui/ProductCard';
import SectionHeader from '../ui/SectionHeader';
import ProductCardSkeleton from '../ui/ProductCardSkeleton';
import { Product } from '@repo/types';

interface Props {
  products: Product[];
  isLoading: boolean;
}

export default function FeaturedSection({ products, isLoading }: Props) {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader title="Featured this week" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
