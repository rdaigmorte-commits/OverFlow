// Normalise language en string[] quelle que soit la source Supabase.
// À appeler une seule fois au moment du fetch, pas à chaque utilisation.
export function normalizeLanguage(lang: string | string[] | null | undefined): string[] {
  if (!lang) return [];
  if (Array.isArray(lang)) return lang;
  return [lang];
}

export type Profile = {
  id: string;
  name: string;
  games: string[];
  platform: string;
  style: string;
  // language est toujours string[] après normalisation via normalizeLanguage()
  language: string[];
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
  id: string;
  name: string;
  games: string[];
  platform: string;
  language: string[];
  email?: string | null;
  discord?: string | null;
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
export function computeScore(a: Profile, b: Profile): number {
  let score = 0;

  const commonGames = a.games.filter((g) => b.games.includes(g));
  if (commonGames.length > 0) score += 40;

  if (a.platform && b.platform && a.platform === b.platform) score += 20;

  if (a.style && b.style && a.style === b.style) score += 20;

  // language est garanti string[] — pas besoin de normaliser ici
  if (a.language.some((l) => b.language.includes(l))) score += 10;

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

  // language est garanti string[] — pas besoin de normaliser ici
  const commonLang = a.language.find((l) => b.language.includes(l));
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
      // Normalisation au moment du mapping : une seule fois, à la source
      const normalizedP: Profile = {
        ...p,
        language: normalizeLanguage(p.language),
        games: Array.isArray(p.games) ? p.games : [],
        availability: Array.isArray(p.availability) ? p.availability : [],
      };
      const score = computeScore(current, normalizedP);
      return {
        profile: normalizedP,
        score,
        fitLabel: getFitLabel(score),
        fitReason: getFitReason(current, normalizedP),
        id: normalizedP.id,
        name: normalizedP.name,
        games: normalizedP.games,
        platform: normalizedP.platform,
        language: normalizedP.language,
        email: normalizedP.email ?? null,
        discord: normalizedP.discord ?? null,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export type Match = MatchResult;
export const computeMatches = matchProfiles;
