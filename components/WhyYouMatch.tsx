import { STYLE_TO_CLASS } from '@/lib/rpgClass';
import { PLATFORM_EMOJI, LANG_FLAG, type FitReason } from '@/lib/match';
import { FIT_REASON_EMOJI } from '@/lib/fitReasons';
import { ShapeIcon } from '@/components/ShapeIcon';

function ReasonIcon({ reason }: { reason: FitReason }) {
  if (reason.kind === 'language') {
    return <span className={`fi fi-${LANG_FLAG[reason.label] ?? 'un'}`} />;
  }
  if (reason.kind === 'platform') {
    return <>{PLATFORM_EMOJI[reason.label] ?? FIT_REASON_EMOJI.platform}</>;
  }
  if (reason.kind === 'style') {
    const rpg = STYLE_TO_CLASS[reason.label];
    return rpg ? <ShapeIcon shape={rpg.icon} color={rpg.color} size={13} /> : <>{FIT_REASON_EMOJI.style}</>;
  }
  return <>{FIT_REASON_EMOJI[reason.kind]}</>;
}

// Raisons de match + jeux en commun — extrait de MatchCard pour être réutilisé
// dans les lignes dépliables Received/Sent/Matched (même contenu, sans l'habillage
// avatar/CTA qui n'a pas de sens hors de la grille de découverte).
export function WhyYouMatch({ fitReasons, commonGames }: { fitReasons: FitReason[]; commonGames: string[] }) {
  if (fitReasons.length === 0 && commonGames.length === 0) {
    return <p className="text-xs text-muted">No shared details on record for this match.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {fitReasons.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {fitReasons.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-text min-w-0">
              <span className="shrink-0"><ReasonIcon reason={r} /></span>
              <span className="truncate">{r.label}</span>
            </div>
          ))}
        </div>
      )}
      {commonGames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}
