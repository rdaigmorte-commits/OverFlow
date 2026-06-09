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

    if (userEmail) {
      if (hasProfile) {
        // Cas "Add email" : on met à jour le profil existant avec l'email + user_id
        await supabase
          .from('profiles')
          .update({ email: userEmail, user_id: userId })
          .eq('id', profile.profileId);
        // Met à jour le store local pour que hasEmail passe à true immédiatement
        setProfile({ ...profile, email: userEmail });
      } else {
        // Cas reconnexion : on lie le compte auth au profil existant par email
        await supabase
          .from('profiles')
          .update({ user_id: userId })
          .eq('email', userEmail)
          .is('user_id', null);
      }
    }

    if (hasProfile) {
      // Si un autre profil existe pour cet email, on bascule dessus
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail ?? '')
        .single();
      if (data?.id && data.id !== profile.profileId) {
        setProfile({ profileId: data.id });
      }
      router.replace('/matches');
    } else {
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
