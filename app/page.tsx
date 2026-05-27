'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';

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
    desc: 'Not a global feed. Every profile you see is someone you could actually meet.',
    tag: 'Local',
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

export default function HomePage() {
  const { profile, setProfile } = useOverflowStore();
  const [mounted, setMounted] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  const whyReveal = useScrollReveal(mounted);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (typeof count === 'number') setPlayerCount(count);
      });
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const profileId = profile.profileId;
    if (!profileId || profile.name) return;
    setLoadingProfile(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProfile({
            profileId: data.id,
            name: data.name ?? '',
            age: data.age ?? '',
            city: data.city ?? 'Utrecht',
            language: Array.isArray(data.language) ? data.language : (data.language ? [data.language] : []),
            platform: data.platform ?? '',
            games: Array.isArray(data.games) ? data.games : [],
            style: data.style ?? '',
            availability: Array.isArray(data.availability) ? data.availability : [],
            openIRL: data.open_irl ?? false,
            consent: data.consent ?? false,
            email: data.email ?? '',
            discord: data.discord ?? '',
          });
        }
        setLoadingProfile(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, profile.profileId]);

  if (!mounted) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          <div className="text-sm text-muted">Utrecht only · Free</div>
        </header>
      </main>
    );
  }

  const hasProfile = !!profile.profileId;
  const isReady = hasProfile && !loadingProfile;
  const showBadge = playerCount !== null && playerCount >= BADGE_MIN_PLAYERS;

  // ── RETURNING USER ────────────────────────────────────────────
  if (hasProfile) {
    const games = (profile.games ?? []).join(', ');
    const summaryLines = [
      profile.name && { label: 'Name', value: profile.name },
      games && { label: 'Games', value: games },
      profile.platform && { label: 'Platform', value: profile.platform },
      profile.style && { label: 'Style', value: profile.style },
      (profile.availability ?? []).length > 0 && { label: 'Available', value: (profile.availability ?? []).join(', ') },
      profile.city && { label: 'City', value: profile.city },
      profile.openIRL && { label: 'IRL events', value: 'Open to it' },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          <div className="text-sm text-muted">Utrecht only · MVP</div>
        </header>
        <section className="grid flex-1 items-start gap-8 py-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.25em] text-accent">Welcome back</p>
            <h1 className="max-w-xl text-5xl font-black leading-tight text-text md:text-6xl">
              Hey{profile.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              Your profile is live. Check your matches or update your info anytime.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/matches"><Button>See my matches</Button></Link>
              <Link href="/onboarding" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text hover:bg-panel2 transition-colors">
                Edit profile
              </Link>
            </div>
          </div>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Your profile</h2>
              <Link href="/onboarding" className="text-xs text-accent underline">Edit</Link>
            </div>
            {!isReady ? (
              <div className="mt-5 grid gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-4 w-24 rounded bg-panel2 animate-pulse" />
                    <div className="h-4 w-36 rounded bg-panel2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-5 grid gap-3">
                {summaryLines.map((line) => (
                  <li key={line.label} className="flex gap-3 text-sm">
                    <span className="w-32 shrink-0 text-muted">{line.label}</span>
                    <span className="font-medium text-text">{line.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </main>
    );
  }

  // ── NEW VISITOR ──────────────────────────────────────────────────
  const v = heroVisible;

  return (
    <>
      <style>{`
        /* ───────────────────────────────────────────────── */
        /* Token vert tertiaire                                   */
        /* ───────────────────────────────────────────────── */
        :root { --of-green: #4ade80; --of-green-dim: rgba(74,222,128,0.12); }

        /* ───────────────────────────────────────────────── */
        /* DOT GRID — wrapper fixe pleine page                    */
        /* ───────────────────────────────────────────────── */
        .of-dots {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          /* Masque uniquement ce div, pas le contenu */
          -webkit-mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
        }
        /* Glow orange subtil */
        .of-glow {
          position: fixed;
          top: -20%;
          left: -10%;
          width: 65vw;
          height: 65vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,122,0,0.055) 0%, rgba(255,122,0,0.01) 45%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        /* ───────────────────────────────────────────────── */
        /* Reveal animations                                       */
        /* ───────────────────────────────────────────────── */
        @keyframes of-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .of-r0 { animation: of-up 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r1 { animation: of-up 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r2 { animation: of-up 0.6s 0.30s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r3 { animation: of-up 0.6s 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .of-r4 { animation: of-up 0.6s 0.60s cubic-bezier(0.16,1,0.3,1) both; }

        /* ───────────────────────────────────────────────── */
        /* Sweep headline — 2s                                     */
        /* ───────────────────────────────────────────────── */
        @keyframes of-sweep {
          from { background-position: 200% center; }
          to   { background-position:   0% center; }
        }
        .of-sweep {
          display: inline-block;
          background: linear-gradient(90deg, #ff7a00 30%, #ffcc88 50%, #ff7a00 70%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: of-sweep 2s 0.55s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* ───────────────────────────────────────────────── */
        /* Why cards — reset gradient + scroll reveal               */
        /* ───────────────────────────────────────────────── */
        .of-why,
        .of-why * {
          background-image: none !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
          -webkit-text-fill-color: unset !important;
        }
        .of-why {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1),
                      transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .of-why.of-on { opacity: 1; transform: translateY(0); }

        /* ───────────────────────────────────────────────── */
        /* Vert — dot de statut pulse                              */
        /* ───────────────────────────────────────────────── */
        @keyframes of-dot {
          0%,100% { box-shadow: 0 0 0 0   rgba(74,222,128,0.7); }
          50%      { box-shadow: 0 0 0 5px rgba(74,222,128,0);   }
        }
        .of-dot {
          background-color: var(--of-green);
          animation: of-dot 2s ease-in-out infinite;
        }

        /* ───────────────────────────────────────────────── */
        /* Badges tertiaires verts                                 */
        /* ───────────────────────────────────────────────── */
        .of-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--of-green);
          background: var(--of-green-dim);
          border: 1px solid rgba(74,222,128,0.2);
          margin-bottom: 6px;
        }
        .of-tag::before {
          content: '';
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--of-green);
          opacity: 0.8;
        }

        /* Texte vert utilitaire */
        .of-green { color: var(--of-green); }

        /* ───────────────────────────────────────────────── */
        /* CTA glow hover                                           */
        /* ───────────────────────────────────────────────── */
        .of-cta {
          transition: transform 0.2s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .of-cta:hover {
          transform: scale(1.04) translateY(-1px);
          box-shadow: 0 0 32px 6px rgba(255,122,0,0.25), 0 4px 16px rgba(0,0,0,0.4);
        }
        .of-cta:active { transform: scale(0.97); }
      `}</style>

      {/* Layers de fond — séparés du contenu */}
      <div className="of-dots" aria-hidden="true" />
      <div className="of-glow" aria-hidden="true" />

      <main
        className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10"
        style={{ backgroundColor: '#0a0a0a', zIndex: 1 }}
      >
        <header className="relative z-10 flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          {/* Header : tag vert “Live” */}
          <div className="flex items-center gap-3">
            <span className="of-tag">Live</span>
            <span className="text-sm text-muted">Utrecht only · Free</span>
          </div>
        </header>

        {/* Hero */}
        <section className="relative z-10 flex flex-1 flex-col justify-center py-16 lg:py-24">
          <div className="max-w-3xl">

            {/* Badge compteur — dot vert */}
            <div className={v ? 'of-r0 mb-6' : 'mb-6 opacity-0'}>
              {showBadge ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
                  <span className="of-dot inline-block h-1.5 w-1.5 rounded-full" />
                  <span>{playerCount} gamers in Utrecht</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
                  <span className="of-dot inline-block h-1.5 w-1.5 rounded-full" />
                  <span>Utrecht · Local matchmaking</span>
                </span>
              )}
            </div>

            {/* Headline */}
            <h1 className={`${v ? 'of-r1' : 'opacity-0'} text-5xl font-black leading-[1.08] tracking-tight text-text md:text-7xl`}>
              Find your teammates.<br />
              <span className={v ? 'of-sweep' : 'text-accent'}>Play together.</span>
            </h1>

            {/* Sub */}
            <p className={`${v ? 'of-r2' : 'opacity-0'} mt-6 max-w-xl text-lg leading-8 text-muted`}>
              OverFlow connects gamers in Utrecht — same games, same schedule, real meetups.<br />
              No feed, no algorithm. Just people who want to play.
            </p>

            {/* CTA */}
            <div className={`${v ? 'of-r3' : 'opacity-0'} mt-10 flex flex-wrap items-center gap-4`}>
              <Link href="/onboarding">
                <Button className="of-cta px-8 py-4 text-base font-bold">Find my teammates</Button>
              </Link>
            </div>

            {/* Social proof — accents verts sur les mots clés */}
            <p className={`${v ? 'of-r4' : 'opacity-0'} mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted`}>
              <span className="of-green font-semibold">✓ Free</span>
              <span className="text-border">·</span>
              <span>No account needed</span>
              <span className="text-border">·</span>
              <span className="of-green font-semibold">✓ Utrecht only</span>
            </p>
          </div>
        </section>

        {/* Why OverFlow — scroll reveal cascade + tags verts */}
        <section ref={whyReveal.ref} className="relative z-10 border-t border-border py-16">
          <p className="mb-10 text-xs uppercase tracking-[0.25em] text-muted">Why OverFlow?</p>
          <div className="grid gap-10 sm:grid-cols-3">
            {WHY_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={`of-why${whyReveal.visible ? ' of-on' : ''}`}
                style={{ transitionDelay: `${i * 130}ms` }}
              >
                <span className="of-tag">{item.tag}</span>
                <div className="mb-3 text-2xl">{item.icon}</div>
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
