/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavItemType } from "./types";
import { getTenantUrl } from '@/src/utils/image';

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function categoriesToNavItems(
  categories: any[],
  limit = 3
): NavItemType[] {

  const parentCategories = categories
    .filter((cat) => !cat.parentId && cat.isNavBarEnable)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit);

  return parentCategories.map((cat) => ({
    label: capitalize(cat.name),
    href: `/products?cat=${cat.slug}`,
    image: cat.image ? getTenantUrl(cat.image) : undefined,
    description: cat.description,

    children: (cat.children || []).map((child: any) => ({
      label: capitalize(child.name),
      href: `/products?cat=${child.slug}`,
      image: child.image ? getTenantUrl(child.image) : undefined,
    })),
  }));
}
