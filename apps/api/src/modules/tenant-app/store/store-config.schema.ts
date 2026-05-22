import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreConfigDocument = StoreConfig & Document;

// ── Nested types ──────────────────────────────────────────────
export class HeaderConfig {
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
  navigationLinks?: { label: string; href: string; openInNewTab?: boolean }[];
}

export class FooterConfig {
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
  paymentIcons?: string[]; // e.g. ['visa', 'mastercard', 'upi']
}

export class BrandConfig {
  primaryColor?: string; // hex  e.g. '#FF6B35'
  secondaryColor?: string;
  accentColor?: string;
  heroWords?: string[];
  fontHeading?: string; // Google font name
  fontBody?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  favicon?: string; // URL
}

export class StoreLocation {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  latitude?: number;
  longitude?: number;
}

// ── Main schema ───────────────────────────────────────────────
@Schema({ timestamps: true })
export class StoreConfig {
  // ── General ──────────────────────────────────────────────
  @Prop({ default: 'My Store' }) storeName: string;
  @Prop() storeEmail: string;
  @Prop() storePhone?: string;
  @Prop() storeMobile?: string;
  @Prop({ default: 'INR' }) currency: string;
  @Prop({ default: 'Asia/Kolkata' }) timezone: string;
  @Prop({ default: false }) maintenanceMode: boolean;
  @Prop({ default: true }) allowGuestCheckout: boolean;
  @Prop({ default: 10 }) lowStockAlert: number;
  @Prop({ default: 18 }) taxRate: number;
  @Prop({ default: 99 }) shippingFlatRate: number;
  @Prop({ default: 999 }) freeShippingThreshold: number;

  @Prop({ type: Object, default: {} })
  storeLocation?: StoreLocation;

  // ── Branding / Logo ───────────────────────────────────────
  /** Public URL of the uploaded store logo */
  @Prop({ default: '' }) storeLogo: string;

  /** Public URL of an optional wide banner / hero image */
  @Prop({ default: '' }) storeBanner: string;

  /** Fine-grained brand tokens (colors, fonts, radius…) */
  @Prop({ type: Object, default: {} }) brandConfig: BrandConfig;

  // ── Header & Footer ───────────────────────────────────────
  @Prop({ type: Object, default: {} }) storeHeaderConfig: HeaderConfig;
  @Prop({ type: Object, default: {} }) storeFooterConfig: FooterConfig;

  // ── SEO ──────────────────────────────────────────────────
  @Prop({ type: Object, default: {} }) seo: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };

  // ── Integrations ─────────────────────────────────────────
  @Prop({ type: Object, default: {} }) gateways: Record<string, any>;
  @Prop({ type: Object, default: {} }) smtp: Record<string, any>;
}

export const StoreConfigSchema = SchemaFactory.createForClass(StoreConfig);
