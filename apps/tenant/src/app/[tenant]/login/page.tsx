'use client';

import { useState, useEffect } from 'react';

import {
  useRouter,
  useSearchParams,
  useParams,
} from 'next/navigation';

import { isAuthed } from '@repo/auth';
import { authApi } from '@repo/api-client';

import { tenantPath } from '../../utils/tenant';

export default function LoginPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const params = useParams();

  const tenant = params?.tenant as string;

  const from =
    searchParams.get('from') ??
    tenantPath('/dashboard');

  const [email, setEmail] = useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] = useState('');

  const [loading, setLoading] =
    useState(false);

  // Already logged in
  useEffect(() => {
    if (isAuthed()) {
      router.replace(from);
    }
  }, [from, router]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError('');

    setLoading(true);

    try {
      await authApi.adminLogin(
        tenant,
        email.trim(),
        password
      );

      router.replace(from);

      router.refresh();
    } catch (err: any) {
      setError(
        err.message ?? 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07070e',
      }}
    >
      <div
        style={{
          width: 380,
          padding: '40px 36px',
          background: '#0d0d18',
          border: '1px solid #1a1a28',
          borderRadius: 16,
        }}
      >
        <div
          style={{
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              color: '#e8e8f0',
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {tenant?.toUpperCase()}
          </h1>

          <p
            style={{
              color: '#6b6b80',
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="admin@store.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#12121e',
                border: '1px solid #1e1e30',
                borderRadius: 8,
                color: '#e8e8f0',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#12121e',
                border: '1px solid #1e1e30',
                borderRadius: 8,
                color: '#e8e8f0',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#ff444420',
                border:
                  '1px solid #ff444440',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 16,
                color: '#ff8080',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 0',
              background: '#7c3aed',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {loading
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}