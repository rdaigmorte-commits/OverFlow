import { normalizeArray } from '@/lib/match';

type MatchCardProps = {
  name: string;
  games: string[];
  platform: string[];
  style: string[];
  language: string[];
  city?: string;
  openIRL?: boolean;
  isIRLNearby?: boolean;
  fitLabel: 'Strong fit' | 'Good fit' | 'Worth reaching out';
  fitReason: string;
  score: number;
  invitationSent?: boolean;
  onRequestMatch: () => void;
};

const fitConfig = {
  'Strong fit': {
    badge: '🟢 Strong fit',
    border: 'border-green-500/40',
    bg: 'bg-green-500/8',
    badgeBg: 'bg-green-500/20 text-green-400 border-green-500/40',
  },
  'Good fit': {
    badge: '🟡 Good fit',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/8',
    badgeBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  },
  'Worth reaching out': {
    badge: '⚪ Worth reaching out',
    border: 'border-border',
    bg: 'bg-panel',
    badgeBg: 'bg-panel2 text-muted border-border',
  },
};

function parseFitReasonToBullets(fitReason: string): { emoji: string; text: string }[] {
  const parts = fitReason.split(' · ');
  return parts.map((part) => {
    if (part.startsWith('plays '))         return { emoji: '🎮', text: `Both play ${part.replace('plays ', '')}` };
    if (part.startsWith('same platform'))  return { emoji: '🖥️', text: part.charAt(0).toUpperCase() + part.slice(1) };
    if (part.startsWith('same playstyle')) return { emoji: '⚡', text: part.charAt(0).toUpperCase() + part.slice(1) };
    if (part.startsWith('speaks '))        return { emoji: '🌍', text: `Speaks ${part.replace('speaks ', '')}` };
    if (part.startsWith('available '))     return { emoji: '📅', text: `Both free ${part.replace('available ', '')}` };
    if (part.startsWith('same city'))      return { emoji: '📍', text: part.charAt(0).toUpperCase() + part.slice(1) };
    return { emoji: '✅', text: part };
  });
}

export function MatchCard({
  name,
  games,
  platform,
  style,
  language,
  city,
  openIRL,
  isIRLNearby,
  fitLabel,
  fitReason,
  invitationSent = false,
  onRequestMatch,
}: MatchCardProps) {
  const config   = fitConfig[fitLabel] ?? fitConfig['Worth reaching out'];
  const bullets  = parseFitReasonToBullets(fitReason);
  const platforms = normalizeArray(platform);
  const styles    = normalizeArray(style);

  return (
    <div className={`card-hover rounded-2xl border ${config.border} ${config.bg} overflow-hidden`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xl font-black text-text truncate">{name}</span>
          {(city || isIRLNearby || openIRL) && (
            <div className="flex items-center gap-2 flex-wrap">
              {city && (
                city === 'Utrecht'
                  ? <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">📍 Utrecht</span>
                  : <span className="rounded-full border border-border bg-panel2 px-2 py-0.5 text-xs text-muted">📍 {city}</span>
              )}
              {isIRLNearby ? (
                <span className="rounded-full border border-emerald-400/60 bg-emerald-400/15 px-2 py-0.5 text-xs font-bold text-emerald-400 animate-pulse">
                  📍 Nearby · IRL ready
                </span>
              ) : openIRL ? (
                <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-400">
                  IRL ✓
                </span>
              ) : null}
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${config.badgeBg}`}>
          {config.badge}
        </span>
      </div>

      <div className="border-t border-border/50 mx-5" />

      {/* Tags profil */}
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {games.map((g) => (
          <span key={g} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">🎮 {g}</span>
        ))}
        {platforms.map((p) => (
          <span key={p} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">🖥️ {p}</span>
        ))}
        {styles.map((s) => (
          <span key={s} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">⚡ {s}</span>
        ))}
        {language.map((l) => (
          <span key={l} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">🌍 {l}</span>
        ))}
      </div>

      <div className="border-t border-border/50 mx-5" />

      {/* Why you match */}
      <div className="px-5 py-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Why you match</p>
        <ul className="flex flex-col gap-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-text">
              <span>{b.emoji}</span>
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border/50 mx-5" />

      {/* CTA */}
      <div className="px-5 py-4">
        {invitationSent ? (
          <div className="w-full rounded-xl border border-green-500/40 bg-green-500/10 px-5 py-3 text-sm font-semibold text-green-400 text-center">
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
