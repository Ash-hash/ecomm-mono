'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, User, Mail, CheckCircle2 } from 'lucide-react';
import { useStoreInfo } from '@/src/hooks';
import { authApi } from '@repo/api-client';
import { setAuthed } from '@repo/auth';
import { syncOnLogin } from '@/src/hooks';

const FORM_KEY = 'reg_form';

function saveForm(data: { name: string; email: string }) {
  sessionStorage.setItem(FORM_KEY, JSON.stringify(data));
}

function loadForm() {
  try {
    return JSON.parse(sessionStorage.getItem(FORM_KEY) || '{}');
  } catch {
    return {};
  }
}

const BENEFITS = [
  'Track your orders in real time',
  'Save items to wishlist',
  'Faster checkout experience',
  'Exclusive offers for members',
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { data: storeInfo } = useStoreInfo();

  const logo = storeInfo?.storeLogo ?? '/logo.png';
  const banner = storeInfo?.storeBanner ?? '/banner.jpg';
  const storeName = storeInfo?.storeName ?? 'StoreFront';

  const [regToken, setRegToken] = useState('');
  const saved = loadForm();
  const [name, setName] = useState(saved.name || '');
  const [email, setEmail] = useState(saved.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    saveForm({ name, email });
  }, [name, email]);

  useEffect(() => {
  const token = sessionStorage.getItem('reg_token');

  if (!token) {
    router.replace('/login');
    return;
  }

  setRegToken(token);
}, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (email && !email.includes('@')) {
      setError('Please enter valid email');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authApi.completeRegistration(
        regToken,
        name.trim(),
        email || undefined,
      );
      setAuthed(true);

      const { store } = await import('@/src/store');
      await syncOnLogin(store);

      sessionStorage.removeItem('reg_token');
      sessionStorage.removeItem('reg_form');
      setSuccess(true);

      setTimeout(() => router.replace(redirectTo), 1000);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Banner */}
      {banner && (
        <Image
          src={banner}
          alt="store banner"
          fill
          priority
          className="object-cover"
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md p-8 card shadow-xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-36 h-20">
            <Image src={logo} alt={storeName} fill className="object-contain" />
          </div>

          <h1 className="serif text-2xl mt-2">{storeName}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Create your account
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle2 size={46} className="mx-auto text-green-500 mb-3" />

            <h2 className="serif text-xl mb-1">Welcome to {storeName} 🎉</h2>

            <p className="text-sm text-[var(--text-muted)]">
              Redirecting to your account...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                Full name
              </label>

              <div className="flex items-center border border-[var(--border)] rounded-lg px-3 h-11 gap-2">
                <User size={16} className="text-[var(--text-muted)]" />

                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className="flex-1 bg-transparent outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                Email (optional)
              </label>

              <div className="flex items-center border border-[var(--border)] rounded-lg px-3 h-11 gap-2">
                <Mail size={16} className="text-[var(--text-muted)]" />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            {/* Error */}
            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              <ArrowRight size={16} />
            </button>

            {/* Benefits */}
            <div className="border-t pt-4 mt-2 flex flex-col gap-2">
              {BENEFITS.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
                >
                  <CheckCircle2 size={14} className="text-[var(--primary)]" />
                  {b}
                </div>
              ))}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
