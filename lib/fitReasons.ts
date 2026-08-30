import type { FitReasonKind } from '@/lib/match';

// Emoji "why you match" — reprend le vocabulaire déjà utilisé ailleurs dans l'app
// pour ces mêmes catégories (🖥️ ⚡ 🗣️ 🕒 📍). Volontairement sans couleur de fond :
// une liste neutre se scanne plus vite qu'une pile de pastilles colorées.
// Les jeux en commun (critère le plus lourd) ont leur propre pastille violette, voir MatchCard.
export const FIT_REASON_EMOJI: Record<FitReasonKind, string> = {
  platform:     '🖥️',
  style:        '⚡',
  language:     '🗣️',
  availability: '🕒',
  city:         '📍',
  age:          '🎂',
};
