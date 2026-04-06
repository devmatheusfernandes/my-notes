import { create } from "zustand";

export interface ReferenceInstance {
  id: string;
  label: string;
  content: string;
  type: "footnote" | "bible" | "publication" | "note";
  noteId?: string;
}

interface ReaderState {
  currentChapterIndex: number;
  isChapterDrawerOpen: boolean;
  isSidebarOpen: boolean;
  direction: number;

  activeReferences: ReferenceInstance[];
  lastReference: ReferenceInstance | null;
  docReferences: ReferenceInstance[];

  setCurrentChapterIndex: (index: number) => void;
  setIsChapterDrawerOpen: (open: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setDirection: (direction: number) => void;

  addReference: (ref: Omit<ReferenceInstance, "id">) => void;
  removeReference: (id: string) => void;
  clearReferences: () => void;
  setDocReferences: (refs: ReferenceInstance[]) => void;

  reset: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  currentChapterIndex: 0,
  isChapterDrawerOpen: false,
  isSidebarOpen: false,
  direction: 0,
  activeReferences: [],
  lastReference: null,
  docReferences: [],

  setCurrentChapterIndex: (index) => set({ currentChapterIndex: index }),
  setIsChapterDrawerOpen: (open) => set({ isChapterDrawerOpen: open }),
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setDirection: (direction) => set({ direction }),

  addReference: (ref) => {
    const { activeReferences } = get();
    const newId = `ref-${Date.now()}`;
    const newRef = { ...ref, id: newId };

    const existingIndex = activeReferences.findIndex(r =>
      r.label === ref.label && r.type === ref.type
    );

    if (existingIndex !== -1) {
      const existing = activeReferences[existingIndex];
      const filtered = activeReferences.filter(r => r.id !== existing.id);
      set({
        activeReferences: [existing, ...filtered],
        lastReference: existing,
        isSidebarOpen: true
      });
      return;
    }

    set({
      activeReferences: [newRef, ...activeReferences],
      lastReference: newRef,
      isSidebarOpen: true
    });
  },

  removeReference: (id) => set((state) => ({
    activeReferences: state.activeReferences.filter((r) => r.id !== id),
    lastReference: state.lastReference?.id === id ? null : state.lastReference
  })),

  clearReferences: () => set({ activeReferences: [], lastReference: null }),

  setDocReferences: (refs) => set({ docReferences: refs }),

  reset: () => set({
    currentChapterIndex: 0,
    isChapterDrawerOpen: false,
    isSidebarOpen: false,
    activeReferences: [],
    lastReference: null,
    docReferences: [],
    direction: 0,
  }),
}));
