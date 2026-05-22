import { userStore } from './user.store';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

let _refreshing: Promise<void> | null = null;

export async function refreshToken(): Promise<void> {
  if (_refreshing) return _refreshing;

  _refreshing = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('refresh_failed');

      // ✅ no token handling needed
      return;
    })
    .catch((err) => {
      userStore.clear();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      throw err;
    })
    .finally(() => {
      _refreshing = null;
    });

  return _refreshing;
}