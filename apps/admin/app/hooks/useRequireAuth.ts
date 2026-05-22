'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from './useAuth';

export function useRequireAuth() {
  const { loading, authed } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!loading && !authed) {
      router.replace('/login');
    }
  }, [loading, authed, router]);

  return {
    loading,
    authed,
  };
}