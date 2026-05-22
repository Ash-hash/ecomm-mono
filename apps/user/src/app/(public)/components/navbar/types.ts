// components/navbar/types.ts

export type NavItemType = {
  label: string;
  href?: string;
  children?: NavItemType[];
  image?: string;
  description?: string;
};