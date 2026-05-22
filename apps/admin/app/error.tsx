'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[var(--bg)] text-center px-6">
      <h2 className="text-3xl font-semibold text-[var(--danger)]">Something went wrong</h2>
      <p className="text-[var(--muted)] max-w-md">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[var(--primary)] text-black rounded-xl font-medium hover:brightness-110 transition"
      >
        Try again
      </button>
    </div>
  );
}