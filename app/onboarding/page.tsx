'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { useOverflowStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { normalizeLanguage, normalizeArray } from '@/lib/match';

const FALLBACK_GAMES = ['Valorant', 'CS2', 'Rocket League', 'Smash Bros', 'League of Legends', 'FIFA', 'Minecraft', 'Animal Crossing'];
const STYLES    = ['Competitive', 'Co-op', 'Casual', 'Roleplay'];
const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'];
const LANGS     = ['English', 'Dutch', 'French', 'Spanish', 'German', 'Italian'];
const SLOTS     = ['Weekday evenings', 'Friday night', 'Weekend day', 'Weekend evening'];
const TOTAL_STEPS = 5;

const STEP_LABELS = [
  'Who you are',
  'Your games',
  'Your vibe',
  'Your setup',
  'Your matches',
];

const STEP_ENCOURAGEMENTS = [
  '',
  '',
  'Getting interesting 👀',
  'Almost there! 🔥',
  '',
];

const LOOKING_FOR_OPTIONS = [
  { value: 'online' as const, icon: '🏠', title: 'Play online',  desc: 'Regular sessions, no pressure' },
  { value: 'irl'    as const, icon: '🍺', title: 'Meet IRL',    desc: 'Find people in your city' },
  { value: 'both'   as const, icon: '⚡',  title: 'Both',        desc: 'Online first, IRL if it clicks' },
];

type GameCount = Record<string, number>;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-text">{STEP_LABELS[step - 1]}</span>
        <span className="text-xs text-muted">
          {STEP_ENCOURAGEMENTS[step - 1] || `${step} of ${TOTAL_STEPS}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < step ? 'bg-accent' : 'bg-panel2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      key={selected ? 'selected' : 'unselected'}
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors relative ${
        selected
          ? 'border-accent bg-accent text-black font-semibold chip-selected'
          : 'border-border bg-panel2 text-text hover:border-accent'
      }`}
    >
      {selected && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-black font-black">
          ✓
        </span>
      )}
      {label}
    </button>
  );
}

function LiveCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="flex items-center gap-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-xs font-medium text-green-400">{count} playing</span>
    </span>
  );
}

