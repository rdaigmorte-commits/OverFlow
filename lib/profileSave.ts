import { supabase } from './supabase';

// Champs autorisés en UPDATE anonyme direct (US-SEC-09). Tout le reste
// (contacts, partage, consentement de partage) exige le claim_token via la RPC.
export type NonSensitiveFields = {
  name: string;
  age: string | null;
  city: string | null;
  language: string[];
  platform: string[];
  games: string[];
  style: string[];
  availability: string[];
  open_irl: boolean;
  looking_for: string;
  consent: boolean;
  notify_on_match_request: boolean;
  interested_in_irl_event: boolean;
};

export type SensitiveFields = {
  email: string | null;
  discord: string | null;
  psn_handle: string | null;
  steam_handle: string | null;
  other_contact: string | null;
  other_contact_label: string | null;
  share_discord: boolean;
  share_email_contact: boolean;
  share_psn: boolean;
  share_steam: boolean;
  share_other: boolean;
  contact_share_consent: boolean;
};

type SaveExistingProfileOpts = {
  profileId: string;
  isAuthenticated: boolean;
  claimToken: string | null;
  nonSensitive: NonSensitiveFields;
  sensitive: SensitiveFields;
  consentChanged: boolean;
  contactShareConsentAt: string | null;
};

// Sauvegarde un profil déjà existant (profileId connu), qu'il soit lié à un
// compte ou non. Un profil non lié ne peut plus modifier ses champs de contact
// via UPDATE direct (US-SEC-09) — ces champs passent par une RPC gardée par le
// claim_token généré à la création du profil (voir onboarding/page.tsx).
export async function saveExistingProfile(
  opts: SaveExistingProfileOpts
): Promise<{ error: { message: string } | null }> {
  const { profileId, isAuthenticated, claimToken, nonSensitive, sensitive, consentChanged, contactShareConsentAt } = opts;

  if (isAuthenticated) {
    // Profil lié à un compte : la policy "authenticated" (auth.uid() = user_id)
    // couvre déjà tous les champs, pas besoin de séparer l'appel.
    const { error } = await supabase
      .from('profiles')
      .update({
        ...nonSensitive,
        ...sensitive,
        ...(consentChanged ? { contact_share_consent_at: contactShareConsentAt } : {}),
      })
      .eq('id', profileId)
      .select('id')
      .single();
    return { error };
  }

  const { error: nonSensitiveError } = await supabase
    .from('profiles')
    .update(nonSensitive)
    .eq('id', profileId)
    .select('id')
    .single();
  if (nonSensitiveError) return { error: nonSensitiveError };

  if (!claimToken) {
    return { error: { message: 'Missing claim token — cannot update contact fields for an unclaimed profile.' } };
  }

  const { error: sensitiveError } = await supabase.rpc('update_unclaimed_profile_contact', {
    p_profile_id: profileId,
    p_claim_token: claimToken,
    p_email: sensitive.email,
    p_discord: sensitive.discord,
    p_psn_handle: sensitive.psn_handle,
    p_steam_handle: sensitive.steam_handle,
    p_other_contact: sensitive.other_contact,
    p_other_contact_label: sensitive.other_contact_label,
    p_share_discord: sensitive.share_discord,
    p_share_email_contact: sensitive.share_email_contact,
    p_share_psn: sensitive.share_psn,
    p_share_steam: sensitive.share_steam,
    p_share_other: sensitive.share_other,
    p_contact_share_consent: sensitive.contact_share_consent,
    p_consent_changed: consentChanged,
    p_contact_share_consent_at: contactShareConsentAt,
  });
  return { error: sensitiveError };
}

// Supprime définitivement le profil (+ ses demandes de match, + le compte Auth
// s'il est lié). Deux chemins : authentifié (auth.uid()) ou profil non lié
// (claim_token) — même logique que saveExistingProfile.
export async function deleteAccount(opts: {
  profileId: string;
  isAuthenticated: boolean;
  claimToken: string | null;
}): Promise<{ error: { message: string } | null }> {
  const { profileId, isAuthenticated, claimToken } = opts;

  if (isAuthenticated) {
    const { error } = await supabase.rpc('delete_my_account');
    return { error };
  }

  if (!claimToken) {
    return { error: { message: 'Missing claim token — cannot delete an unclaimed profile.' } };
  }

  const { error } = await supabase.rpc('delete_unclaimed_profile', {
    p_profile_id: profileId,
    p_claim_token: claimToken,
  });
  return { error };
}
