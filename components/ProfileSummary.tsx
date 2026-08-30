import Link from 'next/link';
import { LANG_FLAG, PLATFORM_EMOJI, LOOKING_FOR_META } from '@/lib/match';
import { STYLE_TO_CLASS } from '@/lib/rpgClass';
import { ShapeIcon } from '@/components/ShapeIcon';

type Props = {
  name: string;
  age?: string | null;
  games: string[];
  platform: string | string[];
  style: string | string[];
  language: string[];
  availability: string[];
  city: string;
  openIRL: boolean;
  lookingFor?: string | null;
  // Remplace le CTA "Edit my profile" par défaut — utilisé pour afficher la
  // fiche d'un AUTRE joueur (voir PlayerDetailModal dans /matches).
  footer?: React.ReactNode;
};

function toArray(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

export function ProfileSummary({ name, age, games, platform, style, language, availability, city, openIRL, lookingFor, footer }: Props) {
  const platforms = toArray(platform);
  const styles    = toArray(style);
  const lookingForMeta = lookingFor ? LOOKING_FOR_META[lookingFor] : null;

  return (
    <div className="rounded-2xl border border-accentSoftBorder bg-accentSoft overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-text">
            {name || 'Your profile'}
            {age && <span className="font-semibold text-muted">, {age}</span>}
          </span>
          <span className="rounded-full border border-border bg-panel2 px-2 py-0.5 text-xs text-muted">{city || 'your city'}</span>
        </div>
        <div className="flex items-center gap-2">
          {openIRL && (
            <span className="rounded-full border border-accent3SoftBorder bg-accent3Soft px-3 py-1 text-xs font-bold text-[#2E9E24]">📍 IRL</span>
          )}
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-accentSoftBorder mx-5" />

      {/* Tags */}
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {games.map((g) => (
          <span key={g} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            🎮 {g}
          </span>
        ))}
        {platforms.map((p) => (
          <span key={p} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            {PLATFORM_EMOJI[p] ?? '🖥️'} {p}
          </span>
        ))}
        {language.map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5 rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            <span className={`fi fi-${LANG_FLAG[l] ?? 'un'}`} />
            {l}
          </span>
        ))}
        {styles.map((s) => {
          const rpg = STYLE_TO_CLASS[s];
          return (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
              {rpg ? <ShapeIcon shape={rpg.icon} color={rpg.color} size={13} /> : '⚡'}
              {s}
            </span>
          );
        })}
        {availability.map((slot) => (
          <span key={slot} className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            🕒 {slot}
          </span>
        ))}
        {lookingForMeta && (
          <span className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text">
            {lookingForMeta.icon} Looking for: {lookingForMeta.label}
          </span>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-t border-accentSoftBorder mx-5" />

      {/* CTA — "Edit my profile" par défaut, remplaçable via `footer` (fiche d'un autre joueur) */}
      <div className="px-5 py-4">
        {footer ?? (
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 rounded-xl bg-panel2 border border-border px-4 py-2 text-sm font-semibold text-text hover:border-accent/60 hover:text-accent transition"
          >
            ✏️ Edit my profile
          </Link>
        )}
      </div>

    </div>
  );
}
