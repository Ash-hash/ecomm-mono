/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Instagram,
  Mail,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  PackageCheck,
} from 'lucide-react';
import { SocialIcon } from 'react-social-icons';

import { useStoreInfo } from '@/src/hooks';
import { useEffect, useState } from 'react';
import { getImageUrl } from '@/src/utils/image';

export default function Footer() {
  const { data: storeInfo } = useStoreInfo();

  const storeName = storeInfo?.storeName ?? 'StoreFront';
  const logo = getImageUrl(storeInfo?.storeLogo);
  const banner = storeInfo?.storeBanner ?? '/banner.jpg';
  const phone = `${storeInfo?.storePhone} , ${storeInfo?.storeMobile}`;
  const whatsappLink = storeInfo?.storeMobile
    ? `https://wa.me/${storeInfo.storeMobile.replace(/\D/g, '')}`
    : null;
  const email = storeInfo?.storeEmail || 'support@store.com';
  const socialLinks = storeInfo?.footer?.socialLinks || {};

  const [showCTA, setShowCTA] = useState(true);
  const location = storeInfo?.storeLocation;

  const address = [
    location?.addressLine1,
    location?.addressLine2,
    location?.city,
    location?.state,
    location?.postalCode,
    location?.country,
  ]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const rect = footer.getBoundingClientRect();
      setShowCTA(rect.top > window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => setOpen(open === id ? null : id);

  return (
    <>
      {showCTA && (
        <div
          className="
fixed bottom-4 left-1/2 -translate-x-1/2
z-50
bg-[var(--surface)]
border border-[var(--border)]
shadow-lg
rounded-full
px-4 py-2
flex items-center gap-2
backdrop-blur-md
"
        >
          {Object.values(socialLinks).map((url: any, i) => (
            <SocialIcon
              key={i}
              url={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ height: 30, width: 30 }}
              className="transition hover:scale-110"
            />
          ))}

          {whatsappLink && (
            <SocialIcon
              url={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ height: 30, width: 30 }}
            />
          )}
        </div>
      )}
      <footer className="bg-[var(--bg-3)] border-t border-[var(--border)] pb-5">
        {/* ───────── PROMO BANNER ───────── */}
        <div className="container-main py-6 md:py-10">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden group">
            <Image
              src={banner}
              alt="promotion"
              width={1600}
              height={500}
              className="
      w-full
      h-[160px] md:h-auto
      object-cover
      transition-transform duration-700
      group-hover:scale-[1.03]
      "
            />

            <div
              className="
    absolute inset-0
    bg-gradient-to-r
    from-black/30
    via-black/10
    to-transparent
    "
            />

            <div
              className="
    absolute inset-0
    flex flex-col justify-center
    px-5 md:px-12
    text-white right-10
    "
            >
              <span className="text-[10px] md:text-xs bg-white/20 px-2 py-1 rounded-full w-fit mb-2">
                🌿 New Season
              </span>

              <h2 className="text-lg md:text-3xl serif">
                Discover Nature Living
              </h2>

              <p className="text-xs md:text-base text-white/80 max-w-sm mt-1 mb-3 md:mb-5">
                Sustainable design inspired by nature.
              </p>

              <Link
                href="/products"
                className="
        text-xs md:text-sm
        bg-white text-black
        px-4 py-2
        rounded-full
        w-fit
        hover:bg-[var(--primary)]
        hover:text-white
        transition
        "
              >
                Explore →
              </Link>
            </div>
          </div>
        </div>

        {/* ───────── TRUST BADGES ───────── */}
        <div className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div
            className="
container-main
py-5
grid grid-flow-col auto-cols-max
md:grid-cols-4
md:auto-cols-auto
gap-8
justify-between
items-center
overflow-x-auto md:overflow-visible
scrollbar-hide
text-xs md:text-sm
text-[var(--text-soft)]
"
          >
            {[
              { icon: Truck, text: 'Free Shipping ₹999+' },
              { icon: ShieldCheck, text: 'Secure Checkout' },
              { icon: PackageCheck, text: 'Easy Returns' },
              { icon: Instagram, text: 'Loved by Customers' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="
flex items-center gap-2
justify-center md:justify-start
whitespace-nowrap
"
              >
                <Icon size={18} className="text-[var(--primary)]" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───────── MAIN FOOTER ───────── */}
        <div className="container-main py-14 grid md:grid-cols-4 gap-10 items-start">
          {' '}
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                <Image
                  src={logo}
                  alt={storeName}
                  fill
                  className="object-cover"
                />
              </div>

              <span className="serif text-lg">{storeName}</span>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-6">
              Thoughtfully curated products inspired by nature, quality
              craftsmanship and sustainable design.
            </p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-3 mt-2">
                {Object.values(socialLinks).map((url: any, i) => (
                  <SocialIcon
                    key={i}
                    url={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ height: 32, width: 32 }}
                    className="transition hover:scale-110"
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Shop Links */}
          <FooterColumn
            title="Shop"
            id="shop"
            open={open}
            toggle={toggle}
            links={[
              ['All Products', '/products'],
              ['New Arrivals', '/collections/new'],
              ['Best Sellers', '/collections/best'],
              ['Sale', '/collections/sale'],
            ]}
          />
          {/* Support */}
          <FooterColumn
            title="Support"
            id="support"
            open={open}
            toggle={toggle}
            links={[
              ['Contact', '/contact'],
              ['FAQ', '/faq'],
              ['Shipping', '/shipping'],
              ['Returns', '/returns'],
            ]}
          />
          {/* Contact */}
          <div>
            <h3 className="serif mb-4 text-[var(--text-strong)]">Contact</h3>

            <div className="flex flex-col gap-3 text-sm text-[var(--text-soft)]">
              <div className="flex items-center gap-2">
                <Mail size={16} /> {email}
              </div>

              <div className="flex items-center gap-2">
                <Phone size={16} /> {phone}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    {address || 'Address not available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ───────── BOTTOM BAR ───────── */}
        <div className="container-main py-6 flex flex-col md:flex-row justify-between text-xs text-[var(--text-muted)] gap-3">
          <p>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ───────── Collapsible Column ───────── */

function FooterColumn({ title, id, links, open, toggle }: any) {
  const isOpen = open === id;

  return (
    <div className="border-b md:border-none border-[var(--border)] pb-3 md:pb-0">
      <button
        onClick={() => toggle(id)}
        className="
        flex justify-between items-center
        w-full
        text-sm md:text-base
        serif
        py-3 md:py-0
        "
      >
        {title}

        <span className="md:hidden text-xs">{isOpen ? '−' : '+'}</span>
      </button>

      <div
        className={`
        flex flex-col
        gap-3
        text-sm
        text-[var(--text-soft)]
        transition-all duration-300
        md:mt-4
        ${isOpen ? 'max-h-96 pb-3' : 'max-h-0 overflow-hidden'}
        md:max-h-none md:overflow-visible
        `}
      >
        {links.map(([label, href]: any) => (
          <Link
            key={label}
            href={href}
            className="
            block
            relative
            hover:text-[var(--primary)]
            transition
            after:absolute
            after:left-0
            after:-bottom-0.5
            after:h-[2px]
            after:w-0
            after:bg-[var(--primary)]
            hover:after:w-full
            after:transition-all
            "
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
