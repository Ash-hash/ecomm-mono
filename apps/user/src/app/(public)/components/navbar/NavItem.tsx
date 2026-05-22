/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Dropdown from './DropDown';
import { useRef } from 'react';
import clsx from 'clsx';

export default function NavItem({
  item,
  activeMenu,
  setActiveMenu,
  closeMenu,
}: any) {
  const hasDropdown = item.children && item.children.length > 0;
  const isActive = activeMenu === item.label;
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      closeMenu();
    }, 120); // small delay — enough to bridge nav → dropdown gap
  };


  return (
    <div className="relative" onMouseLeave={() => closeMenu()}>
      {hasDropdown ? (
        <button
          onClick={() => setActiveMenu(isActive ? null : item.label)}
          className={clsx(
            'flex items-center gap-1 text-sm font-medium relative z-20',
            'text-[var(--text-soft)]',
            'hover:text-[var(--text-strong)]',
            'transition-colors duration-200',
          )}
        >
          {item.label}

          <ChevronDown
            size={14}
            className={clsx(
              'transition-all duration-300',
              'text-[var(--text-muted)]',
              isActive && 'rotate-180 text-[var(--text-strong)]',
            )}
          />
        </button>
      ) : (
        <Link
          href={item.href || '#'}
          className={clsx(
            'flex items-center gap-1 text-sm font-medium relative',
            'text-[var(--text-soft)]',
            'hover:text-[var(--text-strong)]',
            'transition-colors duration-200',
          )}
        >
          {item.label}
        </Link>
      )}

      {hasDropdown && (
        <Dropdown
          item={item}
          open={isActive}
          setActiveMenu={setActiveMenu}
          dropdownRef={dropdownRef}
          cancelClose={cancelClose}
          scheduleClose={scheduleClose}
        />
      )}
    </div>
  );
}
