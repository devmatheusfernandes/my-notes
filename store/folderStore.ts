import { create } from "zustand";

interface FolderState {
  isLoading: boolean;
  error: string | null;
  unlockedFolders: Set<string>;

  unlockFolder: (folderId: string) => void;
  lockFolder: (folderId: string) => void;
  resetUnlockedFolders: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  isLoading: false,
  error: null,
  unlockedFolders: new Set(),

  unlockFolder: (folderId) =>
    set((state) => {
      const next = new Set(state.unlockedFolders);
      next.add(folderId);
      return { unlockedFolders: next };
    }),
  lockFolder: (folderId) =>
    set((state) => {
      const next = new Set(state.unlockedFolders);
      next.delete(folderId);
      return { unlockedFolders: next };
    }),
  resetUnlockedFolders: () => set({ unlockedFolders: new Set() }),
  setLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
}));
