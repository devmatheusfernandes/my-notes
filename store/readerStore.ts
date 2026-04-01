import { create } from "zustand";

export interface ReferenceInstance {
  id: string; // Internal ID for UI mapping
  label: string;
  content: string;
  type: "footnote" | "bible";
}

interface ReaderState {
  // Navigation & UI state
  currentChapterIndex: number;
  isChapterDrawerOpen: boolean;
  isSidebarOpen: boolean;
  direction: number;
  
  // Reference management
  activeReferences: ReferenceInstance[]; 
  
  // Actions
  setCurrentChapterIndex: (index: number) => void;
  setIsChapterDrawerOpen: (open: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setDirection: (direction: number) => void;
  
  // Sidebar reference actions
  addReference: (ref: Omit<ReferenceInstance, "id">) => void;
  removeReference: (id: string) => void;
  clearReferences: () => void;
  
  reset: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  currentChapterIndex: 0,
  isChapterDrawerOpen: false,
  isSidebarOpen: true, 
  direction: 0,
  activeReferences: [],

  setCurrentChapterIndex: (index) => set({ currentChapterIndex: index }),
  setIsChapterDrawerOpen: (open) => set({ isChapterDrawerOpen: open }),
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setDirection: (direction) => set({ direction }),

  addReference: (ref) => {
    const { activeReferences } = get();
    
    // Check if duplicate for UX consistency
    const existingIndex = activeReferences.findIndex(r => r.content === ref.content);
    
    if (existingIndex !== -1) {
      const existing = activeReferences[existingIndex];
      const filtered = activeReferences.filter(r => r.id !== existing.id);
      set({ 
        activeReferences: [existing, ...filtered],
        isSidebarOpen: true 
      });
      return;
    }

    // Single mode for sidebar: only keep one if needed, or keep history.
    // For now, let's keep it simple: push to front, keep sidebar open.
    const newRef = { ...ref, id: "sidebar-ref" }; // Simplified to one active for standard sidebar
    set({ 
      activeReferences: [newRef],
      isSidebarOpen: true 
    });
  },

  removeReference: (id) => set((state) => ({
    activeReferences: state.activeReferences.filter((r) => r.id !== id)
  })),

  clearReferences: () => set({ activeReferences: [] }),

  reset: () => set({
    currentChapterIndex: 0,
    isChapterDrawerOpen: false,
    isSidebarOpen: true,
    activeReferences: [],
    direction: 0,
  }),
}));
