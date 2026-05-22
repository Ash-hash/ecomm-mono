// packages/auth/src/index.ts

let authedCache: boolean | null = null;
let inflight: Promise<boolean> | null = null;
let authEpoch = 0;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// 🔥 toggle logs
const DEBUG = process.env.NEXT_PUBLIC_API_DEBUG === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log(...args);
}

function getTenantSlug(): string | null {
  if (typeof window === 'undefined') return null;

  const envTenant = process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (envTenant) return envTenant;

  const queryTenant = new URLSearchParams(window.location.search).get('tenant');
  if (queryTenant) {
    window.localStorage.setItem('tenant_slug', queryTenant);
    return queryTenant;
  }

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

function isTenantPanelRoute(): boolean {
  if (typeof window === 'undefined') return false;

  const [tenant, section] = window.location.pathname.split('/').filter(Boolean);

  return Boolean(
    tenant &&
      (section === 'dashboard' ||
        section === 'login' ||
        window.location.pathname.includes('/dashboard/')),
  );
}

// ✅ sync check
export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;

  log('🔍 [AUTH] isAuthed()', {
    authedCache,
  });

  return authedCache === true;
}

// ✅ real check (cookie-based)
export async function checkAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (inflight) {
    log('⏳ [AUTH] checkAuth() deduped (inflight)');
    return inflight;
  }

  const startedAtEpoch = authEpoch;

  inflight = (async () => {
    const tenantSlug = getTenantSlug();
    const isTenantAdmin = isTenantPanelRoute();

    const meUrl = isTenantAdmin
      ? `${BASE_URL}/tenant/auth/me`
      : `${BASE_URL}/auth/me`;

    const refreshUrl = isTenantAdmin
      ? `${BASE_URL}/tenant/auth/refresh`
      : `${BASE_URL}/auth/refresh`;

    const headers = tenantSlug
      ? { 'x-tenant-slug': tenantSlug }
      : undefined;

    log('🚀 [AUTH] checkAuth() → request', {
      meUrl,
      refreshUrl,
      tenantSlug,
    });

    try {
      let res = await fetch(meUrl, {
        credentials: 'include',
        headers,
      });

      if (res.status === 401) {
        log('🔄 [AUTH] attempting refresh');

        const refresh = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(tenantSlug
              ? { 'x-tenant-slug': tenantSlug }
              : {}),
          },
        });

        log('📥 [AUTH] refresh response', {
          status: refresh.status,
          ok: refresh.ok,
        });

        if (refresh.ok) {
          res = await fetch(meUrl, {
            credentials: 'include',
            headers,
          });
        }
      }

      log('📥 [AUTH] /me response', {
        status: res.status,
        ok: res.ok,
      });

      const ok = res.ok;

      if (!ok && startedAtEpoch !== authEpoch && authedCache === true) {
        log('🛡️ [AUTH] ignored stale unauthenticated check', {
          startedAtEpoch,
          authEpoch,
          authedCache,
        });
        return true;
      }

      authedCache = ok;

      log('✅ [AUTH] auth state updated', {
        authedCache,
      });

      notify();

      return ok;
    } catch (err: any) {
      log('💥 [AUTH] checkAuth() failed', {
        error: err?.message,
      });

      if (startedAtEpoch !== authEpoch && authedCache === true) {
        log('🛡️ [AUTH] ignored stale failed check', {
          startedAtEpoch,
          authEpoch,
          authedCache,
        });
        return true;
      }

      authedCache = false;

      notify();

      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

// ✅ manual update
export function setAuthed(value: boolean) {
  authEpoch += 1;
  inflight = null;

  log('🧠 [AUTH] setAuthed()', {
    previous: authedCache,
    next: value,
    authEpoch,
  });

  authedCache = value;
  notify();
}

// ✅ logout
export async function logout() {
  const url = `${BASE_URL}/auth/logout`;

  log('🚪 [AUTH] logout() → request', { url });

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    });

    log('📥 [AUTH] logout response', {
      status: res.status,
    });
  } catch (err: any) {
    log('💥 [AUTH] logout failed', {
      error: err.message,
    });
  }

  setAuthed(false);
}

// ✅ internal notifier
function notify() {
  if (typeof window === 'undefined') return;

  log('📣 [AUTH] notify() → emitting auth-change');

  window.dispatchEvent(new Event('auth-change'));
  localStorage.setItem('auth-sync', Date.now().toString());
}

// ✅ subscription
export function subscribeAuthChange(cb: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    log('🔔 [AUTH] auth-change event received');
    cb();
  };

  window.addEventListener('auth-change', handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('auth-change', handler);
    window.removeEventListener('storage', handler);
  };
}
