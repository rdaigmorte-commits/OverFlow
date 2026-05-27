'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';

function useReveal(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const BADGE_MIN_PLAYERS = 10;

const WHY_ITEMS = [
  {
    icon: '📍',
    title: 'Utrecht only',
    desc: 'Not a global feed. Every profile you see is someone you could actually meet.',
  },
  {
    icon: '🎮',
    title: 'Same games, same vibe',
    desc: 'Matched by games, playstyle, language and schedule — not just location.',
  },
  {
    icon: '🤝',
    title: 'Real meetups',
    desc: 'The goal is a session IRL. OverFlow is the bridge between online profiles and real play.',
  },
];

export default function HomePage() {
  const { profile, setProfile } = useOverflowStore();
  const [mounted, setMounted] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [playerCount, setPlayerCount] = useState<number | null>(null);

  const r0 = useReveal(0);
  const r1 = useReveal(120);
  const r2 = useReveal(260);
  const r3 = useReveal(400);
  const r4 = useReveal(520);
  const whyReveal = useScrollReveal();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (typeof count === 'number') setPlayerCount(count);
      });
  }, []);

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

  const hasProfile = mounted && !!profile.profileId;
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
  return (
    <>
      <style>{`
        @keyframes of-grain {
          0%,100% { transform:translate(0,0) }
          25%      { transform:translate(-1%,-1%) }
          50%      { transform:translate(1%,0) }
          75%      { transform:translate(0,1%) }
        }
        .of-grain::before {
          content:'';
          position:fixed;inset:-20%;
          width:140%;height:140%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size:180px 180px;
          opacity:0.028;
          pointer-events:none;
          z-index:0;
          animation:of-grain 8s steps(2) infinite;
        }
        @keyframes of-fadeslide {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .of-pulse { animation: of-pulse-dot 2s ease-in-out infinite; }
        @keyframes of-pulse-dot {
          0%,100% { box-shadow:0 0 0 0 rgba(255,122,0,0.5); }
          50%      { box-shadow:0 0 0 5px rgba(255,122,0,0); }
        }
        .of-cta { transition: transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s cubic-bezier(0.16,1,0.3,1); }
        .of-cta:hover { transform:scale(1.03); box-shadow:0 0 28px 4px rgba(255,122,0,0.2); }
        .of-cta:active { transform:scale(0.98); }
        .of-why-item {
          opacity:0;
          transform:translateY(14px);
          transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .of-why-item.of-visible { opacity:1; transform:translateY(0); }
      `}</style>

      <main className="of-grain relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">

        <header className="relative z-10 flex items-center justify-between py-2">
          <div className="text-xl font-bold tracking-[0.24em] text-accent">OVERFLOW</div>
          <div className="text-sm text-muted">Utrecht only · Free</div>
        </header>

        {/* Hero */}
        <section className="relative z-10 flex flex-1 flex-col justify-center py-16 lg:py-24">
          <div className="max-w-3xl">

            {/* Badge — RG: affiché uniquement si >= 10 profils en base */}
            <div style={r0 ? { animation: 'of-fadeslide 0.55s cubic-bezier(0.16,1,0.3,1) forwards' } : { opacity: 0 }} className="mb-6">
              {showBadge ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
                  <span className="of-pulse inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  {playerCount} gamers in Utrecht
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
                  <span className="of-pulse inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  Utrecht · Local matchmaking
                </span>
              )}
            </div>

            {/* Headline */}
            <h1
              className="text-5xl font-black leading-[1.08] tracking-tight text-text md:text-7xl"
              style={r1 ? { animation: 'of-fadeslide 0.6s cubic-bezier(0.16,1,0.3,1) forwards' } : { opacity: 0 }}
            >
              Find your teammates.<br />
              <span className="text-accent">Play together.</span>
            </h1>

            {/* Sub */}
            <p
              className="mt-6 max-w-xl text-lg leading-8 text-muted"
              style={r2 ? { animation: 'of-fadeslide 0.55s cubic-bezier(0.16,1,0.3,1) forwards' } : { opacity: 0 }}
            >
              OverFlow connects gamers in Utrecht — same games, same schedule, real meetups.<br />
              No feed, no algorithm. Just people who want to play.
            </p>

            {/* CTA */}
            <div
              className="mt-10 flex flex-wrap items-center gap-4"
              style={r3 ? { animation: 'of-fadeslide 0.55s cubic-bezier(0.16,1,0.3,1) forwards' } : { opacity: 0 }}
            >
              <Link href="/onboarding">
                <Button className="of-cta px-8 py-4 text-base font-bold">Find my teammates</Button>
              </Link>
            </div>

            {/* Social proof */}
            <p
              className="mt-5 text-xs text-muted"
              style={r4 ? { animation: 'of-fadeslide 0.5s cubic-bezier(0.16,1,0.3,1) forwards' } : { opacity: 0 }}
            >
              Free · No account needed · Utrecht only
            </p>
          </div>
        </section>

        {/* Why OverFlow — scroll reveal en cascade */}
        <section ref={whyReveal.ref} className="relative z-10 border-t border-border py-16">
          <p className="mb-10 text-xs uppercase tracking-[0.25em] text-muted">Why OverFlow?</p>
          <div className="grid gap-10 sm:grid-cols-3">
            {WHY_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={`of-why-item${whyReveal.visible ? ' of-visible' : ''}`}
                style={{ transitionDelay: `${i * 130}ms` }}
              >
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
