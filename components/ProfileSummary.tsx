import Link from 'next/link';

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
    <div className="rounded-2xl border border-orange-500/50 bg-orange-500/5 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-text">{name || 'Your profile'}</span>
          <span className="rounded-full border border-border bg-panel2 px-2 py-0.5 text-xs text-muted">{city || 'Utrecht'}</span>
        </div>
        <div className="flex items-center gap-2">
          {openIRL && (
            <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">IRL ✓</span>
          )}
          <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-400">
            👤 My profile
          </span>
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-orange-500/20 mx-5" />

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
            🌍 {l}
          </span>
        ))}
        {styles.map((s) => (
          <span key={s} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            ⚡ {s}
          </span>
        ))}
      </div>

      {/* Séparateur */}
      <div className="border-t border-orange-500/20 mx-5" />

      {/* CTA Edit */}
      <div className="px-5 py-4">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-xl bg-panel2 border border-border px-4 py-2 text-sm font-semibold text-text hover:border-orange-500/60 hover:text-orange-400 transition"
        >
          ✏️ Edit my profile
        </Link>
      </div>

    </div>
  );
}
