export const LANG_BADGE: Record<string, string> = {
  English: 'EN', Dutch: 'NL', French: 'FR',
  Spanish: 'ES', German: 'DE', Italian: 'IT',
};

export const LANG_FLAG: Record<string, string> = {
  English: 'gb', Dutch: 'nl', French: 'fr',
  Spanish: 'es', German: 'de', Italian: 'it',
};

export const PLATFORM_EMOJI: Record<string, string> = {
  PC: '🖥️', PlayStation: '🎮', Xbox: '🎮', Switch: '🎮', Mobile: '📱',
};

export const AVAILABILITY_EMOJI: Record<string, string> = {
  'Weekday evenings': '🌙', 'Friday night': '🎉', 'Weekend day': '☀️', 'Weekend evening': '🌆',
};

export const LOOKING_FOR_META: Record<string, { icon: string; label: string }> = {
  online: { icon: '🏠', label: 'Play online' },
  irl:    { icon: '🍺', label: 'Meet IRL' },
  both:   { icon: '⚡', label: 'Both' },
};

// Normalise language en string[] quelle que soit la source Supabase.
export function normalizeLanguage(lang: string | string[] | null | undefined): string[] {
  if (!lang) return [];
  if (Array.isArray(lang)) return lang;
  return [lang];
}

