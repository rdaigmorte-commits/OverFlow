'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { MatchCard } from '@/components/MatchCard';
import { ProfileSummary } from '@/components/ProfileSummary';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';
import { computeMatches, normalizeArray, normalizeCity, type Match } from '@/lib/match';

type ContactInfo = {
  name: string;
  email?: string | null;
  discord?: string | null;
};

function ContactModal({ contact, onClose }: { contact: ContactInfo; onClose: () => void }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const copy = (value: string, type: 'email' | 'discord') => {
    navigator.clipboard.writeText(value).then(() => {
      if (type === 'email') { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }
      else { setCopiedDiscord(true); setTimeout(() => setCopiedDiscord(false), 2000); }
    });
  };

  const hasContact = contact.email || contact.discord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Contact {contact.name}</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-xl leading-none" aria-label="Close">×</button>
        </div>
        {!hasContact ? (
          <div className="mt-5">
            <p className="text-sm text-muted">{contact.name} hasn&apos;t shared any contact info yet.</p>
            <p className="mt-2 text-sm text-muted">You can still connect with them through OverFlow! 🎮</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <p className="text-sm text-muted">Reach out directly to connect and organise a session.</p>
            {contact.email && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-panel2 px-4 py-3">
                <div>
                  <div className="text-xs text-muted uppercase tracking-widest mb-1">Email</div>
                  <div className="text-sm font-medium text-text">{contact.email}</div>
                </div>
                <button onClick={() => copy(contact.email!, 'email')} className="ml-4 shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-panel2">
                  {copiedEmail ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
            {contact.discord && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-panel2 px-4 py-3">
                <div>
                  <div className="text-xs text-muted uppercase tracking-widest mb-1">Discord</div>
                  <div className="text-sm font-medium text-text">{contact.discord}</div>
                </div>
                <button onClick={() => copy(contact.discord!, 'discord')} className="ml-4 shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-panel2">
                  {copiedDiscord ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        )}
        <button onClick={onClose} className="mt-6 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text hover:bg-panel2 transition">Close</button>
      </div>
    </div>
  );
}

const PUBLIC_PROFILE_FIELDS = 'id, name, age, city, language, platform, games, style, availability, open_irl';
const PROFILE_FETCH_LIMIT = 200;

export default function MatchesPage() {
  const router = useRouter();
  const { profile, setProfile, reset } = useOverflowStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(null);
  const [currentProfile, setCurrentProfile] = useState<typeof profile | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [nearMeOnly, setNearMeOnly] = useState(false);

  useEffect(() => {
    async function fetchMatches() {
      const profileId = profile.profileId;
      if (!profileId) { setLoading(false); return; }

      let hydratedProfile = profile;

      const { data: me, error: meError } = await supabase.from('profiles').select('*').eq('id', profileId).single();

      if (!meError && me) {
        const updated = {
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
          consent:      me.consent ?? false,
          email:        me.email ?? '',
          discord:      me.discord ?? '',
        };
        setProfile(updated);
        hydratedProfile = updated as typeof profile;
      }

      const { data: allProfiles, error: allError } = await supabase.from('profiles').select(PUBLIC_PROFILE_FIELDS).limit(PROFILE_FETCH_LIMIT);

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

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    reset();
    router.replace('/');
  }

  async function handleRequestMatch(matchId: string, matchName: string) {
    const { data, error } = await supabase.from('profiles').select('email, discord').eq('id', matchId).single();
    if (error || !data) setSelectedContact({ name: matchName, email: null, discord: null });
    else setSelectedContact({ name: matchName, email: data.email, discord: data.discord });
  }

  const displayProfile = currentProfile ?? profile;
  const hasNoProfile = !loading && !profile.profileId;
  const hasEmail = !!displayProfile.email;
  const userCity = displayProfile.city || '';

  // Filtre Near me : garde uniquement les joueurs de la même ville si toggle actif
  const visibleMatches = nearMeOnly && userCity
    ? matches.filter((m) => normalizeCity(m.city) === normalizeCity(userCity))
    : matches;

  const nearMeCount = userCity
    ? matches.filter((m) => normalizeCity(m.city) === normalizeCity(userCity)).length
    : 0;

  if (hasNoProfile) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="text-5xl">🎮</div>
          <div>
            <h1 className="text-3xl font-black">You haven&apos;t created your profile yet</h1>
            <p className="mt-3 text-muted max-w-md mx-auto">Create your gamer profile to find players who match your games, style, and availability.</p>
          </div>
          <Link href="/onboarding" className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition">Create my profile</Link>
          <p className="text-xs text-muted">Takes less than 2 minutes · No account needed</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">

      {selectedContact && <ContactModal contact={selectedContact} onClose={() => setSelectedContact(null)} />}

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

      {/* Bandeau no-email */}
      {!loading && !hasEmail && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-yellow-500/40 bg-yellow-500/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-medium text-text">Your profile can&apos;t be recovered</p>
              <p className="mt-1 text-xs text-muted">
                Without an email, you won&apos;t be reachable by matches and you&apos;ll lose access to your profile if you change device or clear your browser.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black hover:opacity-90 transition"
          >
            Add email
          </Link>
        </div>
      )}

      <div className="grid gap-6">

        {/* Profil utilisateur */}
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
              <button onClick={() => setRetryCount(c => c + 1)} className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black">Try again</button>
            </Card>
          )}

          {/* 0 match */}
          {!loading && !fetchError && matches.length === 0 && (
            <div className="grid gap-5">
              <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-6 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🚀</span>
                  <span className="rounded-full border border-green-500/60 bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
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
                      You haven&apos;t added an email yet. Without it, you won&apos;t be notified when a compatible player joins — and they won&apos;t be able to reach you either.
                    </p>
                    <Link
                      href="/login"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
                    >
                      📧 Add my email
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-muted">We&apos;ll email you at <span className="text-text font-medium">{displayProfile.email}</span> when a compatible player joins{userCity ? ` ${userCity}` : ''}.</p>
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

          {/* matches > 0 */}
          {!loading && !fetchError && matches.length > 0 && (
            <div className="grid gap-5">

              {/* Barre de filtres */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted font-medium">
                  {visibleMatches.length} player{visibleMatches.length !== 1 ? 's' : ''} match your vibe
                  {nearMeOnly && userCity ? ` in ${userCity}` : ''}
                </p>

                {/* Toggle Near me — affiché uniquement si l'utilisateur a une ville */}
                {userCity && (
                  <button
                    onClick={() => setNearMeOnly((v) => !v)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      nearMeOnly
                        ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-400'
                        : 'border-border bg-panel2 text-muted hover:border-accent hover:text-text'
                    }`}
                  >
                    📍 Near me{nearMeOnly ? '' : ` (${nearMeCount})`}
                  </button>
                )}
              </div>

              {/* Message si filtre Near me actif et 0 résultat */}
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

              {visibleMatches.map((m, index) => (
                <MatchCard
                  key={m.id || `match-${index}`}
                  name={m.name}
                  games={m.games ?? []}
                  platform={normalizeArray(m.platform)}
                  style={normalizeArray(m.profile?.style)}
                  language={normalizeArray(m.language)}
                  city={m.city}
                  openIRL={m.openIRL}
                  isIRLNearby={m.isIRLNearby}
                  fitLabel={m.fitLabel as 'Strong fit' | 'Good fit' | 'Worth reaching out'}
                  fitReason={m.fitReason}
                  score={m.score}
                  onRequestMatch={() => handleRequestMatch(m.id, m.name)}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
