"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Archive,
  CheckSquare,
  Download,
  FolderOutput,
  Lock,
  Pin,
  Save,
  Share2,
  Trash2,
  Unlock,
  Tag as TagIcon,
  XSquare,
} from "lucide-react";
import { toast } from "sonner";

import { useSelection } from "./selection-context";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { useAuthStore } from "@/store/authStore";
import { useSettings } from "@/hooks/use-settings";
import { useNoteStore } from "@/store/noteStore";
import { useFolderStore } from "@/store/folderStore";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function SelectionActionBar() {
  const pathname = usePathname();
  const isTrashPage = pathname === "/hub/trash";
  const isArchivedPage = pathname === "/hub/archived";

  const {
    isSelectionActive,
    selectedNoteIds,
    selectedFolderIds,
    selectAll,
    clearSelection,
  } = useSelection();
  const { deleteNote, updateNote, notes } = useNotes();
  const { deleteFolder, updateFolder, folders } = useFolders();

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { settings, fetchSettings } = useSettings();

  const lockNote = useNoteStore((s) => s.lockNote);
  const lockFolder = useFolderStore((s) => s.lockFolder);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const selectedCount = selectedNoteIds.size + selectedFolderIds.size;

  const selectedItemsLockState = useMemo(() => {
    const selectedNotes = Array.from(selectedNoteIds)
      .map((id) => notes.find((n) => n.id === id))
      .filter((n): n is NonNullable<typeof n> => !!n);
    const selectedFolders = Array.from(selectedFolderIds)
      .map((id) => folders.find((f) => f.id === id))
      .filter((f): f is NonNullable<typeof f> => !!f);

    const items = [...selectedNotes, ...selectedFolders];
    const allLocked = items.length > 0 && items.every((i) => i.isLocked);
    return { allLocked, hasAny: items.length > 0 };
  }, [folders, notes, selectedFolderIds, selectedNoteIds]);

  const lockButtonMode = selectedItemsLockState.allLocked ? "unlock" : "lock";
  if (!isSelectionActive) return null;

  const handleConfirmDelete = async () => {
    setIsDrawerOpen(false);
    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    const deleteNotePromises = Array.from(selectedNoteIds).map(
      async (noteId) => {
        try {
          if (isTrashPage) {
            await deleteNote(noteId);
          } else {
            await updateNote(noteId, { trashed: true });
          }
          successCount++;
        } catch {
          errorCount++;
        }
      },
    );

    const deleteFolderPromises = Array.from(selectedFolderIds).map(
      async (folderId) => {
        try {
          if (isTrashPage) {
            await deleteFolder(folderId);
          } else {
            await updateFolder(folderId, { trashed: true });
          }
          successCount++;
        } catch {
          errorCount++;
        }
      },
    );

    toast.promise(
      Promise.all([...deleteNotePromises, ...deleteFolderPromises]),
      {
        loading: isTrashPage
          ? "Excluindo itens definitivamente..."
          : "Movendo para a lixeira...",
        success: () => {
          setIsDeleting(false);
          clearSelection();
          if (errorCount > 0) {
            return `${successCount} item(s) processado(s), ${errorCount} erro(s).`;
          }
          return isTrashPage
            ? `${successCount} item(s) excluído(s) com sucesso.`
            : `${successCount} item(s) movidos para a lixeira.`;
        },
        error: () => {
          setIsDeleting(false);
          return "Erro ao processar alguns itens.";
        },
      },
    );
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    let successCount = 0;
    let errorCount = 0;
    const isUnarchiving = isArchivedPage;

    const notePromises = Array.from(selectedNoteIds).map(async (noteId) => {
      try {
        await updateNote(noteId, { archived: !isUnarchiving });
        successCount++;
      } catch {
        errorCount++;
      }
    });

    const folderPromises = Array.from(selectedFolderIds).map(
      async (folderId) => {
        try {
          await updateFolder(folderId, { archived: !isUnarchiving });
          successCount++;
        } catch {
          errorCount++;
        }
      },
    );

    toast.promise(Promise.all([...notePromises, ...folderPromises]), {
      loading: isUnarchiving ? "Desarquivando itens..." : "Arquivando itens...",
      success: () => {
        setIsArchiving(false);
        clearSelection();
        if (errorCount > 0) {
          return `${successCount} item(s) processado(s), ${errorCount} erro(s).`;
        }
        return isUnarchiving
          ? `${successCount} item(s) desarquivado(s).`
          : `${successCount} item(s) arquivado(s).`;
      },
      error: () => {
        setIsArchiving(false);
        return "Erro ao processar os itens.";
      },
    });
  };

  const handlePinSelected = async () => {
    let successCount = 0;
    let errorCount = 0;

    const notePromises = Array.from(selectedNoteIds).map(async (noteId) => {
      try {
        await updateNote(noteId, { pinned: true });
        successCount++;
      } catch {
        errorCount++;
      }
    });

    toast.promise(Promise.all(notePromises), {
      loading: "Fixando notas selecionadas...",
      success: () => {
        clearSelection();
        if (errorCount > 0) {
          return `${successCount} nota(s) fixada(s), ${errorCount} erro(s).`;
        }
        return `${successCount} nota(s) fixada(s).`;
      },
      error: () => "Erro ao fixar notas selecionadas.",
    });
  };

  const ensureSettingsLoaded = async () => {
    if (!userId) return null;
    if (settings) return settings;
    try {
      return await fetchSettings(userId);
    } catch {
      return null;
    }
  };

  const handleLockSelected = async () => {
    setIsLocking(true);
    const s = await ensureSettingsLoaded();
    const hasPin = !!s?.pinHash && !!s?.pinSalt;
    if (!hasPin) {
      setIsLocking(false);
      toast.error("Defina um PIN em Configurações antes de trancar itens.");
      return;
    }

    Array.from(selectedNoteIds).forEach((id) => lockNote(id));
    Array.from(selectedFolderIds).forEach((id) => lockFolder(id));

    let successCount = 0;
    let errorCount = 0;

    const notePromises = Array.from(selectedNoteIds).map(async (noteId) => {
      try {
        await updateNote(noteId, { isLocked: true });
        successCount++;
      } catch {
        errorCount++;
      }
    });

    const folderPromises = Array.from(selectedFolderIds).map(
      async (folderId) => {
        try {
          await updateFolder(folderId, { isLocked: true });
          successCount++;
        } catch {
          errorCount++;
        }
      },
    );

    toast.promise(Promise.all([...notePromises, ...folderPromises]), {
      loading: "Trancando itens selecionados...",
      success: () => {
        setIsLocking(false);
        clearSelection();
        if (errorCount > 0) {
          return `${successCount} item(s) trancado(s), ${errorCount} erro(s).`;
        }
        return `${successCount} item(s) trancado(s).`;
      },
      error: () => {
        setIsLocking(false);
        return "Erro ao trancar itens selecionados.";
      },
    });
  };

  const handleUnlockSelected = async () => {
    setIsLocking(true);
    let successCount = 0;
    let errorCount = 0;

    const notePromises = Array.from(selectedNoteIds).map(async (noteId) => {
      try {
        await updateNote(noteId, { isLocked: false });
        successCount++;
      } catch {
        errorCount++;
      }
    });

    const folderPromises = Array.from(selectedFolderIds).map(
      async (folderId) => {
        try {
          await updateFolder(folderId, { isLocked: false });
          successCount++;
        } catch {
          errorCount++;
        }
      },
    );

    toast.promise(Promise.all([...notePromises, ...folderPromises]), {
      loading: "Destrancando itens selecionados...",
      success: () => {
        setIsLocking(false);
        clearSelection();
        if (errorCount > 0) {
          return `${successCount} item(s) destrancado(s), ${errorCount} erro(s).`;
        }
        return `${successCount} item(s) destrancado(s).`;
      },
      error: () => {
        setIsLocking(false);
        return "Erro ao destrancar itens selecionados.";
      },
    });
  };

  const handleToggleLockSelected = async () => {
    if (!selectedItemsLockState.hasAny) return;
    if (lockButtonMode === "unlock") {
      await handleUnlockSelected();
      return;
    }
    await handleLockSelected();
  };

  const attemptDelete = () => {
    setIsDrawerOpen(true);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-2 duration-200 ease-in-out">
      <div className="flex w-full items-center justify-between bg-card text-card-foreground p-2 rounded-lg shadow-sm border border-border overflow-x-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap min-w-max">
          <span className="text-sm font-medium mr-2 px-2">
            {selectedCount} selecionados
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="gap-2 h-8 px-2 sm:px-3"
            disabled={isDeleting}
          >
            <CheckSquare className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Selecionar tudo</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="gap-2 h-8 px-2 sm:px-3"
            disabled={isDeleting}
          >
            <XSquare className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Limpar</span>
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive disabled:opacity-50"
                  onClick={attemptDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <FolderOutput className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mover para</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <TagIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Tag</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={handlePinSelected}
                >
                  <Pin className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fixar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={handleToggleLockSelected}
                  disabled={isLocking || !selectedItemsLockState.hasAny}
                >
                  {lockButtonMode === "unlock" ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {lockButtonMode === "unlock" ? "Destrancar" : "Trancar"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={handleArchive}
                  disabled={isDeleting || isArchiving}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isArchivedPage ? "Desarquivar" : "Arquivar"}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compartilhar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Baixar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Backup</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>
                {isTrashPage
                  ? "Excluir Definitivamente?"
                  : "Mover para a lixeira?"}
              </DrawerTitle>
              <DrawerDescription>
                {isTrashPage
                  ? `Tem certeza que deseja excluir permanentemente ${selectedCount} iten(s)? Essa ação não pode ser desfeita.`
                  : `Tem certeza que deseja mover ${selectedCount} iten(s) para a lixeira? Eles podem ser restaurados depois.`}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {isTrashPage
                  ? "Excluir Permanentemente"
                  : "Mover para a lixeira"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
