import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

type Profile = {
  profileId: string | null;
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
  lookingFor: 'online' | 'irl' | 'both';
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

function getSavedProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

const initialProfile: Profile = {
  profileId: getSavedProfileId(),
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
  lookingFor: 'both',
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
    return { profile: updated };
  }),

  setSession: (session) => set({ session }),

  setStep: (step) => set({ currentStep: step }),

  reset: () => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* silencieux */ }
    }
    set({ profile: { ...initialProfile, profileId: null }, session: null, currentStep: 1 });
  },
}));
