// Habillage cosmétique "RPG" du reskin combo — ne touche jamais au barème de lib/match.ts.
// Le style stocké en base reste la valeur réelle (Competitive/Co-op/Casual/Roleplay) ;
// ces mappings ne servent qu'à l'affichage (nom de classe, icône, couleur).

export type RpgClass = {
  name: string;
  color: string;
  bg: string;
  icon: 'cross' | 'circle' | 'triangle' | 'square';
};

export const STYLE_TO_CLASS: Record<string, RpgClass> = {
  Competitive: { name: 'Duelist',   color: '#0C87C4', bg: '#EAF7FE', icon: 'cross' },
  'Co-op':     { name: 'Support',   color: '#2E9E24', bg: '#E7F8E4', icon: 'circle' },
  Casual:      { name: 'Explorer',  color: '#B77900', bg: '#FFF6DE', icon: 'triangle' },
  Roleplay:    { name: 'Trickster', color: '#5B3FD6', bg: '#EDE9FF', icon: 'square' },
};

export type FitTier = 'strong' | 'good' | 'other';

export function getFitTier(score: number): FitTier {
  if (score >= 60) return 'strong';
  if (score >= 40) return 'good';
  return 'other';
}

export const TIER_STYLE: Record<FitTier, {
  ring: string; track: string;
  avatarFrom: string; avatarTo: string;
  badgeBg: string; badgeBorder: string; badgeText: string;
  cardBorder: string; cardBgFrom: string;
}> = {
  strong: {
    ring: '#46C93A', track: '#E1EAD9',
    avatarFrom: '#46C93A', avatarTo: '#37A52E',
    badgeBg: '#E7F8E4', badgeBorder: '#C9F0C1', badgeText: '#2E9E24',
    cardBorder: '#C9F0C1', cardBgFrom: '#F3FBEF',
  },
  good: {
    ring: '#E0A016', track: '#F0E6C9',
    avatarFrom: '#FFC83D', avatarTo: '#E0A016',
    badgeBg: '#FFF6DE', badgeBorder: '#FBE9B8', badgeText: '#B77900',
    cardBorder: '#FBE9B8', cardBgFrom: '#FFFAEC',
  },
  other: {
    ring: '#8A8578', track: '#E5DECB',
    avatarFrom: '#B8AF9C', avatarTo: '#8A8578',
    badgeBg: '#F4EFE4', badgeBorder: '#E5DECB', badgeText: '#6B6B76',
    cardBorder: '#E5DECB', cardBgFrom: '#FDFBF6',
  },
};
