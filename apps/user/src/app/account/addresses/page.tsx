/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import clsx from 'clsx';
import {
  Plus, Edit2, Trash2, Star, MapPin, Phone,
  CheckCircle2, X, AlertCircle, Home, Briefcase, MoreHorizontal,
} from 'lucide-react';
import {
  useAddresses, useAddAddress, useUpdateAddress,
  useDeleteAddress, useSetDefaultAddress,
} from '@/src/hooks';
import type { Address, AddressCreateDto, AddressUpdateDto } from '@repo/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const LABEL_META = {
  home:  { icon: Home,          color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  work:  { icon: Briefcase,     color: 'bg-blue-50 text-blue-700 border-blue-200'          },
  other: { icon: MoreHorizontal, color: 'bg-stone-50 text-stone-600 border-stone-200'       },
} as const;

interface FormState {
  label: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY: FormState = {
  label: 'home', fullName: '', phone: '',
  addressLine1: '', addressLine2: '', landmark: '',
  city: '', state: '', pincode: '', country: 'India', isDefault: false,
};

function addressToForm(a: Address): FormState {
  return {
    label:        a.label        ?? 'home',
    fullName:     a.fullName     ?? '',
    phone:        a.phone        ?? '',
    addressLine1: a.addressLine1 ?? '',
    addressLine2: a.addressLine2 ?? '',
    landmark:     a.landmark     ?? '',
    city:         a.city         ?? '',
    state:        a.state        ?? '',
    pincode:      a.pincode      ?? '',
    country:      a.country      ?? 'India',
    isDefault:    a.isDefault    ?? false,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) => clsx(
  'w-full border rounded-lg px-3.5 py-2.5 text-sm bg-[var(--surface)] text-[var(--text-strong)] outline-none transition-all',
  'placeholder:text-[var(--text-muted)] focus:ring-2',
  err
    ? 'border-rose-300 focus:ring-rose-100'
    : 'border-[var(--border)] focus:border-emerald-500 focus:ring-emerald-100/60',
);

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-14 bg-[var(--bg-3)] rounded-full" />
      </div>
      <div className="h-4 w-36 bg-[var(--bg-3)] rounded" />
      <div className="h-3 w-full bg-[var(--bg-3)] rounded" />
      <div className="h-3 w-2/3 bg-[var(--bg-3)] rounded" />
    </div>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────

function AddressCard({ addr, onEdit, onDelete, onSetDefault, settingDefault, deletingId }: {
  addr: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  settingDefault: boolean;
  deletingId: string | null;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = LABEL_META[addr.label ?? 'home'];
  const LabelIcon = meta.icon;
  const isDeleting = deletingId === addr._id;

  return (
    <div className={clsx(
      'card p-5 flex flex-col gap-4 transition-all',
      addr.isDefault && 'ring-2 ring-emerald-500 ring-offset-1',
      isDeleting && 'opacity-50 pointer-events-none',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            'flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full border',
            meta.color,
          )}>
            <LabelIcon size={10} />
            {addr.label}
          </span>
          {addr.isDefault && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-stone-900 text-white">
              <Star size={9} className="fill-white" /> Default
            </span>
          )}
        </div>
      </div>

      {/* Address body */}
      <div>
        <p className="font-semibold text-[var(--text-strong)] mb-1">{addr.fullName}</p>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {addr.addressLine1}
          {addr.addressLine2 && `, ${addr.addressLine2}`}
          {addr.landmark && <span className="text-[var(--text-muted)]"> · Near {addr.landmark}</span>}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {addr.city}, {addr.state} — {addr.pincode}
        </p>
        <p className="text-sm text-[var(--text-muted)]">{addr.country}</p>
        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1.5">
          <Phone size={11} /> {addr.phone}
        </p>
      </div>

      {/* Actions */}
      {!confirmDelete ? (
        <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
          {!addr.isDefault && (
            <button
              onClick={onSetDefault}
              disabled={settingDefault}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-emerald-700 transition-colors disabled:opacity-40 px-2 py-1.5 rounded-lg hover:bg-emerald-50"
            >
              <Star size={12} />
              {settingDefault ? 'Saving…' : 'Set Default'}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors px-2 py-1.5 rounded-lg hover:bg-[var(--bg-2)]"
          >
            <Edit2 size={12} /> Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-rose-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-rose-50"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1 border-t border-rose-100 bg-rose-50/50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
          <p className="text-xs text-rose-700 flex-1">Remove this address?</p>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-strong)] px-2 py-1 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => { setConfirmDelete(false); onDelete(); }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-100"
          >
            Yes, remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Address Form Panel (slide-in) ────────────────────────────────────────────

function AddressFormPanel({ open, onClose, initialData, onSubmit, submitting, title }: {
  open: boolean;
  onClose: () => void;
  initialData: FormState;
  onSubmit: (data: FormState) => void;
  submitting: boolean;
  title: string;
}) {
  const [form, setFormState] = useState<FormState>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Sync when initialData changes (edit mode)
  useState(() => { setFormState(initialData); });

  function setField(key: keyof FormState, value: any) {
    setFormState((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim())        errs.fullName     = 'Required';
    if (!/^\d{10}$/.test(form.phone)) errs.phone        = 'Valid 10-digit number required';
    if (!form.addressLine1.trim())    errs.addressLine1 = 'Required';
    if (!form.city.trim())            errs.city         = 'Required';
    if (!form.state)                  errs.state        = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode     = '6-digit PIN required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (validate()) onSubmit(form);
  }

  // Re-sync form when panel is opened with new initialData
  const prevOpen = open;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={clsx(
        'fixed top-0 right-0 h-full w-full max-w-md bg-[var(--surface)] z-50 shadow-2xl',
        'flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-base font-semibold text-[var(--text-strong)] flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-2)] text-[var(--text-muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Label selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
              Address type
            </label>
            <div className="flex gap-2">
              {(['home', 'work', 'other'] as const).map((l) => {
                const m = LABEL_META[l];
                const Icon = m.icon;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setField('label', l)}
                    className={clsx(
                      'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border capitalize transition-all',
                      form.label === l
                        ? m.color
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
                    )}
                  >
                    <Icon size={12} /> {l}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.fullName}>
              <input
                type="text" placeholder="Recipient's name"
                value={form.fullName} onChange={(e) => setField('fullName', e.target.value)}
                className={inputCls(errors.fullName)}
              />
            </Field>
            <Field label="Phone" required error={errors.phone}>
              <input
                type="tel" inputMode="numeric" placeholder="10-digit"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={inputCls(errors.phone)} maxLength={10}
              />
            </Field>
          </div>

          <Field label="Address Line 1" required error={errors.addressLine1}>
            <input
              type="text" placeholder="House / Flat No., Building, Street"
              value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)}
              className={inputCls(errors.addressLine1)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Address Line 2" error={errors.addressLine2}>
              <input
                type="text" placeholder="Area, Colony (optional)"
                value={form.addressLine2} onChange={(e) => setField('addressLine2', e.target.value)}
                className={inputCls()}
              />
            </Field>
            <Field label="Landmark" error={errors.landmark}>
              <input
                type="text" placeholder="Near… (optional)"
                value={form.landmark} onChange={(e) => setField('landmark', e.target.value)}
                className={inputCls()}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City" required error={errors.city}>
              <input
                type="text" placeholder="City"
                value={form.city} onChange={(e) => setField('city', e.target.value)}
                className={inputCls(errors.city)}
              />
            </Field>
            <Field label="PIN Code" required error={errors.pincode}>
              <input
                type="text" inputMode="numeric" placeholder="6 digits"
                value={form.pincode}
                onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={inputCls(errors.pincode)} maxLength={6}
              />
            </Field>
          </div>

          <Field label="State" required error={errors.state}>
            <select
              value={form.state} onChange={(e) => setField('state', e.target.value)}
              className={clsx(inputCls(errors.state), 'cursor-pointer')}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          {/* Set as default */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setField('isDefault', !form.isDefault)}
              className={clsx(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                form.isDefault
                  ? 'bg-emerald-600 border-emerald-600'
                  : 'border-[var(--border)] group-hover:border-[var(--border-strong)]',
              )}
            >
              {form.isDefault && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className="text-sm text-[var(--text-soft)]">Set as default address</span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting
              ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
                </svg> Saving…</>
              : <><CheckCircle2 size={15} /> Save Address</>
            }
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useAddresses();
  const addAddress     = useAddAddress();
  const updateAddress  = useUpdateAddress();
  const deleteAddress  = useDeleteAddress();
  const setDefault     = useSetDefaultAddress();

  const [panelOpen,    setPanelOpen]    = useState(false);
  const [editingAddr,  setEditingAddr]  = useState<Address | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openAdd() {
    setEditingAddr(null);
    setPanelOpen(true);
  }

  function openEdit(addr: Address) {
    setEditingAddr(addr);
    setPanelOpen(true);
  }

  async function handleSubmit(form: FormState) {
    const dto: AddressCreateDto = {
      label:        form.label,
      fullName:     form.fullName,
      phone:        form.phone,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      landmark:     form.landmark     || undefined,
      city:         form.city,
      state:        form.state,
      pincode:      form.pincode,
      country:      form.country || 'India',
      isDefault:    form.isDefault,
    };

    try {
      if (editingAddr) {
        await updateAddress.mutateAsync({ id: editingAddr._id, dto: dto as AddressUpdateDto });
        showToast('Address updated successfully');
      } else {
        await addAddress.mutateAsync(dto);
        showToast('Address added successfully');
      }
      setPanelOpen(false);
      setEditingAddr(null);
    } catch (err: any) {
      showToast(err?.message ?? 'Something went wrong', 'error');
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAddress.mutateAsync(id);
      showToast('Address removed');
    } catch {
      showToast('Failed to remove address', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    setSettingDefaultId(id);
    try {
      await setDefault.mutateAsync(id);
      showToast('Default address updated');
    } catch {
      showToast('Failed to update default', 'error');
    } finally {
      setSettingDefaultId(null);
    }
  }

  const submitting = addAddress.isPending || updateAddress.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="serif text-xl text-[var(--text-strong)]">Delivery Addresses</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage your saved shipping addresses
          </p>
        </div>
        {addresses.length < 10 && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors"
          >
            <Plus size={15} /> Add Address
          </button>
        )}
      </div>

      {/* Address limit warning */}
      {addresses.length >= 10 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          Maximum of 10 addresses reached. Remove one to add a new address.
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && addresses.length === 0 && (
        <div className="card py-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
            <MapPin size={28} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-strong)] mb-1">No addresses saved yet</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-xs">
              Add a delivery address to speed up your checkout experience
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors"
          >
            <Plus size={15} /> Add Your First Address
          </button>
        </div>
      )}

      {/* Address grid */}
      {!isLoading && addresses.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              addr={addr}
              onEdit={() => openEdit(addr)}
              onDelete={() => handleDelete(addr._id)}
              onSetDefault={() => handleSetDefault(addr._id)}
              settingDefault={settingDefaultId === addr._id}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      {/* Slide panel */}
      <AddressFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditingAddr(null); }}
        initialData={editingAddr ? addressToForm(editingAddr) : EMPTY}
        onSubmit={handleSubmit}
        submitting={submitting}
        title={editingAddr ? 'Edit Address' : 'Add New Address'}
      />

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium',
          'transition-all animate-in slide-in-from-bottom-2',
          toast.type === 'success'
            ? 'bg-emerald-700 text-white'
            : 'bg-rose-600 text-white',
        )}>
          {toast.type === 'success'
            ? <CheckCircle2 size={15} />
            : <AlertCircle size={15} />
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}