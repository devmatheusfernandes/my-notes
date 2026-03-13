import { create } from "zustand";
import { Tag } from "@/schemas/tagSchema";

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;

  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  isLoading: false,
  error: null,

  setTags: (tags) => set({ tags: tags }),
  addTag: (tag) =>
    set((state) => ({ tags: [tag, ...state.tags] })),
  setLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
}));
