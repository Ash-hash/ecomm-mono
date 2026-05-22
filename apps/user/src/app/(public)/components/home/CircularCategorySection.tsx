'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CircularCategoryCard from '../ui/CircularCategoryCard';
import { Category } from '@repo/types';

interface Props {
  categories: Category[];
}

export default function CircularCategorySection({ categories }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const showArrows = categories.length > 7;

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!scrollRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleMouseLeave() {
    setIsDragging(false);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !scrollRef.current) return;

    e.preventDefault();

    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.4;

    scrollRef.current.scrollLeft = scrollLeft - walk;
  }

  return (
    <section className="py-5">
      <div className="max-w-7xl mx-auto px-6 relative group mt-5">
        {/* LEFT ARROW */}
        {showArrows && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex items-center justify-center
  absolute -left-2 top-1/2 -translate-y-1/2 z-20
  w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow
  text-[var(--text-soft)] hover:text-white hover:bg-[var(--primary)] hover:border-[var(--primary)]
  opacity-0 group-hover:opacity-100 transition"
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {/* RIGHT ARROW */}
        {showArrows && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex items-center justify-center
  absolute -right-2 top-1/2 -translate-y-1/2 z-20
  w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow
  text-[var(--text-soft)] hover:text-white hover:bg-[var(--primary)] hover:border-[var(--primary)]
  opacity-0 group-hover:opacity-100 transition"
            aria-label="Scroll categories right"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {showArrows && (
          <div className="hidden md:block pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
        )}

        {showArrows && (
          <div className="hidden md:block pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />
        )}

        {/* SCROLL CONTAINER */}
        <div
          ref={scrollRef}
          className={`flex gap-15 overflow-x-auto scrollbar-hide
snap-x snap-mandatory py-4 px-2 ml-10
${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          {categories.map((cat) => (
            <div key={cat._id} className="flex-shrink-0 snap-start w-[110px]">
              <CircularCategoryCard category={cat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
