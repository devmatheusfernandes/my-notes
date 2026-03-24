import { create } from "zustand";
import { Note } from "@/schemas/noteSchema";

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;

  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  isLoading: false,
  error: null,

  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  removeNote: (noteId) => set((state) => ({ notes: state.notes.filter((n) => n.id !== noteId) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
