import { create } from "zustand";

interface AppState {
  isOnboarded: boolean;
  setOnboarded: (v: boolean) => void;

  checkedInToday: boolean;
  consecutiveDays: number;
  checkIn: () => void;

  todayFortune: any | null;
  setTodayFortune: (f: any) => void;

  darkMode: "system" | "light" | "dark";
  setDarkMode: (m: "system" | "light" | "dark") => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  setOnboarded: (value) => set({ isOnboarded: value }),

  checkedInToday: false,
  consecutiveDays: 12,
  checkIn: () =>
    set((state) => ({
      checkedInToday: true,
      consecutiveDays: state.consecutiveDays + 1,
    })),

  todayFortune: null,
  setTodayFortune: (f) => set({ todayFortune: f }),

  darkMode: "system",
  setDarkMode: (m) => set({ darkMode: m }),
}));
