'use client';

import Link from 'next/link';

interface Item {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Item[] }) {
  return (
    <nav className="text-sm text-gray-500 mb-6 flex items-center flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {item.href ? (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}

          {i < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}