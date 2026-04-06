"use client";

import { useMemo, useEffect, useState } from "react";
import { useSelection } from "@/components/hub/selection-context";
import { usePathname } from "next/navigation";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { storageService } from "@/services/storageService";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";

export default function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-flow-dense auto-rows-[170px] grid-cols-2 gap-4 md:auto-rows-[190px] md:grid-cols-4">
      {children}
    </div>
  );
}

export function ItemsBentoGrid({
  notes,
  folders = [],
  searchQuery = "",
}: {
  notes: Note[];
  folders?: Folder[];
  searchQuery?: string;
}) {
  const folderId = useFolderId();
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { setVisibleItems } = useSelection();
  const { updateNote, deleteNote } = useNotes(userId);
  const { updateFolder, deleteFolder } = useFolders(userId);

  // Global Modals State
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    kind: "note" | "folder";
    title: string;
    type?: string;
  } | null>(null);
  const [itemToUnlock, setItemToUnlock] = useState<{
    id: string;
    kind: "note" | "folder";
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const { sortedNotes, searchQuery: internalSearchQuery } = useNotesSearch(folderFilteredNotes);

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

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    const { id, kind, type } = itemToDelete;
    const isTrashPageItem = pathname === "/hub/trash";

    try {
      if (kind === "note") {
        const promise = isTrashPageItem
          ? (async () => {
            if (type === "pdf" && userId) {
              await storageService.deleteFile(userId, `pdf/${id}.pdf`);
            }
            await deleteNote(id);
          })()
          : updateNote(id, { trashed: true });

        toast.promise(promise, {
          loading: isTrashPageItem ? "Excluindo nota..." : "Movendo nota para a lixeira...",
          success: isTrashPageItem ? "Nota excluída com sucesso." : "Nota movida para a lixeira.",
          error: isTrashPageItem ? "Erro ao excluir nota." : "Erro ao mover nota.",
        });
      } else {
        const promise = isTrashPageItem
          ? deleteFolder(id)
          : updateFolder(id, { trashed: true });

        toast.promise(promise, {
          loading: isTrashPageItem ? "Excluindo pasta..." : "Movendo pasta para a lixeira...",
          success: isTrashPageItem ? "Pasta excluída com sucesso." : "Pasta movida para a lixeira.",
          error: isTrashPageItem ? "Erro ao excluir pasta." : "Erro ao mover pasta.",
        });
      }
      setItemToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const pathname = usePathname();
  const isTrashPage = pathname === "/hub/trash";

  if (gridItems.length === 0) {
    return (
      <Empty className="mt-8">
        <EmptyContent>
          <EmptyMedia variant="icon">
            {searchQuery || internalSearchQuery ? <SearchX /> : <FileText />}
          </EmptyMedia>
          <EmptyTitle>
            {searchQuery || internalSearchQuery ? "Nenhum resultado encontrado" : "Nenhuma nota"}
          </EmptyTitle>
          <EmptyDescription>
            {searchQuery || internalSearchQuery
              ? `Sua busca por "${searchQuery || internalSearchQuery}" não retornou resultados.`
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
              : cn(getFolderBentoClasses(), "h-fit");
          return item.kind === "note" ? (
            <NoteCard
              key={`note-${item.note.id}`}
              note={item.note as Note}
              className={bentoClasses}
              searchQuery={searchQuery}
              onOpenDelete={(note: Note) => setItemToDelete({ id: note.id, kind: "note", title: note.title || "Sem Título", type: note.type })}
              onOpenUnlock={(note: Note) => setItemToUnlock({ id: note.id, kind: "note" })}
            />
          ) : (
            <FolderCard
              key={`folder-${item.folder.id}`}
              folder={item.folder as Folder}
              className={bentoClasses}
              searchQuery={searchQuery}
              onOpenDelete={(folder: Folder) => setItemToDelete({ id: folder.id, kind: "folder", title: folder.title })}
              onOpenUnlock={(folder: Folder) => setItemToUnlock({ id: folder.id, kind: "folder" })}
            />
          );
        })}
      </BentoGrid>

      <Drawer open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>
                {isTrashPage ? "Excluir Definitivamente?" : "Mover para a Lixeira?"}
              </DrawerTitle>
              <DrawerDescription>
                {isTrashPage
                  ? `Tem certeza que deseja excluir permanentemente "${itemToDelete?.title}"? Essa ação não pode ser desfeita.`
                  : `Tem certeza que deseja mover "${itemToDelete?.title}" para a lixeira? Você poderá restaurá-la mais tarde.`}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isTrashPage ? "Confirmar Exclusão" : "Mover para Lixeira"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Global Unlock Drawer */}
      {itemToUnlock && (
        <UnlockDrawer
          open={!!itemToUnlock}
          onOpenChange={(open) => !open && setItemToUnlock(null)}
          item={itemToUnlock}
          onUnlocked={() => {
            setItemToUnlock(null);
          }}
        />
      )}
    </DndContext>
  );
}
