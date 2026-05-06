import { create } from 'zustand';

type Profile = {
  name: string;
  age: string;
  city: string;
  language: string;
  platform: string;
  games: string[];
  style: string;
  availability: string[];
  openIRL: boolean;
  consent: boolean;
};

type State = {
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  reset: () => void;
};

const initialProfile: Profile = {
  name: '', age: '', city: 'Utrecht', language: 'English', platform: '', games: [], style: '', availability: [], openIRL: false, consent: false,
};

export const useOverflowStore = create<State>((set) => ({
  profile: initialProfile,
  setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
  reset: () => set({ profile: initialProfile }),
}));
