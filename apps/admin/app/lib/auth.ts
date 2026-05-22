const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/super-admin/auth/me`,
      {
        credentials: 'include',
        cache: 'no-store',
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}

export async function logout() {
  await fetch(
    `${API_URL}/super-admin/auth/logout`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );
}