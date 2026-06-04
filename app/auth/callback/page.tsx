'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    // Supabase Auth lit automatiquement le token dans l'URL et établit la session.
    // On écoute l'événement SIGNED_IN pour savoir quand c'est prêt.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Si l'utilisateur a déjà un profileId (retour sur le site), on le renvoie sur /matches
        // Sinon, on l'envoie sur /onboarding pour compléter son profil
        const savedProfileId = typeof window !== 'undefined'
          ? localStorage.getItem('overflow_profile_id')
          : null;

        if (savedProfileId) {
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
  }, [router]);

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-white font-semibold text-xl mb-2">Link expired or invalid</h2>
          <p className="text-gray-400 text-sm mb-6">
            Magic links expire after 1 hour. Please request a new one.
          </p>
          <a
            href="/login"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg px-6 py-3 text-sm transition"
          >
            Back to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔗</div>
        <p className="text-gray-400 text-sm">Signing you in...</p>
      </div>
    </main>
  );
}
