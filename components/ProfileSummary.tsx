import Link from 'next/link';

type Props = {
  name: string;
  games: string[];
  platform: string;
  style: string;
  language: string[];
  city: string;
  openIRL: boolean;
};

export function ProfileSummary({ name, games, platform, style, language, city, openIRL }: Props) {
  const chips = [
    ...games.slice(0, 3),
    platform,
    style,
    ...(language.length > 0 ? [language.join(' / ')] : []),
    city,
    openIRL ? 'IRL ✓' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-panel px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text">{name || 'Your profile'}</span>
          <span className="rounded-full border border-border bg-panel2 px-2 py-0.5 text-xs text-muted">Utrecht</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-panel2 px-3 py-1 text-xs font-medium text-text"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <Link
        href="/onboarding"
        className="shrink-0 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-panel2 transition"
      >
        Edit profile
      </Link>
    </div>
  );
}
