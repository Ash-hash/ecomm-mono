// utils/image.ts

const ASSET_URL =
  process.env.NEXT_PUBLIC_ASSET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:3000';

export function getTenantUrl(path?: string) {
  if (!path) return '/logo.png';

  if (path.startsWith('http') || path.startsWith('/') === false) {
    return path;
  }

  return `${ASSET_URL}${path}`;
}

export const getImageUrl = getTenantUrl;
