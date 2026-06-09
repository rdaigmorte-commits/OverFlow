'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { ProfileSummary } from '@/components/ProfileSummary';
import { supabase } from '@/lib/supabase';
import { useOverflowStore } from '@/lib/store';
import { computeMatches, type Match } from '@/lib/match';
import { normalizeArray } from '@/lib/match';

function fitStyle(label: string) {
  if (label === 'Strong fit') return 'border-accent bg-accent text-black';
  if (label === 'Good fit') return 'border-accent2 bg-accent2 text-black';
  return 'border-border bg-panel2 text-text';
}

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
            <p className="mt-2 text-sm text-muted">You can still meet them at the next OverFlow IRL event in Utrecht! 🎮</p>
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
          city:         me.city ?? 'Utrecht',
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

  async function handleReset() {
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

  if (hasNoProfile) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="text-5xl">🎮</div>
          <div>
            <h1 className="text-3xl font-black">You haven&apos;t created your profile yet</h1>
            <p className="mt-3 text-muted max-w-md mx-auto">Create your gamer profile to see players in Utrecht who match your games, style, and availability.</p>
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black">Your matches</h1>
          <p className="mt-2 text-muted">Utrecht · Based on your profile</p>
        </div>
        <button onClick={handleReset} className="text-xs text-muted hover:text-text transition mt-2">Reset profile</button>
      </div>

      <div className="grid gap-6">

        {/* ProfileSummary + Edit profile bien visible */}
        {!loading && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-panel px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <ProfileSummary
                name={displayProfile.name}
                games={displayProfile.games ?? []}
                platform={displayProfile.platform}
                style={displayProfile.style}
                language={displayProfile.language ?? []}
                city={displayProfile.city}
                openIRL={displayProfile.openIRL}
              />
            </div>
            <div className="pt-1 border-t border-border">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-panel2 border border-border px-4 py-2 text-sm font-semibold text-text hover:border-accent hover:text-accent transition"
              >
                ✏️ Edit my profile
              </Link>
            </div>
          </div>
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

              {/* Encart Early Tester — mise en valeur avec fond accent */}
              <div className="rounded-2xl border border-accent/40 bg-accent/10 px-6 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🚀</span>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-black">Early OverFlow Tester · Utrecht</span>
                </div>
                <p className="text-sm text-text font-medium">You&apos;re one of the first gamers to join OverFlow in Utrecht.</p>
                <p className="mt-1 text-sm text-muted">No compatible profile yet — but the community is growing. You&apos;ll be among the first notified when a match appears.</p>
              </div>

              {/* What happens next — proposition de valeur retravaillée */}
              <Card className="p-6">
                <h2 className="text-lg font-bold">📧 Get notified when a match arrives</h2>
                <p className="mt-2 text-sm text-muted">
                  {hasEmail
                    ? `We\'ll email you at ${displayProfile.email} when a compatible player joins Utrecht.`
                    : "You haven\'t added an email yet. Without it, you won\'t be notified when a compatible player joins — and they won\'t be able to reach you either."}
                </p>
                {!hasEmail && (
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
                  >
                    📧 Add my email
                  </Link>
                )}
                {hasEmail && (
                  <ul className="mt-4 grid gap-3 text-sm text-muted">
                    <li className="flex gap-3"><span className="text-accent font-bold">1</span>We&apos;ll notify you when a compatible player joins Utrecht.</li>
                    <li className="flex gap-3"><span className="text-accent font-bold">2</span>You&apos;ll be invited to first local test sessions matching your profile.</li>
                    <li className="flex gap-3"><span className="text-accent font-bold">3</span>You can accept or decline every suggestion — nothing is automatic.</li>
                  </ul>
                )}
              </Card>
            </div>
          )}

          {/* matches > 0 */}
          {!loading && !fetchError && matches.length > 0 && (
            <div className="grid gap-5">
              <p className="text-sm text-muted font-medium">
                {matches.length} player{matches.length > 1 ? 's' : ''} match your vibe in Utrecht
              </p>
              {matches.map((m, index) => (
                <Card key={m.id || `match-${index}`} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-2xl font-bold">{m.name}</div>
                      <div className="mt-1 text-sm text-muted">{(m.games ?? []).join(', ')} • {normalizeArray(m.platform).join(', ')} • {Array.isArray(m.language) ? m.language.join(', ') : m.language}</div>
                      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${fitStyle(m.fitLabel)}`}>{m.fitLabel}</div>
                      <p className="mt-3 text-sm text-muted">{m.fitReason}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleRequestMatch(m.id, m.name)} className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black hover:opacity-90 transition">
                        Request match
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* CTA Save profile — affiché seulement si pas d'email */}
        {!loading && !fetchError && !hasEmail && (
          <div className="rounded-2xl border border-dashed border-border px-6 py-5">
            <h2 className="text-base font-bold">🔗 Save your profile</h2>
            <p className="mt-2 text-sm text-muted">
              Add your email to save your profile on any device and let other players reach you.
            </p>
            <Link href="/login" className="mt-4 inline-block rounded-xl border border-border px-5 py-2 text-sm font-semibold text-text hover:bg-panel2 transition">
              Add my email
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
