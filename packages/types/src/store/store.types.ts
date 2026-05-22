export interface HeaderConfig {
  logoUrl?: string;
  showSearch?: boolean;
  showCart?: boolean;
  showWishlist?: boolean;

  announcementBar?: {
    enabled: boolean;
    text: string;
    bgColor: string;
    textColor: string;
    link?: string;
  };

  navigationLinks?: {
    label: string;
    href: string;
    openInNewTab?: boolean;
  }[];
}

export interface FooterConfig {
  copyrightText?: string;

  showSocialLinks?: boolean;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };

  columns?: {
    heading: string;
    links: { label: string; href: string }[];
  }[];

  showPaymentIcons?: boolean;
  paymentIcons?: string[];
}

export interface BrandConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  heroWords?: string[];

  fontHeading?: string;
  fontBody?: string;

  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  favicon?: string;
}

export interface SeoConfig {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;

  googleAnalyticsId?: string;
  facebookPixelId?: string;
}

export interface StoreLocation {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  latitude?: number;
  longitude?: number;
}

export interface StoreConfig {
  _id?: string;

  // ── General ─────────────────────────────────────
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeMobile?: string;

  currency: string;
  timezone: string;

  maintenanceMode: boolean;
  allowGuestCheckout: boolean;

  lowStockAlert: number;
  taxRate: number;

  shippingFlatRate: number;
  freeShippingThreshold: number;

  // ── Branding ────────────────────────────────────
  storeLogo: string;
  storeBanner: string;

  brandConfig: BrandConfig;

  // ── Location ────────────────────────────────────
  storeLocation?: StoreLocation;

  // ── Layout ──────────────────────────────────────
  storeHeaderConfig?: HeaderConfig;
  storeFooterConfig?: FooterConfig;

  // Backward-compatible aliases for older storefront code.
  header?: HeaderConfig;
  footer?: FooterConfig;

  // ── SEO ─────────────────────────────────────────
  seo: SeoConfig;

  // ── Integrations ────────────────────────────────
  gateways: Record<string, any>;
  smtp: Record<string, any>;
}
