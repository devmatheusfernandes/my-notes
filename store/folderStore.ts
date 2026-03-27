import { create } from "zustand";
import { Folder } from "@/schemas/folderSchema";

interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  unlockedFolders: Set<string>;

  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  removeFolder: (folderId: string) => void;
  updateFolder: (folderId: string, data: Partial<Folder>) => void;
  unlockFolder: (folderId: string) => void;
  lockFolder: (folderId: string) => void;
  resetUnlockedFolders: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  isLoading: false,
  error: null,
  unlockedFolders: new Set(),

  setFolders: (folders) => set({ folders: folders }),
  addFolder: (folder) =>
    set((state) => ({ folders: [folder, ...state.folders] })),
  removeFolder: (folderId) =>
    set((state) => ({ folders: state.folders.filter((f) => f.id !== folderId) })),
  updateFolder: (folderId, data) =>
    set((state) => ({ folders: state.folders.map((f) => f.id === folderId ? { ...f, ...data } : f) })),
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
