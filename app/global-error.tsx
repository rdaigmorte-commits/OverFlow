'use client';
import { useEffect } from 'react';

// Filet de dernier recours si le root layout lui-même plante — remplace tout
// le document, donc pas de dépendance à globals.css/Tailwind (styles inline).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#161320', color: '#EDE9F5' }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Something broke on our end</h1>
            <p style={{ marginTop: '0.75rem', color: '#A79CC0' }}>Sorry about that — try again, or head back home.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={reset}
              style={{ background: '#6E42C9', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ border: '1px solid #342C49', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#EDE9F5', textDecoration: 'none' }}
            >
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
