'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, Phone, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@repo/api-client';
import { isAuthed, setAuthed} from '@repo/auth'
import { syncOnLogin } from '@/src/hooks';
// import { requestOtp, verifyOtp, isAuthed, syncOnLogin } from '@/lib/auth';
import { useStoreInfo } from '@/src/hooks';
import { QK } from '../../../../../packages/shared/queryKeys';
import { getTenantUrl } from '@/src/utils/image';

const OTP_LENGTH  = 6;
const RESEND_SECS = 30;

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const redirectTo = searchParams.get('redirect') || '/';

  const [step, setStep]       = useState<Step>('phone');
  const [phone, setPhone]     = useState('');
  const [digits, setDigits]   = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  const { data: storeInfo } = useStoreInfo();
  const logoUrl   = getTenantUrl(storeInfo?.storeLogo);
  const storeName = storeInfo?.storeName  ?? 'StoreFront';

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }

  // Redirect if already authed
  useEffect(() => {
    if (isAuthed()) router.replace('/');
  }, [router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-focus first OTP box when step changes
  useEffect(() => {
    if (step === 'otp') setTimeout(() => inputRefs.current[0]?.focus(), 120);
  }, [step]);

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const normalized = phone.replace(/\s/g, '');
    const full       = normalized.startsWith('+') ? normalized : `+91${normalized}`;

    if (full.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await authApi.requestOtp(full);
      setPhone(full);
      setDigits(Array(OTP_LENGTH).fill(''));
      setCountdown(RESEND_SECS);
      setStep('otp');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────

  async function submitOtp(otp: string) {
    setError('');
    setLoading(true);

    try {
      const result = await authApi.verifyOtp(phone, otp);

      if (result.isNewUser) {
        // New user: store reg token and redirect to registration
        sessionStorage.setItem('reg_token', result.registrationToken ?? '');
        router.push(`/register?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      setAuthed(true);

      // Returning user: sync guest state → server, then navigate
      const { store } = await import('@/src/store');
      await syncOnLogin(store);

      // Refresh both cart and wishlist in React Query cache
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.customer.cart }),
        queryClient.invalidateQueries({ queryKey: QK.customer.wishlist }),
        queryClient.invalidateQueries({ queryKey: QK.customer.profile }),
      ]);

      router.replace(redirectTo);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Invalid OTP.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handlers ─────────────────────────────────────────────────────

  function handleDigitChange(i: number, val: string) {
    const ch   = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i]    = ch;
    setDigits(next);

    if (ch && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    if (next.every(Boolean) && ch) submitOtp(next.join(''));
  }

  function handleDigitKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const n = [...digits]; n[i] = ''; setDigits(n);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft'  && i > 0)             inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) submitOtp(pasted);
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.requestOtp(phone);
      setDigits(Array(OTP_LENGTH).fill(''));
      setCountdown(RESEND_SECS);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  }

  const maskedPhone = phone
    ? phone.replace(/^(\+\d{2})(\d+)(\d{4})$/, '$1 •••• $3')
    : '';

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-white bg-black/40 px-3 py-1.5 rounded-lg hover:bg-black/60 transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md p-8 bg-white/95 rounded-2xl shadow-2xl border border-[var(--border)]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-2">
          <div className="relative w-100 h-80">
            <Image src={logoUrl} alt={storeName} fill className="object-contain" />
          </div>
        </div>

        {/* ── Step 1: Phone ──────────────────────────────────────────────── */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <div className="flex items-center gap-2 mb-5">
              <Phone size={18} />
              <span className="font-medium">Login with OTP</span>
            </div>

            <div className="flex items-center border border-[var(--border)] rounded-lg px-3 h-11 mb-4">
              <span className="text-sm pr-2 border-r">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                className="flex-1 outline-none pl-3 text-sm bg-transparent"
                value={phone.startsWith('+91') ? phone.slice(3) : phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                required
              />
            </div>

            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? 'Sending OTP…' : 'Send OTP'}
              <ArrowRight size={16} />
            </button>

            <div className="mt-5 text-center">
              <Link
                href="/products"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-strong)] underline underline-offset-4"
              >
                Browse products without signing in
              </Link>
            </div>
          </form>
        )}

        {/* ── Step 2: OTP ────────────────────────────────────────────────── */}
        {step === 'otp' && (
          <div>
            <button
              onClick={() => setStep('phone')}
              className="flex items-center gap-1 text-sm mb-4"
            >
              <ArrowLeft size={14} />
              Change number
            </button>

            <p className="text-sm text-center mb-5">
              OTP sent to <strong>{maskedPhone}</strong>
            </p>

            <div
              className="flex justify-center gap-2 mb-4"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { if (el) inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold border rounded-md focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition"
                />
              ))}
            </div>

            {error && (
              <div className="text-red-600 text-sm mb-3 text-center">{error}</div>
            )}

            <button
              onClick={() => submitOtp(digits.join(''))}
              disabled={loading || digits.join('').length < OTP_LENGTH}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify OTP'}
              <ArrowRight size={16} />
            </button>

            <div className="text-center mt-4 text-sm">
              {countdown > 0 ? (
                <span className="text-[var(--text-muted)]">Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-[var(--primary)] underline disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[var(--text-muted)]">
          <ShieldCheck size={14} />
          Secure OTP login
        </div>
      </div>
    </div>
  );
}
