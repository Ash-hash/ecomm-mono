// ─── user.schema.ts ───────────────────────────────────────────────────────────
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;
export type UserRole = 'customer' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'banned' | 'suspended';
export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type AddressLabel = 'home' | 'work' | 'other';

// ── Address sub-document ──────────────────────────────────────────────────────
@Schema({ _id: true, timestamps: false })
export class Address {
  /** Stable reference id — exposed to frontend as the "addressId" */
  _id: Types.ObjectId;

  @Prop({ enum: ['home', 'work', 'other'], default: 'home' })
  label: AddressLabel;

  @Prop({ required: true, trim: true })
  fullName: string;

  /** E.164 or plain 10-digit Indian mobile */
  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  addressLine1: string;

  @Prop({ trim: true, default: '' })
  addressLine2: string;

  @Prop({ trim: true, default: '' })
  landmark: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  /** 6-digit India PIN — store as string to preserve leading zeros if ever needed */
  @Prop({ required: true, match: /^\d{6}$/, trim: true })
  pincode: string;

  @Prop({ default: 'India', trim: true })
  country: string;

  @Prop({ type: Number, default: null })
  lat: number | null;

  @Prop({ type: Number, default: null })
  lng: number | null;

  // Optional: 2dsphere index for geo queries later
  // Add on UserSchema after SchemaFactory:
  // UserSchema.index({ 'addresses.loc': '2dsphere' });
  // (only needed if you query by proximity)

  @Prop({ default: false })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

// ── User ──────────────────────────────────────────────────────────────────────
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class User {
  @Prop({ trim: true }) name: string;
  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  email?: string;
  @Prop({ type: String, select: false }) otp: string | null;
  @Prop({ type: Date, select: false }) otpExpires: Date | null;
  @Prop({ required: false, select: false }) passwordHash: string;
  @Prop({ select: false }) refreshToken: string;
  @Prop() phone: string;
  @Prop({ enum: ['customer', 'admin', 'super_admin'], default: 'customer' })
  role: UserRole;
  @Prop({ enum: ['active', 'banned', 'suspended'], default: 'active' })
  status: UserStatus;
  @Prop({ enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' })
  plan: UserPlan;
  @Prop({ default: false }) emailVerified: boolean;
  @Prop() avatarUrl: string;
  @Prop() lastOrderAt: Date;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  wishlist: Types.ObjectId[];

  /** ✅ New — saved delivery addresses */
  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ phone: 1 } , { unique: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ plan: 1 });
UserSchema.index({ createdAt: -1 });
