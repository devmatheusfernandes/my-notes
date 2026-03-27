import { create } from "zustand";
import type { UserSettings } from "@/schemas/userSettingsSchema";

type SettingsState = {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;

  setSettings: (settings: UserSettings | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  setSettings: (settings) => set({ settings }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
