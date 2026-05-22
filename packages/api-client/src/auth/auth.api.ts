import { fetcher } from '../core/fetcher';
import { userStore } from '../core/user.store';

function isTenantPanelPath() {
  if (typeof window === 'undefined') return false;
  const [, section] = window.location.pathname.split('/').filter(Boolean);
  return section === 'dashboard' || section === 'login';
}

export const authApi = {
  // ───────────────── ADMIN ─────────────────
  async adminLogin(
    tenant: string,
    email: string,
    password: string,
  ) {
    const res = await fetcher<{ user: any }>(
      '/tenant/auth/login',
      {
        method: 'POST',

        headers: {
          'x-tenant-slug': tenant,
        },

        body: {
          email,
          password,
        },

        skipAuth: true,
      },
    );

    // ✅ store user only
    userStore.set(res.user);

    return res;
  },

  // ───────────────── USER (OTP FLOW) ─────────────────
  async requestOtp(phone: string) {
    return fetcher<{ message: string }>(
      '/auth/request-otp',
      {
        method: 'POST',
        body: { phone },
        skipAuth: true,
      },
    );
  },

  async verifyOtp(phone: string, otp: string) {
    const res = await fetcher<{
      isNewUser: boolean;
      registrationToken?: string;
      user?: any;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp },
      skipAuth: true,
    });

    if (res.user) {
      userStore.set(res.user);
    }

    return res;
  },

  async completeRegistration(
    registrationToken: string,
    name: string,
    email?: string,
  ) {
    const res = await fetcher<{
      user: any;
    }>('/auth/complete-registration', {
      method: 'POST',
      body: {
        registrationToken,
        name,
        email,
      },
      skipAuth: true,
    });

    userStore.set(res.user);

    return res;
  },

  // ───────────────── LOGOUT ─────────────────
  async logout() {
    const tenantPanel = isTenantPanelPath();
    const endpoint = tenantPanel ? '/tenant/auth/logout' : '/auth/logout';

    try {
      await fetcher(endpoint, {
        method: 'POST',
      });
    } catch {}

    userStore.clear();

    if (typeof window !== 'undefined') {
      const tenant = window.location.pathname.split('/').filter(Boolean)[0];

      window.location.href = tenantPanel && tenant ? `/${tenant}/login` : '/login';
    }
  },
};
