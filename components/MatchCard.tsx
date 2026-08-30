import { CompatibilityRing } from '@/components/CompatibilityRing';
import { TIER_STYLE } from '@/lib/rpgClass';
import type { FitReason, FitTier } from '@/lib/match';
import { WhyYouMatch } from '@/components/WhyYouMatch';
import { Avatar } from '@/components/Avatar';

type MatchCardProps = {
  name: string;
  age?: string | null;
  games: string[];
  platform: string[];
  style: string[];
  language: string[];
  city?: string;
  isIRLNearby?: boolean;
  fitLabel: 'Strong fit' | 'Good fit' | 'Worth reaching out';
  tier: FitTier;
  fitReasons: FitReason[];
  commonGames: string[];
  score: number;
  invitationSent?: boolean;
  onRequestMatch: () => void;
};

export function MatchCard({
  name,
  age,
  isIRLNearby,
  fitLabel,
  tier,
  fitReasons,
  commonGames,
  score,
  invitationSent = false,
  onRequestMatch,
}: MatchCardProps) {
  const percent  = Math.round((score / 120) * 100);
  const style_   = TIER_STYLE[tier];

  return (
    <div
      className="card-hover flex h-full flex-col rounded-2xl border overflow-hidden"
      style={{ borderColor: style_.cardBorder, background: `linear-gradient(165deg, ${style_.cardBgFrom}, #FDFBF6)` }}
    >

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Avatar name={name} tier={tier} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl font-black text-text truncate">
              {name}
              {age && <span className="font-semibold text-muted">, {age}</span>}
            </span>
            {isIRLNearby && (
              <span className="shrink-0 rounded-full border border-accent3SoftBorder bg-accent3Soft px-2 py-0.5 text-xs font-bold text-[#2E9E24] animate-pulse">
                📍 IRL
              </span>
            )}
          </div>
          <span
            className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold"
            style={{ background: style_.badgeBg, borderColor: style_.badgeBorder, color: style_.badgeText }}
          >
            {fitLabel}
          </span>
        </div>
        <CompatibilityRing percent={percent} tier={tier} />
      </div>

      <div className="border-t border-border/50 mx-5" />

      <div className="px-5 py-3">
        <WhyYouMatch fitReasons={fitReasons} commonGames={commonGames} />
      </div>

      {/* CTA — toujours calé en bas, même si peu de raisons au-dessus */}
      <div className="mt-auto px-5 pb-4">
        {invitationSent ? (
          <div className="w-full rounded-xl border border-accent3SoftBorder bg-accent3Soft px-5 py-3 text-sm font-semibold text-[#2E9E24] text-center">
            Invitation sent ✓
          </div>
        ) : (
          <button
            onClick={onRequestMatch}
            className={`${tier === 'good' ? 'btn-yellow' : 'btn-primary-new'} w-full px-5 py-3 text-sm`}
          >
            Let&apos;s play 🎮
          </button>
        )}
      </div>

    </div>
  );
}
