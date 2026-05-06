'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { demoMatches } from '@/lib/match';
import { supabase } from '@/lib/supabase';

type GameStat = {
  game: string;
  occurrences: number;
};

export default function AdminPage() {
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    async function fetchGameStats() {
      const { data, error } = await supabase.rpc('get_game_stats');
      if (!error && data) {
        setGameStats(data);
      }
      setLoadingGames(false);
    }
    fetchGameStats();
  }, []);

  const maxOccurrences = gameStats.length > 0 ? gameStats[0].occurrences : 1;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-black">Admin overview</h1>
      <p className="mt-3 text-muted">Internal view for segmentation and traction analysis.</p>

      {/* KPI cards */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted">Qualified profiles</div>
          <div className="mt-2 text-3xl font-black">38</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">IRL interested</div>
          <div className="mt-2 text-3xl font-black">21</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Potential matches</div>
          <div className="mt-2 text-3xl font-black">12</div>
        </Card>
      </div>

      {/* Game popularity */}
      <Card className="mt-8 p-5">
        <h2 className="text-xl font-bold">Game popularity</h2>
        <p className="mt-1 text-sm text-muted">Live — based on declared profiles in the database.</p>
        <div className="mt-5 space-y-4">
          {loadingGames && (
            <p className="text-sm text-muted">Loading game stats...</p>
          )}
          {!loadingGames && gameStats.length === 0 && (
            <p className="text-sm text-muted">No game data yet. Wait for the first profiles to be submitted.</p>
          )}
          {!loadingGames && gameStats.map((g) => {
            const pct = Math.round((g.occurrences / maxOccurrences) * 100);
            return (
              <div key={g.game}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-text">{g.game}</span>
                  <span className="text-muted">{g.occurrences} player{g.occurrences > 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-panel2 border border-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top matches */}
      <Card className="mt-8 p-5">
        <h2 className="text-xl font-bold">Top matches</h2>
        <div className="mt-4 space-y-3">
          {demoMatches.map(m => (
            <div key={m.name} className="rounded-xl border border-border bg-panel2 p-4 flex justify-between">
              <span>{m.name} • {m.game}</span>
              <span className="text-accent">{m.compatibility}%</span>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
