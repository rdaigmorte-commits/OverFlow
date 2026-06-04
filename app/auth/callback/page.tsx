'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const { profile, setProfile } = useOverflowStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;

        // — Fix #35 : lier le profil anonyme au compte auth fraîchement créé —
        // Si un profil existe avec cet email mais sans user_id (créé avant la connexion),
        // on met à jour son user_id pour activer les politiques RLS UPDATE.
        if (user.email) {
          await supabase
            .from('profiles')
            .update({ user_id: user.id })
            .eq('email', user.email)
            .is('user_id', null); // seulement les profils non encore liés
        }

        // Redirection selon qu'un profil existe déjà dans le store
        const hasProfile = Boolean(profile?.profileId);
        if (hasProfile) {
          // Mettre à jour le profileId dans le store si besoin
          // (cas où l'utilisateur avait un profil anonyme avant de se connecter)
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email ?? '')
            .single();
          if (data?.id && data.id !== profile.profileId) {
            setProfile({ profileId: data.id });
          }
          router.replace('/matches');
        } else {
          router.replace('/onboarding');
        }
      }
    });

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
