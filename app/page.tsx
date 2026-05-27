'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useOverflowStore } from '@/lib/store';

export default function HomePage() {
  const { profile } = useOverflowStore();
  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration before reading the store
  // This prevents server/client HTML mismatch (Zustand persists to localStorage)
  useEffect(() => { setMounted(true); }, []);

  const hasProfile = mounted && !!profile.profileId;

  // ── RETURNING USER ──────────────────────────────────────────────
  if (hasProfile) {
    const games = (profile.games ?? []).join(', ');
    const summaryLines = [
      profile.name && { label: 'Name', value: profile.name },
      games && { label: 'Games', value: games },
      profile.platform && { label: 'Platform', value: profile.platform },
      profile.style && { label: 'Style', value: profile.style },
      (profile.availability ?? []).length > 0 && { label: 'Available', value: (profile.availability ?? []).join(', ') },
      profile.city && { label: 'City', value: profile.city },
      profile.openIRL && { label: 'IRL events', value: 'Open to it' },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          <div className="text-sm text-muted">Utrecht only · MVP</div>
        </header>

        <section className="grid flex-1 items-start gap-8 py-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.25em] text-accent">Welcome back</p>
            <h1 className="max-w-xl text-5xl font-black leading-tight text-text md:text-6xl">
              Hey{profile.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              Your profile is live. Check your matches or update your info anytime.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/matches"><Button>See my matches</Button></Link>
              <Link href="/onboarding" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text">
                Edit profile
              </Link>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Your profile</h2>
              <Link href="/onboarding" className="text-xs text-accent underline">Edit</Link>
            </div>
            <ul className="mt-5 grid gap-3">
              {summaryLines.map((line) => (
                <li key={line.label} className="flex gap-3 text-sm">
                  <span className="w-32 shrink-0 text-muted">{line.label}</span>
                  <span className="font-medium text-text">{line.value}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </main>
    );
  }

  // ── NEW VISITOR (also rendered server-side → always safe to hydrate) ──
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
      <header className="flex items-center justify-between py-2">
        <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
        <div className="text-sm text-muted">Utrecht only · MVP</div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.25em] text-accent">Local gaming matchmaking</p>
          <h1 className="max-w-xl text-5xl font-black leading-tight text-text md:text-6xl">Find gamers in Utrecht who actually play the same games as you.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">OverFlow is not a social feed. It is a local matchmaking tool built to qualify interest, connect compatible players, and validate the demand for future gaming events and a physical gaming space.</p>
          <div className="mt-8 flex gap-4">
            <Link href="/onboarding"><Button>Start matching</Button></Link>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold">Why OverFlow?</h2>
          <div className="mt-6 space-y-4 text-sm text-muted">
            <div className="rounded-xl border border-border bg-panel2 p-4">Local to Utrecht, not a generic global platform.</div>
            <div className="rounded-xl border border-border bg-panel2 p-4">Built to find compatible players fast, not to scroll a feed.</div>
            <div className="rounded-xl border border-border bg-panel2 p-4">Designed to collect quality profiles and validate future physical events.</div>
          </div>
        </Card>
      </section>
    </main>
  );
}
