# Production Multitenancy Guide

## Current Architecture

This repo currently uses a shared MongoDB cluster with database-per-tenant isolation:

- Platform data lives in the `adminos` database.
- Each tenant record stores a unique `dbName`.
- Tenant APIs resolve the tenant from `x-tenant-slug` or subdomain, then attach `req.db = connection.useDb(tenant.dbName)`.
- Tenant models must always be read through `getModel(req, ModelName, Schema)` so they use the resolved tenant database.

If you want a true single shared database model, every tenant-owned schema needs a required `tenantId`, compound indexes like `{ tenantId: 1, slug: 1 }`, and every query must include `tenantId`. Do not mix the two models in production.

## Apps And Ports

- API: `http://localhost:3000/api`
- Storefront: `http://localhost:3001`
- Tenant admin: `http://localhost:3002/[tenant]/dashboard`
- Platform admin: `http://localhost:3003/dashboard`

## Required Environment

API:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-strong-secret
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret
CORS_ORIGINS=https://admin.yourdomain.com,https://tenant.yourdomain.com,https://store.yourdomain.com
ENABLE_SWAGGER=false
SEED_SUPER_ADMIN=false
SAAS_RAZORPAY_KEY_ID=...
SAAS_RAZORPAY_KEY_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_SECRET=...
```

Frontends:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_API_DEBUG=false
```

For a single-store storefront deployed on its own domain, also set:

```env
NEXT_PUBLIC_TENANT_SLUG=your-store-slug
```

## Request Flow

1. Platform admin creates a tenant with `POST /api/tenants/register`.
2. Tenant middleware resolves the tenant from `x-tenant-slug` or subdomain.
3. Tenant admin login uses `POST /api/tenant/auth/login`.
4. Customer login uses `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`, and `POST /api/auth/complete-registration`.
5. Storefront catalog uses public tenant-scoped routes like `GET /api/catalog/products`.

The shared frontend API client now automatically sends `x-tenant-slug` from:

- explicit request headers,
- `NEXT_PUBLIC_TENANT_SLUG`,
- tenant dashboard paths like `/nike/dashboard`,
- subdomains like `nike.localhost`.

## Production Checklist

- Replace all secrets in `.env`; never use the local demo JWT or Razorpay values.
- Keep Swagger disabled in production unless you explicitly need it behind auth.
- Set `CORS_ORIGINS` to exact frontend origins.
- Run `npm run build --workspace=api`, `npm run build --workspace=admin`, `npm run build --workspace=tenant`, and `npm run build --workspace=user`.
- Add MongoDB indexes for high-volume collections per tenant database.
- Add rate limiting for auth, OTP, cart, and checkout routes.
- Move OTP from the hardcoded `123456` dev value to SMS/email delivery.
- Encrypt tenant Razorpay secrets before storing them.
- Add webhook verification for Razorpay order/payment lifecycle.
- Add automated e2e tests for tenant isolation: tenant A must never read tenant B data.

## Missing Backend Modules To Finish

The frontends already contain UI/hooks for several commerce areas that are not fully present in the API yet:

- `/subscriptions/*`
- customer wishlist routes
- customer address routes
- customer payment history routes
- public subscription plan detail routes

Build these as tenant-scoped modules using `getModel(req, ...)`, add them to `AppModule`, and verify each route from the corresponding hook in `apps/user/src/hooks/index.ts` and `apps/tenant/src/app/hooks/index.ts`.
