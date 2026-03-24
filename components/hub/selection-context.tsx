"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

type SelectionContextType = {
  selectedNoteIds: Set<string>;
  selectedFolderIds: Set<string>;
  toggleNote: (id: string) => void;
  toggleFolder: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  visibleNoteIds: string[];
  visibleFolderIds: string[];
  setVisibleItems: (noteIds: string[], folderIds: string[]) => void;
  isSelectionActive: boolean;
};

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [visibleNoteIds, setVisibleNoteIds] = useState<string[]>([]);
  const [visibleFolderIds, setVisibleFolderIds] = useState<string[]>([]);

  const toggleNote = useCallback((id: string) => {
    setSelectedNoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleFolder = useCallback((id: string) => {
    setSelectedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNoteIds(new Set());
    setSelectedFolderIds(new Set());
  }, []);

  const setVisibleItems = useCallback((noteIds: string[], folderIds: string[]) => {
    setVisibleNoteIds(noteIds);
    setVisibleFolderIds(folderIds);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedNoteIds(new Set(visibleNoteIds));
    setSelectedFolderIds(new Set(visibleFolderIds));
  }, [visibleNoteIds, visibleFolderIds]);

  const isSelectionActive = selectedNoteIds.size > 0 || selectedFolderIds.size > 0;

  const value = useMemo(() => ({
    selectedNoteIds,
    selectedFolderIds,
    toggleNote,
    toggleFolder,
    clearSelection,
    selectAll,
    visibleNoteIds,
    visibleFolderIds,
    setVisibleItems,
    isSelectionActive
  }), [
    selectedNoteIds,
    selectedFolderIds,
    toggleNote,
    toggleFolder,
    clearSelection,
    selectAll,
    visibleNoteIds,
    visibleFolderIds,
    setVisibleItems,
    isSelectionActive
  ]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
