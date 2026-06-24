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
      if (userEmail && profile.profileId) {
        // Liaison par ID de profil via SECURITY DEFINER — pas de dépendance sur
        // profile.email (retiré de l'onboarding par SEC-02).
        const { data: rows } = await supabase.rpc('link_profile_to_auth', {
          profile_id: profile.profileId,
        });
        const linked = rows?.[0];
        if (linked) {
          setProfile({
            profileId:    linked.id,
            name:         linked.name ?? '',
            age:          linked.age ?? '',
            city:         linked.city ?? '',
            language:     Array.isArray(linked.language)     ? linked.language     : [],
            platform:     Array.isArray(linked.platform)     ? linked.platform     : [],
            games:        Array.isArray(linked.games)        ? linked.games        : [],
            style:        Array.isArray(linked.style)        ? linked.style        : [],
            availability: Array.isArray(linked.availability) ? linked.availability : [],
            openIRL:      linked.open_irl ?? false,
            consent:      linked.consent  ?? false,
            email:        userEmail,
            discord:      '',
          });
        }

        // Vérifier si un autre profil appartient déjà à ce compte (cas "Switch profile")
        const { data: ownId } = await supabase.rpc('get_own_profile_id');
        if (ownId && ownId !== profile.profileId) {
          setProfile({ profileId: ownId });
        }
      }

      router.replace('/matches');
    } else {
      // Cas reconnexion : localStorage vide (nouvel onglet / autre appareil)
      // link_and_get_profile_by_auth() lie user_id + retourne le profil (sans email/discord)
      if (userEmail) {
        const { data: rows } = await supabase.rpc('link_and_get_profile_by_auth');
        const existingProfile = rows?.[0];

        if (existingProfile) {
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
            email:        userEmail,     // vient de auth.user.email (source fiable)
            discord:      '',            // chargé via get_my_contacts() sur /matches
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
