'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { NavItemType } from './types';

export default function MobileMenu({ open ,   items}: { open: boolean , items: NavItemType[]}) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggle = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  if (!open) return null;

  // Nav item emojis map — customize as needed
  const emojiMap: Record<string, string> = {
    Home: '🏠',
    Shop: '🛍️',
    Decor: '🪴',
    Furniture: '🛋️',
    Utility : '💡',
    Rugs: '🧶',
    Sale: '🔥',
    About: '✨',
    Contact: '📬',
  };

  return (
    <div
      className={clsx(
        'absolute top-full left-0 w-full z-50',
        'bg-[var(--surface)] border-t border-[var(--border)]',
        'flex flex-col overflow-y-auto max-h-[80vh]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
      )}
    >
      {items.map((item, index) => {
        const hasDropdown = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.label);
        const emoji = emojiMap[item.label] ?? '→';

        return (
          <div
            key={item.label}
            className="border-b border-[var(--border)] last:border-b-0"
          >
            {/* Main nav row */}
            {hasDropdown ? (
              <button
                onClick={() => toggle(item.label)}
                className={clsx(
                  'w-full flex items-center justify-between',
                  'px-5 py-4 text-left',
                  'text-[var(--text-strong)] font-semibold text-[15px]',
                  'transition-colors duration-200',
                  isExpanded
                    ? 'bg-[var(--bg-2)]'
                    : 'hover:bg-[var(--bg-2)]',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{emoji}</span>
                  {item.label}
                </span>
                <ChevronDown
                  size={16}
                  className={clsx(
                    'text-[var(--text-muted)] transition-transform duration-300',
                    isExpanded && 'rotate-180',
                  )}
                />
              </button>
            ) : (
              <Link
                href={item.href || '#'}
                className={clsx(
                  'flex items-center gap-3',
                  'px-5 py-4',
                  'text-[var(--text-strong)] font-semibold text-[15px]',
                  'hover:bg-[var(--bg-2)] transition-colors duration-200',
                )}
              >
                <span className="text-xl">{emoji}</span>
                {item.label}
              </Link>
            )}

            {/* Dropdown panel */}
            {hasDropdown && (
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-300 ease-in-out',
                  isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
                )}
              >
                {/* Hero image */}
                {item.image && (
                  <div className="relative w-full h-36 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.label}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-4 text-white">
                      <p className="text-sm font-bold">{item.label}</p>
                      {item.description && (
                        <p className="text-xs opacity-75 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Child links */}
                <div className="flex flex-col px-4 py-2 bg-[var(--bg-2)]">
                  {item.children?.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href!}
                      className={clsx(
                        'flex items-center justify-between',
                        'px-3 py-3 rounded-lg',
                        'text-sm text-[var(--text-soft)]',
                        'hover:text-[var(--text-strong)] hover:bg-[var(--surface)]',
                        'transition-all duration-200 group',
                      )}
                    >
                      <span>{child.label}</span>
                      <span className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-xs">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}