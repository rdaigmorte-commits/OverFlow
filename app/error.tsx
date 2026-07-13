'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-5xl">⚠️</div>
      <div>
        <h1 className="text-3xl font-black">Something broke on our end</h1>
        <p className="mt-3 text-muted">Sorry about that — try again, or head back home.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary-new px-6 py-3 text-sm">
          Try again
        </button>
        <a href="/" className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text hover:bg-panel2 transition">
          Back to home
        </a>
      </div>
    </main>
  );
}
