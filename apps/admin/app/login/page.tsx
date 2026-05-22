'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { api } from '@repo/api-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Login request
      await api.post('/super-admin/auth/login', {
        email: email.trim(),
        password,
      });

      // Verify auth cookie/session
      await api.get('/super-admin/auth/me');

      toast.success('Login successful');

      // IMPORTANT:
      // Use full page navigation so middleware re-evaluates auth
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.message || 'Login failed',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="glow w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10">
        <h2 className="mb-8 text-center text-3xl font-semibold text-[var(--primary)]">
          AdminOS
        </h2>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="input w-full"
            disabled={isLoading}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="input w-full"
            disabled={isLoading}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[var(--primary)] py-3.5 font-semibold text-black transition hover:brightness-110 disabled:opacity-70"
          >
            {isLoading
              ? 'Signing in...'
              : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          platform@yoursaas.com / SuperAdmin@123
        </p>
      </div>
    </div>
  );
}