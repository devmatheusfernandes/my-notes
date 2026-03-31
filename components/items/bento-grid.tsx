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
import { SearchX, FileText } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useFolderId } from "@/utils/searchParams";
import { cn } from "@/lib/utils";
import { 
  DndContext, 
  DragEndEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCenter
} from "@dnd-kit/core";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

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
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { setVisibleItems } = useSelection();
  const { updateNote } = useNotes(userId);
  const { updateFolder } = useFolders(userId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const folderFilteredNotes = useMemo(() => {
    return filterNotesByFolder(notes, folderId);
  }, [folderId, notes]);

  const { sortedNotes, searchQuery } = useNotesSearch(folderFilteredNotes);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // activeId format: "note-{id}" or "folder-{id}"
    // overId format: "folder-{id}" (folders are droppable)

    const [activeKind, actualActiveId] = activeId.split("-");
    const [overKind, actualOverId] = overId.split("-");

    if (overKind !== "folder") return;

    if (activeKind === "note") {
      const noteToMove = notes.find(n => n.id === actualActiveId);
      if (!noteToMove || noteToMove.folderId === actualOverId) return;

      toast.promise(updateNote(actualActiveId, { folderId: actualOverId }), {
        loading: "Movendo nota...",
        success: "Nota movida com sucesso!",
        error: "Erro ao mover nota.",
      });
    } else if (activeKind === "folder") {
      const folderToMove = folders.find(f => f.id === actualActiveId);
      if (!folderToMove || folderToMove.parentId === actualOverId) return;

      toast.promise(updateFolder(actualActiveId, { parentId: actualOverId }), {
        loading: "Movendo pasta...",
        success: "Pasta movida com sucesso!",
        error: "Erro ao mover pasta.",
      });
    }
  };

  if (gridItems.length === 0) {
    return (
      <Empty className="mt-8">
        <EmptyContent>
          <EmptyMedia variant="icon">
            {searchQuery ? <SearchX /> : <FileText />}
          </EmptyMedia>
          <EmptyTitle>
            {searchQuery ? "Nenhum resultado encontrado" : "Nenhuma nota"}
          </EmptyTitle>
          <EmptyDescription>
            {searchQuery
              ? `Sua busca por "${searchQuery}" não retornou resultados.`
              : "Nenhuma nota encontrada nesta pasta."}
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
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
    </DndContext>
  );
}
