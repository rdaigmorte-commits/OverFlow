'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Désabonnement en un clic du digest hebdo. Volontairement indépendant de la
// session/du claim_token — le token signé (HMAC) dans l'URL est la seule preuve
// requise, et son effet est borné : il ne peut mettre que weekly_digest_opt_in à
// false (voir unsubscribe_weekly_digest côté DB). Ne jamais réutiliser le
// claim_token ici (cf. US-SEC-14 #85).
function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    const pid = searchParams.get('pid');
    const token = searchParams.get('token');
    if (!pid || !token) {
      setStatus('error');
      return;
    }
    supabase.rpc('unsubscribe_weekly_digest', { p_profile_id: pid, p_token: token }).then(({ data, error }) => {
      setStatus(!error && data === true ? 'done' : 'error');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4 animate-pulse">✉️</div>
            <p className="text-muted text-sm">Unsubscribing…</p>
          </>
        )}
        {status === 'done' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-text font-semibold text-xl mb-2">You&apos;re unsubscribed</h2>
            <p className="text-muted text-sm mb-6">
              You won&apos;t get the weekly Strong Fit digest anymore. You can turn it back on anytime from your profile.
            </p>
            <a href="/matches" className="bg-accent hover:opacity-90 text-white font-semibold rounded-lg px-6 py-3 text-sm transition">
              Back to OverFlow
            </a>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-text font-semibold text-xl mb-2">This link didn&apos;t work</h2>
            <p className="text-muted text-sm mb-6">
              It may be malformed or already used. You can also manage this from your profile settings.
            </p>
            <a href="/profile/edit" className="bg-accent hover:opacity-90 text-white font-semibold rounded-lg px-6 py-3 text-sm transition">
              Go to profile settings
            </a>
          </>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeContent />
    </Suspense>
  );
}
