# SaasOS — Multi-Tenant Upgrade Guide

## What's in this package

```
saas-upgrade/
├── backend/
│   ├── tenant/
│   │   ├── tenant.schema.ts       ← Mongoose schema for all tenant data
│   │   ├── tenant.service.ts      ← Full business logic (registration, payment, CRUD)
│   │   ├── tenant.controller.ts   ← All HTTP routes
│   │   ├── tenant.module.ts       ← NestJS module
│   │   └── dto/tenant.dto.ts      ← All DTOs
│   ├── super-admin/
│   │   ├── super-admin-auth.service.ts  ← Platform-level auth
│   │   ├── super-admin.controller.ts
│   │   └── super-admin.module.ts
│   ├── auth/
│   │   ├── auth.service.fixed.ts  ← DROP-IN replacement fixing auto-logout
│   │   └── fetcher.fixed.ts       ← Frontend fetcher with proper refresh
│   └── common/
│       └── jwt-auth.guard.fixed.ts ← Reads both sa_ and regular cookies
└── frontend/
    └── super-admin/
        └── index.html             ← Complete super-admin panel (standalone)
```

---

## 1. Backend Integration

### Step 1 — Add env variables
```env
# Your platform Razorpay keys (NOT tenant's keys)
SAAS_RAZORPAY_KEY_ID=rzp_live_xxx
SAAS_RAZORPAY_KEY_SECRET=xxx

# Existing vars (make sure these are set)
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Step 2 — Copy files into your NestJS app
```
apps/api/src/tenant/                ← copy entire tenant/ folder
apps/api/src/super-admin/           ← copy entire super-admin/ folder
```

### Step 3 — Replace fixed files
```bash
# Replace auth service (fixes cookie path + refresh loop)
cp backend/auth/auth.service.fixed.ts apps/api/src/auth/auth.service.ts

# Replace JWT guard (reads both sa_ and regular cookies)
cp backend/common/jwt-auth.guard.fixed.ts apps/api/src/common/guards/jwt-auth.guard.ts

# Replace frontend fetcher (proper auto-refresh + redirect)
cp backend/auth/fetcher.fixed.ts packages/api-client/src/core/fetcher.ts
```

### Step 4 — Register modules in app.module.ts
```typescript
// apps/api/src/app.module.ts
import { TenantModule }      from './tenant/tenant.module';
import { SuperAdminModule }  from './super-admin/super-admin.module';

@Module({
  imports: [
    // ... existing imports ...
    TenantModule,
    SuperAdminModule,
  ],
})
export class AppModule {}
```

### Step 5 — Seed platform super-admin in main.ts
```typescript
// apps/api/src/main.ts
import { SuperAdminAuthService } from './super-admin/super-admin-auth.service';

// After app.get(AuthService) line, add:
const superAdminAuthService = app.get(SuperAdminAuthService);
await superAdminAuthService.seedSuperAdmin();
```

### Step 6 — Install Razorpay (if not already)
```bash
pnpm add razorpay @types/razorpay --filter api
```

---

## 2. Multi-Tenant Architecture

### How it works
Each tenant gets their **own isolated MongoDB database**:
```
Platform DB (adminos):
  └── tenants collection  ← all tenant metadata, billing, slugs

Tenant DB (tenant_acmestore_abc123):
  ├── users               ← their customers + admin users
  ├── products
  ├── categories
  ├── orders
  ├── carts
  ├── offers
  └── storeconfig
```

### Routing per tenant
Tenants identify themselves via subdomain (`acme.yoursaas.com`) OR
by passing their `slug` in the login route (`POST /api/tenants/acme/login`).

The JWT payload for tenant users includes `{ tenantId, slug, dbName, role }`
so every request knows which database to use.

### Connecting to tenant DB in services
```typescript
// In any service that needs tenant DB access:
@Injectable()
export class SomeService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async doSomething(dbName: string) {
    const tenantConn = this.connection.useDb(dbName, { useCache: true });
    const ProductModel = tenantConn.model('Product', ProductSchema);
    return ProductModel.find({});
  }
}
```

---

## 3. Auth Fix — Why users were getting logged out

**Root causes found:**

1. `setAuthCookies()` was setting `path: '/'` only on access_token, NOT refresh_token
   → Refresh token wasn't being sent on refresh requests → 401 → logout
   
2. `refresh()` in `auth.controller.ts` was reading `req.cookies.refresh_token`
   but the guard was looking for `req.cookies.access_token` after expiry
   → The retry after refresh was failing silently

3. The frontend `fetcher.ts` was calling a non-existent `refreshToken()` import
   → Import error caused all retries to fail immediately

**All three are fixed in the replacement files.**

---

## 4. Super-Admin Panel

Open `frontend/super-admin/index.html` in a browser (or host it).

Set your API URL before loading:
```html
<script>window.SA_API_URL = 'https://api.yoursaas.com/api'</script>
```

**Default credentials:** `platform@yoursaas.com` / `SuperAdmin@123`

### Features
- Dashboard with MRR, ARR, plan distribution, health metrics
- Tenant management (list, search, filter by plan/status)
- Tenant detail with live metrics from their DB
- Plan override (admin-free subscription change)
- Suspend / reactivate stores
- Register new tenants manually
- Hard-delete (drops tenant database permanently)
- Billing overview

---

## 5. Tenant Registration Flow (public)

```
1. POST /api/tenants/register
   { storeName, slug, ownerName, ownerEmail, ownerPhone, password, plan }

2. Backend:
   - Validates slug uniqueness
   - Creates Tenant document in platform DB
   - Provisions new MongoDB database (dbName: tenant_slug_xxxx)
   - Seeds admin user in tenant DB
   - Seeds default StoreConfig in tenant DB
   - Issues JWT with tenantId + dbName
   - Sets httpOnly cookies
   - Returns { tenant, adminPanelUrl }

3. Tenant logs into their admin panel at /dashboard
   - Uses POST /api/tenants/:slug/login
   - Gets JWT with tenantId baked in

4. Tenant pays for subscription:
   - POST /api/tenants/me/payment/initiate → gets Razorpay order
   - Frontend opens Razorpay modal
   - POST /api/tenants/me/payment/verify → plan activated

5. Tenant connects their own Razorpay:
   - POST /api/tenants/me/razorpay
   - Credentials verified via live API call
   - Stored in tenant document
```

---

## 6. Plans & Pricing

Edit `TENANT_PLANS` in `tenant.schema.ts`:

| Plan       | Monthly | Annual | One-time | Products | Admins |
|------------|---------|--------|----------|----------|--------|
| Starter    | ₹999    | ₹9,990 | ₹4,999   | 50       | 1      |
| Growth     | ₹2,499  | ₹24,990| ₹12,999  | 500      | 3      |
| Pro        | ₹4,999  | ₹49,990| ₹24,999  | 2,000    | 10     |
| Enterprise | ₹9,999  | ₹99,990| ₹49,999  | ∞        | ∞      |
