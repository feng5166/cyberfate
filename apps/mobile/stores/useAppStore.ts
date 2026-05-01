import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BaziResult } from "../lib/types";

interface AppState {
  isOnboarded: boolean;
  setOnboarded: (v: boolean) => void;

  userName: string;
  birthDate: string;
  birthHour: number;
  gender: "male" | "female";
  baziResult: BaziResult | null;
  setProfile: (profile: {
    userName: string;
    birthDate: string;
    birthHour: number;
    gender: "male" | "female";
  }) => void;
  setBaziResult: (result: BaziResult | null) => void;
  clearProfile: () => void;

  checkedInToday: boolean;
  consecutiveDays: number;
  checkIn: () => void;

  todayFortune: any | null;
  setTodayFortune: (f: any) => void;

  darkMode: "system" | "light" | "dark";
  setDarkMode: (m: "system" | "light" | "dark") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      setOnboarded: (value) => set({ isOnboarded: value }),

      userName: "",
      birthDate: "",
      birthHour: 0,
      gender: "male",
      baziResult: null,
      setProfile: (profile) =>
        set({
          userName: profile.userName,
          birthDate: profile.birthDate,
          birthHour: profile.birthHour,
          gender: profile.gender,
        }),
      setBaziResult: (result) => set({ baziResult: result }),
      clearProfile: () =>
        set({
          userName: "",
          birthDate: "",
          birthHour: 0,
          gender: "male",
          baziResult: null,
        }),

      checkedInToday: false,
      consecutiveDays: 0,
      checkIn: () =>
        set((state) => ({
          checkedInToday: true,
          consecutiveDays: state.consecutiveDays + 1,
        })),

      todayFortune: null,
      setTodayFortune: (f) => set({ todayFortune: f }),

      darkMode: "system",
      setDarkMode: (m) => set({ darkMode: m }),
    }),
    {
      name: "cyberfate-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
