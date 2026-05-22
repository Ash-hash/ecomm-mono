/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import {
  PageHeader,
  Btn,
  Card,
  Input,
  Select,
  Toggle,
  Divider,
} from '../../../../components/ui';
import { useStoreConfig, useUpdateStoreConfig } from '../../../../hooks';
import type { StoreConfig } from '@repo/types';
import Image from 'next/image';
import ImageUploader from '@/src/app/components/ui/ImageUploader';

// ─────────────────────────────────────────────────────────────
// Default fallback
// ─────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: StoreConfig = {
  storeName: '',
  storeEmail: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  maintenanceMode: false,
  allowGuestCheckout: true,
  lowStockAlert: 10,
  taxRate: 18,
  shippingFlatRate: 99,
  freeShippingThreshold: 999,

  storeLogo: '',
  storeBanner: '',
  brandConfig: {
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    accentColor: '#FF6B35',
    heroWords: ['Fresh.', 'Useful.', 'Trusted.', 'Yours.'],
    fontHeading: '',
    fontBody: '',
    borderRadius: 'md',
    favicon: '',
  },

  storeHeaderConfig: {
    logoUrl: '',
    showSearch: true,
    showCart: true,
    showWishlist: false,
    announcementBar: {
      enabled: false,
      text: '',
      bgColor: '#000000',
      textColor: '#ffffff',
      link: '',
    },
    navigationLinks: [],
  },

  storeFooterConfig: {
    copyrightText: '',
    showSocialLinks: true,
    socialLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
      linkedin: '',
    },
    columns: [],
    showPaymentIcons: true,
    paymentIcons: [],
  },

  seo: {
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
  },

  gateways: {
    razorpay: { enabled: false, keyId: '' },
    stripe: { enabled: false, publishableKey: '' },
    paypal: { enabled: false, clientId: '' },
  },
  smtp: {
    host: '',
    port: 587,
    user: '',
    fromName: '',
    fromEmail: '',
  },
};

