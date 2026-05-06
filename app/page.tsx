import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
      <header className="flex items-center justify-between py-2">
        <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
        <div className="text-sm text-muted">Utrecht only • MVP</div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.25em] text-accent">Local gaming matchmaking</p>
          <h1 className="max-w-xl text-5xl font-black leading-tight text-text md:text-6xl">Find gamers in Utrecht who actually play the same games as you.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">OverFlow is not a social feed. It is a local matchmaking tool built to qualify interest, connect compatible players, and validate the demand for future gaming events and a physical gaming space.</p>
          <div className="mt-8 flex gap-4">
            <Link href="/onboarding"><Button>Start matching</Button></Link>
            <Link href="/matches" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text">See sample matches</Link>
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
