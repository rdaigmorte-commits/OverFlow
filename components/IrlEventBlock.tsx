'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';

// US-ACT-01 #53 — signal d'intérêt opt-in pour l'événement pilote IRL Utrecht.
// N'affiche jamais de coordonnées ici : juste un booléen, comme open_irl.
export function IrlEventBlock({ profileId }: { profileId: string }) {
  const [loading, setLoading] = useState(true);
  const [interested, setInterested] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('profiles')
      .select('interested_in_irl_event')
      .eq('id', profileId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setInterested(!!data?.interested_in_irl_event);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileId]);

  async function handleOptIn() {
    setSaving(true);
    setSaveError(false);
    // .select() est indispensable ici : sans lui, une RLS qui bloque silencieusement
    // l'update (0 ligne touchée, ex. session expirée sur un profil déjà réclamé)
    // ne renvoie aucune erreur — data vide est le seul signal de l'échec réel.
    const { data, error } = await supabase
      .from('profiles')
      .update({ interested_in_irl_event: true })
      .eq('id', profileId)
      .select('id');
    if (!error && data && data.length > 0) {
      setInterested(true);
    } else {
      setSaveError(true);
    }
    setSaving(false);
  }

  if (loading) return null;

  if (interested) {
    return (
      <div className="rounded-2xl border border-accent3SoftBorder bg-accent3Soft px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-semibold text-text">You&apos;re on the list!</p>
            <p className="mt-1 text-xs text-muted">We&apos;ll reach out with details for the Utrecht meetup as soon as we lock a date.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">🍺 Meet other Utrecht players IRL</h2>
      <p className="mt-2 text-sm text-muted">
        We&apos;re putting together a first in-person meetup for OverFlow players in Utrecht. Say you&apos;re interested and we&apos;ll let you know as soon as there&apos;s a date.
      </p>
      <label className="mt-4 flex items-start gap-3 text-sm text-text cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 accent-[var(--accent)]"
        />
        I&apos;m interested in the Utrecht pilot meetup
      </label>
      <button
        onClick={handleOptIn}
        disabled={!checked || saving}
        className="mt-4 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 disabled:pointer-events-none"
      >
        {saving ? 'Saving…' : 'Count me in →'}
      </button>
      {saveError && (
        <p className="mt-3 text-xs text-error">Something went wrong — please try again, or sign in again if the problem persists.</p>
      )}
    </Card>
  );
}
