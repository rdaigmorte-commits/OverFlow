'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useOverflowStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const games = ['Valorant', 'CS2', 'Rocket League', 'Smash Bros', 'League of Legends', 'Animal Crossing'];
const styles = ['Competitive', 'Co-op', 'Casual'];
const platforms = ['PC', 'PlayStation', 'Xbox', 'Switch'];
const langs = ['English', 'Dutch', 'French'];
const slots = ['Weekday evenings', 'Friday night', 'Weekend day', 'Weekend evening'];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, setProfile } = useOverflowStore();
  const [gameInput, setGameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMulti = (key: 'games' | 'availability', value: string) => {
    const current = profile[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setProfile({ [key]: next } as any);
  };

  const addGame = () => {
    const value = gameInput.trim();
    if (!value) return;
    if (!profile.games.includes(value)) setProfile({ games: [...profile.games, value] });
    setGameInput('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('profiles').insert({
      name: profile.name,
      age: profile.age,
      city: profile.city,
      language: profile.language,
      platform: profile.platform,
      games: profile.games,
      style: profile.style,
      availability: profile.availability,
      open_irl: profile.openIRL,
      consent: profile.consent,
    });
    setLoading(false);
    if (error) {
      setError('Something went wrong. Please try again.');
      return;
    }
    router.push('/matches');
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="text-4xl font-black text-text">Tell us your gaming profile</h1>
      <p className="mt-3 text-muted">This helps us match you with the right players in Utrecht.</p>

      <div className="mt-8 grid gap-6">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none" placeholder="Name / nickname" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
            <input className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none" placeholder="Age" value={profile.age} onChange={(e) => setProfile({ age: e.target.value })} />
            <input className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none" placeholder="City" value={profile.city} onChange={(e) => setProfile({ city: e.target.value })} />
            <select className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none" value={profile.language} onChange={(e) => setProfile({ language: e.target.value })}>
              {langs.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none" value={profile.platform} onChange={(e) => setProfile({ platform: e.target.value })}>
              <option value="">Platform</option>
              {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none" value={profile.style} onChange={(e) => setProfile({ style: e.target.value })}>
              <option value="">Play style</option>
              {styles.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold">Games</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {games.map((g) => (
              <button key={g} onClick={() => toggleMulti('games', g)} className={`rounded-full border px-4 py-2 text-sm ${profile.games.includes(g) ? 'border-accent bg-accent text-black' : 'border-border bg-panel2 text-text'}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <input className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 outline-none" placeholder="Add another game" value={gameInput} onChange={(e) => setGameInput(e.target.value)} />
            <button className="rounded-xl border border-border px-4 py-3" onClick={addGame}>Add</button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold">Availability</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {slots.map((s) => (
              <button key={s} onClick={() => toggleMulti('availability', s)} className={`rounded-full border px-4 py-2 text-sm ${profile.availability.includes(s) ? 'border-accent bg-accent text-black' : 'border-border bg-panel2 text-text'}`}>
                {s}
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-muted"><input type="checkbox" checked={profile.openIRL} onChange={(e) => setProfile({ openIRL: e.target.checked })} /> Open to in-person later</label>
          <label className="mt-2 flex items-center gap-3 text-sm text-muted"><input type="checkbox" checked={profile.consent} onChange={(e) => setProfile({ consent: e.target.checked })} /> I agree to be recontacted</label>
        </Card>

        {error && <p className="rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'See matches'}
          </Button>
        </div>
      </div>
    </main>
  );
}
