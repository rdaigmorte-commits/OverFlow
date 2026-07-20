'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';

// ─── Stat Components ──────────────────────────────────────────────────────────

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-text">{label}</span>
        <span className="text-muted">{value} player{value > 1 ? 's' : ''}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-panel2 border border-border overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatsBlock({ title, rows, labelKey }: { title: string; rows: any[]; labelKey: string }) {
  const max = rows.length > 0 ? rows[0].occurrences : 1;
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.length === 0
          ? <p className="text-sm text-muted">No data yet.</p>
          : rows.map((r, i) => (
              <StatBar
                key={`${labelKey}-${i}`}
                label={r[labelKey] ?? 'Unknown'}
                value={Number(r.occurrences)}
                max={max}
              />
            ))
        }
      </div>
    </Card>
  );
}

type MatchOpportunities = { strong: number; good: number; possible: number };
type MatchRequests = { total: number; pending: number; accepted: number; declined: number };
type FunnelRow = { step: number; action: string; occurrences: number };

function FunnelBlock({ rows, loading }: { rows: FunnelRow[]; loading: boolean }) {
  const steps = [1, 2, 3, 4, 5];
  const countFor = (step: number, action: string) =>
    Number(rows.find((r) => r.step === step && r.action === action)?.occurrences ?? 0);

  return (
    <Card className="mt-8 p-5">
      <h2 className="text-xl font-bold">📈 Onboarding funnel</h2>
      <p className="mt-1 text-sm text-muted">Where players complete or abandon each step.</p>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No onboarding activity tracked yet.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 pr-4">Step</th>
                <th className="pb-2 pr-4">Started</th>
                <th className="pb-2 pr-4">Completed</th>
                <th className="pb-2">Abandoned</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step} className="border-t border-border">
                  <td className="py-2 pr-4 font-semibold text-text">Step {step}</td>
                  <td className="py-2 pr-4">{countFor(step, 'start')}</td>
                  <td className="py-2 pr-4 text-[#2E9E24]">{countFor(step, 'complete')}</td>
                  <td className="py-2 text-error">{countFor(step, 'abandon')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function MatchOpportunitiesBlock({ data, loading }: { data: MatchOpportunities; loading: boolean }) {
  const total = data.strong + data.good + data.possible;
  const max = Math.max(data.strong, data.good, data.possible, 1);

  const tiers = [
    { label: 'Strong fit (game + platform match)', value: data.strong, color: 'bg-accent' },
    { label: 'Good fit', value: data.good, color: 'bg-accent2' },
    { label: 'Possible', value: data.possible, color: 'bg-muted' },
  ];

  return (
    <Card className="mt-8 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">🤝 Match opportunities</h2>
          <p className="mt-1 text-sm text-muted">Compatible pairs calculated live from all profiles.</p>
        </div>
        {!loading && (
          <div className="text-right">
            <div className="text-3xl font-black text-accent">{total}</div>
            <div className="text-xs text-muted">total pairs</div>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Calculating...</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted">Not enough profiles yet to compute matches.</p>
        ) : (
          tiers.map((t) => (
            <div key={t.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-text">{t.label}</span>
                <span className="text-muted">{t.value} pair{t.value !== 1 ? 's' : ''}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-panel2 border border-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${t.color}`}
                  style={{ width: `${Math.round((t.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function MatchRequestsBlock({ data, loading }: { data: MatchRequests; loading: boolean }) {
  const responded = data.accepted + data.declined;
  const acceptanceRate = responded > 0 ? Math.round((data.accepted / responded) * 100) : null;
  const max = Math.max(data.pending, data.accepted, data.declined, 1);

  const rows = [
    { label: 'Pending', value: data.pending, color: 'bg-accent2' },
    { label: 'Accepted', value: data.accepted, color: 'bg-accent3' },
    { label: 'Declined', value: data.declined, color: 'bg-muted' },
  ];

  return (
    <Card className="mt-8 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📨 Match requests</h2>
          <p className="mt-1 text-sm text-muted">Requests actually sent between players — real activity, not potential.</p>
        </div>
        {!loading && (
          <div className="text-right">
            <div className="text-3xl font-black text-accent">{data.total}</div>
            <div className="text-xs text-muted">sent total</div>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Calculating...</p>
        ) : data.total === 0 ? (
          <p className="text-sm text-muted">No match request sent yet.</p>
        ) : (
          <>
            {rows.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-text">{r.label}</span>
                  <span className="text-muted">{r.value} request{r.value !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-panel2 border border-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${r.color}`}
                    style={{ width: `${Math.round((r.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {acceptanceRate !== null && (
              <p className="pt-2 text-sm text-muted">
                Acceptance rate: <span className="font-semibold text-text">{acceptanceRate}%</span> ({data.accepted}/{responded} answered requests)
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [globals, setGlobals] = useState({ total_profiles: 0, open_irl: 0, consent: 0, new_this_week: 0 });
  const [games, setGames] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [ages, setAges] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [matchOps, setMatchOps] = useState<MatchOpportunities>({ strong: 0, good: 0, possible: 0 });
  const [matchRequests, setMatchRequests] = useState<MatchRequests>({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [g] = await Promise.all([supabase.rpc('get_global_stats')]);

      const [gm, pl, st, la, av, ag, ci, mo, mr, fn] = await Promise.all([
        supabase.rpc('get_game_stats'),
        supabase.rpc('get_platform_stats'),
        supabase.rpc('get_style_stats'),
        supabase.rpc('get_language_stats'),
        supabase.rpc('get_availability_stats'),
        supabase.rpc('get_age_stats'),
        supabase.rpc('get_city_stats'),
        supabase.rpc('get_match_opportunities'),
        supabase.rpc('get_match_requests_stats'),
        supabase.rpc('get_onboarding_funnel_stats'),
      ]);

      if (g.data)  setGlobals(g.data);
      if (gm.data) setGames(gm.data);
      if (pl.data) setPlatforms(pl.data);
      if (st.data) setStyles(st.data);
      if (la.data) setLanguages(la.data);
      if (av.data) setAvailability(av.data);
      if (ag.data) setAges(ag.data);
      if (ci.data) setCities(ci.data);
      if (mo.data) setMatchOps(mo.data);
      if (mr.data) setMatchRequests(mr.data);
      if (fn.data) setFunnel(fn.data);
      setLoading(false);
    }
    fetchAll();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-black">Admin overview</h1>
      <p className="mt-3 text-muted">Live dashboard — all data from Supabase.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <Card className="p-5"><div className="text-sm text-muted">Total profiles</div><div className="mt-2 text-3xl font-black">{loading ? '...' : globals.total_profiles}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted">Open to IRL</div><div className="mt-2 text-3xl font-black">{loading ? '...' : globals.open_irl}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted">Consent given</div><div className="mt-2 text-3xl font-black">{loading ? '...' : globals.consent}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted">New this week</div><div className="mt-2 text-3xl font-black">{loading ? '...' : globals.new_this_week}</div></Card>
      </div>

      <MatchOpportunitiesBlock data={matchOps} loading={loading} />
      <MatchRequestsBlock data={matchRequests} loading={loading} />
      <FunnelBlock rows={funnel} loading={loading} />

      <h2 className="mt-10 text-2xl font-black">Community profile</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <StatsBlock title="🎮 Games" rows={games} labelKey="game" />
        <StatsBlock title="🖥️ Platforms" rows={platforms} labelKey="platform" />
        <StatsBlock title="⚡ Play style" rows={styles} labelKey="style" />
        <StatsBlock title="🗣️ Languages" rows={languages} labelKey="language" />
        <StatsBlock title="🕒 Availability" rows={availability} labelKey="slot" />
      </div>

      <h2 className="mt-10 text-2xl font-black">Demographics</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <StatsBlock title="👤 Age groups" rows={ages} labelKey="age_group" />
        <StatsBlock title="📍 Cities" rows={cities} labelKey="city" />
      </div>
    </main>
  );
}
