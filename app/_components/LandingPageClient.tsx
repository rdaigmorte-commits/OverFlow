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

const BADGE_MIN_PLAYERS = 10;

const WHY_ITEMS = [
  {
    icon: '📍',
    title: 'Utrecht only',
    desc: 'Not a global feed. Every profile you see is someone you could actually meet in Utrecht.',
    tag: 'Utrecht',
  },
  {
    icon: '🎮',
    title: 'Same games, same vibe',
    desc: 'Matched by games, playstyle, language and schedule — not just location.',
    tag: 'Smart match',
  },
  {
    icon: '🤝',
    title: 'Real meetups',
    desc: 'The goal is a session IRL. OverFlow is the bridge between online profiles and real play.',
    tag: 'IRL ready',
  },
];

const AVATAR_EMOJIS = ['🎮', '🕹️', '🃏', '⚔️', '🏆', '🎲', '🖥️'];
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f97066,#f59e0b)',
  'linear-gradient(135deg,#34d399,#059669)',
  'linear-gradient(135deg,#60a5fa,#7c3aed)',
  'linear-gradient(135deg,#fb7185,#e879f9)',
];

interface Props {
  playerCount: number | null;
  topGames: string[];
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
  const showBadge = playerCount !== null && playerCount >= BADGE_MIN_PLAYERS;

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
        .of-r5 { animation: of-up 0.6s 0.72s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r6 { animation: of-up 0.6s 0.84s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes of-sweep {
          from { background-position: 200% center; }
          to   { background-position:   0% center; }
        }
        .of-sweep {
          display: inline-block;
          background: linear-gradient(90deg, var(--accent) 30%, #b8affe 50%, var(--accent) 70%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: of-sweep 2s 0.55s cubic-bezier(0.16,1,0.3,1) both;
        }
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
          0%,100% { box-shadow: 0 0 0 0   rgba(52,211,153,0.7); }
          50%      { box-shadow: 0 0 0 5px rgba(52,211,153,0);   }
        }
        .of-dot { background-color: var(--accent3); animation: of-dot 2s ease-in-out infinite; }
        .of-tag {
          display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px;
          border-radius: 999px; font-size: 0.65rem; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--accent3); background: rgba(52,211,153,0.12);
          border: 1px solid rgba(52,211,153,0.2);
        }
        .of-dots {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 30px 30px;
          -webkit-mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 55%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 55%, transparent 100%);
        }
      `}</style>

      <div className="of-dots" aria-hidden="true" />
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <main
        className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10"
        style={{ backgroundColor: 'var(--bg)', zIndex: 1 }}
      >
        <header className="relative z-10 flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          <div className="text-sm text-muted">Local · Free</div>
        </header>

        <section className="relative z-10 flex flex-1 flex-col justify-center py-16 lg:py-24">
          <div className="max-w-3xl">

            <div className={v ? 'of-r0 mb-6' : 'mb-6 opacity-0'}>
              {showBadge ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
                  <span className="of-dot inline-block h-1.5 w-1.5 rounded-full" />
                  <span>{playerCount} gamers · Utrecht</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
                  <span className="of-dot inline-block h-1.5 w-1.5 rounded-full" />
                  <span>Utrecht · Local matchmaking</span>
                </span>
              )}
            </div>

            <h1 className={`${v ? 'of-r1' : 'opacity-0'} text-5xl font-black leading-[1.08] tracking-tight text-text md:text-7xl`}>
              Find your teammates.<br />
              <span className={v ? 'of-sweep' : 'text-accent'}>Play together.</span>
            </h1>

            <p className={`${v ? 'of-r2' : 'opacity-0'} mt-6 max-w-xl text-lg leading-8 text-muted`}>
              OverFlow connects <strong className="text-text">gamers in Utrecht</strong> who actually want to meet up —
              same games, same vibe, same area.<br />
              No feed. No algorithm. Just <strong className="text-text">real humans</strong> who want to play.
            </p>

            {/* Rangée d'avatars */}
            <div className={`${v ? 'of-r2' : 'opacity-0'} mt-6 flex items-center`}>
              <div className="flex">
                {AVATAR_EMOJIS.slice(0, 5).map((emoji, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-[var(--bg)] flex items-center justify-center text-lg -ml-2 first:ml-0 transition-transform hover:-translate-y-1"
                    style={{ background: AVATAR_GRADIENTS[i], zIndex: 5 - i }}
                  >
                    {emoji}
                  </div>
                ))}
                {playerCount !== null && playerCount > 5 && (
                  <div className="w-9 h-9 rounded-full border-2 border-[var(--bg)] -ml-2 bg-panel flex items-center justify-center text-xs font-bold text-muted">
                    +{playerCount - 5}
                  </div>
                )}
              </div>
              {playerCount !== null && playerCount > 0 && (
                <div className="ml-4 text-sm text-muted leading-tight">
                  <span className="block font-semibold text-text">{playerCount} active players</span>
                  already in Utrecht
                </div>
              )}
            </div>

            <div className={`${v ? 'of-r3' : 'opacity-0'} mt-10 flex flex-wrap items-center gap-4`}>
              <Link href="/onboarding" className="btn-primary-new px-8 py-4 text-base font-bold">
                Find my teammates
              </Link>
            </div>

            <p className={`${v ? 'of-r4' : 'opacity-0'} mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted`}>
              <span className="font-semibold text-accent3">✓ Free</span>
              <span className="text-border">·</span>
              <span className="font-semibold text-accent3">✓ No account needed</span>
              <span className="text-border">·</span>
              <span className="font-semibold text-accent3">✓ Utrecht only</span>
            </p>

            {topGames.length >= 4 && (
              <p className={`${v ? 'of-r5' : 'opacity-0'} mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted`}>
                <span className="text-border">Most played ·</span>
                {topGames.map((g, i) => (
                  <span key={g} className="flex items-center gap-1.5">
                    <span className="text-text/70">{g}</span>
                    {i < topGames.length - 1 && <span className="text-border">·</span>}
                  </span>
                ))}
              </p>
            )}

            <p className={`${v ? 'of-r6' : 'opacity-0'} mt-6 text-xs text-muted`}>
              Already have a profile?{' '}
              <Link href="/login" className="text-accent underline underline-offset-2 hover:opacity-80 transition">
                Recover access →
              </Link>
            </p>

          </div>
        </section>

        <section ref={whyReveal.ref} className="relative z-10 border-t border-border py-16">
          <p className="mb-10 text-xs uppercase tracking-[0.25em] text-muted">Why OverFlow?</p>
          <div className="grid gap-10 sm:grid-cols-3">
            {WHY_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={`of-why card-hover rounded-2xl border border-border bg-panel p-6${whyReveal.visible ? ' of-on' : ''}`}
                style={{ transitionDelay: `${i * 130}ms` }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className="of-tag">{item.tag}</span>
                </div>
                <h3 className="mb-2 text-sm font-bold text-text">{item.title}</h3>
                <p className="text-sm leading-6 text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
