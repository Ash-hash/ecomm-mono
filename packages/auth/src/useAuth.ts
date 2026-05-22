'use client';

import { useEffect, useState } from 'react';
import { isAuthed } from '.';


export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function init() {
      const ok = await isAuthed();
      setAuthed(ok);
      setLoading(false);
    }

    init();
  }, []);

  return { authed, loading };
}