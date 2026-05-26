import { create } from 'zustand';

type Profile = {
  profileId: string | null;
  name: string;
  age: string;
  city: string;
  language: string[];
  platform: string;
  games: string[];
  style: string;
  availability: string[];
  openIRL: boolean;
  consent: boolean;
  email: string;
  discord: string;
};

type State = {
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  reset: () => void;
};

const STORAGE_KEY = 'overflow_profile_id';

// Récupère le profileId sauvegardé dans localStorage (si dispo)
function getSavedProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const initialProfile: Profile = {
  profileId: getSavedProfileId(),
  name: '',
  age: '',
  city: 'Utrecht',
  language: [],
  platform: '',
  games: [],
  style: '',
  availability: [],
  openIRL: false,
  consent: false,
  email: '',
  discord: '',
};

export const useOverflowStore = create<State>((set) => ({
  profile: initialProfile,
  setProfile: (p) => set((s) => {
    const updated = { ...s.profile, ...p };
    // Persiste le profileId dans localStorage à chaque mise à jour
    if (updated.profileId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, updated.profileId);
      } catch {
        // silencieux si localStorage est bloqué
      }
    }
    return { profile: updated };
  }),
  reset: () => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* silencieux */ }
    }
    set({ profile: { ...initialProfile, profileId: null } });
  },
}));
