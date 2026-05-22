import type { AuthUser } from '@repo/types';

export const userStore = {
  get(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('au');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(u: AuthUser) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('au', JSON.stringify(u));
    }
  },
  clear() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('au');
    }
  },
};