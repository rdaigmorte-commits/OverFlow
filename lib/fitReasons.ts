// Badges "why you match" — pastille emoji colorée, un ton dédié par critère.
// Reprend le vocabulaire des emoji déjà utilisés ailleurs dans l'app pour ces mêmes
// catégories (🎮 🖥️ ⚡ 🗣️ 🕒 📍) et le pattern pastille douce déjà utilisé pour
// le badge "📍 Down to meet".
export type FitReasonKind = 'games' | 'platform' | 'style' | 'language' | 'availability' | 'city';

export const FIT_REASON_BADGE: Record<FitReasonKind, { emoji: string; bg: string; border: string; text: string }> = {
  games:        { emoji: '🎮', bg: '#FFE9E9', border: '#FFD1D1', text: '#E8544F' },
  platform:     { emoji: '🖥️', bg: '#E6F6FE', border: '#C7ECFB', text: '#0C87C4' },
  style:        { emoji: '⚡', bg: '#FFF6DE', border: '#FBE9B8', text: '#B77900' },
  language:     { emoji: '🗣️', bg: '#EDE9FF', border: '#D9CCFF', text: '#7C5CFF' },
  availability: { emoji: '🕒', bg: '#FFF0E0', border: '#FFD9A8', text: '#C2620A' },
  city:         { emoji: '📍', bg: '#E7F8E4', border: '#C9F0C1', text: '#2E9E24' },
};
