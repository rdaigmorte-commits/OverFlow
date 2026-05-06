'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';
import { computeMatches, type Match } from '@/lib/match';

function fitStyle(label: string) {
  if (label === 'Strong fit') return 'border-accent bg-accent text-black';
  if (label === 'Good fit') return 'border-accent2 bg-accent2 text-black';
  return 'border-border bg-panel2 text-text';
}

export default function MatchesPage() {
  const { profile } = useOverflowStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchMatches() {
      const { data, error } = await supabase.from('profiles').select('*');

      if (error || !data) {
        setFetchError(true);
        setLoading(false);
        return;
      }

      const current = {
        id: profile.profileId ?? '',
        name: profile.name,
        games: profile.games,
        platform: profile.platform,
        language: profile.language,
        availability: profile.availability,
        style: profile.style,
        city: profile.city,
      };

      const results = computeMatches(current, data);
      setMatches(results);
      setLoading(false);
    }
    fetchMatches();
  }, [profile.profileId]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">Your best local matches</h1>
          <p className="mt-3 text-muted">Suggested based on your profile and Utrecht location.</p>
        </div>
        <Link className="rounded-xl border border-border px-4 py-3 text-sm" href="/onboarding">Edit profile</Link>
      </div>

      <div className="mt-8 grid gap-5">
        {loading && (
          <p className="text-muted">Finding your matches...</p>
        )}

        {!loading && fetchError && (
          <Card className="p-8 text-center">
            <div className="text-2xl font-bold">Something went wrong</div>
            <p className="mt-3 text-muted">We couldn&apos;t load your matches. Please try refreshing the page.</p>
            <button
              onClick={() => { setFetchError(false); setLoading(true); }}
              className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black"
            >
              Try again
            </button>
          </Card>
        )}

        {!loading && !fetchError && matches.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-2xl font-bold">No matches yet</div>
            <p className="mt-3 text-muted">You&apos;re one of the first! Share OverFlow with your gaming friends in Utrecht so we can find you the best matches.</p>
            <Link href="/onboarding" className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black">Edit my profile</Link>
          </Card>
        )}

        {!loading && !fetchError && matches.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-2xl font-bold">{m.name}</div>
                <div className="mt-1 text-sm text-muted">{m.games.join(', ')} • {m.platform} • {m.language}</div>
                <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${fitStyle(m.fitLabel)}`}>{m.fitLabel}</div>
                <p className="mt-3 text-sm text-muted">{m.fitReason}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black">Request match</button>
                <button className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text">Why this match?</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
