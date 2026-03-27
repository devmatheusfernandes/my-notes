import { create } from "zustand";
import { Note } from "@/schemas/noteSchema";

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  unlockedNotes: Set<string>;

  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
  updateNote: (noteId: string, data: Partial<Note>) => void;
  unlockNote: (noteId: string) => void;
  lockNote: (noteId: string) => void;
  resetUnlockedNotes: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  isLoading: false,
  error: null,
  unlockedNotes: new Set(),

  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  removeNote: (noteId) => set((state) => ({ notes: state.notes.filter((n) => n.id !== noteId) })),
  updateNote: (noteId, data) => set((state) => ({ notes: state.notes.map((n) => n.id === noteId ? { ...n, ...data } : n) })),
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
