/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Image from 'next/image';
import clsx from 'clsx';
import {
  ArrowRight,
  MapPin,
  Phone,
  CheckCircle2,
  Plus,
  ChevronRight,
  Leaf,
  Shield,
  Truck,
  Tag,
  X,
  AlertCircle,
  Star,
  Lock,
  UserPlus,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

import {
  useCart,
  useCustomerProfile,
  useStoreInfo,
  useAddAddress,
  useSetDefaultAddress,
  usePlaceOrder,
  useVerifyPayment,
  syncOnLogin,
} from '@/src/hooks';

import { useCouponField, useProductById } from '@/src/hooks';

import { formatCurrency } from '@/src/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

import type {
  Address,
  AddressCreateDto,
  CheckoutStatus,
  PlaceOrderDto,
  ShippingAddress,
} from '@repo/types';
import Link from 'next/link';
import { isAuthed, setAuthed } from '@repo/auth';
import { api, authApi } from '@repo/api-client';
import { QK } from '../../../../../packages/shared/queryKeys';
import { getTenantUrl } from '@/src/utils/image';

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

const LABEL_COLORS: Record<string, string> = {
  home: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  work: 'bg-blue-50 text-blue-700 border-blue-200',
  other: 'bg-stone-50 text-stone-600 border-stone-200',
};

type Step = 'address' | 'verify';

interface AddressFormState {
  label: 'home' | 'work' | 'other';
  authPhone: string;
  email: string;
  fullName: string;
  deliveryPhone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  saveToAccount: boolean;
}

const EMPTY_FORM: AddressFormState = {
  label: 'home',
  authPhone: '',
  email: '',
  fullName: '',
  deliveryPhone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
  saveToAccount: true,
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const Spinner = () => (
  <svg
    className="animate-spin w-4 h-4 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="60"
      strokeDashoffset="20"
    />
  </svg>
);

function StepBadge({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 text-sm font-medium transition-all',
        done
          ? 'text-emerald-700'
          : active
            ? 'text-stone-900'
            : 'text-stone-400',
      )}
    >
      <span
        className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
          done
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : active
              ? 'bg-stone-900 border-stone-900 text-white'
              : 'bg-white border-stone-300 text-stone-400',
        )}
      >
        {done ? <CheckCircle2 size={14} /> : num}
      </span>
      <span className="text-xs sm:text-sm">{label}</span>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
        {hint && (
          <span className="ml-1.5 text-[10px] font-normal normal-case text-stone-400">
            {hint}
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) =>
  clsx(
    'w-full border rounded-lg px-3.5 py-2.5 text-sm bg-white text-stone-800 outline-none transition-all',
    'placeholder:text-stone-300 focus:ring-2',
    err
      ? 'border-rose-300 focus:ring-rose-100'
      : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-100',
  );

// ─── Saved address card ───────────────────────────────────────────────────────

function SavedAddressCard({
  addr,
  selected,
  onSelect,
  onSetDefault,
  settingDefault,
}: {
  addr: Address;
  selected: boolean;
  onSelect: () => void;
  onSetDefault: () => void;
  settingDefault: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border-2 transition-all overflow-hidden',
        selected
          ? 'border-emerald-500 bg-emerald-50/40'
          : 'border-stone-200 bg-white',
      )}
    >
      <button onClick={onSelect} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={clsx(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                  LABEL_COLORS[addr.label ?? 'home'],
                )}
              >
                {addr.label ?? 'home'}
              </span>
              {addr.isDefault && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </div>
            <p className="font-semibold text-stone-800 text-sm">
              {addr.fullName}
            </p>
            <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">
              {[addr.addressLine1, addr.addressLine2]
                .filter(Boolean)
                .join(', ')}
              {addr.landmark && ` · Near ${addr.landmark}`}
            </p>
            <p className="text-sm text-stone-500">
              {addr.city}, {addr.state} — {addr.pincode}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">📞 {addr.phone}</p>
          </div>
          <div
            className={clsx(
              'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-all',
              selected
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-stone-300',
            )}
          >
            {selected && <span className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>
      </button>
      {selected && !addr.isDefault && (
        <div className="px-4 pb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault();
            }}
            disabled={settingDefault}
            className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 disabled:opacity-50"
          >
            <Star size={11} />
            {settingDefault ? 'Saving…' : 'Set as default address'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Address form ─────────────────────────────────────────────────────────────

function AddressFormFields({
  form,
  errors,
  setField,
  isAuthedUser,
}: {
  form: AddressFormState;
  errors: Partial<Record<keyof AddressFormState, string>>;
  setField: (k: keyof AddressFormState, v: any) => void;
  isAuthedUser: boolean;
}) {
  return (
    <div className="space-y-4">
      {!isAuthedUser && (
        <div className="space-y-3 pb-4 border-b border-stone-100">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Your Contact
          </p>
          <Field
            label="Your Mobile"
            required
            hint="OTP will be sent here"
            error={errors.authPhone}
          >
            <div className="flex gap-2">
              <span className="flex items-center px-3.5 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-500 font-medium whitespace-nowrap">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                value={form.authPhone}
                onChange={(e) =>
                  setField(
                    'authPhone',
                    e.target.value.replace(/\D/g, '').slice(0, 10),
                  )
                }
                className={inputCls(errors.authPhone)}
                maxLength={10}
                autoComplete="tel"
              />
            </div>
          </Field>
          <Field
            label="Your Name"
            required
            hint="used for your account"
            error={errors.fullName}
          >
            <input
              type="text"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              className={inputCls(errors.fullName)}
              autoComplete="name"
            />
          </Field>
          <Field
            label="Email"
            hint="optional — for order updates"
            error={errors.email}
          >
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className={inputCls(errors.email)}
              autoComplete="email"
            />
          </Field>
        </div>
      )}

      {isAuthedUser && (
        <div className="flex gap-2">
          {(['home', 'work', 'other'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setField('label', l)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all',
                form.label === l
                  ? LABEL_COLORS[l] + ' border-current'
                  : 'border-stone-200 text-stone-400 hover:border-stone-300',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider pt-1">
        {isAuthedUser ? 'Address Details' : 'Delivery Address'}
      </p>

      {isAuthedUser && (
        <Field label="Recipient Name" required error={errors.fullName}>
          <input
            type="text"
            placeholder="Name on shipping label"
            value={form.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            className={inputCls(errors.fullName)}
            autoComplete="name"
          />
        </Field>
      )}

      <Field
        label="Delivery Phone"
        required
        hint="printed on package"
        error={errors.deliveryPhone}
      >
        <div className="flex gap-2">
          <span className="flex items-center px-3 rounded-lg border border-stone-200 bg-stone-50 text-xs text-stone-500 font-medium whitespace-nowrap">
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit"
            value={form.deliveryPhone}
            onChange={(e) =>
              setField(
                'deliveryPhone',
                e.target.value.replace(/\D/g, '').slice(0, 10),
              )
            }
            className={inputCls(errors.deliveryPhone)}
            maxLength={10}
          />
        </div>
      </Field>

      <Field label="Address Line 1" required error={errors.addressLine1}>
        <input
          type="text"
          placeholder="House / Flat No., Building, Street"
          value={form.addressLine1}
          onChange={(e) => setField('addressLine1', e.target.value)}
          className={inputCls(errors.addressLine1)}
          autoComplete="address-line1"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Area / Colony" error={errors.addressLine2}>
          <input
            type="text"
            placeholder="optional"
            value={form.addressLine2}
            onChange={(e) => setField('addressLine2', e.target.value)}
            className={inputCls()}
          />
        </Field>
        <Field label="Landmark" error={errors.landmark}>
          <input
            type="text"
            placeholder="Near… (optional)"
            value={form.landmark}
            onChange={(e) => setField('landmark', e.target.value)}
            className={inputCls()}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="City" required error={errors.city}>
          <input
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            className={inputCls(errors.city)}
            autoComplete="address-level2"
          />
        </Field>
        <Field label="State" required error={errors.state}>
          <select
            value={form.state}
            onChange={(e) => setField('state', e.target.value)}
            className={clsx(inputCls(errors.state), 'cursor-pointer')}
          >
            <option value="">Select</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="PIN Code" required error={errors.pincode}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6 digits"
            value={form.pincode}
            onChange={(e) =>
              setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className={inputCls(errors.pincode)}
            maxLength={6}
            autoComplete="postal-code"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer group pt-1">
        <div
          onClick={() => setField('saveToAccount', !form.saveToAccount)}
          className={clsx(
            'w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
            form.saveToAccount
              ? 'bg-emerald-600 border-emerald-600'
              : 'border-stone-300 group-hover:border-stone-400',
          )}
        >
          {form.saveToAccount && (
            <CheckCircle2 size={10} className="text-white" />
          )}
        </div>
        <span className="text-sm text-stone-600">
          {isAuthedUser
            ? 'Save this address to my account'
            : 'Save address to my new account'}
        </span>
      </label>
    </div>
  );
}

// ─── OTP panel ────────────────────────────────────────────────────────────────

function OtpPanel({
  phone,
  otp,
  onOtpChange,
  onVerify,
  onResend,
  onBack,
  verifying,
  error,
  countdown,
}: {
  phone: string;
  otp: string;
  onOtpChange: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  verifying: boolean;
  error: string | null;
  countdown: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <Lock size={14} className="text-emerald-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-emerald-700 font-medium">OTP sent to</p>
          <p className="text-sm font-bold text-emerald-900">+91 {phone}</p>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
        >
          Change
        </button>
      </div>
      <p className="text-xs text-stone-400 leading-relaxed">
        By verifying, a free account will be created for your number so you can
        track orders and checkout faster next time.
      </p>
      <Field label="Enter OTP" required error={error ?? undefined}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="• • • • • •"
          value={otp}
          onChange={(e) =>
            onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && onVerify()}
          className={clsx(
            inputCls(error ?? undefined),
            'tracking-[0.5em] text-center font-bold text-xl py-3',
          )}
          maxLength={6}
          autoFocus
        />
      </Field>
      <p className="text-center text-xs text-stone-400">
        {countdown > 0 ? (
          <span>
            Resend in{' '}
            <span className="font-semibold text-stone-600">{countdown}s</span>
          </span>
        ) : (
          <button
            onClick={onResend}
            className="text-emerald-700 hover:underline font-medium"
          >
            Resend OTP
          </button>
        )}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust signals — shared between the two empty states
// ─────────────────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: '🔒', title: 'Secure Payments', desc: 'Razorpay encrypted checkout' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fast & reliable shipping' },
  { icon: '↩️', title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: '✅', title: '100% Authentic', desc: 'Quality guaranteed always' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared checkout shell — top bar present in all states
// ─────────────────────────────────────────────────────────────────────────────

function CheckoutShell({
  storeName,
  logoUrl,
  children,
}: {
  storeName?: string;
  logoUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Same sticky top bar as the real checkout */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={storeName ?? ''}
                width={40}
                height={40}
                className="rounded-lg object-cover border border-stone-100"
              />
            )}
            <span className="hidden sm:block font-semibold text-emerald-800 text-lg">
              {storeName}
            </span>
          </Link>
          {/* Greyed-out progress — shows where they would be */}
          <div className="flex items-center gap-2 sm:gap-4 opacity-40 select-none">
            <div className="flex items-center gap-2 text-stone-400">
              <span className="w-7 h-7 rounded-full border-2 border-stone-300 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span className="text-xs hidden sm:block">Address</span>
            </div>
            <ChevronRight size={14} className="text-stone-300" />
            <div className="flex items-center gap-2 text-stone-400">
              <span className="w-7 h-7 rounded-full border-2 border-stone-300 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="text-xs hidden sm:block">Verify</span>
            </div>
            <ChevronRight size={14} className="text-stone-300" />
            <div className="flex items-center gap-2 text-stone-400">
              <span className="w-7 h-7 rounded-full border-2 border-stone-300 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span className="text-xs hidden sm:block">Payment</span>
            </div>
          </div>
          <div className="w-10 sm:w-28" /> {/* spacer to balance the logo */}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function CheckoutLoadingSkeleton({
  storeName,
  logoUrl,
}: {
  storeName?: string;
  logoUrl?: string;
}) {
  return (
    <CheckoutShell storeName={storeName} logoUrl={logoUrl}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left skeleton */}
          <div className="lg:col-span-3 space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-stone-200 rounded-lg" />
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
              <div className="h-5 w-36 bg-stone-100 rounded" />
              <div className="space-y-3">
                {[80, 60, 90, 70].map((w, i) => (
                  <div
                    key={i}
                    className={`h-10 bg-stone-100 rounded-lg`}
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-stone-100 rounded-lg" />
                ))}
              </div>
              <div className="h-12 bg-stone-100 rounded-xl" />
            </div>
          </div>
          {/* Right skeleton */}
          <div className="lg:col-span-2 animate-pulse">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
              <div className="h-5 w-32 bg-stone-100 rounded" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-12 h-12 bg-stone-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-stone-100 rounded w-3/4" />
                      <div className="h-3 bg-stone-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-stone-100 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-stone-100 rounded" />
                ))}
              </div>
              <div className="h-6 bg-stone-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Empty cart state
// ─────────────────────────────────────────────────────────────────────────────

function CheckoutEmptyState({
  storeName,
  logoUrl,
  storeEmail,
  onBrowse,
}: {
  storeName?: string;
  logoUrl?: string;
  storeEmail?: string;
  onBrowse: () => void;
}) {
  return (
    <CheckoutShell storeName={storeName} logoUrl={logoUrl}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Hero illustration */}
        <div className="text-center mb-10">
          {/* Decorative rings */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-emerald-50 animate-pulse" />
            <div className="absolute inset-3 rounded-full bg-emerald-100/60" />
            <div className="absolute inset-6 rounded-full bg-emerald-200/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                viewBox="0 0 80 80"
                className="w-20 h-20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Bag body */}
                <rect
                  x="14"
                  y="28"
                  width="52"
                  height="38"
                  rx="6"
                  fill="#d1fae5"
                  stroke="#6ee7b7"
                  strokeWidth="2"
                />
                {/* Bag handle */}
                <path
                  d="M28 28 C28 18 52 18 52 28"
                  stroke="#6ee7b7"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Sparkle top-right */}
                <path
                  d="M62 12 L63.2 15.2 L66 16 L63.2 16.8 L62 20 L60.8 16.8 L58 16 L60.8 15.2 Z"
                  fill="#34d399"
                />
                {/* Sparkle top-left */}
                <path
                  d="M18 8 L18.8 10.4 L21 11 L18.8 11.6 L18 14 L17.2 11.6 L15 11 L17.2 10.4 Z"
                  fill="#a7f3d0"
                />
                {/* Dotted horizontal line inside bag */}
                <line
                  x1="26"
                  y1="47"
                  x2="54"
                  y2="47"
                  stroke="#6ee7b7"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
                <line
                  x1="30"
                  y1="54"
                  x2="50"
                  y2="54"
                  stroke="#a7f3d0"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-[26px] sm:text-[30px] font-bold text-stone-800 tracking-tight mb-3">
            Nothing here yet
          </h1>
          <p className="text-stone-500 text-[15px] leading-relaxed max-w-sm mx-auto">
            Your checkout bag is empty. Explore our collection and add items you
            love.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <button
            onClick={onBrowse}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-emerald-700 text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-sm shadow-emerald-900/20"
          >
            Explore Collection
            <ArrowRight size={16} />
          </button>
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-4 py-3.5"
          >
            Go to homepage
          </Link>
        </div>

        {/* Trust grid */}
        <div className="border-t border-stone-200 pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 text-center mb-6">
            Why customers love shopping with us
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-stone-100 gap-2.5"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-stone-700">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Support line */}
          {storeEmail && (
            <p className="text-center text-[12px] text-stone-400 mt-8">
              Questions? Reach us at{' '}
              <a
                href={`mailto:${storeEmail}`}
                className="text-emerald-700 font-medium hover:underline underline-offset-2"
              >
                {storeEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    </CheckoutShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. No items selected state
// ─────────────────────────────────────────────────────────────────────────────

function CheckoutNoSelectionState({
  storeName,
  logoUrl,
  onBack,
}: {
  storeName?: string;
  logoUrl?: string;
  onBack: () => void;
}) {
  return (
    <CheckoutShell storeName={storeName} logoUrl={logoUrl}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Illustration */}
        <div className="text-center mb-10">
          <div className="relative w-36 h-36 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-amber-50" />
            <div className="absolute inset-3 rounded-full bg-amber-100/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                viewBox="0 0 80 80"
                className="w-18 h-18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Checkbox outline */}
                <rect
                  x="20"
                  y="20"
                  width="40"
                  height="40"
                  rx="8"
                  fill="#fef3c7"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                />
                {/* Dashed tick path — "pending" state */}
                <path
                  d="M30 40 L37 47 L50 33"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6 4"
                />
                {/* Tiny sparkles */}
                <circle cx="62" cy="22" r="3" fill="#fde68a" />
                <circle cx="16" cy="58" r="2" fill="#fde68a" />
              </svg>
            </div>
          </div>

          <h1 className="text-[24px] sm:text-[28px] font-bold text-stone-800 tracking-tight mb-3">
            Nothing selected to buy
          </h1>
          <p className="text-stone-500 text-[15px] leading-relaxed max-w-sm mx-auto">
            Tick the items in your bag that you want to order. You can always
            come back for the rest.
          </p>
        </div>

        {/* Steps hint */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-8 space-y-3.5">
          {[
            { num: '1', text: 'Open your cart from the top navigation' },
            { num: '2', text: 'Check the boxes next to the items you want' },
            { num: '3', text: 'Tap "Checkout" in the cart footer' },
          ].map((step) => (
            <div key={step.num} className="flex items-start gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.num}
              </span>
              <p className="text-[13.5px] text-stone-600 leading-snug">
                {step.text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-emerald-700 text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-sm shadow-emerald-900/20"
        >
          <ArrowRight size={15} className="rotate-180" />
          Go Back & Select Items
        </button>

        {/* Trust micro-strip */}
        <div className="flex items-center justify-center gap-5 mt-8">
          {[
            { icon: '🔒', label: 'Secure checkout' },
            { icon: '🚚', label: 'Pan-India delivery' },
            { icon: '↩️', label: 'Easy returns' },
          ].map((t) => (
            <span
              key={t.label}
              className="flex items-center gap-1.5 text-[11px] text-stone-400"
            >
              <span>{t.icon}</span>
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </CheckoutShell>
  );
}

function PaymentProcessingState({ storeName, logoUrl }: any) {
  return (
    <CheckoutShell storeName={storeName} logoUrl={logoUrl}>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg
            className="animate-spin w-8 h-8 text-emerald-600"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-stone-800 mb-2">
          Processing your payment
        </h1>

        <p className="text-sm text-stone-500">
          Please wait while we connect to the payment gateway.
        </p>

        <p className="text-xs text-stone-400 mt-3">
          Do not refresh or close this page.
        </p>
      </div>
    </CheckoutShell>
  );
}

function PaymentVerifyingState({ storeName, logoUrl }: any) {
  return (
    <CheckoutShell storeName={storeName} logoUrl={logoUrl}>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
          <Shield size={30} className="text-blue-600" />
        </div>

        <h1 className="text-xl font-bold text-stone-800 mb-2">
          Verifying your payment
        </h1>

        <p className="text-sm text-stone-500">
          We are securely confirming your transaction.
        </p>
      </div>
    </CheckoutShell>
  );
}

function PaymentFailedState({ retry }: any) {
  return (
    <CheckoutShell>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-100 flex items-center justify-center">
          <AlertCircle size={32} className="text-rose-500" />
        </div>

        <h1 className="text-xl font-bold text-stone-800 mb-2">
          Payment failed
        </h1>

        <p className="text-sm text-stone-500 mb-6">
          Your payment could not be processed.
        </p>

        <button
          onClick={retry}
          className="px-6 py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
        >
          Try Payment Again
        </button>
      </div>
    </CheckoutShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main checkout page
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isBuyNow = searchParams.get('buyNow') === 'true';
  const buyNowProductId = searchParams.get('productId') || undefined;
  const buyNowQty = Number(searchParams.get('qty') || 1);
  const { data: cart } = useCart();
  const { data: profile } = useCustomerProfile();
  const { data: STORE } = useStoreInfo();
  const { data: buyNowProduct } = useProductById(buyNowProductId || '');
  const addAddressMutation = useAddAddress();
  const setDefaultMutation = useSetDefaultAddress();
  const placeOrderMutation = usePlaceOrder();
  const verifyPaymentMutation = useVerifyPayment();

  const regTokenRef = useRef<string | null>(null);
  const authed = isAuthed();
  const [, forceRender] = useState(0);

  // ── Selected items (from server cart selection state) ─────────────────────
  const allItems = cart?.items ?? [];

  const selectedItems = useMemo(() => {
    if (isBuyNow) {
      if (!buyNowProduct) return [];

      return [
        {
          productId: buyNowProduct._id,
          quantity: buyNowQty,
          product: buyNowProduct,
          lineTotal: buyNowProduct.price * buyNowQty,
        },
      ];
    }

    return allItems.filter((i) => i.selected);
  }, [isBuyNow, buyNowProduct, allItems, buyNowQty]);

  const selectedSummary = cart?.selectedSummary;

  // Use selectedSummary for totals — server-computed and accurate
  const subtotal = isBuyNow
    ? selectedItems.reduce((sum, item) => sum + item.lineTotal, 0)
    : (selectedSummary?.subtotal ?? 0);

  const tax = isBuyNow ? subtotal * 0.18 : (selectedSummary?.tax ?? 0);

  const shipping = isBuyNow
    ? subtotal > (STORE?.freeShippingThreshold ?? 999)
      ? 0
      : (STORE?.shippingFlatRate ?? 99)
    : (selectedSummary?.shipping ?? 0);

  const total = isBuyNow
    ? subtotal + tax + shipping
    : (selectedSummary?.total ?? 0);
  const freeShippingThreshold = STORE?.freeShippingThreshold ?? 999;

  const [step, setStep] = useState<Step>('address');
  const savedAddresses: Address[] = profile?.addresses ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(!authed);
  const [form, setFormState] = useState<AddressFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof AddressFormState, string>>
  >({});
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  // ── Coupon — real API validation via useCouponField ──────────────────────
  //
  // cartSubtotal from selectedSummary so the discount is scoped to selected
  // items only. freeShipping flag overrides the shipping line in the summary.
  const couponSubtotal = isBuyNow
    ? selectedItems.reduce((sum, item) => sum + item.lineTotal, 0)
    : (selectedSummary?.subtotal ?? 0);
  const coupon = useCouponField(couponSubtotal);

  // Effective totals — apply coupon discount + free-shipping override
  const displaySubtotal = subtotal;
  const displayDiscount = coupon.discountAmount;
  const displayShipping = coupon.freeShipping ? 0 : shipping;
  const displayTax = tax;
  const displayTotal = Math.max(
    0,
    +(total - displayDiscount - (shipping - displayShipping)).toFixed(2),
  );
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');

  // Auto-select default address on profile load
  useEffect(() => {
    if (!profile) return;
    const addresses = profile.addresses ?? [];
    if (addresses.length === 0) {
      setShowAddressForm(true);
      return;
    }
    setShowAddressForm(false);
    if (!selectedId) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (def) {
        setSelectedId(def._id);
      }
    }
  }, [profile, selectedId]);

  useEffect(
    () => () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    },
    [],
  );

  const setField = useCallback((key: keyof AddressFormState, value: any) => {
    setFormState((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => ({ ...e, [key]: '' }));
  }, []);

  // ── Build structured ShippingAddress from saved address ───────────────────

  function buildShippingAddressFromSaved(addr: Address): ShippingAddress {
    return {
      _id: addr._id,
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || undefined,
      landmark: addr.landmark || undefined,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country || 'India',
      lat: addr.lat,
      lng: addr.lng,
    };
  }

  // ── Build structured ShippingAddress from form state ─────────────────────

  function buildShippingAddressFromForm(): ShippingAddress {
    return {
      _id: '',
      label: form.label,
      fullName: form.fullName,
      phone: form.deliveryPhone,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      landmark: form.landmark || undefined,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      country: form.country || 'India',
    };
  }

  // ── Address display string (Razorpay notes only) ──────────────────────────

  function addressToDisplayString(addr: ShippingAddress): string {
    return [
      addr.fullName,
      addr.addressLine1,
      addr.addressLine2,
      addr.landmark && `Near ${addr.landmark}`,
      addr.city,
      `${addr.state} - ${addr.pincode}`,
      addr.country,
    ]
      .filter(Boolean)
      .join(', ');
  }

  // ── Form validation ───────────────────────────────────────────────────────

  function validateForm(skipAuth = false): boolean {
    const errs: Partial<Record<keyof AddressFormState, string>> = {};
    if (!skipAuth && !authed) {
      if (!/^\d{10}$/.test(form.authPhone))
        errs.authPhone = 'Valid 10-digit number required';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = 'Invalid email';
    }
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!/^\d{10}$/.test(form.deliveryPhone))
      errs.deliveryPhone = 'Valid 10-digit number required';
    if (!form.addressLine1.trim()) errs.addressLine1 = 'Required';
    if (!form.city.trim()) errs.city = 'Required';
    if (!form.state) errs.state = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = '6-digit PIN required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function startCountdown(seconds = 30) {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  // ── OTP flow ──────────────────────────────────────────────────────────────

  async function handleSendOtp() {
    setOrderError(null);
    if (!validateForm()) return;
    try {
      await authApi.requestOtp(`+91${form.authPhone}`);
      setStep('verify');
      startCountdown(30);
    } catch (err: any) {
      setFormErrors((e) => ({
        ...e,
        authPhone: err.message ?? 'Failed to send OTP',
      }));
    }
  }

  async function handleResendOtp() {
    try {
      await authApi.requestOtp(`+91${form.authPhone}`);
      startCountdown(30);
      setOtp('');
      setOtpError(null);
    } catch (err: any) {
      setOtpError(err.message ?? 'Failed to resend OTP');
    }
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    setOtpError(null);

    try {
      const result = await authApi.verifyOtp(`+91${form.authPhone}`, otp);

      if (result.isNewUser) {
        if (!result.registrationToken)
          throw new Error('Registration token missing');
        regTokenRef.current = result.registrationToken;
        await authApi.completeRegistration(
          result.registrationToken,
          form.fullName.trim(),
          form.email.trim() || undefined,
        );
      }

      // Sync guest state → server (deselect-all + merge guest items as selected)
      const { store } = await import('@/src/store');
      await syncOnLogin(store);

      // Refresh React Query cache
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.customer.cart }),
        queryClient.invalidateQueries({ queryKey: QK.customer.profile }),
        queryClient.invalidateQueries({ queryKey: QK.customer.wishlist }),
      ]);

      setAuthed(true);
      forceRender((n) => n + 1);

      await placeOrder(true);
    } catch (err: any) {
      setOtpError(err.message ?? 'Invalid OTP. Please try again.');
      setVerifyingOtp(false);
    }
  }

  async function handleSetDefault(addressId: string) {
    setSettingDefaultId(addressId);
    try {
      await setDefaultMutation.mutateAsync(addressId);
    } finally {
      setSettingDefaultId(null);
    }
  }

  // ── Core checkout function ────────────────────────────────────────────────
  //
  // freshlyAuthed = true  → just completed OTP inline; profile not yet re-fetched.
  // freshlyAuthed = false → returning authed user; profile is loaded.

  async function placeOrder(freshlyAuthed = false) {
    setOrderError(null);
    setLoading(true);

    // Guard: nothing selected
    if (!isBuyNow && selectedItems.length === 0 && !freshlyAuthed) {
      setOrderError(
        'No items are selected. Please select items in your cart to checkout.',
      );
      setLoading(false);
      return;
    }
    if (isBuyNow && !buyNowProductId) {
      throw new Error('Missing productId for Buy Now');
    }

    // ── Resolve shipping address ────────────────────────────────────────────
    let shippingAddress: ShippingAddress;

    if (authed && !showAddressForm && !freshlyAuthed) {
      if (!selectedId) {
        setOrderError('Please select a delivery address.');
        setLoading(false);
        return;
      }
      const addr = savedAddresses.find((a) => a._id === selectedId);
      if (!addr) {
        setOrderError('Selected address not found. Please refresh.');
        setLoading(false);
        return;
      }
      shippingAddress = buildShippingAddressFromSaved(addr);
    } else {
      shippingAddress = buildShippingAddressFromForm();

      // Save address to account if opted in
      if ((authed || freshlyAuthed) && form.saveToAccount) {
        try {
          const dto: AddressCreateDto = {
            label: form.label,
            fullName: form.fullName,
            phone: form.deliveryPhone,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || undefined,
            landmark: form.landmark || undefined,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            country: form.country || 'India',
            isDefault: form.isDefault,
          };
          await addAddressMutation.mutateAsync(dto);
        } catch {
          /* non-fatal */
        }
      }
    }

    // ── Selected product IDs (for partial checkout) ─────────────────────────
    // For freshlyAuthed: guest items were just synced as selected on the server,
    // so we don't need to pass explicit IDs — the DB selection is correct.
    const selectedProductIds = freshlyAuthed
      ? undefined
      : selectedItems
          .map((i) => i.productId)
          .filter((id): id is string => Boolean(id));

    let finalProductIds: string[] | undefined;

    if (isBuyNow) {
      finalProductIds = buyNowProductId ? [buyNowProductId] : undefined;
    } else {
      finalProductIds =
        selectedProductIds && selectedProductIds.length > 0
          ? selectedProductIds
          : undefined;
    }

    // ── Place order ─────────────────────────────────────────────────────────
    try {
      let payload: PlaceOrderDto;

      const couponPart =
        coupon.isApplied && coupon.result?.code
          ? { couponCode: coupon.result.code }
          : {};

      if (isBuyNow) {
        if (!buyNowProductId) {
          throw new Error('Invalid Buy Now state');
        }

        payload = {
          productId: buyNowProductId,
          quantity: buyNowQty,
          shippingAddress,
          paymentMethod: 'online',
          ...couponPart,
        };
      } else {
        if (!finalProductIds || finalProductIds.length === 0) {
          throw new Error('No selected products');
        }

        payload = {
          selectedProductIds: finalProductIds, // ✅ ALWAYS defined
          shippingAddress,
          paymentMethod: 'online',
          ...couponPart,
        };
      }

      const orderData = await placeOrderMutation.mutateAsync(payload);
      const paymentOrder = await api.post<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
      }>('/payments/create-order', { orderId: orderData.orderId });
      const razorpayKey =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY || orderData.keyId;
      setCheckoutStatus('processing');

      if (!razorpayKey) {
        setOrderError('Payment key is not configured. Please contact support.');
        setLoading(false);
        setVerifyingOtp(false);
        return;
      }

      if (!window.Razorpay) {
        setOrderError('Payment SDK not loaded. Please refresh and try again.');
        setLoading(false);
        setVerifyingOtp(false);
        return;
      }

      // ── Open Razorpay modal ───────────────────────────────────────────────
      const rzp = new window.Razorpay({
        key: razorpayKey,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        order_id: paymentOrder.razorpayOrderId,
        name: STORE?.storeName,
        description: `Order #${orderData.orderNumber}`,
        prefill: {
          contact: freshlyAuthed
            ? `+91${form.authPhone}`
            : (profile?.phone ?? `+91${form.deliveryPhone}`),
          name: freshlyAuthed
            ? form.fullName
            : (profile?.name ?? form.fullName),
          email: freshlyAuthed
            ? form.email || undefined
            : (profile?.email ?? undefined),
        },
        notes: { address: addressToDisplayString(shippingAddress) },
        theme: { color: '#2d6a4f' },

        handler: async (response: any) => {
          setCheckoutStatus('verifying');
          try {
            await verifyPaymentMutation.mutateAsync({
              orderId: orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            router.push(`/order-success?order=${orderData.orderNumber}`);
            sessionStorage.setItem('lastOrder', orderData.orderNumber);
          } catch {
            setCheckoutStatus('failed');
            setOrderError(
              'Payment verification failed. Contact support if amount was deducted.',
            );
            setLoading(false);
            setVerifyingOtp(false);
          }
        },

        modal: {
          ondismiss: () => {
            setCheckoutStatus('failed');
            setLoading(false);
            setVerifyingOtp(false);
          },
        },
      });

      rzp.open();
    } catch (err: any) {
      setOrderError(err.message ?? 'Could not place order. Please try again.');
      setLoading(false);
      setVerifyingOtp(false);
      if (freshlyAuthed) setStep('address');
    }
  }

  async function handleAuthedCheckout() {
    setOrderError(null);
    if (showAddressForm && !validateForm(true)) return;
    await placeOrder(false);
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  const isCheckoutActive =
    checkoutStatus === 'processing' || checkoutStatus === 'verifying';

  // if (cartLoading) {
  //   return (
  //     <CheckoutLoadingSkeleton
  //       storeName={STORE?.storeName}
  //       logoUrl={STORE?.storeLogo}
  //     />
  //   );
  // }

  if (checkoutStatus === 'processing') {
    return (
      <PaymentProcessingState
        storeName={STORE?.storeName}
        logoUrl={STORE?.storeLogo}
      />
    );
  }

  if (checkoutStatus === 'verifying') {
    return (
      <PaymentVerifyingState
        storeName={STORE?.storeName}
        logoUrl={STORE?.storeLogo}
      />
    );
  }

  if (checkoutStatus === 'failed') {
    return <PaymentFailedState retry={() => setCheckoutStatus('idle')} />;
  }

  if (!isBuyNow && (!cart || allItems.length === 0)) {
    if (isCheckoutActive) {
      // 🚫 DO NOT interrupt valid payment flow
      return null;
    }
    return (
      <CheckoutEmptyState
        storeName={STORE?.storeName}
        logoUrl={STORE?.storeLogo}
        storeEmail={STORE?.storeEmail}
        onBrowse={() => router.push('/products')}
      />
    );
  }

  // No selected items warning (only for authed users before OTP step)
  if (!isBuyNow && selectedItems.length === 0 && authed) {
    return (
      <CheckoutNoSelectionState
        storeName={STORE?.storeName}
        logoUrl={STORE?.storeLogo}
        onBack={() => router.back()}
      />
    );
  }

  if (isBuyNow && !selectedItems.length) {
    return (
      <CheckoutShell storeName={STORE?.storeName} logoUrl={STORE?.storeLogo}>
        Something Went wrong ...
      </CheckoutShell>
    );
  }
  const isLoggedIn = authed;
  const progressStep = isLoggedIn ? 2 : step === 'verify' ? 2 : 1;
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-stone-50">
        {/* Top bar */}
        <div className="bg-white border-b border-stone-100 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-emerald-800 font-semibold text-lg hover:opacity-80 transition cursor-pointer"
            >
              {STORE?.storeLogo && (
                <Image
                  src={STORE.storeLogo}
                  alt={STORE.storeName ?? ''}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover border border-stone-100"
                />
              )}
              <span className="hidden sm:block">{STORE?.storeName}</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              <StepBadge
                num={1}
                label="Address"
                active={progressStep === 1}
                done={progressStep > 1}
              />
              <ChevronRight
                size={14}
                className="text-stone-300 flex-shrink-0"
              />
              <StepBadge
                num={2}
                label="Verify"
                active={progressStep === 2}
                done={false}
              />
              <ChevronRight
                size={14}
                className="text-stone-300 flex-shrink-0"
              />
              <StepBadge num={3} label="Payment" active={false} done={false} />
            </div>

            <a
              href={`tel:${STORE?.storeMobile}`}
              className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-700"
            >
              <Phone size={13} /> Need help?
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
            {/* ── Left: Address / OTP ──────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/60">
                  <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-600" />
                    {step === 'verify'
                      ? 'Verify Your Number'
                      : 'Delivery Address'}
                  </h2>
                  {isLoggedIn && profile?.name && (
                    <p className="text-xs text-stone-500 mt-0.5">
                      Delivering for{' '}
                      <span className="font-medium text-stone-700">
                        {profile.name}
                      </span>
                    </p>
                  )}
                  {!isLoggedIn && step === 'address' && (
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                      <UserPlus size={11} /> A free account will be created for
                      your number
                    </p>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  {/* Saved addresses */}
                  {isLoggedIn &&
                    savedAddresses.length > 0 &&
                    !showAddressForm && (
                      <>
                        <div className="space-y-3">
                          {savedAddresses.map((addr) => (
                            <SavedAddressCard
                              key={addr._id}
                              addr={addr}
                              selected={selectedId === addr._id}
                              onSelect={() => setSelectedId(addr._id)}
                              onSetDefault={() => handleSetDefault(addr._id)}
                              settingDefault={settingDefaultId === addr._id}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-500 hover:border-emerald-400 hover:text-emerald-700 transition-all"
                        >
                          <Plus size={16} /> Add a new address
                        </button>
                      </>
                    )}

                  {/* Address form */}
                  {(showAddressForm ||
                    !isLoggedIn ||
                    savedAddresses.length === 0) &&
                    step !== 'verify' && (
                      <>
                        {isLoggedIn && savedAddresses.length > 0 && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-stone-700">
                              New Address
                            </p>
                            <button
                              onClick={() => setShowAddressForm(false)}
                              className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        <AddressFormFields
                          form={form}
                          errors={formErrors}
                          setField={setField}
                          isAuthedUser={isLoggedIn}
                        />
                      </>
                    )}

                  {/* OTP step */}
                  {step === 'verify' && !isLoggedIn && (
                    <>
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-0.5">
                        <p className="text-sm font-medium text-stone-700">
                          {form.fullName}
                        </p>
                        <p className="text-xs text-stone-500">
                          {[
                            form.addressLine1,
                            form.city,
                            form.state,
                            form.pincode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <button
                          onClick={() => {
                            setStep('address');
                            setOtp('');
                            setOtpError(null);
                          }}
                          className="text-xs text-emerald-700 hover:underline mt-1 flex items-center gap-1"
                        >
                          <ChevronDown size={11} /> Edit address
                        </button>
                      </div>
                      <OtpPanel
                        phone={form.authPhone}
                        otp={otp}
                        onOtpChange={(v) => {
                          setOtp(v);
                          setOtpError(null);
                        }}
                        onVerify={handleVerifyOtp}
                        onResend={handleResendOtp}
                        onBack={() => {
                          setStep('address');
                          setOtp('');
                          setOtpError(null);
                        }}
                        verifying={verifyingOtp}
                        error={otpError}
                        countdown={countdown}
                      />
                    </>
                  )}

                  {/* Error */}
                  {orderError && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                      <AlertCircle
                        size={15}
                        className="text-rose-500 flex-shrink-0 mt-0.5"
                      />
                      <p className="text-sm text-rose-600">{orderError}</p>
                    </div>
                  )}

                  {/* CTAs */}
                  {step === 'address' && !isLoggedIn && (
                    <button
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99] transition-all disabled:opacity-60"
                    >
                      Continue — Get OTP <ArrowRight size={15} />
                    </button>
                  )}

                  {step === 'verify' && !isLoggedIn && (
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length < 6}
                      className={clsx(
                        'w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                        'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99]',
                        (verifyingOtp || otp.length < 6) &&
                          'opacity-50 cursor-not-allowed',
                      )}
                    >
                      {verifyingOtp ? (
                        <>
                          <Spinner /> Verifying &amp; placing order…
                        </>
                      ) : (
                        <>
                          Verify &amp; Pay {formatCurrency(displayTotal)}{' '}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  )}

                  {isLoggedIn && (
                    <button
                      onClick={handleAuthedCheckout}
                      disabled={loading || selectedItems.length === 0}
                      className={clsx(
                        'w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                        'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99]',
                        (loading || selectedItems.length === 0) &&
                          'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {loading ? (
                        <>
                          <Spinner /> Processing…
                        </>
                      ) : (
                        <>
                          Pay {formatCurrency(displayTotal)} securely{' '}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex items-center justify-center gap-6 pt-1">
                    <span className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Shield size={12} className="text-emerald-500" /> Secure
                      checkout
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Truck size={12} className="text-emerald-500" />
                      {shipping === 0
                        ? 'Free shipping'
                        : `₹${STORE?.shippingFlatRate ?? 99} shipping`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Order Summary (selected items only) ───────────── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/60">
                  <h2 className="font-semibold text-stone-800">
                    Order Summary
                    <span className="ml-2 text-xs font-normal text-stone-400">
                      ({selectedItems.length} item
                      {selectedItems.length !== 1 ? 's' : ''} selected)
                    </span>
                  </h2>
                </div>

                <div className="p-5">
                  {/* Selected items list */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {selectedItems.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-4">
                        No items selected
                      </p>
                    ) : (
                      selectedItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-start gap-3"
                        >
                          {item.product?.main_image && (
                            <Image
                              src={getTenantUrl(item.product.main_image)}
                              alt={item.product.name ?? ''}
                              width={48}
                              height={48}
                              className="rounded-lg object-cover border border-stone-100 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">
                              {item.product?.name}
                            </p>
                            <p className="text-xs text-stone-400">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-stone-800 flex-shrink-0">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ── Coupon ─────────────────────────────────────────── */}
                  <div className="mt-4 space-y-2">
                    {/* Input row */}
                    {!coupon.isApplied ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                          />
                          <input
                            type="text"
                            placeholder="Coupon code"
                            value={coupon.code}
                            onChange={(e) => coupon.setCode(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && coupon.handleApply()
                            }
                            disabled={coupon.isPending}
                            className="w-full border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-sm bg-white text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 disabled:bg-stone-50 uppercase tracking-wider"
                          />
                        </div>
                        <button
                          onClick={coupon.handleApply}
                          disabled={!coupon.code.trim() || coupon.isPending}
                          className="px-3 py-2 rounded-lg border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-all min-w-[64px] flex items-center justify-center"
                        >
                          {coupon.isPending ? (
                            <svg
                              className="animate-spin w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray="60"
                                strokeDashoffset="20"
                              />
                            </svg>
                          ) : (
                            'Apply'
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Applied state */
                      <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-emerald-600 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <div>
                            <p className="text-xs font-bold text-emerald-800 mono tracking-wider">
                              {coupon.result?.code}
                            </p>
                            <p className="text-[11px] text-emerald-600">
                              {coupon.message}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={coupon.handleRemove}
                          className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-100 transition-colors"
                          title="Remove coupon"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {coupon.isApplied && coupon.hasUserRestrictions && (
                      <p className="text-[11px] text-amber-600 flex items-center gap-1.5 px-1 mt-1">
                        <AlertTriangle size={11} className="flex-shrink-0" />
                        Final discount confirmed after login
                      </p>
                    )}

                    {/* Error */}
                    {coupon.error && !coupon.isApplied && (
                      <p className="text-[11.5px] text-rose-500 flex items-center gap-1.5 px-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        {coupon.error}
                      </p>
                    )}
                  </div>

                  {/* ── Totals ──────────────────────────────────────────── */}
                  <div className="mt-4 pt-4 border-t border-stone-100 space-y-2.5 text-sm">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(displaySubtotal)}</span>
                    </div>

                    {/* Discount line — only shown when coupon applied */}
                    {coupon.isApplied && displayDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Tag size={11} />
                          Discount ({coupon.result?.code})
                        </span>
                        <span>−{formatCurrency(displayDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-600">
                      <span>GST (18%)</span>
                      <span>{formatCurrency(displayTax)}</span>
                    </div>

                    <div className="flex justify-between text-stone-600">
                      <span>Shipping</span>
                      {displayShipping === 0 ? (
                        <span className="text-emerald-600 font-medium">
                          {coupon.freeShipping ? (
                            <span className="flex items-center gap-1">
                              Free <Tag size={10} />
                            </span>
                          ) : subtotal > 0 ? (
                            'Free 🎉'
                          ) : (
                            '—'
                          )}
                        </span>
                      ) : (
                        <span>{formatCurrency(displayShipping)}</span>
                      )}
                    </div>
                  </div>

                  {/* Grand total */}
                  <div className="mt-3 pt-3 border-t-2 border-stone-900 flex justify-between items-center">
                    <span className="font-bold text-stone-900">Total</span>
                    <div className="text-right">
                      {coupon.isApplied && displayDiscount > 0 && (
                        <p className="text-[11px] text-stone-400 line-through text-right">
                          {formatCurrency(total)}
                        </p>
                      )}
                      <span className="font-bold text-lg text-stone-900">
                        {formatCurrency(displayTotal)}
                      </span>
                      <p className="text-[10px] text-stone-400">
                        Incl. all taxes
                      </p>
                    </div>
                  </div>

                  {/* Free shipping progress */}
                  {selectedSummary &&
                    selectedSummary.freeShippingRemainingAmount > 0 &&
                    subtotal > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs text-amber-700 mb-1.5">
                          Add{' '}
                          <span className="font-bold">
                            {formatCurrency(
                              selectedSummary.freeShippingRemainingAmount,
                            )}
                          </span>{' '}
                          more for free shipping
                        </p>
                        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <Leaf size={12} /> Why shop with us?
                </p>
                <ul className="space-y-1.5 text-xs text-emerald-700">
                  {[
                    '100% authentic products',
                    'Secure Razorpay payment',
                    'Pan-India delivery',
                    `Support: ${STORE?.storeEmail ?? ''}`,
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 size={11} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
