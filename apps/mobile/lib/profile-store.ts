import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const PROFILE_KEY = 'cyberfate_profile';

export type Gender = 'male' | 'female';

/** 出生档案。birthHour 用「时辰索引」：-1=不知道，0=子时 … 11=亥时（与后端一致）。 */
export interface BirthProfile {
  name: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  birthHour: number; // -1..11
}

interface ProfileState {
  profile: BirthProfile | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setProfile: (p: BirthProfile) => Promise<void>;
  clear: () => Promise<void>;
}

export const SHICHEN = [
  '不知道',
  '子时 23-1',
  '丑时 1-3',
  '寅时 3-5',
  '卯时 5-7',
  '辰时 7-9',
  '巳时 9-11',
  '午时 11-13',
  '未时 13-15',
  '申时 15-17',
  '酉时 17-19',
  '戌时 19-21',
  '亥时 21-23',
];

/** SHICHEN 下标 → 后端 birthHour（不知道 = -1）。 */
export function shichenIndexToHour(idx: number): number {
  return idx === 0 ? -1 : idx - 1;
}

export function hourToShichenIndex(hour: number): number {
  return hour < 0 ? 0 : hour + 1;
}

export const useProfile = create<ProfileState>((set) => ({
  profile: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(PROFILE_KEY);
      set({ profile: raw ? (JSON.parse(raw) as BirthProfile) : null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setProfile: async (p) => {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(p));
    set({ profile: p });
  },

  clear: async () => {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
    set({ profile: null });
  },
}));
