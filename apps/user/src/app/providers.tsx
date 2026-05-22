'use client';

import { useEffect, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Provider } from 'react-redux';
import { store, persistor } from '@/src/store';

import { PersistGate } from 'redux-persist/integration/react';

import { Toaster } from 'sonner';
import { checkAuth, setAuthed, subscribeAuthChange } from '@repo/auth';
import { useStoreInfo } from '@/src/hooks';

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mix(hex: string, target: '#000000' | '#ffffff', amount: number) {
  const source = hexToRgb(hex);
  const dest = hexToRgb(target);
  if (!source || !dest) return hex;
  const blend = (from: number, to: number) =>
    Math.round(from + (to - from) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${blend(source.r, dest.r)}${blend(source.g, dest.g)}${blend(source.b, dest.b)}`;
}

function ThemeBridge() {
  const { data: store } = useStoreInfo();

  useEffect(() => {
    const brand = store?.brandConfig ?? {};
    const primary = brand.primaryColor || '#3a7d44';
    const secondary = brand.secondaryColor || '#f6f4ef';
    const accent = brand.accentColor || '#d88c45';
    const root = document.documentElement;

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-hover', mix(primary, '#000000', 0.18));
    root.style.setProperty('--primary-soft', `${primary}18`);
    root.style.setProperty('--leaf', primary);
    root.style.setProperty('--leaf-soft', `${primary}18`);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--bg-2', secondary);
  }, [store]);

  return null;
}

function AuthBootstrap({ queryClient }: { queryClient: QueryClient }) {
  const [, setAuthVersion] = useState(0);

  useEffect(() => {
    let mounted = true;

    checkAuth().finally(() => {
      if (mounted) setAuthVersion((version) => version + 1);
    });

    const unsubscribe = subscribeAuthChange(() => {
      setAuthVersion((version) => version + 1);
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    });

    const expire = () => {
      setAuthed(false);
      queryClient.removeQueries({ queryKey: ['customer'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
    };

    window.addEventListener('auth-expired', expire);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('auth-expired', expire);
    };
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (n, e: unknown) =>
              ![401, 403].includes((e as { status?: number })?.status ?? 0) &&
              n < 2,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={qc}>
          <AuthBootstrap queryClient={qc} />
          <ThemeBridge />
          {children}

          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                background: '#12121a',
                border: '1px solid #22222e',
                color: '#d8d8e8',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
              },
            }}
          />

          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools buttonPosition="bottom-left" />
          )}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
