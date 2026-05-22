// components/navbar/useNavbar.ts
'use client';

import { useState } from 'react';

export function useNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((p) => !p);
  const closeMobile = () => setMobileOpen(false);

  return {
    mobileOpen,
    toggleMobile,
    closeMobile,
  };
}