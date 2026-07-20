import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

type Profile = {
  profileId: string | null;
  claimToken: string | null;
  name: string;
  age: string;
  city: string;
  language: string[];
  platform: string[];
  games: string[];
  style: string[];
  availability: string[];
  openIRL: boolean;
  consent: boolean;
  email: string;
  discord: string;
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
  lookingFor: 'online' | 'irl' | 'both';
  notifyOnMatchRequest: boolean;
  interestedInIrlEvent: boolean;
};

type State = {
  profile: Profile;
  session: Session | null;
  currentStep: number;
  setProfile: (p: Partial<Profile>) => void;
  setSession: (session: Session | null) => void;
  setStep: (step: number) => void;
  reset: () => void;
};

const STORAGE_KEY = 'overflow_profile_id';
// claim_token : preuve de possession d'un profil pas encore lié à un compte
// (US-SEC-09). Généré côté client à la création, jamais lu depuis le serveur.
const CLAIM_TOKEN_STORAGE_KEY = 'overflow_claim_token';

function getSavedProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function getSavedClaimToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(CLAIM_TOKEN_STORAGE_KEY); } catch { return null; }
}

const initialProfile: Profile = {
  profileId: getSavedProfileId(),
  claimToken: getSavedClaimToken(),
  name: '',
  age: '',
  city: '',
  language: [],
  platform: [],
  games: [],
  style: [],
  availability: [],
  openIRL: false,
  consent: false,
  email: '',
  discord: '',
  psnHandle: '',
  steamHandle: '',
  otherContact: '',
  otherContactLabel: '',
  shareDiscord: true,
  shareEmailContact: true,
  sharePsn: true,
  shareSteam: true,
  shareOther: true,
  contactShareConsent: false,
  lookingFor: 'both',
  notifyOnMatchRequest: true,
  interestedInIrlEvent: false,
};

export const useOverflowStore = create<State>((set) => ({
  profile: initialProfile,
  session: null,
  currentStep: 1,

  setProfile: (p) => set((s) => {
    const updated = { ...s.profile, ...p };
    if (updated.profileId && typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, updated.profileId); } catch { /* silencieux */ }
    }
    if (updated.claimToken && typeof window !== 'undefined') {
      try { localStorage.setItem(CLAIM_TOKEN_STORAGE_KEY, updated.claimToken); } catch { /* silencieux */ }
    }
    return { profile: updated };
  }),

  setSession: (session) => set({ session }),

  setStep: (step) => set({ currentStep: step }),

  reset: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CLAIM_TOKEN_STORAGE_KEY);
      } catch { /* silencieux */ }
    }
    set({ profile: { ...initialProfile, profileId: null, claimToken: null }, session: null, currentStep: 1 });
  },
}));
