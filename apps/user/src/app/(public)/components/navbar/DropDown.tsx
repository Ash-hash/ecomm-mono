/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { useState } from 'react';

export default function Dropdown({
  item,
  open,
  dropdownRef,
  cancelClose,
  scheduleClose,
}: any) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeChild = item?.children?.[activeIndex];

   const previewImage =
    activeChild?.image || item?.image || 'https://picsum.photos/400/500';


  return (
    <div
      ref={dropdownRef}
      className={clsx(
        'absolute top-full pt-16 z-10',
        !open && 'pointer-events-none',
      )}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <div className="absolute left-0 right-0 -top-6 h-6" />

      <div
        className={clsx(
          'w-[700px] grid grid-cols-[1fr_1.25fr] gap-8 p-6',
          'min-h-[360px]',
          'rounded-2xl border border-[var(--border)]',
          'bg-[var(--surface)]',
          'shadow-[0_25px_70px_rgba(0,0,0,0.15)]',
          'transition-all duration-300',
          open
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-3 scale-95',
        )}
      >
        {/* LEFT: CATEGORY LINKS */}
        <div className="flex flex-col gap-1">
          {item?.children?.map((child: any, index: number) => (
            <Link
              key={child?.label}
              href={child?.href}
              onMouseEnter={() => setActiveIndex(index)}
              className={clsx(
                'px-4 py-3 rounded-lg text-sm',
                'flex items-center justify-between',
                'transition-all duration-200',
                index === activeIndex
                  ? 'bg-[var(--bg-2)] text-[var(--text-strong)]'
                  : 'text-[var(--text-soft)] hover:bg-[var(--bg-2)] hover:text-[var(--text-strong)]',
              )}
            >
              <span className="font-medium">{child?.label}</span>

              <span
                className={clsx(
                  'transition-all',
                  index === activeIndex
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-1',
                )}
              >
                →
              </span>
            </Link>
          ))}
        </div>

        {/* RIGHT: IMAGE PREVIEW */}
        <div className="relative rounded-xl overflow-hidden group">
          <Image
            key={previewImage}
            src={previewImage}
            alt={activeChild?.label || item?.label}
            fill
            className="object-cover transition-all duration-500 scale-100 group-hover:scale-105"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Caption */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-sm font-semibold tracking-wide">
              {activeChild?.label || item?.label}
            </p>

            <p className="text-xs opacity-80 mt-1 line-clamp-2">
              {activeChild?.description || item?.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
