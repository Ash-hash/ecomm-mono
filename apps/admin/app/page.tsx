import Link from 'next/link';

const metrics = [
  ['Tenant lifecycle', 'Provision stores, review status, and keep operators accountable from one place.'],
  ['Commerce visibility', 'Track orders, subscriptions, revenue signals, and operational health across tenants.'],
  ['Platform controls', 'Centralize onboarding, credentials, and admin access without touching tenant storefronts.'],
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10">
        <nav className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
              YourShop Platform
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Super Admin</h1>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            Sign in
          </Link>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
              Multi-tenant ecommerce control plane
            </p>
            <h2 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Run every store, tenant, and commerce workflow with platform-grade oversight.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
              YourShop gives platform teams a single operating layer for tenant onboarding,
              store governance, subscription tracking, and ecommerce health monitoring.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Open Super Admin
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--primary)]"
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Network</p>
                <p className="mt-1 text-2xl font-semibold text-white">Commerce OS</p>
              </div>
              <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                Live ready
              </span>
            </div>
            <div className="space-y-4">
              {metrics.map(([title, body]) => (
                <div key={title} className="rounded-lg border border-[var(--border)] bg-black/20 p-4">
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
