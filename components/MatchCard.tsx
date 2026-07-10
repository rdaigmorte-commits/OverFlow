import { CompatibilityRing } from '@/components/CompatibilityRing';
import { TIER_STYLE } from '@/lib/rpgClass';
import { PLATFORM_EMOJI, LANG_FLAG, type FitReason, type FitTier } from '@/lib/match';
import { FIT_REASON_EMOJI } from '@/lib/fitReasons';

type MatchCardProps = {
  name: string;
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

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ReasonIcon({ reason }: { reason: FitReason }) {
  if (reason.kind === 'language') {
    return <span className={`fi fi-${LANG_FLAG[reason.label] ?? 'un'}`} />;
  }
  if (reason.kind === 'platform') {
    return <>{PLATFORM_EMOJI[reason.label] ?? FIT_REASON_EMOJI.platform}</>;
  }
  return <>{FIT_REASON_EMOJI[reason.kind]}</>;
}

export function MatchCard({
  name,
  isIRLNearby,
  fitLabel,
  tier,
  fitReasons,
  commonGames,
  score,
  invitationSent = false,
  onRequestMatch,
}: MatchCardProps) {
  const percent  = Math.round((score / 110) * 100);
  const style_   = TIER_STYLE[tier];

  return (
    <div
      className="card-hover flex h-full flex-col rounded-2xl border overflow-hidden"
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

      {/* Why you match — liste neutre en 2 colonnes, la valeur qui matche plutôt qu'une reformulation générique */}
      <div className="px-5 py-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {fitReasons.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-text min-w-0">
            <span className="shrink-0"><ReasonIcon reason={r} /></span>
            <span className="truncate">{r.label}</span>
          </div>
        ))}
      </div>

      {/* Jeux en commun — critère le plus important, mis en avant à part */}
      {commonGames.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {commonGames.map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1 rounded-full border border-accentSoftBorder bg-accentSoft px-2.5 py-1 text-xs font-bold text-accent"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {/* CTA — toujours calé en bas, même si peu de raisons au-dessus */}
      <div className="mt-auto px-5 pb-4">
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
