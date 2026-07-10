'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { IrlEventBlock } from '@/components/IrlEventBlock';
import { MatchCard } from '@/components/MatchCard';
import { ProfileSummary } from '@/components/ProfileSummary';
import { CompatibilityRing } from '@/components/CompatibilityRing';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';
import { computeMatches, normalizeArray, normalizeCity, type Match } from '@/lib/match';
import { getFitTier } from '@/lib/rpgClass';

const GRID_PAGE_SIZE = 6;
const TAIL_PAGE_SIZE = 10;

// ─── CompactMatchRow ─────────────────────────────────────────────────────────
// Traitement réduit pour le tier "Worth reaching out" — moins prioritaire, pas de carte complète.
function CompactMatchRow({
  match,
  invitationSent,
  onRequestMatch,
}: { match: Match; invitationSent: boolean; onRequestMatch: () => void }) {
  const percent = Math.round((match.score / 110) * 100);
  const tier = getFitTier(match.score);
  const reason = match.fitReason.split(' · ')[0];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3">
      <CompatibilityRing percent={percent} tier={tier} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text truncate">{match.name}</p>
        <p className="text-xs text-muted truncate">{reason}</p>
      </div>
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

// ─── InvitationsPanel ────────────────────────────────────────────────────────
type ReceivedRequest = {
  id: string;
  sender_id: string;
  sender: { id: string; name: string; games: string[] } | null;
};
type SentRequest = {
  id: string;
  receiver_id: string;
  status: string;
  receiver: { id: string; name: string } | null;
};

function InvitationsPanel({
  received,
  sent,
  revealedByReceiver,
  onAccept,
  onDecline,
}: {
  received: ReceivedRequest[];
  sent: SentRequest[];
  revealedByReceiver: Record<string, RevealedField[]>;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [tab, setTab] = useState<'received' | 'sent'>('received');

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
          Sent ({sent.length})
        </button>
      </div>

      {tab === 'received' && received.map((req) => (
        <div
          key={req.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-accent3SoftBorder bg-accent3Soft px-5 py-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">{req.sender?.name ?? 'A player'}</p>
            <p className="text-xs text-muted mt-0.5 truncate">
              {(req.sender?.games ?? []).slice(0, 3).join(', ')}
            </p>
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
      ))}
      {tab === 'received' && received.length === 0 && (
        <p className="text-xs text-muted px-1">No pending invitations right now.</p>
      )}

      {tab === 'sent' && sent.map((req) => {
        const revealed = revealedByReceiver[req.receiver_id];
        return (
          <div
            key={req.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-panel2 px-5 py-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-text truncate">{req.receiver?.name ?? 'A player'}</p>
              {req.status === 'accepted' ? (
                <span className="shrink-0 rounded-full border border-accent3SoftBorder bg-accent3Soft px-3 py-1 text-xs font-bold text-[#2E9E24]">
                  ✓ Accepted
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-accent2SoftBorder bg-accent2Soft px-3 py-1 text-xs font-semibold text-[#B77900]">
                  ⏳ Pending
                </span>
              )}
            </div>
            {req.status === 'accepted' && revealed && revealed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {revealed.map((c) => (
                  <span key={c.label} className="rounded-full bg-panel border border-border px-3 py-1 text-xs font-medium text-text">
                    {c.label}: {c.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {tab === 'sent' && sent.length === 0 && (
        <p className="text-xs text-muted px-1">You haven&apos;t sent any invitations yet.</p>
      )}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PUBLIC_PROFILE_FIELDS = 'id, name, age, city, language, platform, games, style, availability, open_irl';
const PROFILE_FETCH_LIMIT = 200;

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const router = useRouter();
  const { profile, setProfile, reset } = useOverflowStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [situation, setSituation] = useState<ContactSituation | null>(null);
  const [currentProfile, setCurrentProfile] = useState<typeof profile | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [gridVisibleCount, setGridVisibleCount] = useState(GRID_PAGE_SIZE);
  const [tailVisibleCount, setTailVisibleCount] = useState(TAIL_PAGE_SIZE);
  const [sentInvitations, setSentInvitations] = useState<Record<string, boolean>>({});
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [revealedByReceiver, setRevealedByReceiver] = useState<Record<string, RevealedField[]>>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inboundRequests, setInboundRequests] = useState<ReceivedRequest[]>([]);

  // Révèle automatiquement les contacts des invitations envoyées déjà acceptées
  // (onglet Sent) — sans que l'utilisateur ait à recliquer quoi que ce soit.
  useEffect(() => {
    const toFetch = sentRequests.filter(
      (r) => r.status === 'accepted' && !(r.receiver_id in revealedByReceiver)
    );
    if (toFetch.length === 0) return;
    toFetch.forEach(async (r) => {
      const { data: contactRows } = await supabase
        .rpc('get_match_contact', { target_profile_id: r.receiver_id });
      const contact = contactRows?.[0];
      setRevealedByReceiver((prev) => ({
        ...prev,
        [r.receiver_id]: contact ? extractRevealedFields(contact) : [],
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentRequests]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setAuthChecked(true);
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
        }
      }

      // Charger les demandes reçues (pending) avec le profil de l'émetteur
      const { data: inboundData } = await supabase
        .from('match_requests')
        .select('id, sender_id, sender:profiles!sender_id(id, name, games)')
        .eq('receiver_id', profileId)
        .eq('status', 'pending');
      setInboundRequests((inboundData ?? []) as unknown as typeof inboundRequests);

      // Charger les invitations déjà envoyées depuis Supabase (source de vérité)
      const { data: sentData } = await supabase
        .from('match_requests')
        .select('id, receiver_id, status, receiver:profiles!receiver_id(id, name)')
        .eq('sender_id', profileId);

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

      // Révélation immédiate — plus besoin de re-cliquer "Let's play" pour la voir.
      if (request?.sender_id) {
        const { data: contactRows } = await supabase
          .rpc('get_match_contact', { target_profile_id: request.sender_id });
        const contact = contactRows?.[0];
        setSituation({
          type: 'revealed',
          name: request.sender?.name ?? 'this player',
          contacts: contact ? extractRevealedFields(contact) : [],
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
        : [...prev, { id: `local-${matchId}`, receiver_id: matchId, status: 'pending', receiver: { id: matchId, name: matchName } }]
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

  const visibleMatches = nearMeOnly && userCity
    ? matches.filter((m) => normalizeCity(m.city) === normalizeCity(userCity))
    : matches;

  const nearMeCount = userCity
    ? matches.filter((m) => normalizeCity(m.city) === normalizeCity(userCity)).length
    : 0;

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

      {/* Invitations — reçues / envoyées */}
      {!loading && (inboundRequests.length > 0 || sentRequests.length > 0) && (
        <>
          <InvitationsPanel
            received={inboundRequests}
            sent={sentRequests}
            revealedByReceiver={revealedByReceiver}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
          />
          {inboundRequests.length > 0 && !hasContact && (
            <p className="-mt-3 mb-6 text-xs text-muted px-1">
              Add your Discord in{' '}
              <Link href="/profile/edit" className="text-accent underline underline-offset-2 hover:opacity-80 transition">
                your profile
              </Link>
              {' '}so players can reach you after you accept.
            </p>
          )}
        </>
      )}

      {/* Bandeau no-email */}
      {!loading && !hasEmail && (
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

      <div className="grid gap-6">

        {!loading && (
          <ProfileSummary
            name={displayProfile.name}
            games={displayProfile.games ?? []}
            platform={displayProfile.platform}
            style={displayProfile.style}
            language={displayProfile.language ?? []}
            city={displayProfile.city}
            openIRL={displayProfile.openIRL}
          />
        )}

        <section>
          {loading && <p className="text-muted text-sm">Finding your matches...</p>}

          {!loading && fetchError && (
            <Card className="p-8 text-center">
              <div className="text-2xl font-bold">Something went wrong</div>
              <p className="mt-3 text-muted">We couldn&apos;t load your matches. Please try refreshing the page.</p>
              <button onClick={() => setRetryCount(c => c + 1)} className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white">Try again</button>
            </Card>
          )}

          {!loading && !fetchError && matches.length === 0 && (
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

          {!loading && !fetchError && matches.length > 0 && (
            <div className="grid gap-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted font-medium">
                  {visibleMatches.length} player{visibleMatches.length !== 1 ? 's' : ''} match your vibe
                  {nearMeOnly && userCity ? ` in ${userCity}` : ''}
                </p>
                {userCity && (
                  <button
                    onClick={() => {
                      setNearMeOnly((v) => !v);
                      setGridVisibleCount(GRID_PAGE_SIZE);
                      setTailVisibleCount(TAIL_PAGE_SIZE);
                    }}
                    className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      nearMeOnly
                        ? 'border-accent3SoftBorder bg-accent3Soft text-[#2E9E24]'
                        : 'border-border bg-panel2 text-muted hover:border-accent hover:text-text'
                    }`}
                  >
                    📍 Near me{nearMeOnly ? '' : ` (${nearMeCount})`}
                  </button>
                )}
              </div>

              {nearMeOnly && visibleMatches.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-sm font-medium text-text">No players found in {userCity} yet.</p>
                  <p className="mt-1 text-xs text-muted">Try removing the Near me filter to see all compatible players.</p>
                  <button
                    onClick={() => setNearMeOnly(false)}
                    className="mt-4 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-panel2 transition"
                  >
                    Show all matches
                  </button>
                </Card>
              )}

              {visibleMatches.length > 0 && (() => {
                const priority = visibleMatches.filter((m) => getFitTier(m.score) !== 'other');
                const tail     = visibleMatches.filter((m) => getFitTier(m.score) === 'other');
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
                              isIRLNearby={m.isIRLNearby}
                              fitLabel={m.fitLabel as 'Strong fit' | 'Good fit' | 'Worth reaching out'}
                              fitReason={m.fitReason}
                              score={m.score}
                              invitationSent={!!sentInvitations[m.id]}
                              onRequestMatch={() => handleLetsPlay(m.id, m.name)}
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

          {/* Slot IRL Utrecht — US-ACT-01 #53 */}
          {displayProfile.city === 'Utrecht' && <IrlEventBlock />}

        </section>

      </div>
    </main>
  );
}
