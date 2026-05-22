'use client';

export default function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />

          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--primary)]" />
        </div>

        {/* Branding */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text)]">
            AdminOS
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Loading dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}