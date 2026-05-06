import Link from 'next/link';
import { Card } from '@/components/Card';
import { demoMatches } from '@/lib/match';

function fitStyle(label: string) {
  if (label === 'Strong fit') return 'border-accent bg-accent text-black';
  if (label === 'Good fit') return 'border-accent2 bg-accent2 text-black';
  return 'border-border bg-panel2 text-text';
}

export default function MatchesPage() {
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
        {demoMatches.map((m) => (
          <Card key={m.name} className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-2xl font-bold">{m.name}</div>
                <div className="mt-1 text-sm text-muted">{m.game} • {m.platform} • {m.language} • {m.availability}</div>
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
