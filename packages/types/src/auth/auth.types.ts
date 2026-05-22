// auth.types.ts
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  avatarUrl?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AdminUser {
  id:        string;
  name:      string;
  email:     string;
  role:      'admin' | 'super_admin';
}

/** Shape returned inside `data.user` for customer (verify-otp / complete-registration) */
export interface CustomerUser {
  id:    string;
  name:  string;
  phone: string;
  email?: string;
  role:  'customer';
}