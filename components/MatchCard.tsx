import { CompatibilityRing } from '@/components/CompatibilityRing';
import { getFitTier, TIER_STYLE } from '@/lib/rpgClass';
import { FIT_REASON_BADGE, type FitReasonKind } from '@/lib/fitReasons';

type MatchCardProps = {
  name: string;
  games: string[];
  platform: string[];
  style: string[];
  language: string[];
  city?: string;
  isIRLNearby?: boolean;
  fitLabel: 'Strong fit' | 'Good fit' | 'Worth reaching out';
  fitReason: string;
  score: number;
  invitationSent?: boolean;
  onRequestMatch: () => void;
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function parseFitReasonToIcons(fitReason: string): { kind: FitReasonKind; text: string }[] {
  const parts = fitReason.split(' · ');
  return parts.map((part) => {
    if (part.startsWith('plays '))         return { kind: 'games' as const,        text: `Plays ${part.replace('plays ', '')}` };
    if (part.startsWith('same platform'))  return { kind: 'platform' as const,     text: part.charAt(0).toUpperCase() + part.slice(1) };
    if (part.startsWith('same playstyle')) return { kind: 'style' as const,        text: part.charAt(0).toUpperCase() + part.slice(1) };
    if (part.startsWith('speaks '))        return { kind: 'language' as const,     text: `Speaks ${part.replace('speaks ', '')}` };
    if (part.startsWith('available '))     return { kind: 'availability' as const, text: `Free ${part.replace('available ', '')}` };
    if (part.startsWith('same city'))      return { kind: 'city' as const,         text: part.charAt(0).toUpperCase() + part.slice(1) };
    return { kind: 'games' as const, text: part };
  });
}

export function MatchCard({
  name,
  isIRLNearby,
  fitReason,
  score,
  invitationSent = false,
  onRequestMatch,
}: MatchCardProps) {
  const percent  = Math.round((score / 110) * 100);
  const tier     = getFitTier(score);
  const style_   = TIER_STYLE[tier];
  const reasons  = parseFitReasonToIcons(fitReason);

  return (
    <div
      className="card-hover rounded-2xl border overflow-hidden"
      style={{ borderColor: style_.cardBorder, background: `linear-gradient(165deg, ${style_.cardBgFrom}, #FDFBF6)` }}
    >

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
          style={{ fontFamily: 'var(--font-fredoka)', background: `linear-gradient(135deg, ${style_.avatarFrom}, ${style_.avatarTo})` }}
        >
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl font-black text-text truncate">{name}</span>
            {isIRLNearby && (
              <span className="shrink-0 rounded-full border border-accent3SoftBorder bg-accent3Soft px-2 py-0.5 text-xs font-bold text-[#2E9E24] animate-pulse">
                📍 Down to meet
              </span>
            )}
          </div>
        </div>
        <CompatibilityRing percent={percent} tier={tier} />
      </div>

      <div className="border-t border-border/50 mx-5" />

      {/* Why you match — toutes les correspondances, une pastille colorée par critère */}
      <div className="px-5 py-3 flex flex-wrap gap-1.5">
        {reasons.map((r, i) => {
          const badge = FIT_REASON_BADGE[r.kind];
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
            >
              <span>{badge.emoji}</span>
              {r.text}
            </span>
          );
        })}
      </div>

      {/* CTA */}
      <div className="px-5 pb-4">
        {invitationSent ? (
          <div className="w-full rounded-xl border border-accent3SoftBorder bg-accent3Soft px-5 py-3 text-sm font-semibold text-[#2E9E24] text-center">
            Invitation sent ✓
          </div>
        ) : (
          <button
            onClick={onRequestMatch}
            className="btn-primary-new w-full px-5 py-3 text-sm"
          >
            Let&apos;s play 🎮
          </button>
        )}
      </div>

    </div>
  );
}
