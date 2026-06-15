'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const { profile, setProfile } = useOverflowStore();
  const handledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleSession(userId: string, userEmail: string | undefined) {
    if (handledRef.current) return;
    handledRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const hasProfile = Boolean(profile?.profileId);

    if (hasProfile) {
      // Cas "Add email" : profil déjà en localStorage, on lie l'email + user_id
      if (userEmail) {
        await supabase
          .from('profiles')
          .update({ email: userEmail, user_id: userId })
          .eq('id', profile.profileId);
        setProfile({ ...profile, email: userEmail });
      }

      // Si un autre profil existait déjà avec cet email, on bascule dessus
      if (userEmail) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single();
        if (data?.id && data.id !== profile.profileId) {
          setProfile({ profileId: data.id });
        }
      }

      router.replace('/matches');
    } else {
      // Cas reconnexion : localStorage vide (nouvel onglet / autre appareil)
      // On cherche le profil en base par email pour le restaurer dans le store
      if (userEmail) {
        // 1. Lier le user_id Auth au profil existant
        await supabase
          .from('profiles')
          .update({ user_id: userId })
          .eq('email', userEmail)
          .is('user_id', null);

        // 2. Récupérer le profil complet depuis Supabase
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (existingProfile) {
          // 3. Recharger le store avec les données récupérées → localStorage se remplit automatiquement
          setProfile({
            profileId:    existingProfile.id,
            name:         existingProfile.name ?? '',
            age:          existingProfile.age ?? '',
            city:         existingProfile.city ?? '',
            language:     Array.isArray(existingProfile.language) ? existingProfile.language : [],
            platform:     Array.isArray(existingProfile.platform) ? existingProfile.platform : [],
            games:        Array.isArray(existingProfile.games) ? existingProfile.games : [],
            style:        Array.isArray(existingProfile.style) ? existingProfile.style : [],
            availability: Array.isArray(existingProfile.availability) ? existingProfile.availability : [],
            openIRL:      existingProfile.open_irl ?? false,
            consent:      existingProfile.consent ?? false,
            email:        existingProfile.email ?? '',
            discord:      existingProfile.discord ?? '',
          });
          router.replace('/matches');
          return;
        }
      }

      // Aucun profil trouvé pour cet email → vraiment nouvel utilisateur
      router.replace('/onboarding');
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSession(session.user.id, session.user.email ?? undefined);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSession(session.user.id, session.user.email ?? undefined);
      }
    });

    timeoutRef.current = setTimeout(() => setStatus('error'), 60_000);

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-text font-semibold text-xl mb-2">Link expired or invalid</h2>
          <p className="text-muted text-sm mb-6">
            Magic links expire after 1 hour. Please request a new one.
          </p>
          <a href="/login" className="bg-accent hover:opacity-90 text-black font-semibold rounded-lg px-6 py-3 text-sm transition">
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