// ─────────────────────────────────────────────────────────────
// Section UI
// ─────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function StoreConfigPage() {
  const { data: remoteConfig, isLoading } = useStoreConfig();
  const updateConfig = useUpdateStoreConfig();

  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (remoteConfig) setConfig(remoteConfig);
  }, [remoteConfig]);

  // ── helpers ──────────────────────────────────────────────
  const set = <K extends keyof StoreConfig>(key: K, val: StoreConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: val }));

  const setNested = <K extends keyof StoreConfig>(
    key: K,
    field: string,
    val: any,
  ) =>
    setConfig((c) => ({
      ...c,
      [key]: { ...(c[key] as any), [field]: val },
    }));

  const setLocation = (field: string, val: any) =>
    setConfig((c) => ({
      ...c,
      storeLocation: {
        ...(c.storeLocation ?? {}),
        [field]: val,
      },
    }));

  const setDeep = <K extends keyof StoreConfig>(
    key: K,
    subKey: string,
    field: string,
    val: any,
  ) =>
    setConfig((c) => ({
      ...c,
      [key]: {
        ...(c[key] as any),
        [subKey]: { ...(c[key] as any)[subKey], [field]: val },
      },
    }));

  // ── save ─────────────────────────────────────────────────
  const handleSave = () => {
    updateConfig.mutate(config, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  if (isLoading) return <div style={{ padding: 40 }}>Loading config…</div>;

  const header = config.storeHeaderConfig ?? DEFAULT_CONFIG.storeHeaderConfig!;
  const footer = config.storeFooterConfig ?? DEFAULT_CONFIG.storeFooterConfig!;
  const brand = config.brandConfig ?? DEFAULT_CONFIG.brandConfig!;
  const seo = config.seo ?? DEFAULT_CONFIG.seo!;

  return (
    <div>
      <PageHeader
        title="Store Config"
        subtitle="Manage your store settings"
        actions={
          <Btn onClick={handleSave} disabled={updateConfig.isPending}>
            {updateConfig.isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
          </Btn>
        }
      />

      {/* ── GENERAL ─────────────────────────────────────────── */}
      <Section title="General">
        <Input
          label="Store Name"
          value={config.storeName ?? ''}
          onChange={(e) => set('storeName', e.target.value)}
        />
        <Input
          label="Store Email"
          value={config.storeEmail ?? ''}
          onChange={(e) => set('storeEmail', e.target.value)}
        />
        <Input
          label="Store Phone"
          value={config.storePhone ?? ''}
          onChange={(e) => set('storePhone', e.target.value)}
        />
        <Input
          label="Store Mobile"
          value={config.storeMobile ?? ''}
          onChange={(e) => set('storeMobile', e.target.value)}
        />

        <Select
          label="Currency"
          value={config.currency ?? ''}
          onChange={(e) => set('currency', e.target.value)}
          options={[
            { label: 'INR (₹)', value: 'INR' },
            { label: 'USD ($)', value: 'USD' },
            { label: 'EUR (€)', value: 'EUR' },
            { label: 'GBP (£)', value: 'GBP' },
          ]}
        />
        <Select
          label="Timezone"
          value={config.timezone ?? ''}
          onChange={(e) => set('timezone', e.target.value)}
          options={[
            { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
            { label: 'UTC', value: 'UTC' },
            { label: 'America/New_York', value: 'America/New_York' },
            { label: 'Europe/London', value: 'Europe/London' },
          ]}
        />

        <Divider />

        <div style={{ fontWeight: 500 }}>Store Location</div>

        <Input
          label="Address Line 1"
          placeholder="Shop / Building / Street"
          value={config.storeLocation?.addressLine1 ?? ''}
          onChange={(e) => setLocation('addressLine1', e.target.value)}
        />

        <Input
          label="Address Line 2"
          placeholder="Area / Landmark"
          value={config.storeLocation?.addressLine2 ?? ''}
          onChange={(e) => setLocation('addressLine2', e.target.value)}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <Input
            label="City"
            value={config.storeLocation?.city ?? ''}
            onChange={(e) => setLocation('city', e.target.value)}
          />

          <Input
            label="State"
            value={config.storeLocation?.state ?? ''}
            onChange={(e) => setLocation('state', e.target.value)}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <Input
            label="Postal Code"
            value={config.storeLocation?.postalCode ?? ''}
            onChange={(e) => setLocation('postalCode', e.target.value)}
          />

          <Input
            label="Country"
            value={config.storeLocation?.country ?? ''}
            onChange={(e) => setLocation('country', e.target.value)}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <Input
            label="Latitude"
            type="number"
            value={String(config.storeLocation?.latitude ?? '')}
            onChange={(e) => setLocation('latitude', Number(e.target.value))}
          />

          <Input
            label="Longitude"
            type="number"
            value={String(config.storeLocation?.longitude ?? '')}
            onChange={(e) => setLocation('longitude', Number(e.target.value))}
          />
        </div>
        <Toggle
          label="Maintenance Mode"
          value={config.maintenanceMode ?? false}
          onChange={(v) => set('maintenanceMode', v)}
        />
        <Toggle
          label="Allow Guest Checkout"
          value={config.allowGuestCheckout ?? false}
          onChange={(v) => set('allowGuestCheckout', v)}
        />
        <Input
          label="Low Stock Alert (units)"
          type="number"
          value={String(config.lowStockAlert ?? '')}
          onChange={(e) => set('lowStockAlert', Number(e.target.value))}
        />
      </Section>

      {/* ── BRANDING ────────────────────────────────────────── */}
      <Section title="Branding & Media">
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              color: '#888',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Store Logo
          </label>

          <ImageUploader
            images={config.storeLogo ? [config.storeLogo] : []}
            onChange={(urls) => set('storeLogo', urls[0] || '')}
            multiple={false}
          />
        </div>
        {config.storeLogo && (
          <Image
            src={config.storeLogo as string}
            alt="Store logo preview"
            width={120}
            height={64}
            style={{ objectFit: 'contain', borderRadius: 6 }}
          />
        )}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              color: '#888',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Store Banner
          </label>

          <ImageUploader
            images={config.storeBanner ? [config.storeBanner] : []}
            onChange={(urls) => set('storeBanner', urls[0] || '')}
            multiple={false}
          />
        </div>
        <Input
          label="Favicon URL"
          placeholder="https://cdn.example.com/favicon.ico"
          value={brand.favicon ?? ''}
          onChange={(e) => setNested('brandConfig', 'favicon', e.target.value)}
        />
        <Input
          label="Hero Words"
          placeholder="Fresh., Useful., Trusted., Yours."
          value={(brand.heroWords ?? []).join(', ')}
          onChange={(e) =>
            setNested(
              'brandConfig',
              'heroWords',
              e.target.value
                .split(',')
                .map((word) => word.trim())
                .filter(Boolean),
            )
          }
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Primary Color
            </label>
            <input
              type="color"
              value={brand.primaryColor ?? '#000000'}
              onChange={(e) =>
                setNested('brandConfig', 'primaryColor', e.target.value)
              }
              style={{
                width: '100%',
                height: 38,
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Secondary Color
            </label>
            <input
              type="color"
              value={brand.secondaryColor ?? '#ffffff'}
              onChange={(e) =>
                setNested('brandConfig', 'secondaryColor', e.target.value)
              }
              style={{
                width: '100%',
                height: 38,
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Accent Color
            </label>
            <input
              type="color"
              value={brand.accentColor ?? '#FF6B35'}
              onChange={(e) =>
                setNested('brandConfig', 'accentColor', e.target.value)
              }
              style={{
                width: '100%',
                height: 38,
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            />
          </div>
        </div>
        <Input
          label="Heading Font (Google Font name)"
          placeholder="Playfair Display"
          value={brand.fontHeading ?? ''}
          onChange={(e) =>
            setNested('brandConfig', 'fontHeading', e.target.value)
          }
        />
        <Input
          label="Body Font (Google Font name)"
          placeholder="DM Sans"
          value={brand.fontBody ?? ''}
          onChange={(e) => setNested('brandConfig', 'fontBody', e.target.value)}
        />
        <Select
          label="Border Radius Style"
          value={brand.borderRadius ?? 'md'}
          onChange={(e) =>
            setNested('brandConfig', 'borderRadius', e.target.value)
          }
          options={[
            { label: 'None (sharp)', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
            { label: 'Full (pill)', value: 'full' },
          ]}
        />
      </Section>

      {/* ── HEADER CONFIG ────────────────────────────────────── */}
      <Section title="Header Config">
        <Input
          label="Logo URL (overrides store logo in header)"
          placeholder="Leave blank to use Store Logo"
          value={header.logoUrl ?? ''}
          onChange={(e) =>
            setNested('storeHeaderConfig', 'logoUrl', e.target.value)
          }
        />
        <div style={{ display: 'flex', gap: 24 }}>
          <Toggle
            label="Show Search"
            value={header.showSearch ?? true}
            onChange={(v) => setNested('storeHeaderConfig', 'showSearch', v)}
          />
          <Toggle
            label="Show Cart"
            value={header.showCart ?? true}
            onChange={(v) => setNested('storeHeaderConfig', 'showCart', v)}
          />
          <Toggle
            label="Show Wishlist"
            value={header.showWishlist ?? false}
            onChange={(v) => setNested('storeHeaderConfig', 'showWishlist', v)}
          />
        </div>

        <Divider />
        <div style={{ fontWeight: 500, fontSize: 13 }}>Announcement Bar</div>
        <Toggle
          label="Enabled"
          value={header.announcementBar?.enabled ?? false}
          onChange={(v) =>
            setDeep('storeHeaderConfig', 'announcementBar', 'enabled', v)
          }
        />
        {header.announcementBar?.enabled && (
          <>
            <Input
              label="Announcement Text"
              placeholder="Free shipping on orders above ₹999!"
              value={header.announcementBar.text ?? ''}
              onChange={(e) =>
                setDeep(
                  'storeHeaderConfig',
                  'announcementBar',
                  'text',
                  e.target.value,
                )
              }
            />
            <Input
              label="Link (optional)"
              placeholder="/sale"
              value={header.announcementBar.link ?? ''}
              onChange={(e) =>
                setDeep(
                  'storeHeaderConfig',
                  'announcementBar',
                  'link',
                  e.target.value,
                )
              }
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Background Color
                </label>
                <input
                  type="color"
                  value={header.announcementBar.bgColor ?? ''}
                  onChange={(e) =>
                    setDeep(
                      'storeHeaderConfig',
                      'announcementBar',
                      'bgColor',
                      e.target.value,
                    )
                  }
                  style={{
                    width: '100%',
                    height: 38,
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 6,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Text Color
                </label>
                <input
                  type="color"
                  value={header.announcementBar.textColor ?? ''}
                  onChange={(e) =>
                    setDeep(
                      'storeHeaderConfig',
                      'announcementBar',
                      'textColor',
                      e.target.value,
                    )
                  }
                  style={{
                    width: '100%',
                    height: 38,
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ── FOOTER CONFIG ────────────────────────────────────── */}
      <Section title="Footer Config">
        <Input
          label="Copyright Text"
          placeholder="© 2025 Candley Aroma. All rights reserved."
          value={footer.copyrightText ?? ''}
          onChange={(e) =>
            setNested('storeFooterConfig', 'copyrightText', e.target.value)
          }
        />
        <Toggle
          label="Show Social Links"
          value={footer.showSocialLinks ?? true}
          onChange={(v) => setNested('storeFooterConfig', 'showSocialLinks', v)}
        />
        {footer.showSocialLinks && (
          <>
            {(
              [
                'instagram',
                'facebook',
                'twitter',
                'youtube',
                'linkedin',
              ] as const
            ).map((platform) => (
              <Input
                key={platform}
                label={
                  platform.charAt(0).toUpperCase() + platform.slice(1) + ' URL'
                }
                placeholder={`https://${platform}.com/yourpage`}
                value={footer.socialLinks?.[platform] ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    storeFooterConfig: {
                      ...c.storeFooterConfig,
                      socialLinks: {
                        ...c.storeFooterConfig?.socialLinks,
                        [platform]: e.target.value,
                      },
                    },
                  }))
                }
              />
            ))}
          </>
        )}
        <Toggle
          label="Show Payment Icons"
          value={footer.showPaymentIcons ?? true}
          onChange={(v) =>
            setNested('storeFooterConfig', 'showPaymentIcons', v)
          }
        />
      </Section>

      {/* ── SEO ──────────────────────────────────────────────── */}
      <Section title="SEO & Analytics">
        <Input
          label="Meta Title"
          placeholder="Candley Aroma – Premium Handcrafted Candles"
          value={seo.metaTitle ?? ''}
          onChange={(e) => setNested('seo', 'metaTitle', e.target.value)}
        />
        <Input
          label="Meta Description"
          placeholder="Discover handcrafted soy candles…"
          value={seo.metaDescription ?? ''}
          onChange={(e) => setNested('seo', 'metaDescription', e.target.value)}
        />
        <Input
          label="OG Image URL"
          placeholder="https://cdn.example.com/og.jpg"
          value={seo.ogImage ?? ''}
          onChange={(e) => setNested('seo', 'ogImage', e.target.value)}
        />
        <Input
          label="Google Analytics ID"
          placeholder="G-XXXXXXXXXX"
          value={seo.googleAnalyticsId ?? ''}
          onChange={(e) =>
            setNested('seo', 'googleAnalyticsId', e.target.value)
          }
        />
        <Input
          label="Facebook Pixel ID"
          placeholder="1234567890"
          value={seo.facebookPixelId ?? ''}
          onChange={(e) => setNested('seo', 'facebookPixelId', e.target.value)}
        />
      </Section>

      {/* ── SHIPPING & TAX ───────────────────────────────────── */}
      <Section title="Shipping & Tax">
        <Input
          label="Flat Shipping Rate (₹)"
          type="number"
          value={String(config.shippingFlatRate) ?? ''}
          onChange={(e) => set('shippingFlatRate', Number(e.target.value))}
        />
        <Input
          label="Free Shipping Threshold (₹)"
          type="number"
          value={String(config.freeShippingThreshold) ?? ''}
          onChange={(e) => set('freeShippingThreshold', Number(e.target.value))}
        />
        <Input
          label="Tax Rate (%)"
          type="number"
          value={String(config.taxRate) ?? ''}
          onChange={(e) => set('taxRate', Number(e.target.value))}
        />
      </Section>

      {/* ── PAYMENT GATEWAYS ─────────────────────────────────── */}
      <Section title="Payment Gateways">
        {/* Razorpay */}
        <Toggle
          label="Razorpay"
          value={config.gateways?.razorpay?.enabled ?? false}
          onChange={(v) =>
            set('gateways', {
              ...config.gateways,
              razorpay: { ...config.gateways?.razorpay, enabled: v },
            })
          }
        />
        {config.gateways?.razorpay?.enabled && (
          <Input
            label="Razorpay Key ID"
            placeholder="rzp_live_…"
            value={config.gateways.razorpay.keyId ?? ''}
            onChange={(e) =>
              set('gateways', {
                ...config.gateways,
                razorpay: {
                  ...config.gateways.razorpay,
                  keyId: e.target.value,
                },
              })
            }
          />
        )}

        <Divider />

        {/* Stripe */}
        <Toggle
          label="Stripe"
          value={config.gateways?.stripe?.enabled ?? false}
          onChange={(v) =>
            set('gateways', {
              ...config.gateways,
              stripe: { ...config.gateways?.stripe, enabled: v },
            })
          }
        />
        {config.gateways?.stripe?.enabled && (
          <Input
            label="Stripe Publishable Key"
            placeholder="pk_live_…"
            value={config.gateways.stripe.publishableKey ?? ''}
            onChange={(e) =>
              set('gateways', {
                ...config.gateways,
                stripe: {
                  ...config.gateways.stripe,
                  publishableKey: e.target.value,
                },
              })
            }
          />
        )}
      </Section>

      {/* ── SMTP ─────────────────────────────────────────────── */}
      <Section title="SMTP / Email">
        <Input
          label="SMTP Host"
          placeholder="smtp.gmail.com"
          value={config.smtp?.host ?? ''}
          onChange={(e) =>
            set('smtp', { ...config.smtp, host: e.target.value })
          }
        />
        <Input
          label="SMTP Port"
          type="number"
          value={String(config.smtp?.port ?? 587)}
          onChange={(e) =>
            set('smtp', { ...config.smtp, port: Number(e.target.value) })
          }
        />
        <Input
          label="SMTP User"
          placeholder="no-reply@yourstore.com"
          value={config.smtp?.user ?? ''}
          onChange={(e) =>
            set('smtp', { ...config.smtp, user: e.target.value })
          }
        />
        <Input
          label="From Name"
          placeholder="Candley Aroma"
          value={config.smtp?.fromName ?? ''}
          onChange={(e) =>
            set('smtp', { ...config.smtp, fromName: e.target.value })
          }
        />
        <Input
          label="From Email"
          placeholder="no-reply@candleyaroma.com"
          value={config.smtp?.fromEmail ?? ''}
          onChange={(e) =>
            set('smtp', { ...config.smtp, fromEmail: e.target.value })
          }
        />
      </Section>
    </div>
  );
}
