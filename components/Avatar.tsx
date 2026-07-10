import { TIER_STYLE } from '@/lib/rpgClass';
import type { FitTier } from '@/lib/match';

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Avatar initiales — dégradé de couleur par tier (vert/or/gris) quand connu,
// gris neutre sinon (ex. une invitation dont on n'a plus les données de match).
export function Avatar({ name, tier, size = 56 }: { name: string; tier?: FitTier; size?: number }) {
  const style_ = TIER_STYLE[tier ?? 'other'];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl font-bold text-white"
      style={{
        width: size, height: size, fontSize: size * 0.32,
        fontFamily: 'var(--font-fredoka)',
        background: `linear-gradient(135deg, ${style_.avatarFrom}, ${style_.avatarTo})`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
