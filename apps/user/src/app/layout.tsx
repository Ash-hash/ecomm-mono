import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'My Account — StoreFront', template: '%s — StoreFront' },
  description: 'Manage your orders, subscription, and account settings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full min-w-full overflow-x-hidden">
        <NuqsAdapter>
          <Providers>
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
