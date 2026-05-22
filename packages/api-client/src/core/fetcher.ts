// ─── core/fetcher.ts (FIXED — auto-refresh on 401) ───────────────────────────
//
// FIXES vs original:
//  1. refreshToken() now posts to /auth/refresh — which reads the httpOnly
//     cookie automatically — then RETRIES the original request
//  2. Prevents refresh loops by tracking isRefreshing state
//  3. Uses separate refresh endpoint for super-admin routes (/super-admin/auth/refresh)
//  4. On refresh failure → redirects to login rather than silently failing
//
import { toast } from 'sonner';
import type { FetchOptions } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const DEBUG = process.env.NEXT_PUBLIC_API_DEBUG === 'true';
const ENV_TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG;

function log(...args: any[]) {
  if (DEBUG) console.log(...args);
}

function buildUrl(endpoint: string, params?: FetchOptions['params']) {
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`,
  );
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '')
        url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

// ── Refresh state (prevents concurrent refresh storms) ────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{ resolve: () => void; reject: (e: Error) => void }> =
  [];

function flushQueue(error?: Error) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  refreshQueue = [];
}

function getTenantSlug(explicit?: string): string | null {
  if (explicit) return explicit;
  if (ENV_TENANT_SLUG) return ENV_TENANT_SLUG;

  if (typeof window === 'undefined') return null;

  const queryTenant = new URLSearchParams(window.location.search).get('tenant');
  if (queryTenant) {
    window.localStorage.setItem('tenant_slug', queryTenant);
    return queryTenant;
  }

  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];
  const reserved = new Set([
    'login',
    'register',
    'dashboard',
    'super-admin',
    'admin',
    'api',
    'account',
    'checkout',
    'order-success',
    'offers',
    'products',
  ]);

  if (first && !reserved.has(first)) return first;

  const host = window.location.hostname;
  if (host.endsWith('.localhost')) {
    const slug = host.split('.')[0] || null;
    if (slug) window.localStorage.setItem('tenant_slug', slug);
    return slug;
  }

  const storedTenant = window.localStorage.getItem('tenant_slug');
  if (storedTenant) return storedTenant;

  return null;
}

function getRefreshEndpoint(endpoint: string, tenantSlug: string | null) {
  if (endpoint.includes('/super-admin')) return '/super-admin/auth/refresh';
  if (
    endpoint.includes('/tenant/auth') ||
    endpoint.includes('/tenant/dashboard')
  ) {
    return '/tenant/auth/refresh';
  }
  if (
    tenantSlug &&
    typeof window !== 'undefined' &&
    window.location.pathname.split('/').filter(Boolean)[1] === 'dashboard'
  ) {
    return '/tenant/auth/refresh';
  }
  return '/auth/refresh';
}

function getLoginPath(endpoint: string, tenantSlug: string | null) {
  if (endpoint.includes('/super-admin')) return '/login';
  if (tenantSlug && endpoint.includes('/tenant')) return `/${tenantSlug}/login`;
  return '/login';
}

async function doRefresh(
  endpoint: string,
  tenantSlug: string | null,
): Promise<void> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const refreshEndpoint = getRefreshEndpoint(endpoint, tenantSlug);
    const res = await fetch(`${BASE_URL}${refreshEndpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
      },
    });
    if (!res.ok) throw new Error('Refresh failed');
    flushQueue();
  } catch (e: any) {
    flushQueue(e);
    throw e;
  } finally {
    isRefreshing = false;
  }
}

export async function fetcher<T = unknown, B = unknown>(
  endpoint: string,
  options: FetchOptions<B> = {},
): Promise<T> {
  const start = Date.now();
  const {
    method = 'GET',
    body,
    params,
    headers = {},
    successMsg,
    suppressErrorToast = false,
    timeoutMs = 15000,
  } = options;

  const url = buildUrl(endpoint, params);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const exec = async () => {
    const tenantSlug = getTenantSlug(headers['x-tenant-slug']);

    const res = await fetch(url, {
      method,

      headers: {
        Accept: 'application/json',

        ...(body && !(body instanceof FormData)
          ? {
              'Content-Type': 'application/json',
            }
          : {}),

        // AUTO TENANT HEADER
        ...(tenantSlug
          ? {
              'x-tenant-slug': tenantSlug,
            }
          : {}),

        ...headers,
      },

      credentials: 'include',

      signal: ctrl.signal,

      ...(body !== undefined
        ? {
            body: body instanceof FormData ? body : JSON.stringify(body),
          }
        : {}),
    });

    return res;
  };

  try {
    let res = await exec();
    const isAuthRoute =
      endpoint.includes('/login') ||
      endpoint.includes('/refresh') ||
      endpoint.includes('/logout');

    // ── Auto-refresh on 401 ───────────────────────────────────────────────────
    if (res.status === 401 && !isAuthRoute) {
      log('🔄 [API] 401 → attempting token refresh…');
      const tenantSlug = getTenantSlug(headers['x-tenant-slug']);
      try {
        await doRefresh(endpoint, tenantSlug);
        log('🔁 [API] refresh OK → retrying request');
        res = await exec(); // retry with new cookie
      } catch {
        log('🚪 [API] refresh failed → redirecting to login');
        clearTimeout(timer);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-expired'));
          // Redirect to appropriate login page
          const loginPath = getLoginPath(endpoint, tenantSlug);
          window.location.href = `${loginPath}?reason=session_expired`;
        }
        throw new Error('Session expired — please log in again');
      }
    }

    clearTimeout(timer);

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* empty body */
    }

    const duration = Date.now() - start;
    log('✅ [API RESULT]', {
      url,
      status: res.status,
      duration: `${duration}ms`,
      data: json,
    });

    if (!res.ok) {
      const msg = json?.message || `HTTP ${res.status}`;
      if (!suppressErrorToast) toast.error(msg);
      throw new Error(msg);
    }

    if (successMsg) toast.success(successMsg);
    return json?.meta ? (json as T) : (json?.data as T);
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timeout');
    throw err;
  }
}
