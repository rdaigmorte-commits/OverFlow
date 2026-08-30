'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { IrlEventBlock } from '@/components/IrlEventBlock';
import { MatchCard } from '@/components/MatchCard';
import { WhyYouMatch } from '@/components/WhyYouMatch';
import { Avatar } from '@/components/Avatar';
import { ProfileSummary } from '@/components/ProfileSummary';
import { DISCORD_URL, DiscordIcon } from '@/components/DiscordIcon';
import { CompatibilityRing } from '@/components/CompatibilityRing';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';
import { computeMatches, normalizeArray, type Match } from '@/lib/match';

const GRID_PAGE_SIZE = 6;
const TAIL_PAGE_SIZE = 10;

// ─── CompactMatchRow ─────────────────────────────────────────────────────────
// Traitement réduit pour le tier "Worth reaching out" — moins prioritaire, pas de carte complète.
function CompactMatchRow({
  match,
  invitationSent,
  onRequestMatch,
  onViewProfile,
}: { match: Match; invitationSent: boolean; onRequestMatch: () => void; onViewProfile: () => void }) {
  const percent = Math.round((match.score / 120) * 100);
  const reason = match.fitReason.split(' · ')[0];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3">
      <CompatibilityRing percent={percent} tier={match.tier} size={36} />
      <button
        type="button"
        onClick={onViewProfile}
        className="min-w-0 flex-1 text-left hover:opacity-80 transition"
      >
        <p className="text-sm font-semibold text-text truncate">
          {match.name}
          {match.age && <span className="font-normal text-muted">, {match.age}</span>}
        </p>
        <p className="text-xs text-muted truncate">{reason} · See full profile</p>
      </button>
      {invitationSent ? (
        <span className="shrink-0 rounded-full border border-accent3SoftBorder bg-accent3Soft px-3 py-1.5 text-xs font-semibold text-[#2E9E24]">
          Sent ✓
        </span>
      ) : (
        <button
          onClick={onRequestMatch}
          className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
        >
          Let&apos;s play
        </button>
      )}
    </div>
  );
}

