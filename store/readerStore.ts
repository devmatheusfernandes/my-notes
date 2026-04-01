import { create } from "zustand";

interface ReaderState {
  currentChapterIndex: number;
  isChapterDrawerOpen: boolean;
  activeReference: { label: string; url: string } | null;
  direction: number;
  
  // Actions
  setCurrentChapterIndex: (index: number) => void;
  setIsChapterDrawerOpen: (open: boolean) => void;
  setActiveReference: (ref: { label: string; url: string } | null) => void;
  setDirection: (direction: number) => void;
  reset: () => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  currentChapterIndex: 0,
  isChapterDrawerOpen: false,
  activeReference: null,
  direction: 0,

  setCurrentChapterIndex: (index) => set({ currentChapterIndex: index }),
  setIsChapterDrawerOpen: (open) => set({ isChapterDrawerOpen: open }),
  setActiveReference: (ref) => set({ activeReference: ref }),
  setDirection: (direction) => set({ direction }),
  reset: () => set({
    currentChapterIndex: 0,
    isChapterDrawerOpen: false,
    activeReference: null,
    direction: 0,
  }),
}));
