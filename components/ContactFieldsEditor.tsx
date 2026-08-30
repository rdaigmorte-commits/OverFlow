export type ContactValues = {
  discord: string;
  email: string;
  psnHandle: string;
  steamHandle: string;
  otherContact: string;
  otherContactLabel: string;
  shareDiscord: boolean;
  shareEmailContact: boolean;
  sharePsn: boolean;
  shareSteam: boolean;
  shareOther: boolean;
  contactShareConsent: boolean;
};

type Props = {
  values: ContactValues;
  onChange: (patch: Partial<ContactValues>) => void;
  // true once this profile is linked to an authenticated account — the email
  // field then mirrors the login email (DB-synced) and stops being freeform.
  isLinkedAccount?: boolean;
  onRequestEmailChange?: () => void;
};

// Un contact "partageable" (pas l'email, qui reste privé) — c'est la seule chose
// qui rend un profil réellement joignable par un autre joueur après un match.
// Utilisé aussi bien ici (afficher le consentement de partage) que dans les pages
// onboarding/profile-edit (bloquer la sauvegarde si aucun n'est renseigné).
export function hasShareableContact(values: ContactValues): boolean {
  return !!(
    values.discord.trim() || values.psnHandle.trim() ||
    values.steamHandle.trim() || values.otherContact.trim()
  );
}

export function ContactFieldsEditor({ values, onChange, isLinkedAccount, onRequestEmailChange }: Props) {
  const hasContact = hasShareableContact(values);

  return (
    <div className="flex flex-col gap-6">

      {/* Email — privé, jamais montré aux autres joueurs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">📧 Your email <span className="text-muted text-xs font-normal">(private)</span></label>
        {isLinkedAccount ? (
          <div className="flex items-center gap-3">
            <input
              type="email"
              readOnly
              className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-muted outline-none cursor-not-allowed"
              value={values.email}
            />
            <button
              type="button"
              onClick={onRequestEmailChange}
              className="shrink-0 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text hover:bg-panel2 transition"
            >
              Change
            </button>
          </div>
        ) : (
          <input
            type="email"
            className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        )}
        <p className="text-xs text-muted leading-relaxed">
          {isLinkedAccount
            ? 'This is also the email you sign in with (magic link). Changing it will ask you to confirm via a link.'
            : 'Used to notify you of match requests. Kept private, never shown to other players. Changing it does not change which email you sign in with.'}
        </p>
      </div>

      <div className="border-t border-border" />

      {/* Coordonnées partageables — révélées sur match mutuel, sous consentement */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium text-text">
            🎮 Shareable contact details <span className="text-accent">*</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Revealed to a player only once you both click &quot;Let&apos;s play&quot;. At least one is required — otherwise matches have no way to reach you.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text">Discord</label>
          <input
            className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="username#0000"
            value={values.discord}
            onChange={(e) => onChange({ discord: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text">PSN</label>
          <input
            className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="PSN username"
            value={values.psnHandle}
            onChange={(e) => onChange({ psnHandle: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text">Steam</label>
          <input
            className="rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="Steam username"
            value={values.steamHandle}
            onChange={(e) => onChange({ steamHandle: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text">Other</label>
          <div className="flex items-center gap-3">
            <input
              className="w-28 rounded-xl border border-border bg-panel2 px-3 py-3 text-text outline-none focus:border-accent transition"
              placeholder="Label"
              value={values.otherContactLabel}
              onChange={(e) => onChange({ otherContactLabel: e.target.value })}
            />
            <input
              className="min-w-0 flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
              placeholder="Your handle or link"
              value={values.otherContact}
              onChange={(e) => onChange({ otherContact: e.target.value })}
            />
          </div>
        </div>

        {hasContact && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={values.contactShareConsent}
              onChange={(e) => onChange({ contactShareConsent: e.target.checked })}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <span className="text-sm text-muted leading-relaxed">
              I agree that my Discord, PSN, Steam and other details above are shared automatically on mutual match.
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
