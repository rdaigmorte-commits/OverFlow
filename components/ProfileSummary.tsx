import Link from 'next/link';
import { LANG_BADGE } from '@/lib/match';

type Props = {
  name: string;
  games: string[];
  platform: string | string[];
  style: string | string[];
  language: string[];
  city: string;
  openIRL: boolean;
};

function toArray(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

export function ProfileSummary({ name, games, platform, style, language, city, openIRL }: Props) {
  const platforms = toArray(platform);
  const styles    = toArray(style);

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-text">{name || 'Your profile'}</span>
          <span className="rounded-full border border-border bg-panel2 px-2 py-0.5 text-xs text-muted">{city || 'your city'}</span>
        </div>
        <div className="flex items-center gap-2">
          {openIRL && (
            <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">IRL ✓</span>
          )}
          <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
            👤 My profile
          </span>
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-accent/20 mx-5" />

      {/* Tags */}
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
        {language.map((l) => (
          <span key={l} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            {LANG_BADGE[l] ?? l.slice(0, 2).toUpperCase()} {l}
          </span>
        ))}
        {styles.map((s) => (
          <span key={s} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            ⚡ {s}
          </span>
        ))}
      </div>

      {/* Séparateur */}
      <div className="border-t border-accent/20 mx-5" />

      {/* CTA Edit — pointe maintenant vers /profile/edit */}
      <div className="px-5 py-4">
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 rounded-xl bg-panel2 border border-border px-4 py-2 text-sm font-semibold text-text hover:border-accent/60 hover:text-accent transition"
        >
          ✏️ Edit my profile
        </Link>
      </div>

    </div>
  );
}
