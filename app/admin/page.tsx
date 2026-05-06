import { Card } from '@/components/Card';
import { demoMatches } from '@/lib/match';

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-black">Admin overview</h1>
      <p className="mt-3 text-muted">Internal view for segmentation and traction analysis.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card className="p-5"><div className="text-sm text-muted">Qualified profiles</div><div className="mt-2 text-3xl font-black">38</div></Card>
        <Card className="p-5"><div className="text-sm text-muted">IRL interested</div><div className="mt-2 text-3xl font-black">21</div></Card>
        <Card className="p-5"><div className="text-sm text-muted">Potential matches</div><div className="mt-2 text-3xl font-black">12</div></Card>
      </div>
      <Card className="mt-8 p-5">
        <h2 className="text-xl font-bold">Top matches</h2>
        <div className="mt-4 space-y-3">{demoMatches.map(m => <div key={m.name} className="rounded-xl border border-border bg-panel2 p-4 flex justify-between"><span>{m.name} • {m.game}</span><span className="text-accent">{m.compatibility}%</span></div>)}</div>
      </Card>
    </main>
  );
}
