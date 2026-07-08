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
};

function ShareToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--accent)]"
      />
      Share on mutual match
    </label>
  );
}

export function ContactFieldsEditor({ values, onChange }: Props) {
  const hasAnyContact = !!(
    values.discord.trim() || values.email.trim() || values.psnHandle.trim() ||
    values.steamHandle.trim() || values.otherContact.trim()
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">Discord</label>
        <div className="flex items-center gap-3">
          <input
            className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="username#0000"
            value={values.discord}
            onChange={(e) => onChange({ discord: e.target.value })}
          />
          {values.discord.trim() && (
            <ShareToggle checked={values.shareDiscord} onChange={(v) => onChange({ shareDiscord: v })} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">Email</label>
        <div className="flex items-center gap-3">
          <input
            type="email"
            className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
          {values.email.trim() && (
            <ShareToggle checked={values.shareEmailContact} onChange={(v) => onChange({ shareEmailContact: v })} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">PSN</label>
        <div className="flex items-center gap-3">
          <input
            className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="PSN username"
            value={values.psnHandle}
            onChange={(e) => onChange({ psnHandle: e.target.value })}
          />
          {values.psnHandle.trim() && (
            <ShareToggle checked={values.sharePsn} onChange={(v) => onChange({ sharePsn: v })} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">Steam</label>
        <div className="flex items-center gap-3">
          <input
            className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="Steam username"
            value={values.steamHandle}
            onChange={(e) => onChange({ steamHandle: e.target.value })}
          />
          {values.steamHandle.trim() && (
            <ShareToggle checked={values.shareSteam} onChange={(v) => onChange({ shareSteam: v })} />
          )}
        </div>
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
            className="flex-1 rounded-xl border border-border bg-panel2 px-4 py-3 text-text outline-none focus:border-accent transition"
            placeholder="Your handle or link"
            value={values.otherContact}
            onChange={(e) => onChange({ otherContact: e.target.value })}
          />
          {values.otherContact.trim() && (
            <ShareToggle checked={values.shareOther} onChange={(v) => onChange({ shareOther: v })} />
          )}
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Your contact info will only be revealed to someone when you both click &quot;Let&apos;s play&quot;
        on each other&apos;s profile. You can update this anytime.
      </p>

      {hasAnyContact && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.contactShareConsent}
            onChange={(e) => onChange({ contactShareConsent: e.target.checked })}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <span className="text-sm text-muted leading-relaxed">
            I agree that my selected contact details are shared automatically on mutual match.
          </span>
        </label>
      )}
    </div>
  );
}
