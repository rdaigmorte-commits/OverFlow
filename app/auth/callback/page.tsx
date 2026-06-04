'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const { profile } = useOverflowStore();

  useEffect(() => {
    // Supabase Auth lit automatiquement le token dans l'URL et établit la session.
    // On écoute l'événement SIGNED_IN pour savoir quand c'est prêt.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // On utilise le store Zustand (plus fiable que localStorage en SSR/iframe).
        // Si le store a un profileId, l'utilisateur a déjà un profil → /matches
        // Sinon → /onboarding pour compléter son profil
        const hasProfile = Boolean(profile?.profileId);

        if (hasProfile) {
          router.replace('/matches');
        } else {
          router.replace('/onboarding');
        }
      }
    });

    // Timeout de sécurité : si rien ne se passe après 8s, on affiche une erreur
    const timeout = setTimeout(() => {
      setStatus('error');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-text font-semibold text-xl mb-2">Link expired or invalid</h2>
          <p className="text-muted text-sm mb-6">
            Magic links expire after 1 hour. Please request a new one.
          </p>
          <a
            href="/login"
            className="bg-accent hover:opacity-90 text-black font-semibold rounded-lg px-6 py-3 text-sm transition"
          >
            Back to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔗</div>
        <p className="text-muted text-sm">Signing you in...</p>
      </div>
    </main>
  );
}
