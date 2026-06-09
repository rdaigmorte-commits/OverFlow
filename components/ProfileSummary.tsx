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
  const chips = [
    ...games.slice(0, 3),
    ...toArray(platform),
    ...toArray(style),
    ...(language.length > 0 ? [language.join(' / ')] : []),
    city,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-text">{name || 'Your profile'}</span>
        <span className="rounded-full border border-border bg-panel2 px-2 py-0.5 text-xs text-muted">Utrecht</span>
        {openIRL && (
          <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">IRL ✓</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="rounded-full border border-border bg-panel2 px-3 py-1 text-xs font-medium text-text"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
