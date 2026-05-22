export type AddressLabel = 'home' | 'work' | 'other';

export interface Address {
  _id: string;

  label?: AddressLabel;

  fullName: string;
  phone: string;

  addressLine1: string;
  addressLine2?: string;
  landmark?: string;

  city: string;
  state: string;
  pincode: string;
  country?: string;

  lat?: number | null;
  lng?: number | null;

  isDefault?: boolean;
}

export interface AddressCreateDto {
  label?: AddressLabel;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  landmark?: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

export type AddressUpdateDto = Partial<AddressCreateDto>;

export interface ShippingAddress {
  _id: string;
  label?: AddressLabel;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
}
