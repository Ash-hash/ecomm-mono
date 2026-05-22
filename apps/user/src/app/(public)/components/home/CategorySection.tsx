import { Category } from '@repo/types';
import CategoryCard from '../ui/CategoryCard';
import SectionHeader from '../ui/SectionHeader';

interface Props {
  categories: Category[];
}

export default function CategorySection({ categories }: Props) {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="Browse by Category"
        />

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-4 gap-10 mt-10">
          {categories.map((cat) => (
            <CategoryCard key={cat._id} category={cat} />
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 mt-6 scrollbar-hide">
          {categories.map((cat) => (
            <div key={cat._id} className="min-w-[160px]">
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}