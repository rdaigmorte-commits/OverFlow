'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOverflowStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { normalizeLanguage, normalizeArray } from '@/lib/match';

const FALLBACK_GAMES = ['Valorant', 'CS2', 'Rocket League', 'Smash Bros', 'League of Legends', 'FIFA', 'Minecraft', 'Animal Crossing'];
const STYLES    = ['Competitive', 'Co-op', 'Casual', 'Roleplay'];
const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'];
const LANGS     = ['English', 'Dutch', 'French', 'Spanish', 'German', 'Italian'];
const SLOTS     = ['Weekday evenings', 'Friday night', 'Weekend day', 'Weekend evening'];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        selected
          ? 'border-accent bg-accent text-black font-semibold'
          : 'border-border bg-panel2 text-text hover:border-accent'
      }`}
    >
      {label}
    </button>
  );
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { profile, setProfile } = useOverflowStore();

  const [loading, setLoading]       = useState(false);
  const [hydrating, setHydrating]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
  const [gameInput, setGameInput]   = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allGamesInDB, setAllGamesInDB] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ── Redirect si pas de profil ────────────────────────────────────────────
  useEffect(() => {
    async function hydrate() {
      const profileId = profile.profileId;
      if (!profileId) {
        router.replace('/onboarding');
        return;
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).single();
      if (!error && data) {
        setProfile({
          profileId:    data.id,
          name:         data.name ?? '',
          age:          data.age ?? '',
          city:         'Utrecht',
          language:     normalizeLanguage(data.language),
          platform:     normalizeArray(data.platform),
          games:        Array.isArray(data.games) ? data.games : [],
          style:        normalizeArray(data.style),
          availability: Array.isArray(data.availability) ? data.availability : [],
          openIRL:      data.open_irl ?? false,
          consent:      data.consent ?? false,
          email:        data.email ?? '',
          discord:      data.discord ?? '',
        });
      }
      // Fetch all known games for autocomplete
      const { data: allProfiles } = await supabase.from('profiles').select('games');
      if (allProfiles) {
        const gameSet = new Set<string>();
        allProfiles.forEach((row) => {
          (Array.isArray(row.games) ? row.games : []).forEach((g: string) => gameSet.add(g));
        });
        setAllGamesInDB(Array.from(gameSet));
      }
      setHydrating(false);
    }
    hydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fermer suggestions si clic en dehors ────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleMulti = (
    key: 'games' | 'availability' | 'language' | 'platform' | 'style',
    value: string
  ) => {
    const current = profile[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setProfile({ [key]: next } as Parameters<typeof setProfile>[0]);
  };

  const addGame = (value?: string) => {
    const val = (value ?? gameInput).trim();
    if (!val || profile.games.includes(val)) return;
    setProfile({ games: [...profile.games, val] });
    setGameInput('');
    setShowSuggestions(false);
  };

  const dropdownSuggestions = allGamesInDB
    .filter((g) => !profile.games.includes(g))
    .filter((g) =>
      gameInput.trim().length === 0
        ? true
        : g.toLowerCase().includes(gameInput.toLowerCase())
    )
    .slice(0, 6);

  // ── Sauvegarde ───────────────────────────────────────────────────────────
  async function handleSave() {
    setError(null);
    setSuccess(false);
    if (!profile.name.trim()) { setError('Please enter a nickname.'); return; }
    if (profile.games.length === 0) { setError('Please select at least one game.'); return; }
    if (profile.platform.length === 0) { setError('Please select at least one platform.'); return; }
    if (profile.style.length === 0) { setError('Please select at least one play style.'); return; }
    if (profile.language.length === 0) { setError('Please select at least one language.'); return; }

    setLoading(true);
    const payload = {
      id:           profile.profileId,
      name:         profile.name,
      age:          profile.age || null,
      city:         'Utrecht',
      language:     profile.language,
      platform:     profile.platform,
      games:        profile.games,
      style:        profile.style,
      availability: profile.availability,
      open_irl:     profile.openIRL,
      consent:      true,
      email:        profile.email || null,
      discord:      profile.discord || null,
    };
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('id')
      .single();

    setLoading(false);
    if (dbError) {
      setError('Something went wrong. Please try again.');
      return;
    }
    setSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccess(false), 3000);
  }

  if (hydrating) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-6 py-10">
        <p className="text-muted">Loading your profile…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">Edit my profile ✏️</h1>
          <Link
            href="/matches"
            className="text-sm text-muted hover:text-text transition"
          >
            ← Back to matches
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">All your changes are saved instantly to your account.</p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/40 bg-green-500/10 px-5 py-4">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium text-green-400">Profile updated successfully!</p>
        </div>
      )}

      <div className="flex flex-col gap-8">

        {/* ── Section 1: Identité ───────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-panel p-6 flex flex-col gap-5">
          <h2 className="text-base font-bold text-text">👤 Identity</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text">
              Nickname <span className="text-accent">*</span>
            </label>
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
              placeholder="How do people call you in-game?"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text">
              Age <span className="text-muted text-xs">(optional)</span>
            </label>
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
              placeholder="Your age"
              type="number"
              min={10}
              max={99}
              value={profile.age}
              onChange={(e) => setProfile({ age: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-panel2 px-4 py-3">
            <span className="text-lg">📍</span>
            <div>
              <div className="text-xs text-muted uppercase tracking-widest">City</div>
              <div className="text-sm font-semibold text-text">Utrecht</div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Jeux ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-panel p-6 flex flex-col gap-5">
          <h2 className="text-base font-bold text-text">🎮 Games <span className="text-accent">*</span></h2>

          {/* Chips des jeux sélectionnés */}
          {profile.games.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.games.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm text-black font-semibold"
                >
                  {g}
                  <button
                    type="button"
                    onClick={() => setProfile({ games: profile.games.filter((x) => x !== g) })}
                    className="hover:opacity-70"
                    aria-label={`Remove ${g}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Top 8 rapide */}
          <div className="flex flex-wrap gap-3">
            {FALLBACK_GAMES.filter((g) => !profile.games.includes(g)).map((g) => (
              <Chip
                key={g}
                label={g}
                selected={false}
                onClick={() => setProfile({ games: [...profile.games, g] })}
              />
            ))}
          </div>

          {/* Input libre */}
          <div className="relative" ref={suggestionsRef}>
            <div className="flex gap-3">
              <input
                className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
                placeholder="Add another game…"
                value={gameInput}
                onChange={(e) => { setGameInput(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addGame(); }
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
              />
              <button
                type="button"
                onClick={() => addGame()}
                className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-panel2 transition"
              >
                Add
              </button>
            </div>
            {showSuggestions && dropdownSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-border bg-panel shadow-lg overflow-hidden">
                {dropdownSuggestions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addGame(g); }}
                    className="flex w-full items-center px-4 py-3 text-sm text-text hover:bg-panel2 transition"
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3: Style de jeu ───────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-panel p-6 flex flex-col gap-5">
          <h2 className="text-base font-bold text-text">⚔️ How you play</h2>

          <div>
            <h3 className="text-sm font-semibold text-text mb-3">
              Platform <span className="text-accent">*</span>{' '}
              <span className="text-muted font-normal">(select all that apply)</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map((p) => (
                <Chip key={p} label={p} selected={profile.platform.includes(p)} onClick={() => toggleMulti('platform', p)} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text mb-3">
              Play style <span className="text-accent">*</span>{' '}
              <span className="text-muted font-normal">(select all that apply)</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {STYLES.map((s) => (
                <Chip key={s} label={s} selected={profile.style.includes(s)} onClick={() => toggleMulti('style', s)} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text mb-3">
              Language <span className="text-accent">*</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {LANGS.map((l) => (
                <Chip key={l} label={l} selected={profile.language.includes(l)} onClick={() => toggleMulti('language', l)} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text mb-3">
              Availability{' '}
              <span className="text-muted font-normal">(optional)</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {SLOTS.map((s) => (
                <Chip key={s} label={s} selected={profile.availability.includes(s)} onClick={() => toggleMulti('availability', s)} />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={profile.openIRL}
              onChange={(e) => setProfile({ openIRL: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Open to meeting IRL in Utrecht
          </label>
        </section>

        {/* ── Section 4: Contact ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-panel p-6 flex flex-col gap-5">
          <h2 className="text-base font-bold text-text">📬 Contact info</h2>
          <p className="text-xs text-muted">Used for match notifications. Not displayed publicly.</p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text">
              Email <span className="text-muted text-xs">(optional)</span>
            </label>
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
              placeholder="you@example.com"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ email: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text">
              Discord <span className="text-muted text-xs">(optional)</span>
            </label>
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
              placeholder="yourhandle#1234"
              value={profile.discord}
              onChange={(e) => setProfile({ discord: e.target.value })}
            />
          </div>
        </section>

        {/* ── Erreur + CTA ─────────────────────────────────────────────── */}
        {error && (
          <p className="text-sm text-red-400 -mt-4">{error}</p>
        )}

        <div className="flex flex-col gap-3 pb-10">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Saving…' : 'Save changes ✓'}
          </button>
          <Link
            href="/matches"
            className="w-full rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text text-center hover:bg-panel2 transition"
          >
            Cancel
          </Link>
        </div>

      </div>
    </main>
  );
}
