import { normalizeArray } from '@/lib/match';

type MatchCardProps = {
  name: string;
  games: string[];
  platform: string[];
  style: string[];
  language: string[];
  fitLabel: 'Strong fit' | 'Good fit' | 'Worth reaching out';
  fitReason: string;
  score: number;
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
    if (part.startsWith('plays '))        return { emoji: '🎮', text: `Both play ${part.replace('plays ', '')}` };
    if (part.startsWith('same platform')) return { emoji: '🖥️', text: part.charAt(0).toUpperCase() + part.slice(1) };
    if (part.startsWith('same playstyle')) return { emoji: '⚡', text: part.charAt(0).toUpperCase() + part.slice(1) };
    if (part.startsWith('speaks '))       return { emoji: '🌍', text: `Speaks ${part.replace('speaks ', '')}` };
    if (part.startsWith('available '))    return { emoji: '📅', text: `Both free ${part.replace('available ', '')}` };
    return { emoji: '✅', text: part };
  });
}

export function MatchCard({
  name,
  games,
  platform,
  style,
  language,
  fitLabel,
  fitReason,
  onRequestMatch,
}: MatchCardProps) {
  const config   = fitConfig[fitLabel] ?? fitConfig['Worth reaching out'];
  const bullets  = parseFitReasonToBullets(fitReason);
  const platforms = normalizeArray(platform);
  const styles    = normalizeArray(style);

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} overflow-hidden`}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="text-xl font-black text-text">{name}</span>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${config.badgeBg}`}>
          {config.badge}
        </span>
      </div>

      {/* Séparateur */}
      <div className="border-t border-border/50 mx-5" />

      {/* Tags profil */}
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {games.map((g) => (
          <span key={g} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            🎮 {g}
          </span>
        ))}
        {platforms.map((p) => (
          <span key={p} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            🖥️ {p}
          </span>
        ))}
        {styles.map((s) => (
          <span key={s} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            ⚡ {s}
          </span>
        ))}
        {language.map((l) => (
          <span key={l} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            🌍 {l}
          </span>
        ))}
      </div>

      {/* Séparateur */}
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

      {/* Séparateur */}
      <div className="border-t border-border/50 mx-5" />

      {/* CTA */}
      <div className="px-5 py-4">
        <button
          onClick={onRequestMatch}
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
        >
          Request match
        </button>
      </div>

    </div>
  );
}