// ─── MatchesDisconnectedState ────────────────────────────────────────────────
function MatchesDisconnectedState() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.status === 429
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : 'Something went wrong. Please try again.');
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="text-5xl">🎮</div>
        <div>
          <h1 className="text-3xl font-black">Your matches are waiting</h1>
          <p className="mt-3 text-muted max-w-md mx-auto">
            Sign in with your email to access your profile and see who&apos;s ready to play.
          </p>
        </div>

        {sent ? (
          <div className="w-full max-w-sm rounded-2xl border border-border bg-panel p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-semibold text-text mb-2">Check your inbox!</h2>
            <p className="text-sm text-muted">
              We sent a magic link to <span className="font-medium text-text">{email}</span>.<br />
              Click it to access your matches — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-xs text-muted underline hover:text-text"
            >
              Wrong email? Try again
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-2xl border border-border bg-panel p-8 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="ml-email" className="text-sm font-medium text-text">Email address</label>
              <input
                id="ml-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-panel2 border border-border rounded-lg px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-accent transition"
              />
            </div>
            {error && <p className="text-error text-sm text-left">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary-new w-full py-3 text-sm disabled:pointer-events-none"
            >
              {loading ? 'Sending…' : 'Send magic link 🔗'}
            </button>
          </form>
        )}

        <p className="text-xs text-muted">
          No account yet?{' '}
          <Link href="/onboarding" className="text-accent underline underline-offset-2 hover:opacity-80">
            Create your profile
          </Link>
        </p>
      </div>
    </main>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type RevealedField = { label: string; value: string };

type ContactSituation =
  | { type: 'discord'; discord: string; name: string }
  | { type: 'mail_only'; name: string }
  | { type: 'no_contact'; name: string }
  | { type: 'login_required'; name: string }
  | { type: 'revealed'; name: string; contacts: RevealedField[] };

// Construit la liste des champs révélés à partir de get_match_contact() —
// l'email n'y figure jamais (privé, gardé pour le magic link + notifications) ;
// seuls les champs non-null passent (mutual accepted + consent).
function extractRevealedFields(contact: {
  discord: string | null; psn: string | null; steam: string | null;
  other_contact: string | null; other_contact_label: string | null;
}): RevealedField[] {
  const fields: RevealedField[] = [];
  if (contact.discord)       fields.push({ label: 'Discord', value: contact.discord });
  if (contact.psn)           fields.push({ label: 'PSN',     value: contact.psn });
  if (contact.steam)         fields.push({ label: 'Steam',   value: contact.steam });
  if (contact.other_contact) fields.push({ label: contact.other_contact_label || 'Other', value: contact.other_contact });
  return fields;
}

// ─── ContactModal ────────────────────────────────────────────────────────────
function ContactModal({
  situation,
  onClose,
}: {
  situation: ContactSituation;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">
            {situation.type === 'revealed' ? `🎮 Match confirmed with ${situation.name}!` : `🎮 Let's play with ${situation.name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {situation.type === 'discord' && (
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              {situation.name} is on Discord — reach out directly to set up a session.
            </p>
            <div className="flex items-center justify-between rounded-xl border border-border bg-panel2 px-4 py-3">
              <div>
                <div className="text-xs text-muted uppercase tracking-widest mb-1">Discord</div>
                <div className="text-sm font-medium text-text">{situation.discord}</div>
              </div>
              <button
                onClick={() => copy(situation.discord)}
                className="ml-4 shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-panel2"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-muted">
              Your invitation has been recorded. 🎮
            </p>
          </div>
        )}

        {situation.type === 'mail_only' && (
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              We&apos;ve sent {situation.name} a notification to let them know you want to play.
            </p>
            <div className="rounded-xl border border-border bg-panel2 px-4 py-3 text-sm text-muted">
              They&apos;ll get an email inviting them to connect with you. If they don&apos;t respond, we&apos;ll nudge them again.
            </div>
          </div>
        )}

        {situation.type === 'no_contact' && (
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              {situation.name} hasn&apos;t shared contact info yet.
            </p>
            <div className="rounded-xl border border-accent2SoftBorder bg-accent2Soft px-4 py-3 text-sm text-muted">
              ⚠️ We&apos;ll notify them that players want to connect — this might nudge them to add their Discord or email.
            </div>
          </div>
        )}

        {situation.type === 'revealed' && (
          <div className="grid gap-3">
            <p className="text-sm text-muted">
              You both clicked &quot;Let&apos;s play&quot; — here&apos;s how to reach {situation.name}:
            </p>
            {situation.contacts.length === 0 ? (
              <p className="rounded-xl border border-border bg-panel2 px-4 py-3 text-sm text-muted">
                {situation.name} hasn&apos;t shared any contact details yet.
              </p>
            ) : (
              situation.contacts.map((c) => (
                <div key={c.label} className="flex items-center justify-between rounded-xl border border-border bg-panel2 px-4 py-3">
                  <div>
                    <div className="text-xs text-muted uppercase tracking-widest mb-1">{c.label}</div>
                    <div className="text-sm font-medium text-text">{c.value}</div>
                  </div>
                  <button
                    onClick={() => copy(c.value)}
                    className="ml-4 shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-panel2"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {situation.type === 'login_required' && (
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              You need an account to invite {situation.name} to play.
            </p>
            <Link
              href="/login"
              onClick={onClose}
              className="block w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white text-center hover:opacity-90 transition"
            >
              Sign in to invite
            </Link>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text hover:bg-panel2 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── PlayerDetailModal ───────────────────────────────────────────────────────
// Fiche complète d'un autre joueur — tout ce qu'il a saisi (pas juste les
// critères en commun affichés sur la card). Réutilise ProfileSummary, jamais
// les contacts (email/Discord/etc.) : ça reste gated derrière l'acceptation
// mutuelle, comme partout ailleurs dans l'app.
function PlayerDetailModal({
  match,
  invitationSent,
  onRequestMatch,
  onClose,
}: {
  match: Match;
  invitationSent: boolean;
  onRequestMatch: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Full profile</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <ProfileSummary
          name={match.name}
          age={match.age}
          games={match.games ?? []}
          platform={normalizeArray(match.platform)}
          style={normalizeArray(match.profile?.style)}
          language={normalizeArray(match.language)}
          availability={normalizeArray(match.profile?.availability)}
          city={match.city ?? ''}
          openIRL={!!match.openIRL}
          lookingFor={match.lookingFor}
          footer={
            invitationSent ? (
              <div className="w-full rounded-xl border border-accent3SoftBorder bg-accent3Soft px-4 py-3 text-sm font-semibold text-[#2E9E24] text-center">
                Invitation sent ✓
              </div>
            ) : (
              <button
                onClick={onRequestMatch}
                className="btn-primary-new w-full px-5 py-3 text-sm"
              >
                Let&apos;s play 🎮
              </button>
            )
          }
        />

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            {match.fitLabel} · {Math.round((match.score / 120) * 100)}%
          </p>
          <WhyYouMatch fitReasons={match.fitReasons} commonGames={match.commonGames} />
        </div>
      </div>
    </div>
  );
}

// ─── InvitationsPanel ────────────────────────────────────────────────────────
type ReceivedRequest = {
  id: string;
  sender_id: string;
  created_at: string;
  sender: { id: string; name: string; games: string[] } | null;
};
type SentRequest = {
  id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  receiver: { id: string; name: string } | null;
};
type MatchedConnection = { id: string; profileId: string; name: string; created_at: string };

// Date courte et lisible sans dépendance supplémentaire.
function formatRequestDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH  = diffMs / 3_600_000;
  if (diffH < 1)  return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)  return `${diffD}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function InvitationsPanel({
  received,
  sent,
  matched,
  revealedContacts,
  matchesById,
  onAccept,
  onDecline,
}: {
  received: ReceivedRequest[];
  sent: SentRequest[];
  matched: MatchedConnection[];
  revealedContacts: Record<string, RevealedField[]>;
  matchesById: Record<string, Match>;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [tab, setTab] = useState<'received' | 'sent' | 'matched'>('received');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sentPending = sent.filter((r) => r.status !== 'accepted');

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    });
  };

  // Lien "Why we match" — déplie la même info que la card de découverte, réutilisée
  // depuis les matches déjà calculés en mémoire (pas de nouvelle requête).
  function WhyMatchToggle({ rowId, profileId }: { rowId: string; profileId: string }) {
    const m = matchesById[profileId];
    if (!m) return null;
    const isOpen = expandedId === rowId;
    return (
      <button
        type="button"
        onClick={() => setExpandedId(isOpen ? null : rowId)}
        className="text-xs text-accent underline underline-offset-2 hover:opacity-80 transition self-start"
      >
        {isOpen ? 'Hide details' : 'Why we match'}
      </button>
    );
  }

  // Empty state global — aucune demande ni match dans aucune des deux directions.
  if (received.length === 0 && sentPending.length === 0 && matched.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-panel px-6 py-8 text-center">
        <p className="text-lg font-bold text-text">No match yet</p>
        <p className="mt-2 text-sm text-muted">
          Pick a player from the list below and send a request to get started.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a href="#matches-grid" className="btn-primary-new px-5 py-2.5 text-sm">
            Browse matches
          </a>
          <Link
            href="/profile/edit"
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-panel2 transition"
          >
            Complete my profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="inline-flex w-fit rounded-xl border border-border bg-[#F1ECE1] p-1 gap-1">
        <button
          onClick={() => setTab('received')}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
            tab === 'received' ? 'bg-white text-text shadow-sm' : 'bg-transparent text-muted hover:text-text'
          }`}
        >
          📬 Received ({received.length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
            tab === 'sent' ? 'bg-white text-text shadow-sm' : 'bg-transparent text-muted hover:text-text'
          }`}
        >
          Sent ({sentPending.length})
        </button>
        <button
          onClick={() => setTab('matched')}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
            tab === 'matched' ? 'bg-white text-text shadow-sm' : 'bg-transparent text-muted hover:text-text'
          }`}
        >
          🤝 Matched ({matched.length})
        </button>
      </div>

      {tab === 'received' && received.map((req) => (
        <div
          key={req.id}
          className="flex flex-col gap-2 rounded-xl border border-accent3SoftBorder bg-accent3Soft px-5 py-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={req.sender?.name ?? '?'} tier={matchesById[req.sender_id]?.tier} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text truncate">{req.sender?.name ?? 'A player'}</p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {(req.sender?.games ?? []).slice(0, 3).join(', ')}
                  {req.sender?.games?.length ? ' · ' : ''}{formatRequestDate(req.created_at)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => onAccept(req.id)}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
              >
                Accept
              </button>
              <button
                onClick={() => onDecline(req.id)}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted hover:text-text hover:bg-panel2 transition"
              >
                Decline
              </button>
            </div>
          </div>
          <WhyMatchToggle rowId={req.id} profileId={req.sender_id} />
          {expandedId === req.id && matchesById[req.sender_id] && (
            <div className="rounded-lg bg-panel/60 p-3">
              <WhyYouMatch fitReasons={matchesById[req.sender_id].fitReasons} commonGames={matchesById[req.sender_id].commonGames} />
            </div>
          )}
        </div>
      ))}
      {tab === 'received' && received.length === 0 && (
        <p className="text-xs text-muted px-1">No pending invitations right now.</p>
      )}

      {tab === 'sent' && sentPending.map((req) => (
        <div
          key={req.id}
          className="flex flex-col gap-2 rounded-xl border border-border bg-panel2 px-5 py-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={req.receiver?.name ?? '?'} tier={matchesById[req.receiver_id]?.tier} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text truncate">{req.receiver?.name ?? 'A player'}</p>
                <p className="text-xs text-muted mt-0.5">{formatRequestDate(req.created_at)}</p>
              </div>
            </div>
            {req.status === 'declined' ? (
              <span className="shrink-0 rounded-full border border-border bg-panel px-3 py-1 text-xs font-semibold text-muted">
                Declined
              </span>
            ) : (
              <span className="shrink-0 rounded-full border border-accent2SoftBorder bg-accent2Soft px-3 py-1 text-xs font-semibold text-[#B77900]">
                ⏳ Pending
              </span>
            )}
          </div>
          <WhyMatchToggle rowId={req.id} profileId={req.receiver_id} />
          {expandedId === req.id && matchesById[req.receiver_id] && (
            <div className="rounded-lg bg-panel/60 p-3">
              <WhyYouMatch fitReasons={matchesById[req.receiver_id].fitReasons} commonGames={matchesById[req.receiver_id].commonGames} />
            </div>
          )}
        </div>
      ))}
      {tab === 'sent' && sentPending.length === 0 && (
        <p className="text-xs text-muted px-1">You haven&apos;t sent any invitations yet.</p>
      )}

      {/* Matched — connexions mutuelles, coordonnées toujours disponibles ici */}
      {tab === 'matched' && matched.map((m) => {
        const revealed = revealedContacts[m.profileId];
        return (
          <div
            key={m.id}
            className="flex flex-col gap-2 rounded-xl border border-accent3SoftBorder bg-accent3Soft px-5 py-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={m.name} tier={matchesById[m.profileId]?.tier} size={40} />
                <p className="text-sm font-medium text-text truncate">{m.name}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{formatRequestDate(m.created_at)}</span>
            </div>
            {revealed === undefined ? (
              <p className="text-xs text-muted">Loading contact…</p>
            ) : revealed.length === 0 ? (
              <p className="text-xs text-muted">{m.name} hasn&apos;t shared any contact details yet — check back later.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {revealed.map((c) => {
                  const key = `${m.profileId}-${c.label}`;
                  return (
                    <button
                      key={key}
                      onClick={() => copy(key, c.value)}
                      className="rounded-full bg-panel2 border border-border px-3 py-1 text-xs font-medium text-text hover:border-accent transition"
                    >
                      {c.label}: {c.value} {copiedKey === key ? '· Copied ✓' : ''}
                    </button>
                  );
                })}
              </div>
            )}
            <WhyMatchToggle rowId={m.id} profileId={m.profileId} />
            {expandedId === m.id && matchesById[m.profileId] && (
              <div className="rounded-lg bg-panel2/60 p-3">
                <WhyYouMatch fitReasons={matchesById[m.profileId].fitReasons} commonGames={matchesById[m.profileId].commonGames} />
              </div>
            )}
          </div>
        );
      })}
      {tab === 'matched' && matched.length === 0 && (
        <p className="text-xs text-muted px-1">No matches yet — accept or get an invitation accepted to connect.</p>
      )}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PUBLIC_PROFILE_FIELDS = 'id, name, age, city, language, platform, games, style, availability, open_irl, looking_for';
const PROFILE_FETCH_LIMIT = 200;

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const router = useRouter();
  const { profile, setProfile, reset } = useOverflowStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [situation, setSituation] = useState<ContactSituation | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Match | null>(null);
  const [currentProfile, setCurrentProfile] = useState<typeof profile | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [downToMeetOnly, setDownToMeetOnly] = useState(false);
  const [gridVisibleCount, setGridVisibleCount] = useState(GRID_PAGE_SIZE);
  const [tailVisibleCount, setTailVisibleCount] = useState(TAIL_PAGE_SIZE);
  const [sentInvitations, setSentInvitations] = useState<Record<string, boolean>>({});
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [acceptedReceived, setAcceptedReceived] = useState<ReceivedRequest[]>([]);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, RevealedField[]>>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // true = get_my_contacts() confirmed this session owns the loaded profile;
  // false = authenticated, but as a different account (profile/login identity mismatch).
  const [ownsProfile, setOwnsProfile] = useState<boolean | null>(null);
  const [inboundRequests, setInboundRequests] = useState<ReceivedRequest[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);

  // Matchs mutuels — union des demandes acceptées dans les deux sens, plus récent en premier.
  const matchedConnections: MatchedConnection[] = [
    ...sentRequests
      .filter((r) => r.status === 'accepted')
      .map((r) => ({ id: r.id, profileId: r.receiver_id, name: r.receiver?.name ?? 'A player', created_at: r.created_at })),
    ...acceptedReceived
      .map((r) => ({ id: r.id, profileId: r.sender_id, name: r.sender?.name ?? 'A player', created_at: r.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Révèle automatiquement les contacts des matchs mutuels (envoyés ET reçus acceptés)
  // — sans que l'utilisateur ait à recliquer quoi que ce soit.
  useEffect(() => {
    const toFetch = [...new Set(matchedConnections.map((c) => c.profileId))]
      .filter((id) => !(id in revealedContacts));
    if (toFetch.length === 0) return;
    toFetch.forEach(async (id) => {
      const { data: contactRows } = await supabase
        .rpc('get_match_contact', { target_profile_id: id });
      const contact = contactRows?.[0];
      setRevealedContacts((prev) => ({
        ...prev,
        [id]: contact ? extractRevealedFields(contact) : [],
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentRequests, acceptedReceived]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setAuthChecked(true);
    });
  }, []);

  // Total de joueurs inscrits (site-wide, pas juste les PROFILE_FETCH_LIMIT découvrables) —
  // sert de dénominateur au "X players match your vibes out of Y players" ci-dessous.
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (typeof count === 'number') setTotalPlayers(count);
      });
  }, []);

  useEffect(() => {
    async function fetchMatches() {
      const profileId = profile.profileId;
      if (!profileId) { setLoading(false); return; }

      let hydratedProfile = profile;

      // select=* interdit après SEC-02 (REVOKE table-level SELECT) — utiliser les champs publics
      const { data: me, error: meError } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_FIELDS)
        .eq('id', profileId)
        .single();

      if (!meError && me) {
        const updated = {
          ...profile,  // preserve email, discord, consent depuis le store (chargés séparément)
          profileId:    me.id,
          name:         me.name ?? '',
          age:          me.age ?? '',
          city:         me.city ?? '',
          language:     Array.isArray(me.language) ? me.language : (me.language ? [me.language] : []),
          platform:     normalizeArray(me.platform),
          games:        Array.isArray(me.games) ? me.games : [],
          style:        normalizeArray(me.style),
          availability: Array.isArray(me.availability) ? me.availability : [],
          openIRL:      me.open_irl ?? false,
        };
        setProfile(updated);
        hydratedProfile = updated as typeof profile;
      }

      // Contacts : REVOKE bloque la lecture directe — passer par la RPC si authentifié
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession?.user) {
        const { data: contacts } = await supabase.rpc('get_my_contacts');
        if (contacts?.[0]) {
          const contactPatch = { email: contacts[0].email ?? '', discord: contacts[0].discord ?? '' };
          setProfile(contactPatch);
          hydratedProfile = { ...hydratedProfile, ...contactPatch };
          setOwnsProfile(true);
        } else {
          // Signed in, but this session doesn't own the profile cached in localStorage —
          // e.g. a stale profileId from a previous account on this browser.
          setOwnsProfile(false);
        }
      }

      // Charger les demandes reçues (pending) avec le profil de l'émetteur
      const { data: inboundData } = await supabase
        .from('match_requests')
        .select('id, sender_id, created_at, sender:profiles!sender_id(id, name, games)')
        .eq('receiver_id', profileId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setInboundRequests((inboundData ?? []) as unknown as typeof inboundRequests);

      // Charger les demandes reçues déjà acceptées (matchs mutuels, onglet "Matched")
      const { data: acceptedReceivedData } = await supabase
        .from('match_requests')
        .select('id, sender_id, created_at, sender:profiles!sender_id(id, name, games)')
        .eq('receiver_id', profileId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });
      setAcceptedReceived((acceptedReceivedData ?? []) as unknown as ReceivedRequest[]);

      // Charger les invitations déjà envoyées depuis Supabase (source de vérité)
      const { data: sentData } = await supabase
        .from('match_requests')
        .select('id, receiver_id, status, created_at, receiver:profiles!receiver_id(id, name)')
        .eq('sender_id', profileId)
        .order('created_at', { ascending: false });

      if (sentData) {
        const sentMap: Record<string, boolean> = {};
        sentData.forEach((r) => { sentMap[r.receiver_id] = true; });
        setSentInvitations(sentMap);
        setSentRequests(sentData as unknown as SentRequest[]);
      }

      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_FIELDS)
        .limit(PROFILE_FETCH_LIMIT);

      if (allError || !allProfiles) { setFetchError(true); setLoading(false); return; }

      const current = {
        id:           hydratedProfile.profileId ?? '',
        name:         hydratedProfile.name,
        games:        hydratedProfile.games ?? [],
        platform:     hydratedProfile.platform,
        language:     hydratedProfile.language,
        availability: hydratedProfile.availability ?? [],
        style:        hydratedProfile.style,
        city:         hydratedProfile.city,
        age:          hydratedProfile.age,
        open_irl:     hydratedProfile.openIRL,
      };

      setCurrentProfile(hydratedProfile as typeof profile);
      const results = computeMatches(current, allProfiles);
      setMatches(results);
      setLoading(false);
    }

    setLoading(true);
    setFetchError(false);
    fetchMatches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.profileId, retryCount]);

  async function handleAcceptRequest(requestId: string) {
    const request = inboundRequests.find((r) => r.id === requestId);
    const { error } = await supabase
      .from('match_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (!error) {
      setInboundRequests((prev) => prev.filter((r) => r.id !== requestId));

      // Passe dans l'onglet "Matched" — retrouvable à tout moment, pas que dans le modal.
      if (request) {
        setAcceptedReceived((prev) => [request, ...prev]);
      }

      // Révélation immédiate — plus besoin de re-cliquer "Let's play" pour la voir.
      if (request?.sender_id) {
        const { data: contactRows } = await supabase
          .rpc('get_match_contact', { target_profile_id: request.sender_id });
        const contact = contactRows?.[0];
        const contacts = contact ? extractRevealedFields(contact) : [];
        setRevealedContacts((prev) => ({ ...prev, [request.sender_id]: contacts }));
        setSituation({
          type: 'revealed',
          name: request.sender?.name ?? 'this player',
          contacts,
        });
      }
    }
  }

  async function handleDeclineRequest(requestId: string) {
    const { error } = await supabase
      .from('match_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);
    if (!error) {
      setInboundRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    reset();
    router.replace('/');
  }

  async function handleLetsPlay(matchId: string, matchName: string) {
    const senderId = profile.profileId;
    if (!senderId) return;

    // Bloquer les utilisateurs non authentifiés (policy match_requests TO authenticated)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setSituation({ type: 'login_required', name: matchName });
      return;
    }

    // 1. Enregistrer en base (anti-spam via contrainte UNIQUE)
    await supabase.from('match_requests').upsert(
      { sender_id: senderId, receiver_id: matchId },
      { onConflict: 'sender_id,receiver_id', ignoreDuplicates: true }
    );

    // 2. Mettre à jour l'état local (pas de localStorage)
    setSentInvitations((prev) => ({ ...prev, [matchId]: true }));
    setSentRequests((prev) => (
      prev.some((r) => r.receiver_id === matchId)
        ? prev
        : [{ id: `local-${matchId}`, receiver_id: matchId, status: 'pending', created_at: new Date().toISOString(), receiver: { id: matchId, name: matchName } }, ...prev]
    ));

    // 3. Récupérer le contact via RPC sécurisée (email/discord jamais lus directement)
    const { data: contactRows, error } = await supabase
      .rpc('get_match_contact', { target_profile_id: matchId });

    const contact = contactRows?.[0];
    if (error || !contact) {
      setSituation({ type: 'no_contact', name: matchName });
      return;
    }

    if (contact.discord) {
      setSituation({ type: 'discord', discord: contact.discord, name: matchName });
    } else if (contact.has_email) {
      setSituation({ type: 'mail_only', name: matchName });
      await supabase.functions.invoke('notify-match', {
        body: { sender_id: senderId, receiver_id: matchId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } else {
      setSituation({ type: 'no_contact', name: matchName });
    }
  }

  const displayProfile = currentProfile ?? profile;
  const hasNoProfile = !loading && !profile.profileId;
  const hasEmail = !!displayProfile.email;
  const hasContact = !!displayProfile.email || !!displayProfile.discord;
  const userCity = displayProfile.city || '';

  // Index par profil — permet à l'encart Invitations de retrouver les raisons de match
  // ("Why we match") pour un joueur déjà accepté/en attente sans nouvelle requête.
  const matchesById: Record<string, Match> = Object.fromEntries(matches.map((m) => [m.id, m]));

  // Un profil déjà matché (mutuel) sort de la découverte — "Let's play" n'a plus de sens,
  // il vit désormais dans l'onglet "Matched".
  const matchedProfileIds = new Set(matchedConnections.map((c) => c.profileId));
  const discoverableMatches = matches.filter((m) => !matchedProfileIds.has(m.id));

  const visibleMatches = downToMeetOnly
    ? discoverableMatches.filter((m) => m.isIRLNearby)
    : discoverableMatches;

  // "X players match your vibes" — uniquement les tiers jaune (Good fit) et vert (Strong
  // fit), pas le gris "Worth reaching out" ; indépendant du filtre "Down to meet" pour
  // rester un chiffre stable quand on bascule le filtre.
  const vibeMatchCount = discoverableMatches.filter((m) => m.tier === 'good' || m.tier === 'strong').length;

  const downToMeetCount = discoverableMatches.filter((m) => m.isIRLNearby).length;

  // Un simple bonus de ville suffit à générer un match "Worth reaching out" (tier
  // 'other') dès qu'un autre profil existe dans la même ville — matches.length === 0
  // n'est donc quasiment jamais vrai. Le signal pertinent pour proposer l'événement
  // IRL est l'absence de match sérieux (Strong/Good fit), pas l'absence totale.
  const hasSeriousMatch = discoverableMatches.some((m) => m.tier !== 'other');

  if (hasNoProfile) {
    if (!authChecked) {
      return (
        <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 flex items-center justify-center">
          <p className="text-muted text-sm">Loading…</p>
        </main>
      );
    }
    if (!isAuthenticated) {
      return <MatchesDisconnectedState />;
    }
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="text-5xl">🎮</div>
          <div>
            <h1 className="text-3xl font-black">You haven&apos;t created your profile yet</h1>
            <p className="mt-3 text-muted max-w-md mx-auto">Create your gamer profile to find players who match your games, style, and availability.</p>
          </div>
          <Link href="/onboarding" className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition">Create my profile</Link>
          <p className="text-xs text-muted">Takes less than 2 minutes · No account needed</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">

      {situation && <ContactModal situation={situation} onClose={() => setSituation(null)} />}

      {viewingProfile && (
        <PlayerDetailModal
          match={viewingProfile}
          invitationSent={!!sentInvitations[viewingProfile.id]}
          onRequestMatch={() => {
            handleLetsPlay(viewingProfile.id, viewingProfile.name);
            setViewingProfile(null);
          }}
          onClose={() => setViewingProfile(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black">Your matches</h1>
          <p className="mt-2 text-muted">
            {userCity ? `${userCity} · ` : ''}Based on your profile
          </p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-xs text-muted hover:text-text transition mt-2 disabled:opacity-50"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {/* Bandeau no-email — profil jamais lié à un compte : recoverability réellement en jeu */}
      {!loading && !isAuthenticated && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-accent2SoftBorder bg-accent2Soft px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-medium text-text">Your profile can&apos;t be recovered</p>
              <p className="mt-1 text-xs text-muted">
                Without an email, you&apos;ll lose access to your profile if you change device or clear your browser.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            Add email
          </Link>
        </div>
      )}

      {/* Bandeau mismatch — authentifié, mais avec un compte différent de celui qui possède
          ce profil (ex : profileId d'un ancien compte resté dans le localStorage). "Add email"
          n'aiderait pas ici : le profil est déjà lié, il faut se reconnecter avec le bon compte. */}
      {!loading && isAuthenticated && ownsProfile === false && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-accent2SoftBorder bg-accent2Soft px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-medium text-text">You&apos;re signed in with a different account</p>
              <p className="mt-1 text-xs text-muted">
                This profile is linked to a different email than the one you&apos;re currently signed in with. Sign out and sign back in with the original email to manage it.
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}

      {/* Profil + activité (invitations/matchs) côte à côte — évite l'empilement vertical */}
      {!loading && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            <h2 className="mb-2 text-sm font-bold text-muted uppercase tracking-wide">👤 Your profile</h2>
            <ProfileSummary
              name={displayProfile.name}
              games={displayProfile.games ?? []}
              platform={displayProfile.platform}
              style={displayProfile.style}
              language={displayProfile.language ?? []}
              availability={displayProfile.availability ?? []}
              city={displayProfile.city}
              openIRL={displayProfile.openIRL}
            />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold text-muted uppercase tracking-wide">🔔 Activity</h2>
            <InvitationsPanel
              received={inboundRequests}
              sent={sentRequests}
              matched={matchedConnections}
              revealedContacts={revealedContacts}
              matchesById={matchesById}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
            {inboundRequests.length > 0 && !hasContact && (
              <p className="-mt-3 text-xs text-muted px-1">
                Add your Discord in{' '}
                <Link href="/profile/edit" className="text-accent underline underline-offset-2 hover:opacity-80 transition">
                  your profile
                </Link>
                {' '}so players can reach you after you accept.
              </p>
            )}
          </div>
        </div>
      )}

      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 flex items-center gap-4 rounded-2xl border-2 p-4 hover:opacity-90 transition"
        style={{ borderColor: 'var(--border)', background: 'var(--panel2)' }}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: '#5865F2' }}>
          <DiscordIcon size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Join the Discord</p>
          <p className="text-xs text-muted">Found a bug or got an idea to improve OverFlow? Tell us there.</p>
        </div>
      </a>

      <h2 className="mb-2 text-sm font-bold text-muted uppercase tracking-wide">🎯 Matches</h2>
      <div className="grid gap-6">

        <section>
          {loading && <p className="text-muted text-sm">Finding your matches...</p>}

          {!loading && fetchError && (
            <Card className="p-8 text-center">
              <div className="text-2xl font-bold">Something went wrong</div>
              <p className="mt-3 text-muted">We couldn&apos;t load your matches. Please try refreshing the page.</p>
              <button onClick={() => setRetryCount(c => c + 1)} className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white">Try again</button>
            </Card>
          )}

          {!loading && !fetchError && discoverableMatches.length === 0 && (
            <div className="grid gap-5">
              <div className="rounded-2xl border border-accent3SoftBorder bg-accent3Soft px-6 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🚀</span>
                  <span className="rounded-full border border-accent3SoftBorder bg-white px-3 py-1 text-xs font-bold text-[#2E9E24]">
                    Early OverFlow Tester{userCity ? ` · ${userCity}` : ''}
                  </span>
                </div>
                <p className="text-sm font-medium text-text">You&apos;re one of the first gamers to join OverFlow{userCity ? ` in ${userCity}` : ''}.</p>
                <p className="mt-1 text-sm text-muted">No compatible profile yet — but the community is growing. You&apos;ll be among the first notified when a match appears.</p>
              </div>

              <Card className="p-6">
                <h2 className="text-lg font-bold">📧 Get notified when a match arrives</h2>
                {!hasEmail ? (
                  <>
                    <p className="mt-2 text-sm text-muted">
                      You haven&apos;t added an email yet. Without it, you won&apos;t be notified when a compatible player joins.
                    </p>
                    <Link
                      href="/login"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
                    >
                      📧 Add my email
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-muted">We&apos;ll email you at <span className="text-text font-medium">your registered address</span> when a compatible player joins{userCity ? ` ${userCity}` : ''}.</p>
                    <ul className="mt-4 grid gap-3 text-sm text-muted">
                      <li className="flex gap-3"><span className="text-accent font-bold">1</span>We&apos;ll notify you when a compatible player joins.</li>
                      <li className="flex gap-3"><span className="text-accent font-bold">2</span>You&apos;ll be invited to first local test sessions matching your profile.</li>
                      <li className="flex gap-3"><span className="text-accent font-bold">3</span>You can accept or decline every suggestion — nothing is automatic.</li>
                    </ul>
                  </>
                )}
              </Card>
            </div>
          )}

          {!loading && !fetchError && discoverableMatches.length > 0 && (
            <div id="matches-grid" className="grid gap-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted font-medium">
                  {vibeMatchCount} player{vibeMatchCount !== 1 ? 's' : ''} match your vibes
                  {totalPlayers !== null ? ` out of ${totalPlayers} player${totalPlayers !== 1 ? 's' : ''}` : ''}
                  {downToMeetOnly ? ' · down to meet' : ''}
                </p>
                {userCity && (
                  <button
                    onClick={() => {
                      setDownToMeetOnly((v) => !v);
                      setGridVisibleCount(GRID_PAGE_SIZE);
                      setTailVisibleCount(TAIL_PAGE_SIZE);
                    }}
                    className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      downToMeetOnly
                        ? 'border-accent3SoftBorder bg-accent3Soft text-[#2E9E24]'
                        : 'border-border bg-panel2 text-muted hover:border-accent hover:text-text'
                    }`}
                  >
                    📍 Down to meet{downToMeetOnly ? '' : ` (${downToMeetCount})`}
                  </button>
                )}
              </div>

              {downToMeetOnly && visibleMatches.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-sm font-medium text-text">No one down to meet in {userCity} yet.</p>
                  <p className="mt-1 text-xs text-muted">Try removing the filter to see all compatible players.</p>
                  <button
                    onClick={() => setDownToMeetOnly(false)}
                    className="mt-4 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-panel2 transition"
                  >
                    Show all matches
                  </button>
                </Card>
              )}

              {visibleMatches.length > 0 && (() => {
                const priority = visibleMatches.filter((m) => m.tier !== 'other');
                const tail     = visibleMatches.filter((m) => m.tier === 'other');
                return (
                  <>
                    {priority.length > 0 && (
                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {priority.slice(0, gridVisibleCount).map((m, index) => (
                            <MatchCard
                              key={m.id || `grid-${index}`}
                              name={m.name}
                              games={m.games ?? []}
                              platform={normalizeArray(m.platform)}
                              style={normalizeArray(m.profile?.style)}
                              language={normalizeArray(m.language)}
                              city={m.city}
                              age={m.age}
                              isIRLNearby={m.isIRLNearby}
                              fitLabel={m.fitLabel as 'Strong fit' | 'Good fit' | 'Worth reaching out'}
                              tier={m.tier}
                              fitReasons={m.fitReasons}
                              commonGames={m.commonGames}
                              score={m.score}
                              invitationSent={!!sentInvitations[m.id]}
                              onRequestMatch={() => handleLetsPlay(m.id, m.name)}
                              onViewProfile={() => setViewingProfile(m)}
                            />
                          ))}
                        </div>
                        {gridVisibleCount < priority.length && (
                          <button
                            onClick={() => setGridVisibleCount((c) => c + GRID_PAGE_SIZE)}
                            className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text hover:bg-panel2 transition"
                          >
                            Show more ({priority.length - gridVisibleCount} more)
                          </button>
                        )}
                      </div>
                    )}

                    {tail.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Worth reaching out</p>
                        <div className="grid gap-2">
                          {tail.slice(0, tailVisibleCount).map((m, index) => (
                            <CompactMatchRow
                              key={m.id || `tail-${index}`}
                              match={m}
                              invitationSent={!!sentInvitations[m.id]}
                              onRequestMatch={() => handleLetsPlay(m.id, m.name)}
                              onViewProfile={() => setViewingProfile(m)}
                            />
                          ))}
                        </div>
                        {tailVisibleCount < tail.length && (
                          <button
                            onClick={() => setTailVisibleCount((c) => c + TAIL_PAGE_SIZE)}
                            className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text hover:bg-panel2 transition"
                          >
                            Show more ({tail.length - tailVisibleCount} more)
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Pré-inscription événement pilote — US-ACT-01 #53 : Utrecht + pas de match sérieux */}
          {profile.profileId && displayProfile.city === 'Utrecht' && !hasSeriousMatch && (
            <IrlEventBlock profileId={profile.profileId} />
          )}

        </section>

      </div>
    </main>
  );
}
