export type Profile = {
  id: string;
  name: string;
  games: string[];
  platform: string;
  style: string;
  language: string | string[];  // tableau en base, string dans le store
  availability: string[];
  city?: string;
  email?: string | null;
  discord?: string | null;
};

export type MatchResult = {
  profile: Profile;
  score: number;
  fitLabel: string;
  fitReason: string;
  // Champs platés pour faciliter l'affichage
  id: string;
  name: string;
  games: string[];
  platform: string;
  language: string | string[];
  email?: string | null;
  discord?: string | null;
  fitLabel: string;
  fitReason: string;
};

/**
 * Barème officiel (Option B — décision produit du 06/05/2026)
 *
 * Critère                    | Points
 * ─────────────────────────────────────
 * Au moins 1 jeu en commun   |  +40
 * Même plateforme             |  +20
 * Même style de jeu           |  +20
 * Langue en commun            |  +10
 * Au moins 1 créneau commun   |  +10
 * ─────────────────────────────────────
 * Score max                   |  100
 */

// Normalise language en tableau quelle que soit la source
function toLangArray(lang: string | string[] | null | undefined): string[] {
  if (!lang) return [];
  if (Array.isArray(lang)) return lang;
  return [lang];
}

export function computeScore(a: Profile, b: Profile): number {
  let score = 0;

  const commonGames = a.games.filter((g) => b.games.includes(g));
  if (commonGames.length > 0) score += 40;

  if (a.platform && b.platform && a.platform === b.platform) score += 20;

  if (a.style && b.style && a.style === b.style) score += 20;

  // Langue — gère string et string[]
  const aLangs = toLangArray(a.language);
  const bLangs = toLangArray(b.language);
  if (aLangs.some((l) => bLangs.includes(l))) score += 10;

  const commonSlots = a.availability.filter((s) => b.availability.includes(s));
  if (commonSlots.length > 0) score += 10;

  return score;
}

export function getFitLabel(score: number): string {
  if (score >= 60) return 'Strong fit';
  if (score >= 40) return 'Good fit';
  return 'Worth reaching out';
}

export function getFitReason(a: Profile, b: Profile): string {
  const parts: string[] = [];

  const commonGames = a.games.filter((g) => b.games.includes(g));
  if (commonGames.length > 0) parts.push(`plays ${commonGames.join(', ')}`);
  if (a.platform === b.platform) parts.push(`same platform (${a.platform})`);
  if (a.style === b.style) parts.push(`same playstyle (${a.style})`);

  const aLangs = toLangArray(a.language);
  const bLangs = toLangArray(b.language);
  const commonLang = aLangs.find((l) => bLangs.includes(l));
  if (commonLang) parts.push(`speaks ${commonLang}`);

  const commonSlots = a.availability.filter((s) => b.availability.includes(s));
  if (commonSlots.length > 0) parts.push(`available ${commonSlots[0]}`);

  if (parts.length === 0) return 'Some interests in common';
  return parts.join(' · ');
}

export function matchProfiles(current: Profile, others: Profile[]): MatchResult[] {
  return others
    .filter((p) => p.id !== current.id)
    .map((p) => {
      const score = computeScore(current, p);
      return {
        profile: p,
        score,
        fitLabel: getFitLabel(score),
        fitReason: getFitReason(current, p),
        // Champs platés pour l'affichage direct dans la page
        id: p.id,
        name: p.name,
        games: p.games ?? [],
        platform: p.platform,
        language: p.language,
        email: p.email ?? null,
        discord: p.discord ?? null,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Alias pour compatibilité avec matches/page.tsx
export type Match = MatchResult;
export const computeMatches = matchProfiles;
