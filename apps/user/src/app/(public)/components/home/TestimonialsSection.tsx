'use client';

import { Star, BadgeCheck } from 'lucide-react';
import Image from 'next/image';

const TESTIMONIALS = [
  {
    quote:
      'The quality exceeded my expectations. Every detail feels thoughtfully crafted and premium.',
    name: 'Arjun Mehta',
    avatar: 'https://i.pravatar.cc/120?img=12',
  },
  {
    quote:
      'Beautiful products and seamless delivery. This has quickly become my favorite place to shop.',
    name: 'Priya Sharma',
    avatar: 'https://i.pravatar.cc/120?img=32',
  },
  {
    quote:
      'Outstanding experience from start to finish. The product looks even better in person.',
    name: 'Rahul Kapoor',
    avatar: 'https://i.pravatar.cc/120?img=22',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 mb-3">
            Testimonials
          </p>

          <h2 className="text-3xl md:text-4xl font-serif text-neutral-900">
            Loved by Our Customers
          </h2>

          <p className="text-neutral-500 mt-4 max-w-xl mx-auto text-sm">
            Thousands of customers trust our products for their quality,
            craftsmanship, and thoughtful design.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="
              relative group
              rounded-2xl
              border border-neutral-200
              bg-white
              p-8
              shadow-[0_8px_30px_rgba(0,0,0,0.06)]
              hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)]
              transition-all duration-500
              "
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-neutral-700 leading-relaxed text-sm mb-6">
                “{t.quote}”
              </p>

              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-medium text-neutral-900 text-sm">
                    {t.name}
                  </span>

                  <BadgeCheck
                    size={14}
                    className="text-green-500"
                    strokeWidth={2}
                  />
                </div>
              </div>

              {/* Glow Hover Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)]" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}