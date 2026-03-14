import { create } from "zustand";
import { Tag } from "@/schemas/tagSchema";

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;

  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
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
  updateTag: (tag) =>
    set((state) => ({
      tags: state.tags.map((t) => (t.id === tag.id ? tag : t)),
    })),
  removeTag: (tagId) =>
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== tagId),
    })),
  setLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
}));
