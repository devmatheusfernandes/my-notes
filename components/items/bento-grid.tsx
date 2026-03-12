"use client";

import { useMemo } from "react";
import type { Folder } from "@/schemas/folderSchema";
import type { Note } from "@/schemas/noteSchema";
import { useNotesSearch } from "@/hooks/use-notes-search";
import NoteCard from "@/components/items/note-card";
import FolderCard from "@/components/items/folder-card";
import {
  buildNotesGridItems,
  filterNotesByFolder,
  sortByCreatedAtDesc,
} from "@/utils/items";
import { useFolderId } from "@/utils/searchParams";

export default function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 grid-flow-dense auto-rows-[120px] gap-3 md:grid-cols-4 md:auto-rows-[140px]">
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

  return (
    <BentoGrid>
      {gridItems.map((item, index) =>
        item.kind === "note" ? (
          <NoteCard
            key={`note-${item.note.id}`}
            note={item.note}
            index={index}
          />
        ) : (
          <FolderCard
            key={`folder-${item.folder.id}`}
            folder={item.folder}
            index={index}
          />
        ),
      )}
    </BentoGrid>
  );
}