// Garde-fou à la frontière Supabase (colonnes platform/style déjà text[] en base,
// mais le client ne garantit pas le typage à la compilation — jamais utilisé une
// fois la donnée entrée dans un Profile typé, voir matchProfiles()).
export function normalizeArray(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

// Normalise une ville pour comparaison insensible à la casse / espaces
export function normalizeCity(city: string | null | undefined): string {
  return (city ?? '').toLowerCase().trim();
}

export type Profile = {
  id: string;
  name: string;
  games: string[];
  platform: string[];
  style: string[];
  language: string[];
  availability: string[];
  city?: string;
  age?: string | null;
  looking_for?: string | null;
  open_irl?: boolean;
  email?: string | null;
  discord?: string | null;
};

export type FitReasonKind = 'platform' | 'style' | 'language' | 'availability' | 'city' | 'age';
export type FitReason = { kind: FitReasonKind; label: string };

export type FitTier = 'strong' | 'good' | 'other';

export type MatchResult = {
  profile: Profile;
  score: number;
  tier: FitTier;
  fitLabel: string;
  fitReason: string;
  fitReasons: FitReason[];
  commonGames: string[];
  isIRLNearby: boolean;
  id: string;
  name: string;
  games: string[];
  platform: string[];
  language: string[];
  city?: string;
  age?: string | null;
  lookingFor?: string | null;
  openIRL?: boolean;
  email?: string | null;
  discord?: string | null;
};

/**
 * Barème v4 (US-084 — âge comme critère de matching)
 *
 * Critère                          | Points
 * ─────────────────────────────────────────
 * Au moins 1 jeu en commun         |  +40
 * Au moins 1 plateforme en commun  |  +20
 * Au moins 1 style en commun       |  +20
 * Langue en commun                 |  +10
 * Au moins 1 créneau commun        |  +10
 * Même ville (bonus)               |  +10
 * Âge proche (bonus dégressif)     |  +10 / +5 / +2 / 0
 * ─────────────────────────────────────────
 * Score max                        |  120
 */
const CITY_BONUS = 10;

// Bonus d'âge dégressif par palier plutôt qu'une formule continue — évite tout
// risque d'arrondi différent entre ce fichier et son miroir SQL (get_match_
// opportunities), et reste dans le style "points fixes par palier" du reste
// du barème. Jamais bloquant : absent si l'un des deux âges n'est pas renseigné.
function parseAge(age: string | null | undefined): number | null {
  if (!age) return null;
  const n = Number(age);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getAgeBonus(a: Profile, b: Profile): number {
  const ageA = parseAge(a.age);
  const ageB = parseAge(b.age);
  if (ageA === null || ageB === null) return 0;
  const gap = Math.abs(ageA - ageB);
  if (gap <= 2) return 10;
  if (gap <= 5) return 5;
  if (gap <= 10) return 2;
  return 0;
}

// Jeux et plateforme en commun — les deux critères qui déterminent si on peut
// concrètement jouer ensemble. Isolés pour l'affichage dédié ET pour le gate
// de tier ci-dessous (un "Strong fit" sans ça n'a pas de sens en pratique).
// Comparaison insensible à la casse/espaces — deux joueurs ayant saisi "Valorant"
// et "valorant " doivent matcher. Ne résout pas les synonymes (LOL vs "League of
// Legends"), traité côté UI (suggestions) dans les steps de saisie des jeux.
function normalizeGame(g: string): string {
  return g.trim().toLowerCase();
}

export function getCommonGames(a: Profile, b: Profile): string[] {
  const bNormalized = new Set(b.games.map(normalizeGame));
  return a.games.filter((g) => bNormalized.has(normalizeGame(g)));
}

export function getCommonPlatforms(a: Profile, b: Profile): string[] {
  return a.platform.filter((p) => b.platform.includes(p));
}

// Score plafonné juste sous le seuil "Strong fit" quand jeu+plateforme ne sont
// pas réunis — sinon le % affiché peut dépasser 60 alors que le tier reste "Good
// fit" (gate de getFitTier), ce qui donne l'impression d'un bug à l'affichage :
// deux cards au même %, l'une strong, l'autre good.
const NON_CORE_SCORE_CAP = 59;

export function computeScore(a: Profile, b: Profile): number {
  let score = 0;

  const hasCoreMatch = getCommonGames(a, b).length > 0 && getCommonPlatforms(a, b).length > 0;

  if (getCommonGames(a, b).length > 0) score += 40;

  if (getCommonPlatforms(a, b).length > 0) score += 20;

  if (a.style.some((s) => b.style.includes(s))) score += 20;

  if (a.language.some((l) => b.language.includes(l))) score += 10;

  const commonSlots = a.availability.filter((s) => b.availability.includes(s));
  if (commonSlots.length > 0) score += 10;

  // Bonus ville — pas un filtre bloquant, juste un bonus de score
  if (a.city && b.city && normalizeCity(a.city) === normalizeCity(b.city)) {
    score += CITY_BONUS;
  }

  score += getAgeBonus(a, b);

  return hasCoreMatch ? score : Math.min(score, NON_CORE_SCORE_CAP);
}

// "Strong fit" exige un jeu ET une plateforme en commun, quel que soit le score —
// sinon deux joueurs sans rien de concret pour jouer ensemble (juste style/langue/
// ville en commun) pouvaient être étiquetés "Strong fit".
export function getFitTier(score: number, hasCoreMatch: boolean): FitTier {
  if (score >= 60 && hasCoreMatch) return 'strong';
  if (score >= 40) return 'good';
  return 'other';
}

export function getFitLabel(tier: FitTier): string {
  if (tier === 'strong') return 'Strong fit';
  if (tier === 'good') return 'Good fit';
  return 'Worth reaching out';
}

// Raisons de match structurées — le libellé est la valeur partagée elle-même
// (ex. "Competitive", "English"), pas une reformulation générique ("same playstyle").
export function getFitReasons(a: Profile, b: Profile): FitReason[] {
  const reasons: FitReason[] = [];

  // Une ligne par valeur en commun (pas juste la première) — cohérent avec les jeux,
  // et nécessaire pour que chaque langue/plateforme garde sa propre icône (drapeau, etc.).
  getCommonPlatforms(a, b)
    .forEach((p) => reasons.push({ kind: 'platform', label: p }));

  a.style.filter((s) => b.style.includes(s))
    .forEach((s) => reasons.push({ kind: 'style', label: s }));

  a.language.filter((l) => b.language.includes(l))
    .forEach((l) => reasons.push({ kind: 'language', label: l }));

  a.availability.filter((s) => b.availability.includes(s))
    .forEach((s) => reasons.push({ kind: 'availability', label: s }));

  if (a.city && b.city && normalizeCity(a.city) === normalizeCity(b.city)) {
    reasons.push({ kind: 'city', label: b.city });
  }

  // N'affiche la raison que sur le palier le plus proche (écart ≤ 2 ans) — un
  // bonus marginal (écart 6-10 ans) ne mérite pas sa propre ligne dans la liste.
  if (getAgeBonus(a, b) === 10) {
    reasons.push({ kind: 'age', label: 'Similar age' });
  }

  return reasons;
}

// Résumé texte (utilisé par la vue compacte "Worth reaching out") — jeux en tête,
// c'est le critère le plus parlant en un coup d'œil.
export function getFitReason(a: Profile, b: Profile): string {
  const parts = [...getCommonGames(a, b), ...getFitReasons(a, b).map((r) => r.label)];
  if (parts.length === 0) return 'Some interests in common';
  return parts.join(' · ');
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
      const commonGames     = getCommonGames(current, normalizedP);
      const hasCoreMatch    = commonGames.length > 0 && getCommonPlatforms(current, normalizedP).length > 0;
      const tier            = getFitTier(score, hasCoreMatch);

      // Badge "Down to meet" : même ville ET les deux joueurs ouverts à l'IRL (mutuel,
      // pas juste l'autre — sinon un joueur "online only" verrait quand même le badge).
      const isIRLNearby =
        !!current.open_irl &&
        !!normalizedP.open_irl &&
        !!current.city &&
        !!normalizedP.city &&
        normalizeCity(current.city) === normalizeCity(normalizedP.city);

      return {
        profile:     normalizedP,
        score,
        tier,
        fitLabel:    getFitLabel(tier),
        fitReason:   getFitReason(current, normalizedP),
        fitReasons:  getFitReasons(current, normalizedP),
        commonGames,
        isIRLNearby,
        id:          normalizedP.id,
        name:        normalizedP.name,
        games:       normalizedP.games,
        platform:    normalizedP.platform,
        language:    normalizedP.language,
        city:        normalizedP.city,
        age:         normalizedP.age ?? null,
        lookingFor:  normalizedP.looking_for ?? null,
        openIRL:     normalizedP.open_irl ?? false,
        email:       normalizedP.email ?? null,
        discord:     normalizedP.discord ?? null,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      // Tri à tier égal : les matchs mutuellement "down to meet" remontent en premier
      // (objectif premier du POC), score en départage final.
      const tierRank = (t: FitTier) => (t === 'strong' ? 2 : t === 'good' ? 1 : 0);
      if (tierRank(b.tier) !== tierRank(a.tier)) return tierRank(b.tier) - tierRank(a.tier);
      if (b.isIRLNearby !== a.isIRLNearby) return (b.isIRLNearby ? 1 : 0) - (a.isIRLNearby ? 1 : 0);
      return b.score - a.score;
    });
}

export type Match = MatchResult;
export const computeMatches = matchProfiles;
