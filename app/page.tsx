import { createServerClient } from '@supabase/ssr';
import { LandingPageClient } from './_components/LandingPageClient';

export const revalidate = 3600;

const FALLBACK_GAMES: { name: string; count: number }[] = [
  { name: 'Valorant', count: 0 },
  { name: 'CS2', count: 0 },
  { name: 'Minecraft', count: 0 },
  { name: 'EA FC', count: 0 },
  { name: 'League of Legends', count: 0 },
];

function createAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export default async function Page() {
  let playerCount: number | null = null;
  let topGames: { name: string; count: number }[] = FALLBACK_GAMES;

  try {
    const supabase = createAnonClient();

    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('city', 'Utrecht');

    if (typeof count === 'number') playerCount = count;

    const { data } = await supabase
      .from('profiles')
      .select('games');

    if (data && data.length > 0) {
      const freq: Record<string, number> = {};
      for (const row of data) {
        for (const g of (row.games ?? [])) {
          freq[g] = (freq[g] ?? 0) + 1;
        }
      }
      const computed = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([g, count]) => ({ name: g, count }));
      if (computed.length > 0) topGames = computed;
    }
  } catch {
    // fallback silencieux — données statiques utilisées
  }

  return <LandingPageClient playerCount={playerCount} topGames={topGames} />;
}
