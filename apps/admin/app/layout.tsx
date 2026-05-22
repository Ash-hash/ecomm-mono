import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AdminOS - Super Admin',
  description: 'Multi-tenant SaaS Management Platform',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[var(--bg)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}