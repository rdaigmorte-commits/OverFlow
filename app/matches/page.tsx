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
        games: profile.games ?? [],
        platform: profile.platform,
        language: profile.language,
        availability: profile.availability ?? [],
        style: profile.style,
        city: profile.city,
      };

      const results = computeMatches(current, data);
      setMatches(results);
      setLoading(false);
    }
    fetchMatches();
  }, [profile.profileId]);

  // US-032 : construire le résumé du profil depuis le store Zustand
  const profileSummaryLines = [
    (profile.games ?? []).length > 0 && { label: 'Games', value: (profile.games ?? []).join(', ') },
    profile.platform && { label: 'Platform', value: profile.platform },
    profile.style && { label: 'Style', value: profile.style },
    (profile.availability ?? []).length > 0 && { label: 'Available', value: (profile.availability ?? []).join(', ') },
    profile.city && { label: 'City', value: profile.city },
    profile.openIRL && { label: 'Open to in-person events', value: 'Yes' },
  ].filter(Boolean) as { label: string; value: string }[];

  const hasProfileData = profileSummaryLines.length > 0;

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

        {/* État vide — US-032 / 033 / 034 */}
        {!loading && !fetchError && matches.length === 0 && (
          <div className="grid gap-5">

            {/* US-033 — Statut Early Tester */}
            <Card className="p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="inline-flex rounded-full border border-accent bg-accent px-4 py-1 text-xs font-bold text-black">Early OverFlow Tester · Utrecht</span>
                  <p className="mt-3 text-muted text-sm">You&apos;ll be prioritised for the first match suggestions and test sessions when enough compatible players are available.</p>
                </div>
              </div>
            </Card>

            {/* US-032 — Résumé du profil */}
            {hasProfileData && (
              <Card className="p-6">
                <h2 className="text-lg font-bold">Your saved profile</h2>
                <p className="mt-1 text-sm text-muted">Here&apos;s what we&apos;ve recorded. <Link href="/onboarding" className="underline">Edit</Link> anytime.</p>
                <ul className="mt-4 grid gap-2">
                  {profileSummaryLines.map((line) => (
                    <li key={line.label} className="flex gap-3 text-sm">
                      <span className="w-36 shrink-0 text-muted">{line.label}</span>
                      <span className="text-text font-medium">{line.value}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* US-034 — What happens next */}
            <Card className="p-6">
              <h2 className="text-lg font-bold">What happens next?</h2>
              <ul className="mt-4 grid gap-3 text-sm text-muted">
                <li className="flex gap-3"><span className="text-accent font-bold">1</span>We&apos;ll notify you by email when a small compatible group forms.</li>
                <li className="flex gap-3"><span className="text-accent font-bold">2</span>You&apos;ll be invited to first local test sessions matching your profile.</li>
                <li className="flex gap-3"><span className="text-accent font-bold">3</span>You can accept or decline every suggestion — nothing is automatic.</li>
              </ul>
              {!profile.email && (
                <div className="mt-5 rounded-xl border border-border bg-panel2 px-4 py-3 text-sm text-muted">
                  ⚠️ Add your email in your profile to get notified. <Link href="/onboarding" className="underline text-text">Update profile</Link>
                </div>
              )}
            </Card>

          </div>
        )}

        {!loading && !fetchError && matches.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-2xl font-bold">{m.name}</div>
                <div className="mt-1 text-sm text-muted">{(m.games ?? []).join(', ')} • {m.platform} • {m.language}</div>
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
