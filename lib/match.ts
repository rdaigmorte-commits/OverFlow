export type Profile = {
  id: string;
  name: string;
  games: string[];
  platform: string;
  style: string;
  language: string;
  availability: string[];
  city?: string;
};

export type MatchResult = {
  profile: Profile;
  score: number;
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
export function computeScore(a: Profile, b: Profile): number {
  let score = 0;

  // Jeux en commun — 40 pts
  const commonGames = a.games.filter((g) => b.games.includes(g));
  if (commonGames.length > 0) score += 40;

  // Même plateforme — 20 pts
  if (a.platform && b.platform && a.platform === b.platform) score += 20;

  // Même style — 20 pts
  if (a.style && b.style && a.style === b.style) score += 20;

  // Langue en commun — 10 pts
  if (a.language && b.language && a.language === b.language) score += 10;

  // Créneau en commun — 10 pts
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
  if (a.language === b.language) parts.push(`speaks ${a.language}`);

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
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Alias pour compatibilité avec matches/page.tsx
export type Match = MatchResult;
export const computeMatches = matchProfiles;
