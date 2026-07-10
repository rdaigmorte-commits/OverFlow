export const LANG_BADGE: Record<string, string> = {
  English: 'EN', Dutch: 'NL', French: 'FR',
  Spanish: 'ES', German: 'DE', Italian: 'IT',
};

export const LANG_FLAG: Record<string, string> = {
  English: 'gb', Dutch: 'nl', French: 'fr',
  Spanish: 'es', German: 'de', Italian: 'it',
};

// Normalise language en string[] quelle que soit la source Supabase.
export function normalizeLanguage(lang: string | string[] | null | undefined): string[] {
  if (!lang) return [];
  if (Array.isArray(lang)) return lang;
  return [lang];
}

// Normalise platform et style en string[] (migration vers multi-choix US-105)
export function normalizeArray(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val]; // compatibilité ascendante avec les anciens profils string
}

// Normalise une ville pour comparaison insensible à la casse / espaces
export function normalizeCity(city: string | null | undefined): string {
  return (city ?? '').toLowerCase().trim();
}

export type Profile = {
  id: string;
  name: string;
  games: string[];
  platform: string | string[];
  style: string | string[];
  language: string[];
  availability: string[];
  city?: string;
  open_irl?: boolean;
  email?: string | null;
  discord?: string | null;
};

export type FitReasonKind = 'games' | 'platform' | 'style' | 'language' | 'availability' | 'city';
export type FitReason = { kind: FitReasonKind; label: string };

export type MatchResult = {
  profile: Profile;
  score: number;
  fitLabel: string;
  fitReason: string;
  fitReasons: FitReason[];
  isIRLNearby: boolean;
  id: string;
  name: string;
  games: string[];
  platform: string[];
  language: string[];
  city?: string;
  openIRL?: boolean;
  email?: string | null;
  discord?: string | null;
};

/**
 * Barème v3 (US-083 — ville comme critère de matching)
 *
 * Critère                          | Points
 * ─────────────────────────────────────────
 * Au moins 1 jeu en commun         |  +40
 * Au moins 1 plateforme en commun  |  +20
 * Au moins 1 style en commun       |  +20
 * Langue en commun                 |  +10
 * Au moins 1 créneau commun        |  +10
 * Même ville (bonus)               |  +10
 * ─────────────────────────────────────────
 * Score max                        |  110
 */
const CITY_BONUS = 10;

export function computeScore(a: Profile, b: Profile): number {
  let score = 0;

  const aPlatforms = normalizeArray(a.platform);
  const bPlatforms = normalizeArray(b.platform);
  const aStyles    = normalizeArray(a.style);
  const bStyles    = normalizeArray(b.style);

  const commonGames = a.games.filter((g) => b.games.includes(g));
  if (commonGames.length > 0) score += 40;

  if (aPlatforms.some((p) => bPlatforms.includes(p))) score += 20;

  if (aStyles.some((s) => bStyles.includes(s))) score += 20;

  if (a.language.some((l) => b.language.includes(l))) score += 10;

  const commonSlots = a.availability.filter((s) => b.availability.includes(s));
  if (commonSlots.length > 0) score += 10;

  // Bonus ville — pas un filtre bloquant, juste un bonus de score
  if (a.city && b.city && normalizeCity(a.city) === normalizeCity(b.city)) {
    score += CITY_BONUS;
  }

  return score;
}

export function getFitLabel(score: number): string {
  if (score >= 60) return 'Strong fit';
  if (score >= 40) return 'Good fit';
  return 'Worth reaching out';
}

// Raisons de match structurées — le libellé est la valeur partagée elle-même
// (ex. "Competitive", "English"), pas une reformulation générique ("same playstyle").
export function getFitReasons(a: Profile, b: Profile): FitReason[] {
  const reasons: FitReason[] = [];

  const aPlatforms = normalizeArray(a.platform);
  const bPlatforms = normalizeArray(b.platform);
  const aStyles    = normalizeArray(a.style);
  const bStyles    = normalizeArray(b.style);

  const commonGames = a.games.filter((g) => b.games.includes(g));
  if (commonGames.length > 0) reasons.push({ kind: 'games', label: commonGames.join(', ') });

  const commonPlatform = aPlatforms.find((p) => bPlatforms.includes(p));
  if (commonPlatform) reasons.push({ kind: 'platform', label: commonPlatform });

  const commonStyle = aStyles.find((s) => bStyles.includes(s));
  if (commonStyle) reasons.push({ kind: 'style', label: commonStyle });

  const commonLang = a.language.find((l) => b.language.includes(l));
  if (commonLang) reasons.push({ kind: 'language', label: commonLang });

  const commonSlots = a.availability.filter((s) => b.availability.includes(s));
  if (commonSlots.length > 0) reasons.push({ kind: 'availability', label: commonSlots[0] });

  if (a.city && b.city && normalizeCity(a.city) === normalizeCity(b.city)) {
    reasons.push({ kind: 'city', label: b.city });
  }

  return reasons;
}

// Résumé texte (utilisé par la vue compacte "Worth reaching out").
export function getFitReason(a: Profile, b: Profile): string {
  const reasons = getFitReasons(a, b);
  if (reasons.length === 0) return 'Some interests in common';
  return reasons.map((r) => r.label).join(' · ');
}

export function matchProfiles(current: Profile, others: Profile[]): MatchResult[] {
  return others
    .filter((p) => p.id !== current.id)
    .map((p) => {
      const normalizedP: Profile = {
        ...p,
        language:     normalizeLanguage(p.language),
        platform:     normalizeArray(p.platform),
        style:        normalizeArray(p.style),
        games:        Array.isArray(p.games)        ? p.games        : [],
        availability: Array.isArray(p.availability) ? p.availability : [],
      };
      const score = computeScore(current, normalizedP);

      // Badge IRL Nearby : même ville + open_irl
      const isIRLNearby =
        !!normalizedP.open_irl &&
        !!current.city &&
        !!normalizedP.city &&
        normalizeCity(current.city) === normalizeCity(normalizedP.city);

      return {
        profile:     normalizedP,
        score,
        fitLabel:    getFitLabel(score),
        fitReason:   getFitReason(current, normalizedP),
        fitReasons:  getFitReasons(current, normalizedP),
        isIRLNearby,
        id:          normalizedP.id,
        name:        normalizedP.name,
        games:       normalizedP.games,
        platform:    normalizeArray(normalizedP.platform),
        language:    normalizeArray(normalizedP.language),
        city:        normalizedP.city,
        openIRL:     normalizedP.open_irl ?? false,
        email:       normalizedP.email ?? null,
        discord:     normalizedP.discord ?? null,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export type Match = MatchResult;
export const computeMatches = matchProfiles;
