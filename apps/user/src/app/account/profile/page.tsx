/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useCustomerProfile, useUpdateProfile } from '@/src/hooks';
import { formatDate } from '@/src/lib/utils';
import clsx from 'clsx';

import {
  Camera,
  Check,
  AlertCircle,
  User,
  ShieldCheck,
} from 'lucide-react';

/* ───────────────────────── FIELD ───────────────────────── */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  readOnly,
  placeholder,
  hint,
}: any) {
  return (
    <div className="flex flex-col gap-1.5">

      <label className="text-[11px] uppercase tracking-wide font-semibold text-[var(--text-muted)]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={clsx(
          'px-4 py-2.5 rounded-xl text-[14px] transition-all',
          'border outline-none',
          'bg-[var(--surface)]',
          'border-[var(--border)]',
          'focus:border-[var(--primary)]',
          'focus:ring-2 focus:ring-[var(--primary-soft)]',

          readOnly && 'opacity-60 cursor-not-allowed'
        )}
      />

      {hint && (
        <p className="text-[11px] text-[var(--text-muted)]">
          {hint}
        </p>
      )}

    </div>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function ProfilePage() {

  const { data: profile, isLoading } = useCustomerProfile();
  const update = useUpdateProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setName(profile.name ?? '');
    setEmail(profile.email ?? '');
    setAvatarUrl(profile.avatarUrl ?? '');
    setDirty(false);

  }, [profile]);

  function handleChange(setter: any) {
    return (v: string) => {
      setter(v);
      setDirty(true);
    };
  }

  function saveProfile() {

    const payload: any = {};

    if (name !== profile?.name) payload.name = name;
    if (email !== profile?.email) payload.email = email;
    if (avatarUrl !== profile?.avatarUrl) payload.avatarUrl = avatarUrl;

    update.mutate(payload, {
      onSuccess: () => setDirty(false),
    });
  }

  const initials =
    profile?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?';

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        {[1,2,3].map(i => (
          <div key={i} className="h-32 rounded-xl bg-[var(--bg-3)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="serif text-2xl">
          Profile Settings
        </h1>

        <p className="text-sm text-[var(--text-muted)]">
          Manage your personal information
        </p>
      </div>

      {/* PROFILE CARD */}

      <div className="card p-6">

        <div className="flex items-center gap-6">

          {/* Avatar */}

          <div className="relative">

            <div className="w-20 h-20 rounded-full bg-[var(--primary-soft)] flex items-center justify-center overflow-hidden">

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-[var(--primary)]">
                  {initials}
                </span>
              )}

            </div>

            <button
              className="
              absolute
              bottom-0 right-0
              w-7 h-7
              rounded-full
              flex items-center justify-center
              bg-[var(--primary)]
              text-white
              shadow
              "
            >
              <Camera size={12} />
            </button>

          </div>

          {/* Avatar URL */}

          <div className="flex-1">

            <Field
              label="Avatar URL"
              value={avatarUrl}
              onChange={handleChange(setAvatarUrl)}
              placeholder="https://example.com/avatar.jpg"
            />

          </div>

        </div>

      </div>

      {/* PERSONAL INFO */}

      <div className="card p-6 space-y-5">

        <h2 className="text-sm font-semibold text-[var(--text-strong)]">
          Personal Information
        </h2>

        <div className="grid sm:grid-cols-2 gap-5">

          <Field
            label="Full Name"
            value={name}
            onChange={handleChange(setName)}
          />

          <Field
            label="Phone"
            value={profile?.phone ?? ''}
            readOnly
            hint="Phone number cannot be changed"
          />

          <Field
            label="Email"
            value={email}
            onChange={handleChange(setEmail)}
            type="email"
          />

          <Field
            label="Account Role"
            value={profile?.role ?? ''}
            readOnly
          />

        </div>

        {/* Save bar */}

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">

          <button
            onClick={saveProfile}
            disabled={!dirty || update.isPending}
            className={clsx(
              'btn-primary flex items-center gap-2',

              (!dirty || update.isPending) &&
              'opacity-50 cursor-not-allowed'
            )}
          >
            {update.isPending && (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}

            Save Changes

          </button>

          {update.isSuccess && !dirty && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check size={14} />
              Saved
            </span>
          )}

          {update.isError && (
            <span className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle size={14} />
              {(update.error as Error)?.message ?? 'Failed'}
            </span>
          )}

        </div>

      </div>

      {/* ACCOUNT INFO */}

      <div className="card p-6">

        <h2 className="text-sm font-semibold mb-4">
          Account Details
        </h2>

        <div className="grid sm:grid-cols-2 gap-y-3">

          <Row
            label="Member Since"
            value={formatDate(profile?.createdAt ?? '03/13/2026')}
          />

          <Row
            label="Plan"
            value={profile?.plan ?? 'Free'}
          />

          <Row
            label="Account Status"
            value={profile?.status ?? 'Active'}
          />

          <Row
            label="Email Verified"
            value={profile?.emailVerified ? 'Yes' : 'No'}
          />

          <Row
            label="Total Orders"
            value={profile?.totalOrders ?? 0}
          />

          <Row
            label="Total Spent"
            value={`₹${profile?.totalSpent ?? 0}`}
          />

        </div>

      </div>

      {/* SECURITY */}

      <div className="card p-6">

        <div className="flex items-center gap-3 mb-4">

          <ShieldCheck size={18} className="text-[var(--primary)]" />

          <h2 className="text-sm font-semibold">
            Security
          </h2>

        </div>

        <p className="text-sm text-[var(--text-muted)] mb-3">
          Your account is secured with OTP login verification.
        </p>

      </div>

    </div>
  );
}

/* ───────────────────────── ROW ───────────────────────── */

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">

      <span className="text-[var(--text-muted)]">
        {label}
      </span>

      <span className="font-medium">
        {value ?? '—'}
      </span>

    </div>
  );
}