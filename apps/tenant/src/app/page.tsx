import Link from 'next/link';

const features = [
  ['Catalog operations', 'Create products, organize categories, upload media, and keep stock signals visible.'],
  ['Order management', 'Move orders from pending to delivered with customer and payment context nearby.'],
  ['Storefront branding', 'Tune colors, logo, banner, hero words, SEO, shipping, tax, and checkout behavior.'],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07070e] text-[#f0f0f8]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10">
        <nav className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a78bfa]">
              YourShop Merchant
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Tenant Panel</h1>
          </div>
          <Link
            href="/demo/login"
            className="rounded-lg border border-[#24243a] px-4 py-2 text-sm text-[#d0d0e0] transition hover:border-[#a78bfa] hover:text-[#a78bfa]"
          >
            Sign in
          </Link>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-[#24243a] px-3 py-1 text-xs text-[#9090b0]">
              Ecommerce workspace for store teams
            </p>
            <h2 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Manage products, orders, customers, offers, payments, and storefront identity.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#9090b0]">
              The tenant panel keeps daily commerce work focused: launch catalog updates,
              process orders, configure promotions, and shape the storefront from the same dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo/login"
                className="rounded-lg bg-[#a78bfa] px-5 py-3 text-sm font-semibold text-[#0a0a10] transition hover:brightness-110"
              >
                Open tenant login
              </Link>
              <Link
                href="/demo/dashboard"
                className="rounded-lg border border-[#24243a] px-5 py-3 text-sm font-semibold transition hover:border-[#a78bfa]"
              >
                Preview dashboard path
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#1a1a28] bg-[#0d0d18] p-5 shadow-2xl">
            <div className="mb-5 border-b border-[#1a1a28] pb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4b4b6b]">Store workflow</p>
              <p className="mt-1 text-2xl font-semibold">From setup to fulfillment</p>
            </div>
            <div className="space-y-4">
              {features.map(([title, body]) => (
                <div key={title} className="rounded-lg border border-[#1a1a28] bg-[#0a0a12] p-4">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#9090b0]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
