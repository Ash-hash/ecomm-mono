// app/layout.tsx  ← your ROOT layout (not dashboard layout)
// This is the minimal change to make providers available everywhere.

import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdminOS',
  description: 'Store management panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/*
          NuqsAdapter — makes useQueryState() work for URL-based filters.
          Providers — React Query client + Toaster.
          Order matters: NuqsAdapter wraps Providers wraps children.
        */}
        <NuqsAdapter>
          <Providers>
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
