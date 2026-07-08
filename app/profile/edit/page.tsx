'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOverflowStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { normalizeLanguage, normalizeArray } from '@/lib/match';
import { ContactFieldsEditor } from '@/components/ContactFieldsEditor';

const FALLBACK_GAMES = ['Valorant', 'CS2', 'Rocket League', 'Smash Bros', 'League of Legends', 'FIFA', 'Minecraft', 'Animal Crossing'];
const STYLES    = ['Competitive', 'Co-op', 'Casual', 'Roleplay'];
const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'];
const LANGS     = ['English', 'Dutch', 'French', 'Spanish', 'German', 'Italian'];
const SLOTS     = ['Weekday evenings', 'Friday night', 'Weekend day', 'Weekend evening'];
const LOOKING_FOR_OPTIONS = [
  { value: 'online' as const, icon: '🏠', title: 'Play online',  desc: 'Regular sessions, no pressure' },
  { value: 'irl'    as const, icon: '🍺', title: 'Meet IRL',    desc: 'Find people in your city' },
  { value: 'both'   as const, icon: '⚡',  title: 'Both',        desc: 'Online first, IRL if it clicks' },
];

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

  const [loading, setLoading]     = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [gameInput, setGameInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allGamesInDB, setAllGamesInDB] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const consentAtLoad = useRef(false);

  // ── Session — un profil lié à un compte (post Magic Link) ne peut être
  // sauvegardé que par une session authentifiée (RLS profiles.user_id) ──────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });
  }, []);

  // ── Hydratation — charge le profil depuis Supabase ───────────────────────
  useEffect(() => {
    async function hydrate() {
      const profileId = profile.profileId;
      if (!profileId) { router.replace('/onboarding'); return; }

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
          email:        '',
          discord:      '',
          psnHandle:    '',
          steamHandle:  '',
          otherContact: '',
          otherContactLabel: '',
        });
        // Contacts : REVOKE bloque la lecture directe — passer par la RPC
        const { data: contacts } = await supabase.rpc('get_my_contacts');
        const c = contacts?.[0];
        if (c) {
          setProfile({
            email:              c.email ?? '',
            discord:            c.discord ?? '',
            psnHandle:          c.psn_handle ?? '',
            steamHandle:        c.steam_handle ?? '',
            otherContact:       c.other_contact ?? '',
            otherContactLabel:  c.other_contact_label ?? '',
            shareDiscord:       c.share_discord ?? true,
            shareEmailContact:  c.share_email_contact ?? true,
            sharePsn:           c.share_psn ?? true,
            shareSteam:         c.share_steam ?? true,
            shareOther:         c.share_other ?? true,
            contactShareConsent: c.contact_share_consent ?? false,
          });
          consentAtLoad.current = c.contact_share_consent ?? false;
        }
      }

      // Charge aussi la liste de tous les jeux en DB pour les suggestions
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
    setError(null); setNeedsLogin(false); setSuccess(false);
    if (!profile.name.trim())          { setError('Please enter a nickname.'); return; }
    if (profile.games.length === 0)    { setError('Please select at least one game.'); return; }
    if (profile.platform.length === 0) { setError('Please select at least one platform.'); return; }
    if (profile.style.length === 0)    { setError('Please select at least one play style.'); return; }
    if (profile.language.length === 0) { setError('Please select at least one language.'); return; }
    const hasAnyContact = !!(
      profile.discord.trim() || profile.email.trim() || profile.psnHandle.trim() ||
      profile.steamHandle.trim() || profile.otherContact.trim()
    );
    if (hasAnyContact && !profile.contactShareConsent) {
      setError('Please agree to share your contact details, or clear them to skip this.');
      return;
    }

    setLoading(true);
    const consentChanged = profile.contactShareConsent !== consentAtLoad.current;
    const payload = {
      name:         profile.name,
      age:          profile.age || null,
      city:         profile.city || null,
      language:     profile.language,
      platform:     profile.platform,
      games:        profile.games,
      style:        profile.style,
      availability: profile.availability,
      open_irl:     profile.lookingFor === 'irl' || profile.lookingFor === 'both',
      consent:      profile.consent,
      looking_for:  profile.lookingFor,
      email:                profile.email || null,
      discord:              profile.discord || null,
      psn_handle:           profile.psnHandle || null,
      steam_handle:         profile.steamHandle || null,
      other_contact:        profile.otherContact || null,
      other_contact_label:  profile.otherContactLabel || null,
      share_discord:        profile.shareDiscord,
      share_email_contact:  profile.shareEmailContact,
      share_psn:            profile.sharePsn,
      share_steam:          profile.shareSteam,
      share_other:          profile.shareOther,
      contact_share_consent:    profile.contactShareConsent,
      ...(consentChanged ? { contact_share_consent_at: profile.contactShareConsent ? new Date().toISOString() : null } : {}),
    };

    // update() plutôt qu'upsert() : ON CONFLICT DO UPDATE exige un SELECT
    // table-level sur profiles, révoqué par SEC-02 (anon/authenticated n'ont
    // que des GRANT colonne) — l'upsert renvoie systématiquement 403 ici,
    // qu'on soit connecté ou non, profil lié ou non.
    const { error: dbError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profile.profileId)
      .select('id')
      .single();

    setLoading(false);
    if (dbError) {
      console.error('[profile/edit] update failed:', dbError);
      // Un profil déjà lié à un compte (Magic Link) ne peut être sauvegardé
      // que par une session authentifiée — cas le plus probable d'un 403 ici.
      if (!isAuthenticated) {
        setNeedsLogin(true);
        setError('Your session has expired. Please sign in to save changes to this profile.');
      } else {
        // POC : message brut affiché pour diagnostiquer plus vite un 403 inattendu.
        setError(`Something went wrong. Please try again. (${dbError.message})`);
      }
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
          <Link href="/matches" className="text-sm text-muted hover:text-text transition">← Back to matches</Link>
        </div>
        <p className="mt-2 text-sm text-muted">All your changes are saved instantly to your account.</p>
      </div>

      {/* Bannière de succès */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/40 bg-green-500/10 px-5 py-4">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium text-green-400">Profile updated successfully!</p>
        </div>
      )}

      <div className="flex flex-col gap-8">

        {/* Section : Identité */}
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text">
              City <span className="text-muted text-xs">(helps find nearby players)</span>
            </label>
            <input
              className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
              placeholder="Your city (optional)"
              value={profile.city}
              onChange={(e) => setProfile({ city: e.target.value })}
            />
          </div>
        </section>

        {/* Section : Jeux */}
        <section className="rounded-2xl border border-border bg-panel p-6 flex flex-col gap-5">
          <h2 className="text-base font-bold text-text">🎮 Games <span className="text-accent">*</span></h2>
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
                  >×</button>
                </span>
              ))}
            </div>
          )}
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
                {dropdownSuggestions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addGame(g); }}
                    className="flex w-full items-center px-4 py-3 text-sm text-text hover:bg-panel2 transition"
                  >{g}</button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section : Comment tu joues */}
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
              Availability <span className="text-muted font-normal">(optional)</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {SLOTS.map((s) => (
                <Chip key={s} label={s} selected={profile.availability.includes(s)} onClick={() => toggleMulti('availability', s)} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">You&apos;re here to…</h3>
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
                        ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(124,92,255,0.2)]'
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
        </section>

        {/* Section : Contact settings */}
        <section className="rounded-2xl border border-border bg-panel p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-base font-bold text-text">📬 Contact settings</h2>
            <p className="mt-1 text-xs text-muted">Never shown publicly — only revealed on a mutual match.</p>
          </div>
          <ContactFieldsEditor values={profile} onChange={setProfile} />
        </section>

        {error && (
          <p className="text-sm text-red-400 -mt-4">
            {error}
            {needsLogin && (
              <>
                {' '}
                <Link href="/login" className="underline underline-offset-2 hover:opacity-80">
                  Sign in
                </Link>
              </>
            )}
          </p>
        )}

        {/* Actions */}
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
