import { create } from "zustand";
import { Note } from "@/schemas/noteSchema";

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;

  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  isLoading: false,
  error: null,

  setNotes: (notes) => set({ notes: notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  setLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
}));
