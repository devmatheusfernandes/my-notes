import { create } from "zustand";

interface TagState {
  isLoading: boolean;
  error: string | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTagStore = create<TagState>((set) => ({
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
}));
