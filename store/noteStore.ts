import { create } from "zustand";

interface NoteState {
  isLoading: boolean;
  error: string | null;
  unlockedNotes: Set<string>;

  unlockNote: (noteId: string) => void;
  lockNote: (noteId: string) => void;
  resetUnlockedNotes: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  isLoading: false,
  error: null,
  unlockedNotes: new Set(),

  unlockNote: (noteId) =>
    set((state) => {
      const next = new Set(state.unlockedNotes);
      next.add(noteId);
      return { unlockedNotes: next };
    }),
  lockNote: (noteId) =>
    set((state) => {
      const next = new Set(state.unlockedNotes);
      next.delete(noteId);
      return { unlockedNotes: next };
    }),
  resetUnlockedNotes: () => set({ unlockedNotes: new Set() }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
