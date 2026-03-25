import { create } from "zustand";
import { Folder } from "@/schemas/folderSchema";

interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;

  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  removeFolder: (folderId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  isLoading: false,
  error: null,

  setFolders: (folders) => set({ folders: folders }),
  addFolder: (folder) =>
    set((state) => ({ folders: [folder, ...state.folders] })),
  removeFolder: (folderId) =>
    set((state) => ({ folders: state.folders.filter((f) => f.id !== folderId) })),
  setLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
}));
