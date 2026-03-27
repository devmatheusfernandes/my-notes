"use client";

import { useMemo, useEffect } from "react";
import { useSelection } from "@/components/hub/selection-context";
import type { Folder } from "@/schemas/folderSchema";
import type { Note } from "@/schemas/noteSchema";
import { useNotesSearch } from "@/hooks/use-notes-search";
import NoteCard from "@/components/items/note-card";
import FolderCard from "@/components/items/folder-card";
import {
  buildNotesGridItems,
  filterNotesByFolder,
  getBentoClasses,
  getFolderBentoClasses,
  sortByCreatedAtDesc,
} from "@/utils/items";
import { useFolderId } from "@/utils/searchParams";
import { cn } from "@/lib/utils";

export default function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-flow-dense auto-rows-[170px] grid-cols-2 gap-3 md:auto-rows-[190px] md:grid-cols-4">
      {children}
    </div>
  );
}

export function ItemsBentoGrid({
  notes,
  folders = [],
}: {
  notes: Note[];
  folders?: Folder[];
}) {
  const folderId = useFolderId();
  const { setVisibleItems } = useSelection();

  const folderFilteredNotes = useMemo(() => {
    return filterNotesByFolder(notes, folderId);
  }, [folderId, notes]);

  const { sortedNotes } = useNotesSearch(folderFilteredNotes);

  const sortedFolders = useMemo(() => {
    return sortByCreatedAtDesc(folders);
  }, [folders]);

  const gridItems = useMemo(() => {
    return buildNotesGridItems({
      notes: sortedNotes,
      folders: sortedFolders,
      folderId,
    });
  }, [folderId, sortedFolders, sortedNotes]);

  const noteIdsStr = gridItems
    .filter((i) => i.kind === "note")
    .map((i) => i.note.id)
    .join(",");
  const folderIdsStr = gridItems
    .filter((i) => i.kind === "folder")
    .map((i) => i.folder.id)
    .join(",");

  useEffect(() => {
    const visibleNoteIds = noteIdsStr ? noteIdsStr.split(",") : [];
    const visibleFolderIds = folderIdsStr ? folderIdsStr.split(",") : [];
    setVisibleItems(visibleNoteIds, visibleFolderIds);
  }, [noteIdsStr, folderIdsStr, setVisibleItems]);

  return (
    <BentoGrid>
      {gridItems.map((item, index) => {
        const bentoClasses =
          item.kind === "note"
            ? cn(getBentoClasses(index), "h-full")
            : cn(getFolderBentoClasses(), "h-full");
        return item.kind === "note" ? (
          <NoteCard
            key={`note-${item.note.id}`}
            note={item.note}
            className={bentoClasses}
          />
        ) : (
          <FolderCard
            key={`folder-${item.folder.id}`}
            folder={item.folder}
            className={bentoClasses}
          />
        );
      })}
    </BentoGrid>
  );
}