function AnimatedCount({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(current);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{display}</>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, setProfile, currentStep, setStep } = useOverflowStore();

  const [gameInput, setGameInput]       = useState('');
  const [loading, setLoading]           = useState(false);
  const [hydrating, setHydrating]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [gameCounts, setGameCounts]     = useState<GameCount>({});
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [compatCount, setCompatCount]   = useState<number | null>(null);
  const [previewMatches, setPreviewMatches] = useState<{ id: string; name: string; games: string[] }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [direction, setDirection]       = useState<'next' | 'prev'>('next');
  const suggestionsRef  = useRef<HTMLDivElement>(null);
  const sessionId       = useRef<string>(crypto.randomUUID());
  const completedRef    = useRef(false);
  const currentStepRef  = useRef(currentStep);

  const allGamesSorted = Object.entries(gameCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([g]) => g);

  const top8: string[] = countsLoaded
    ? [
        ...allGamesSorted.slice(0, 8),
        ...FALLBACK_GAMES.filter((g) => !allGamesSorted.includes(g)),
      ].slice(0, 8)
    : FALLBACK_GAMES;

  const dropdownSuggestions = allGamesSorted
    .filter((g) => !top8.includes(g))
    .filter((g) =>
      gameInput.trim().length === 0
        ? false
        : g.toLowerCase().includes(gameInput.toLowerCase())
    );

  const extraSelectedGames = profile.games.filter((g) => !top8.includes(g));

  // ── Tracking funnel ─────────────────────────────────────────────────────
  function track(step: number, action: 'start' | 'complete' | 'abandon') {
    supabase.from('onboarding_events').insert({ session_id: sessionId.current, step, action });
  }

  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  useEffect(() => {
    track(1, 'start');
    return () => { if (!completedRef.current) track(currentStepRef.current, 'abandon'); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Hydratation ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function hydrate() {
      const profileId = profile.profileId;
      if (!profileId) { setHydrating(false); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, age, city, language, platform, games, style, availability, open_irl, consent, looking_for')
        .eq('id', profileId)
        .single();
      if (!error && data) {
        setProfile({
          profileId:    data.id,
          name:         data.name ?? '',
          age:          data.age ?? '',
          city:         data.city ?? '',
          language:     normalizeLanguage(data.language),
          platform:     normalizeArray(data.platform),
          games:        Array.isArray(data.games) ? data.games : [],
          style:        normalizeArray(data.style),
          availability: Array.isArray(data.availability) ? data.availability : [],
          openIRL:      data.open_irl ?? false,
          consent:      data.consent ?? false,
          lookingFor:   (data.looking_for ?? 'both') as 'online' | 'irl' | 'both',
        });
      }
      setHydrating(false);
    }
    hydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── COUNT par jeu (Step 2) ───────────────────────────────────────────────
  useEffect(() => {
    if (currentStep !== 2) return;
    async function fetchGameCounts() {
      const { data } = await supabase.from('profiles').select('games');
      if (!data) { setCountsLoaded(true); return; }
      const counts: GameCount = {};
      data.forEach((row) => {
        const games = Array.isArray(row.games) ? row.games : [];
        games.forEach((g: string) => { counts[g] = (counts[g] ?? 0) + 1; });
      });
      setGameCounts(counts);
      setCountsLoaded(true);
    }
    fetchGameCounts();
  }, [currentStep]);

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

  // ── Profils compatibles (Step 5) ─────────────────────────────────────────
  useEffect(() => {
    if (currentStep !== 5) return;
    async function fetchCompatible() {
      if (profile.games.length === 0) { setPreviewMatches([]); setCompatCount(0); return; }
      const baseQuery = supabase.from('profiles').select('id, name, games');
      const { data } = await (profile.profileId ? baseQuery.neq('id', profile.profileId) : baseQuery);
      if (!data) { setCompatCount(0); return; }
      const matches = data.filter((p) => {
        const pGames = Array.isArray(p.games) ? p.games : [];
        return pGames.some((g: string) => profile.games.includes(g));
      });
      setPreviewMatches(matches.slice(0, 5));
      setCompatCount(matches.length);
    }
    fetchCompatible();
  }, [currentStep, profile.games, profile.profileId]);

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

  async function saveProfile(): Promise<boolean> {
    setLoading(true); setError(null);
    const basePayload = {
      name:         profile.name,
      age:          profile.age || null,
      city:         profile.city || null,
      language:     profile.language,
      platform:     profile.platform,
      games:        profile.games,
      style:        profile.style,
      availability: profile.availability,
      open_irl:     profile.openIRL,
      consent:      consentGiven,
      looking_for:  profile.lookingFor,
    };
    let data: { id: string } | null = null;
    let dbError: { message?: string; code?: string } | null = null;
    if (profile.profileId) {
      ({ data, error: dbError } = await supabase
        .from('profiles')
        .upsert({ id: profile.profileId, ...basePayload }, { onConflict: 'id' })
        .select('id')
        .single());
    } else {
      ({ data, error: dbError } = await supabase
        .from('profiles')
        .insert(basePayload)
        .select('id')
        .single());
    }
    setLoading(false);
    if (dbError || !data) { setError('Something went wrong. Please try again.'); return false; }
    setProfile({ profileId: data.id, consent: consentGiven });
    return true;
  }

  function goNext() { setError(null); setStep(currentStep + 1); }
  function goBack() { setError(null); setStep(currentStep - 1); }

  function validateStep(): string | null {
    if (currentStep === 1 && !profile.name.trim()) return 'Please enter your name or nickname.';
    if (currentStep === 2 && profile.games.length === 0) return 'Please select at least one game.';
    if (currentStep === 3 && profile.style.length === 0) return 'Please select at least one play style.';
    if (currentStep === 4) {
      if (profile.platform.length === 0) return 'Please select at least one platform.';
      if (profile.language.length === 0) return 'Please select at least one language.';
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    track(currentStep, 'complete');
    setDirection('next');
    goNext();
  }

  function handleBack() {
    setDirection('prev');
    goBack();
  }

  async function handleSave() {
    if (!consentGiven) {
      setError('Please accept the contact sharing agreement to continue.');
      return;
    }
    const ok = await saveProfile();
    if (ok) {
      track(5, 'complete');
      completedRef.current = true;
      router.push('/matches');
    }
  }

  const backBtn = (
    <button onClick={handleBack} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text hover:bg-panel2 transition">
      ← Back
    </button>
  );

  if (hydrating) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-6 py-10">
        <p className="text-muted">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-10">
      <ProgressBar step={currentStep} />

      {/* STEP 1 — Identité */}
      {currentStep === 1 && (
        <div key={1} className={direction === 'next' ? 'step-enter-next' : 'step-enter-prev'}>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black">Hey, what do they call you?</h1>
              <p className="mt-2 text-muted text-sm">Just your nickname — no need for your real name.</p>
            </div>
            <Card className="p-6 flex flex-col gap-4">
              <input
                className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
                placeholder="The name you play under"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
              />
              <input
                className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
                placeholder="How old are you? (optional)"
                type="number"
                min={10}
                max={99}
                value={profile.age}
                onChange={(e) => setProfile({ age: e.target.value })}
              />
              <input
                className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
                placeholder="Your city (optional)"
                value={profile.city}
                onChange={(e) => setProfile({ city: e.target.value })}
              />
            </Card>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={handleNext} className="self-end btn-primary-new px-6 py-3 text-sm">
              Let&apos;s go →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Jeux */}
      {currentStep === 2 && (
        <div key={2} className={direction === 'next' ? 'step-enter-next' : 'step-enter-prev'}>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black">What games keep you up at night?</h1>
              <p className="mt-2 text-muted text-sm">Pick the ones you&apos;re actually playing right now.</p>
            </div>
            <Card className="p-6 flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                {top8.map((g) => {
                  const count = gameCounts[g] ?? 0;
                  return (
                    <div key={g} className="flex flex-col items-center gap-1">
                      <Chip label={g} selected={profile.games.includes(g)} onClick={() => toggleMulti('games', g)} />
                      <LiveCount count={count} />
                    </div>
                  );
                })}
              </div>
              {extraSelectedGames.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {extraSelectedGames.map((g) => (
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
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
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
                  >Add</button>
                </div>
                {showSuggestions && dropdownSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-border bg-panel shadow-lg overflow-hidden">
                    {dropdownSuggestions.slice(0, 6).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addGame(g); }}
                        className="flex w-full items-center justify-between px-4 py-3 text-sm text-text hover:bg-panel2 transition"
                      >
                        <span>{g}</span>
                        <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                          {gameCounts[g]} playing
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {profile.games.length > 0 && (() => {
                const topGame = [...profile.games].sort((a, b) => (gameCounts[b] ?? 0) - (gameCounts[a] ?? 0))[0];
                const count = gameCounts[topGame] ?? 0;
                return count > 0
                  ? <p className="text-sm text-green-400 font-medium">🎮 {count} player{count > 1 ? 's' : ''} also play {topGame}!</p>
                  : null;
              })()}
            </Card>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-between">
              {backBtn}
              <button onClick={handleNext} className="btn-primary-new px-6 py-3 text-sm">Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — Vibe (looking_for + style) */}
      {currentStep === 3 && (
        <div key={3} className={direction === 'next' ? 'step-enter-next' : 'step-enter-prev'}>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black">What kind of player are you?</h1>
              <p className="mt-2 text-muted text-sm">This helps us find people with the same energy.</p>
            </div>
            <Card className="p-6 flex flex-col gap-6">
              {/* looking_for */}
              <div>
                <h2 className="text-sm font-semibold text-text mb-3">You&apos;re here to…</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {LOOKING_FOR_OPTIONS.map((opt) => {
                    const selected = profile.lookingFor === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProfile({ lookingFor: opt.value })}
                        className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                          selected
                            ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(124,110,249,0.2)]'
                            : 'border-border bg-panel2 hover:border-accent/50 hover:scale-[1.02]'
                        }`}
                      >
                        <div className="text-3xl mb-3">{opt.icon}</div>
                        <div className="font-bold text-text text-sm mb-1">{opt.title}</div>
                        <div className="text-xs text-muted leading-relaxed">{opt.desc}</div>
                        {selected && (
                          <div className="mt-3 text-xs font-semibold text-accent animate-[chip-pop_0.25s_ease_both]">
                            ✓ Selected
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* style */}
              <div>
                <h2 className="text-sm font-semibold text-text mb-3">
                  Your play style <span className="text-accent">*</span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {STYLES.map((s) => (
                    <Chip key={s} label={s} selected={profile.style.includes(s)} onClick={() => toggleMulti('style', s)} />
                  ))}
                </div>
              </div>
            </Card>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-between">
              {backBtn}
              <button onClick={handleNext} className="btn-primary-new px-6 py-3 text-sm">Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Setup (platform + langue + dispo + IRL) */}
      {currentStep === 4 && (
        <div key={4} className={direction === 'next' ? 'step-enter-next' : 'step-enter-prev'}>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black">When and how do you play?</h1>
              <p className="mt-2 text-muted text-sm">We&apos;ll only show you people who can actually play at the same time.</p>
            </div>
            <Card className="p-6 flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-semibold text-text mb-3">
                  Your setup <span className="text-accent">*</span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {PLATFORMS.map((p) => (
                    <Chip key={p} label={p} selected={profile.platform.includes(p)} onClick={() => toggleMulti('platform', p)} />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text mb-3">
                  You play in <span className="text-accent">*</span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {LANGS.map((l) => (
                    <Chip key={l} label={l} selected={profile.language.includes(l)} onClick={() => toggleMulti('language', l)} />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text mb-3">
                  Usually free <span className="text-muted font-normal">(optional)</span>
                </h2>
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
                Open to meeting up with local players
              </label>
            </Card>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-between">
              {backBtn}
              <button onClick={handleNext} className="btn-primary-new px-6 py-3 text-sm">Almost there →</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 — Preview matches + save */}
      {currentStep === 5 && (
        <div key={5} className={direction === 'next' ? 'step-enter-next' : 'step-enter-prev'}>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black">
                {compatCount === null
                  ? 'Finding your matches…'
                  : compatCount === 0
                    ? "You're one of the first — seriously cool 🚀"
                    : <><AnimatedCount target={compatCount} /> player{compatCount !== 1 ? 's' : ''} match your vibe 🎮</>}
              </h1>
              <p className="mt-2 text-muted text-sm">
                {compatCount === 0
                  ? 'The community is growing. You\'ll be the first to know when compatible players join.'
                  : 'Save your profile to connect with them.'}
              </p>
            </div>

            {previewMatches.length > 0 && (
              <div className="flex flex-col gap-3">
                {previewMatches.map((m, i) => (
                  <Card
                    key={m.id}
                    className="p-4 flex items-center justify-between"
                    style={{ animation: `slide-in-right 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both` }}
                  >
                    <div>
                      <div className="font-bold text-text">{m.name}</div>
                      <div className="text-xs text-muted mt-1">{(Array.isArray(m.games) ? m.games : []).join(', ')}</div>
                    </div>
                    <span className="text-xs border border-accent text-accent rounded-full px-3 py-1">Compatible</span>
                  </Card>
                ))}
                {compatCount !== null && compatCount > 5 && (
                  <p className="text-xs text-muted text-center">+{compatCount - 5} more players waiting…</p>
                )}
              </div>
            )}

            <Card className="p-5 border-dashed">
              <p className="text-sm text-muted">
                Save your profile to see all your matches and connect with compatible players.
              </p>
            </Card>

            <div className="rounded-xl border border-border bg-panel p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => { setConsentGiven(e.target.checked); setError(null); }}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <span className="text-sm text-muted leading-relaxed">
                  I agree that OverFlow may share my Discord or email with players whose play request I&apos;ve accepted.{' '}
                  <span className="text-text">Your contact is only shared after you accept — never automatically.</span>
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-between">
              {backBtn}
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary-new px-6 py-3 text-sm disabled:pointer-events-none"
              >
                {loading ? 'Saving…' : 'Find my teammates →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
