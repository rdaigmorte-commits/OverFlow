'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ProfileSummary } from '@/components/ProfileSummary';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';
import { normalizeArray } from '@/lib/match';

function useScrollReveal(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [enabled]);
  return { ref, visible };
}

const WHY_ITEMS = [
  {
    shape: 'circle' as const,
    bg: '#F1ECFF', border: '#E2D8FF', iconBg: '#7C5CFF',
    title: 'Local only',
    desc: 'Not a global feed — everyone you see is someone you could actually meet.',
  },
  {
    shape: 'triangle' as const,
    bg: '#FFF6DE', border: '#FBE9B8', iconBg: '#FFC83D',
    title: 'Smart match',
    desc: 'Matched by games, playstyle, language and schedule — not just location.',
  },
  {
    shape: 'square' as const,
    bg: '#E7F8E4', border: '#C9F0C1', iconBg: '#46C93A',
    title: 'Real meetups',
    desc: 'The goal is a session together — the bridge from online profiles to real play.',
  },
];

const PATH_STEPS = [
  { n: 1, bg: '#7C5CFF', shadow: '#5E42D6', title: 'Create your profile', desc: 'Games, style, schedule' },
  { n: 2, bg: '#FFC83D', shadow: '#E0A016', title: 'Match on vibe', desc: 'Shared interests' },
  { n: 3, bg: '#46C93A', shadow: '#2E9E24', title: 'Play together', desc: 'Online or IRL' },
];

// Duos plutôt que 3 avatars isolés — chaque paire est reliée par un connecteur qui
// montre POURQUOI ils sont matchés (jeu, plateforme), pour rendre le concept de
// squad/matching lisible d'un coup d'œil. Positions en % pour rester proportionnées
// à toute largeur d'écran (visible aussi sur mobile, plus seulement lg:).
const SQUAD_DUOS = [
  {
    id: 'duo1',
    top: '2%', left: '0%', right: 'auto',
    a: { initials: 'JV', bg: 'linear-gradient(135deg,#7C5CFF,#9D86FF)', shadow: 'rgba(124,92,255,.5)' },
    b: { initials: 'MK', bg: 'linear-gradient(135deg,#FFC83D,#FFB01F)', shadow: 'rgba(255,176,31,.5)' },
    connector: { icon: '🎮', label: 'Valorant' },
    showMatchLabel: true,
    anim: 'of-bob 4.4s ease-in-out infinite',
  },
  {
    id: 'duo2',
    top: 'auto', bottom: '4%', left: 'auto', right: '0%',
    a: { initials: 'TB', bg: 'linear-gradient(135deg,#38BDF8,#0EA5E9)', shadow: 'rgba(14,165,233,.5)' },
    b: { initials: 'RN', bg: 'linear-gradient(135deg,#46C93A,#2E9E24)', shadow: 'rgba(70,201,58,.5)' },
    connector: { icon: '🖥️', label: 'PC' },
    showMatchLabel: true,
    anim: 'of-bob3 5s ease-in-out infinite',
  },
];

const MARQUEE_ITEMS = [
  { label: 'MATCH', glyph: '○', color: '#FF6B6B' },
  { label: 'PLAY', glyph: '✕', color: '#38BDF8' },
  { label: 'MEET', glyph: '△', color: '#46C93A' },
  { label: 'REPEAT', glyph: '□', color: '#7C5CFF' },
];

const DISCORD_URL = 'https://discord.gg/j2PCTYZ78j';

function DiscordIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * (96.36 / 127.14)} viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden="true">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

interface Props {
  playerCount: number | null;
  topGames: { name: string; count: number }[];
}

