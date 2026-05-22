'use client';

export function getTenantSlug() {
  if (typeof window === 'undefined') return '';

  return (
    window.location.pathname
      .split('/')
      .filter(Boolean)[0] || ''
  );
}

export function tenantPath(path: string) {
  const tenant = getTenantSlug();

  if (!tenant) return path;

  const clean = path.startsWith('/')
    ? path
    : `/${path}`;

  return `/${tenant}${clean}`;
}