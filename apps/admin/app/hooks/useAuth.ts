'use client';

import { useEffect, useState } from 'react';

import { checkAuth } from '@/app/lib/auth';

export function useAuth() {
  const [loading, setLoading] =
    useState(true);

  const [authed, setAuthed] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const ok = await checkAuth();

      if (mounted) {
        setAuthed(ok);
        setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    loading,
    authed,
  };
}