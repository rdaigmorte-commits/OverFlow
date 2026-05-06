'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useOverflowStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const PRESET_GAMES = ['Valorant', 'CS2', 'Rocket League', 'Smash Bros', 'League of Legends', 'Animal Crossing'];
const styles = ['Competitive', 'Co-op', 'Casual'];
const platforms = ['PC', 'PlayStation', 'Xbox', 'Switch'];
const langs = ['English', 'Dutch', 'French', 'Spanish', 'German', 'Italian'];
const slots = ['Weekday evenings', 'Friday night', 'Weekend day', 'Weekend evening'];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, setProfile } = useOverflowStore();
  const [gameInput, setGameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMulti = (key: 'games' | 'availability' | 'language', value: string) => {
    const current = profile[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setProfile({ [key]: next } as any);
  };

  const addGame = () => {
    const value = gameInput.trim();
    if (!value) return;
    if (!profile.games.includes(value)) setProfile({ games: [...profile.games, value] });
    setGameInput('');
  };

  const handleGameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addGame(); }
  };

  const removeCustomGame = (game: string) => {
    setProfile({ games: profile.games.filter((g) => g !== game) });
  };

  const customGames = profile.games.filter((g) => !PRESET_GAMES.includes(g));

  const validate = (): string | null => {
    if (!profile.name.trim()) return 'Please enter your name or nickname.';
    if (profile.games.length === 0) return 'Please select at least one game.';
    if (!profile.platform) return 'Please select your main platform.';
    if (!profile.style) return 'Please select your play style.';
    if (profile.language.length === 0) return 'Please select at least one language.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    // Si profileId est null (premier enregistrement), on n'inclut pas id
    // pour laisser Supabase générer un UUID automatiquement.
    // Si profileId existe (mise à jour), on l'inclut pour le upsert.
    const basePayload = {
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
      email: profile.email || null,
      discord: profile.discord || null,
    };

    const payload = profile.profileId
      ? { id: profile.profileId, ...basePayload }
      : basePayload;

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    setLoading(false);

    if (error) { setError('Something went wrong. Please try again.'); return; }

    setProfile({ profileId: data.id });
    router.push('/matches');
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="text-4xl font-black text-text">Tell us your gaming profile</h1>
      <p className="mt-3 text-muted">This helps us match you with the right players in Utrecht.</p>

      <div className="mt-8 grid gap-6">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              placeholder="Name / nickname *"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
            />
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              placeholder="Age"
              type="number"
              min={10}
              max={99}
              value={profile.age}
              onChange={(e) => setProfile({ age: e.target.value })}
            />
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              placeholder="City"
              value={profile.city}
              onChange={(e) => setProfile({ city: e.target.value })}
            />
            <select
              className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              value={profile.platform}
              onChange={(e) => setProfile({ platform: e.target.value })}
            >
              <option value="">Platform *</option>
              {platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              value={profile.style}
              onChange={(e) => setProfile({ style: e.target.value })}
            >
              <option value="">Play style *</option>
              {styles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Langues multi-selection */}
        <Card className="p-6">
          <h2 className="text-xl font-bold">Languages <span className="text-sm font-normal text-muted">(select at least one *)</span></h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {langs.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleMulti('language', l)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  profile.language.includes(l)
                    ? 'border-accent bg-accent text-black'
                    : 'border-border bg-panel2 text-text'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Card>

        {/* Jeux */}
        <Card className="p-6">
          <h2 className="text-xl font-bold">Games <span className="text-sm font-normal text-muted">(select at least one *)</span></h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {PRESET_GAMES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleMulti('games', g)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  profile.games.includes(g)
                    ? 'border-accent bg-accent text-black'
                    : 'border-border bg-panel2 text-text'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {customGames.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted">Added by you</p>
              <div className="flex flex-wrap gap-3">
                {customGames.map((g) => (
                  <span key={g} className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm text-black">
                    {g}
                    <button type="button" onClick={() => removeCustomGame(g)} className="ml-1 font-bold leading-none hover:opacity-70" aria-label={`Remove ${g}`}>×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <input
              className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              placeholder="Add another game"
              value={gameInput}
              onChange={(e) => setGameInput(e.target.value)}
              onKeyDown={handleGameInputKeyDown}
            />
            <button type="button" className="rounded-xl border border-border px-4 py-3" onClick={addGame}>Add</button>
          </div>
        </Card>

        {/* Disponibilites */}
        <Card className="p-6">
          <h2 className="text-xl font-bold">Availability</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleMulti('availability', s)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  profile.availability.includes(s)
                    ? 'border-accent bg-accent text-black'
                    : 'border-border bg-panel2 text-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-muted">
            <input type="checkbox" checked={profile.openIRL} onChange={(e) => setProfile({ openIRL: e.target.checked })} />
            Open to in-person later
          </label>
          <label className="mt-2 flex items-center gap-3 text-sm text-muted">
            <input type="checkbox" checked={profile.consent} onChange={(e) => setProfile({ consent: e.target.checked })} />
            I agree to be recontacted
          </label>
        </Card>

        {/* Contact — US-017 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold">Stay in the loop <span className="text-sm font-normal text-muted">(optional but recommended)</span></h2>
          <p className="mt-2 text-sm text-muted">You&apos;ll be the first to know when a compatible group forms in Utrecht. No spam, only useful match suggestions.</p>
          <div className="mt-4 grid gap-4">
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              placeholder="Your email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ email: e.target.value })}
            />
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 outline-none"
              placeholder="Discord handle (optional)"
              value={profile.discord}
              onChange={(e) => setProfile({ discord: e.target.value })}
            />
          </div>
        </Card>

        {error && (
          <p className="rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'See matches'}
          </Button>
        </div>
      </div>
    </main>
  );
}