export function LandingPageClient({ playerCount, topGames }: Props) {
  const { profile, setProfile, reset } = useOverflowStore();
  const [mounted, setMounted] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const whyReveal = useScrollReveal(mounted);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') reset();
    });
    return () => subscription.unsubscribe();
  }, [reset]);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const profileId = profile.profileId;
    if (!profileId || profile.name) return;
    setLoadingProfile(true);
    supabase
      .from('profiles')
      .select('id, name, age, city, language, platform, games, style, availability, open_irl, consent')
      .eq('id', profileId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProfile({
            profileId: data.id,
            name: data.name ?? '',
            age: data.age ?? '',
            city: data.city ?? '',
            language: Array.isArray(data.language) ? data.language : (data.language ? [data.language] : []),
            platform: normalizeArray(data.platform),
            games: Array.isArray(data.games) ? data.games : [],
            style: normalizeArray(data.style),
            availability: Array.isArray(data.availability) ? data.availability : [],
            openIRL: data.open_irl ?? false,
            consent: data.consent ?? false,
          });
        }
        setLoadingProfile(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, profile.profileId]);

  // Fallback : si localStorage vide mais session auth active, retrouve le profil via user_id
  useEffect(() => {
    if (!mounted || profile.profileId) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, name, age, city, language, platform, games, style, availability, open_irl, consent')
        .eq('user_id', session.user.id)
        .single();
      if (data) {
        setProfile({
          profileId:    data.id,
          name:         data.name ?? '',
          age:          data.age ?? '',
          city:         data.city ?? '',
          language:     Array.isArray(data.language) ? data.language : (data.language ? [data.language] : []),
          platform:     normalizeArray(data.platform),
          games:        Array.isArray(data.games) ? data.games : [],
          style:        normalizeArray(data.style),
          availability: Array.isArray(data.availability) ? data.availability : [],
          openIRL:      data.open_irl ?? false,
          consent:      data.consent ?? false,
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, profile.profileId]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    reset();
    setSigningOut(false);
  }

  if (!mounted) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          <div className="text-sm text-muted">Local · Free</div>
        </header>
      </main>
    );
  }

  const hasProfile = !!profile.profileId;

  // ── RETURNING USER ─────────────────────────────────────────────
  if (hasProfile) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <header className="flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-xs text-muted hover:text-text transition disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </header>

        <section className="flex flex-col gap-6 pt-10">
          <p className="inline-flex w-fit rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.25em] text-accent">Welcome back</p>

          <h1 className="text-5xl font-black leading-tight text-text md:text-6xl">
            Hey{profile.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </h1>

          {loadingProfile ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-panel2 animate-pulse" />
              ))}
            </div>
          ) : (
            <ProfileSummary
              name={profile.name}
              games={profile.games ?? []}
              platform={profile.platform}
              style={profile.style}
              language={profile.language ?? []}
              availability={profile.availability ?? []}
              city={profile.city}
              openIRL={profile.openIRL}
            />
          )}

          <p className="text-lg leading-8 text-muted">
            Your profile is live. Check your matches or update your info anytime.
          </p>

          <div>
            <Link href="/matches" className="btn-primary-new px-6 py-3 text-sm">
              See my matches
            </Link>
          </div>

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="of-lift flex items-center gap-4 rounded-2xl border-2 p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--panel2)' }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: '#5865F2' }}>
              <DiscordIcon size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Join the Discord</p>
              <p className="text-xs text-muted">Meet other Utrecht players, or drop a bug/idea for the team.</p>
            </div>
          </a>
        </section>
      </main>
    );
  }

  // ── NEW VISITOR ──────────────────────────────────────────────────
  const v = heroVisible;

  return (
    <>
      <style>{`
        @keyframes of-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .of-r0 { animation: of-up 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r1 { animation: of-up 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r2 { animation: of-up 0.6s 0.30s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r3 { animation: of-up 0.6s 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r4 { animation: of-up 0.6s 0.60s cubic-bezier(0.16,1,0.3,1) both; }
        .of-why, .of-why * {
          background-image: none !important;
          -webkit-background-clip: unset !important; background-clip: unset !important;
          -webkit-text-fill-color: unset !important;
        }
        .of-why {
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .of-why.of-on { opacity: 1; transform: translateY(0); }
        @keyframes of-dot {
          0%,100% { box-shadow: 0 0 0 0   rgba(70,201,58,0.7); }
          50%      { box-shadow: 0 0 0 5px rgba(70,201,58,0);   }
        }
        .of-dot { background-color: var(--accent3); animation: of-dot 2s ease-in-out infinite; }
        .of-dots {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(27,27,35,0.06) 1px, transparent 1px);
          background-size: 30px 30px;
          -webkit-mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 55%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 55%, transparent 100%);
        }
        @keyframes of-bob  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes of-bob2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes of-bob3 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes of-wob  { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(12deg); } }
        @keyframes of-ping { 0% { box-shadow: 0 0 0 0 rgba(255,107,107,.5); } 100% { box-shadow: 0 0 0 14px rgba(255,107,107,0); } }
        .of-shape { position: absolute; pointer-events: none; }
        @keyframes of-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .of-marquee-track { display: inline-flex; animation: of-marquee 22s linear infinite; white-space: nowrap; }
        @keyframes of-dash { from { background-position: 0 0; } to { background-position: 40px 0; } }
        .of-path-line {
          background-image: radial-gradient(circle, #C9C1B0 2px, transparent 2px);
          background-size: 20px 6px; background-repeat: repeat-x;
          animation: of-dash 1.2s linear infinite;
        }
        @keyframes of-walk { from { left: 8%; } to { left: 88%; } }
        .of-path-walker { animation: of-walk 6s ease-in-out infinite alternate; }
        .of-lift { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease; }
        .of-lift:hover { transform: translateY(-4px); }
      `}</style>

      <div className="of-dots" aria-hidden="true" />

      <main
        className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10"
        style={{ backgroundColor: '#FDFBF6', zIndex: 1 }}
      >
        {/* ── NAV ─────────────────────────────────────────────────── */}
        <header className="relative z-10 flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold tracking-[-0.02em] text-accent">
              Over<span className="text-text">Flow</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-1" aria-hidden="true">
              <span className="inline-block h-3 w-3 rounded-full border-[3px]" style={{ borderColor: '#FF6B6B' }} />
              <svg width="14" height="13"><line x1="2" y1="2" x2="12" y2="11" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" /><line x1="12" y1="2" x2="2" y2="11" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" /></svg>
              <svg width="14" height="13"><polygon points="7,2 13,11 1,11" fill="none" stroke="#46C93A" strokeWidth="3" strokeLinejoin="round" /></svg>
              <span className="inline-block h-3 w-3 rounded-[3px] border-[3px]" style={{ borderColor: '#7C5CFF' }} />
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-accent">
            🌱 Early Access
          </span>
        </header>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className="relative z-10 grid flex-1 items-center gap-10 pt-16 pb-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24 lg:pb-8">
          <div>

            <div className={v ? 'of-r0 mb-6' : 'mb-6 opacity-0'}>
              <span className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em]" style={{ borderColor: '#B9EBB0', background: '#E7F8E4', color: '#2E9E24' }}>
                <span className="of-dot inline-block h-2 w-2 rounded-full" />
                <span>Utrecht · Local matchmaking</span>
              </span>
            </div>

            <h1 className={`${v ? 'of-r1' : 'opacity-0'} text-5xl font-black leading-[1.05] tracking-tight text-text md:text-7xl`}>
              Find your <span className="relative inline-block" style={{ color: 'var(--accent)' }}>
                squad.
                <span className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded" style={{ background: '#DED2FF' }} />
              </span><br />
              Play <span className="relative inline-block" style={{ color: 'var(--accent3)' }}>
                IRL.
                <span className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded" style={{ background: '#C9F5C2' }} />
              </span>
            </h1>

            <p className={`${v ? 'of-r2' : 'opacity-0'} mt-6 max-w-xl text-lg leading-8 text-muted`}>
              Same games, same city, same vibe. OverFlow connects you with players who actually want to team up.
              No feed, no algorithm, just real people who want to play.
            </p>

            <div className={`${v ? 'of-r3' : 'opacity-0'} mt-8 flex flex-wrap items-center gap-4`}>
              <Link href="/onboarding" className="btn-primary-new px-8 py-4 text-base font-bold">
                Start — it&apos;s free
              </Link>
              <span className="text-sm leading-tight text-muted">
                No account needed<br />Ready in 2 min
              </span>
            </div>

            {playerCount !== null && playerCount > 0 && (
              <p className={`${v ? 'of-r4' : 'opacity-0'} mt-6 text-sm text-muted`}>
                <span className="font-semibold text-text">{playerCount} active players</span> already in Utrecht
              </p>
            )}

            <p className={`${v ? 'of-r4' : 'opacity-0'} mt-3 text-xs text-muted`}>
              Already have a profile?{' '}
              <Link href="/login" className="text-accent underline underline-offset-2 hover:opacity-80 transition">
                Recover access →
              </Link>
            </p>
          </div>

          {/* Decorative squad visual — visible à toutes les tailles d'écran */}
          <div className="relative h-[220px] sm:h-[280px] lg:h-[350px]" aria-hidden="true">
            {/* Formes de fond ○✕△□ — toujours visibles, dans les coins libres entre les 2 duos diagonaux */}
            <svg width="52" height="48" className="of-shape" style={{ top: '2%', right: '4%', animation: 'of-bob2 5s ease-in-out infinite' }}>
              <polygon points="26,4 48,44 4,44" fill="none" stroke="#46C93A" strokeWidth="7" strokeLinejoin="round" />
            </svg>
            <span className="of-shape rounded-full" style={{ top: '38%', right: '14%', width: 40, height: 40, border: '7px solid #FF6B6B', animation: 'of-bob 4.2s ease-in-out infinite' }} />
            <span className="of-shape rounded-lg" style={{ bottom: '30%', left: '4%', width: 36, height: 36, border: '7px solid #7C5CFF', animation: 'of-wob 5s ease-in-out infinite' }} />
            <svg width="44" height="44" className="of-shape" style={{ bottom: '14%', left: '22%', animation: 'of-bob3 4.6s ease-in-out infinite' }}>
              <line x1="7" y1="7" x2="37" y2="37" stroke="#38BDF8" strokeWidth="7" strokeLinecap="round" />
              <line x1="37" y1="7" x2="7" y2="37" stroke="#38BDF8" strokeWidth="7" strokeLinecap="round" />
            </svg>

            {/* Duos matchés — chaque paire reliée par ce qui les a fait matcher */}
            {SQUAD_DUOS.map((duo) => (
              <div
                key={duo.id}
                className="of-shape flex items-center gap-2"
                style={{ top: duo.top, left: duo.left, right: duo.right, bottom: duo.bottom, animation: duo.anim }}
              >
                <div
                  className="flex shrink-0 items-center justify-center rounded-[24px]"
                  style={{ width: 'clamp(52px, 15vw, 68px)', height: 'clamp(52px, 15vw, 68px)', background: duo.a.bg, boxShadow: `0 14px 28px -10px ${duo.a.shadow}` }}
                >
                  <span className="font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)', fontSize: 'clamp(18px, 5vw, 24px)' }}>{duo.a.initials}</span>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  {duo.showMatchLabel && (
                    <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--accent3)' }}>
                      ✓ Match!
                    </span>
                  )}
                  <div
                    className="flex items-center gap-1 rounded-full border-2 bg-white px-2.5 py-1.5 text-xs font-bold"
                    style={{ borderColor: '#EFEAE0', color: 'var(--text)', boxShadow: '0 8px 18px -8px rgba(27,27,35,.2)' }}
                  >
                    <span>{duo.connector.icon}</span>
                    {duo.connector.label}
                  </div>
                </div>
                <div
                  className="flex shrink-0 items-center justify-center rounded-[24px]"
                  style={{ width: 'clamp(52px, 15vw, 68px)', height: 'clamp(52px, 15vw, 68px)', background: duo.b.bg, boxShadow: `0 14px 28px -10px ${duo.b.shadow}` }}
                >
                  <span className="font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)', fontSize: 'clamp(18px, 5vw, 24px)' }}>{duo.b.initials}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MOST PLAYED ─────────────────────────────────────────── */}
        {topGames.length >= 4 && (
          <section className="relative z-10 flex flex-wrap items-center gap-3 pb-6">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Most played</span>
            {topGames.map((g) => (
              <span key={g.name} className="inline-flex items-center gap-2 rounded-full border border-border bg-panel2 px-3.5 py-1.5 text-sm font-semibold text-text">
                {g.name}
                {g.count > 0 && <span className="font-bold" style={{ color: '#2E9E24' }}>{g.count}</span>}
              </span>
            ))}
          </section>
        )}

        {/* ── MARQUEE ─────────────────────────────────────────────── */}
        <section className="relative z-10 -mx-6 overflow-hidden border-y-2 py-3" style={{ background: '#F1ECFF', borderColor: '#E2D8FF' }} aria-hidden="true">
          <div className="of-marquee-track">
            {[0, 1].map((rep) => (
              <span key={rep} className="flex items-center gap-2 pr-2 font-medium tracking-[0.1em] text-text" style={{ fontFamily: 'var(--font-fredoka)', fontSize: 14 }}>
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {MARQUEE_ITEMS.map((m) => (
                      <span key={m.label} className="flex items-center gap-2">
                        {m.label}
                        <span style={{ color: m.color }}>{m.glyph}</span>
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </section>

        {/* ── GAMIFIED PATH ───────────────────────────────────────── */}
        <section className="relative z-10 -mx-6 mt-4 rounded-[28px] px-4 py-10 sm:px-8 sm:py-12" style={{ background: '#F4EFE4' }}>
          <p className="mb-9 text-center text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fredoka)' }}>
            How it works — 3 steps
          </p>
          <div className="relative mx-auto flex max-w-3xl items-start justify-between">
            <div className="of-path-line absolute left-[8%] right-[8%] top-7 sm:top-9 h-1.5 rounded-full" />
            <div className="of-path-walker absolute top-5 sm:top-7 rounded-full" style={{ width: 22, height: 22, background: 'var(--accent3)', boxShadow: '0 0 0 6px rgba(70,201,58,.2)' }} />
            {PATH_STEPS.map((s) => (
              <div key={s.n} className="relative z-10 flex w-1/3 flex-col items-center gap-2 px-1 sm:gap-3">
                <div
                  className="flex items-center justify-center rounded-full text-white"
                  style={{ width: 'clamp(44px, 12vw, 76px)', height: 'clamp(44px, 12vw, 76px)', background: s.bg, boxShadow: `0 6px 0 ${s.shadow}`, fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 'clamp(18px, 5vw, 30px)' }}
                >
                  {s.n}
                </div>
                <span className="text-center font-bold text-text" style={{ fontSize: 'clamp(10px, 2.9vw, 16px)' }}>{s.title}</span>
                <span className="text-center leading-snug text-muted" style={{ fontSize: 'clamp(9px, 2.5vw, 14px)' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHY CARDS ───────────────────────────────────────────── */}
        <section ref={whyReveal.ref} className="relative z-10 py-16">
          <div className="grid gap-5 sm:grid-cols-3">
            {WHY_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={`of-why of-lift rounded-[22px] border-2 p-6${whyReveal.visible ? ' of-on' : ''}`}
                style={{ background: item.bg, borderColor: item.border, transitionDelay: `${i * 130}ms` }}
              >
                <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ background: item.iconBg }}>
                  {item.shape === 'circle' && <span className="h-5 w-5 rounded-full border-[5px] border-white" />}
                  {item.shape === 'triangle' && (
                    <svg width="24" height="22"><polygon points="12,3 22,19 2,19" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" /></svg>
                  )}
                  {item.shape === 'square' && <span className="h-[18px] w-[18px] rounded-[5px] border-[5px] border-white" />}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text" style={{ fontFamily: 'var(--font-fredoka)' }}>{item.title}</h3>
                <p className="text-sm leading-6" style={{ color: '#6B6B76' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── DISCORD + FOOTER CTA ────────────────────────────────── */}
        <div className="relative z-10 mb-6 grid gap-5 lg:grid-cols-2">

          <section
            className="flex flex-col items-start gap-5 rounded-[26px] border-2 p-8"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: '#5865F2' }}>
                <DiscordIcon size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Community</span>
                <h3 className="mt-1 text-lg font-semibold text-text" style={{ fontFamily: 'var(--font-fredoka)' }}>Come say hi</h3>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted">
              Our Discord already has a bunch of Utrecht players hanging out. It&apos;s way easier to introduce yourself and meet people than a cold match request. Found a bug or got an idea to improve OverFlow? Drop it there too, we&apos;re around.
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="of-lift inline-flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white"
              style={{ background: '#5865F2' }}
            >
              <DiscordIcon size={18} />
              Join the Discord →
            </a>
          </section>

          <section
            className="relative flex flex-col items-start justify-center gap-5 overflow-hidden rounded-[26px] p-8"
            style={{ background: 'linear-gradient(135deg,#7C5CFF,#9D86FF)' }}
          >
            <svg width="70" height="66" className="of-shape opacity-20" style={{ top: '-14px', right: '40px' }} aria-hidden="true">
              <polygon points="35,8 64,60 6,60" fill="none" stroke="#fff" strokeWidth="8" strokeLinejoin="round" />
            </svg>
            <span className="of-shape rounded-full opacity-20" style={{ bottom: '-16px', right: '20px', width: 60, height: 60, border: '8px solid #fff' }} aria-hidden="true" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>Ready to find your squad?</h2>
              <p className="mt-2 text-sm text-white/85">
                {playerCount !== null && playerCount > 0
                  ? `Join ${playerCount} players in Utrecht. It only takes 2 minutes.`
                  : 'It only takes 2 minutes to get started.'}
              </p>
            </div>
            <Link href="/onboarding" className="relative z-10 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-accent shadow-[0_6px_0_rgba(0,0,0,0.18)] transition active:translate-y-1 active:shadow-[0_1px_0_rgba(0,0,0,0.18)]" style={{ fontFamily: 'var(--font-fredoka)' }}>
              Start now →
            </Link>
          </section>

        </div>

      </main>
    </>
  );
}
