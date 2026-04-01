import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNotes } from "./use-notes";
import { useFolders } from "./use-folders";
import { useTags } from "./use-tags";
import { useSettings } from "./use-settings";
import { useNoteStore } from "@/store/noteStore";
import { useFolderStore } from "@/store/folderStore";
import { storageService } from "@/services/storageService";
import { tiptapToText, downloadFile, shareFile } from "@/utils/export-utils";
import { Note } from "@/schemas/noteSchema";
import { Folder } from "@/schemas/folderSchema";

interface UseSelectionActionsProps {
  userId: string;
  selectedNoteIds: Set<string>;
  selectedFolderIds: Set<string>;
  clearSelection: () => void;
  isTrashPage: boolean;
  isArchivedPage: boolean;
}

export function useSelectionActions({
  userId,
  selectedNoteIds,
  selectedFolderIds,
  clearSelection,
  isTrashPage,
  isArchivedPage,
}: UseSelectionActionsProps) {
  const { notes, deleteNote, updateNote, fetchNotes } = useNotes(userId);
  const { folders, deleteFolder, updateFolder, fetchFolders } = useFolders(userId);
  const { tags, applyTagToNote, removeTagFromNote, fetchTags } = useTags(userId);
  const { settings, fetchSettings } = useSettings();

  const lockNote = useNoteStore((s) => s.lockNote);
  const lockFolder = useFolderStore((s) => s.lockFolder);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const selectedNotesCount = selectedNoteIds.size;
  const selectedFoldersCount = selectedFolderIds.size;
  const totalCount = selectedNotesCount + selectedFoldersCount;

  const selectedNotes = useMemo(() => {
    return Array.from(selectedNoteIds)
      .map((id) => notes.find((n) => n.id === id))
      .filter((n): n is Note => !!n);
  }, [notes, selectedNoteIds]);

  const selectedFolders = useMemo(() => {
    return Array.from(selectedFolderIds)
      .map((id) => folders.find((f) => f.id === id))
      .filter((f): f is Folder => !!f);
  }, [folders, selectedFolderIds]);

  const canTag = selectedNotes.length > 0;

  const selectedItemsLockState = useMemo(() => {
    const items = [...selectedNotes, ...selectedFolders];
    const allLocked = items.length > 0 && items.every((i) => i.isLocked);
    return { allLocked, hasAny: items.length > 0 };
  }, [selectedNotes, selectedFolders]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    let successCount = 0;

    const deletePromises = [
      ...Array.from(selectedNoteIds).map(async (noteId) => {
        try {
          if (isTrashPage) {
            const note = notes.find((n) => n.id === noteId) ?? null;
            if (note?.type === "pdf") {
              await storageService.deleteFile(userId, `pdf/${noteId}.pdf`);
            }
            await deleteNote(noteId);
          } else {
            await updateNote(noteId, { trashed: true });
          }
          successCount++;
        } catch {
          // Silent catch
        }
      }),
      ...Array.from(selectedFolderIds).map(async (folderId) => {
        try {
          if (isTrashPage) {
            await deleteFolder(folderId);
          } else {
            await updateFolder(folderId, { trashed: true });
          }
          successCount++;
        } catch {
          // Silent catch
        }
      }),
    ];

    toast.promise(Promise.all(deletePromises), {
      loading: isTrashPage ? "Excluindo iten(s) definitivamente..." : "Movendo para a lixeira...",
      success: () => {
        setIsDeleting(false);
        clearSelection();
        fetchNotes().catch(() => { });
        fetchFolders().catch(() => { });
        return isTrashPage
          ? `${successCount} iten(s) excluído(s) permanentemente.`
          : `${successCount} iten(s) movido(s) para a lixeira.`;
      },
      error: () => {
        setIsDeleting(false);
        return "Um ou mais iten(s) falharam ao serem excluídos.";
      },
    });
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    let successCount = 0;
    const isUnarchiving = isArchivedPage;

    const archivePromises = [
      ...Array.from(selectedNoteIds).map(async (id) => {
        await updateNote(id, { archived: !isUnarchiving });
        successCount++;
      }),
      ...Array.from(selectedFolderIds).map(async (id) => {
        await updateFolder(id, { archived: !isUnarchiving });
        successCount++;
      }),
    ];

    toast.promise(Promise.all(archivePromises), {
      loading: isUnarchiving ? "Desarquivando iten(s)..." : "Arquivando iten(s)...",
      success: () => {
        setIsArchiving(false);
        clearSelection();
        fetchNotes().catch(() => { });
        fetchFolders().catch(() => { });
        return isUnarchiving ? `${successCount} iten(s) desarquivado(s).` : `${successCount} iten(s) arquivado(s).`;
      },
      error: () => {
        setIsArchiving(false);
        return "Erro ao processar arquivamento.";
      },
    });
  };

  const handlePinSelected = async () => {
    const promises = Array.from(selectedNoteIds).map((id) => updateNote(id, { pinned: true }));
    toast.promise(Promise.all(promises), {
      loading: "Fixando notas...",
      success: () => {
        clearSelection();
        fetchNotes().catch(() => { });
        return `${selectedNoteIds.size} nota(s) fixada(s).`;
      },
      error: "Erro ao fixar notas.",
    });
  };

  const ensureSettingsLoaded = async () => {
    if (settings) return settings;
    try {
      return await fetchSettings(userId);
    } catch {
      return null;
    }
  };

  const handleToggleLock = async () => {
    setIsLocking(true);
    const lockButtonMode = selectedItemsLockState.allLocked ? "unlock" : "lock";

    if (lockButtonMode === "lock") {
      const s = await ensureSettingsLoaded();
      if (!s?.pinHash || !s?.pinSalt) {
        setIsLocking(false);
        toast.error("Defina um PIN em Configurações antes de trancar itens.");
        return;
      }
    }

    const isLocked = lockButtonMode === "lock";
    const promises = [
      ...Array.from(selectedNoteIds).map(async (id) => {
        if (isLocked) lockNote(id);
        await updateNote(id, { isLocked });
      }),
      ...Array.from(selectedFolderIds).map(async (id) => {
        if (isLocked) lockFolder(id);
        await updateFolder(id, { isLocked });
      }),
    ];

    toast.promise(Promise.all(promises), {
      loading: isLocked ? "Trancando iten(s)..." : "Destrancando iten(s)...",
      success: () => {
        setIsLocking(false);
        clearSelection();
        fetchNotes().catch(() => { });
        fetchFolders().catch(() => { });
        return isLocked ? "Item(ns) trancado(s)." : "Item(ns) destrancado(s).";
      },
      error: () => {
        setIsLocking(false);
        return "Erro ao processar trancas.";
      },
    });
  };

  const handleToggleTag = async (tagId: string) => {
    if (!canTag) return;
    setIsTagging(true);
    const allHaveTag = selectedNotes.every((n) => (n.tagIds ?? []).includes(tagId));

    const promises = selectedNotes.map(async (note) => {
      const hasTag = (note.tagIds ?? []).includes(tagId);
      if (allHaveTag) {
        if (hasTag) await removeTagFromNote(note.id, tagId);
      } else if (!hasTag) {
        await applyTagToNote(note.id, tagId);
      }
    });

    toast.promise(Promise.all(promises), {
      loading: allHaveTag ? "Removendo tag..." : "Aplicando tag...",
      success: () => {
        setIsTagging(false);
        clearSelection();
        fetchNotes().catch(() => { });
        return allHaveTag ? "Tag removida." : "Tag aplicada.";
      },
      error: "Erro ao processar tags.",
    });
  };

  const handleMoveToFolder = async (destinationFolderId: string | undefined) => {
    setIsMoving(true);
    const promises = [
      ...Array.from(selectedNoteIds).map((id) => updateNote(id, { folderId: destinationFolderId })),
      ...Array.from(selectedFolderIds).map((id) => updateFolder(id, { parentId: destinationFolderId })),
    ];

    toast.promise(Promise.all(promises), {
      loading: "Movendo iten(s)...",
      success: () => {
        setIsMoving(false);
        clearSelection();
        fetchNotes().catch(() => { });
        fetchFolders().catch(() => { });
        return "Item(ns) movidos com sucesso.";
      },
      error: () => {
        setIsMoving(false);
        return "Erro ao mover item(ns).";
      },
    });
  };

  const getFullContentAsText = useCallback(() => {
    let fullText = "";

    selectedNotes.forEach((n) => {
      const contentText = n.type === "pdf" ? "[Arquivo PDF]" : tiptapToText(n.content);
      fullText += `${n.title}\n${"=".repeat(n.title.length)}\n${contentText}\n\n`;
    });
    selectedFolders.forEach((f) => {
      const folderNotes = notes.filter((n) => n.folderId === f.id);
      fullText += `[PASTA] ${f.title}\n${"=".repeat(f.title.length + 8)}\n`;
      folderNotes.forEach((n) => {
        const contentText = n.type === "pdf" ? "[Arquivo PDF]" : tiptapToText(n.content);
        fullText += `- ${n.title}\n${contentText}\n`;
      });
      fullText += `\n`;
    });

    return fullText.trim();
  }, [selectedNotes, selectedFolders, notes]);

  const handleShare = async () => {
    setIsExporting(true);
    const text = getFullContentAsText();
    const filename = selectedNotes.length === 1 ? `${selectedNotes[0].title}.txt` : "notas_compartilhadas.txt";

    const shared = await shareFile(text, filename);
    if (!shared) {
      toast.error("Não foi possível compartilhar.");
    }
    setIsExporting(false);
  };

  const handleDownload = async (format: "txt" | "pdf" | "odt" | "jw") => {
    if (format !== "txt") {
      toast.info(`O formato ${format.toUpperCase()} ainda não está disponível.`);
      return;
    }

    setIsExporting(true);
    const text = getFullContentAsText();
    const filename = selectedNotes.length === 1 ? `${selectedNotes[0].title}.txt` : "notas_baixadas.txt";

    downloadFile(text, filename);
    setIsExporting(false);
    toast.success("Download iniciado.");
  };

  return {
    isDeleting,
    isArchiving,
    isLocking,
    isTagging,
    isMoving,
    isExporting,
    totalCount,
    selectedItemsLockState,
    canTag,
    handleConfirmDelete,
    handleArchive,
    handlePinSelected,
    handleToggleLock,
    handleToggleTag,
    handleMoveToFolder,
    handleShare,
    handleDownload,
    selectedNotes,
    selectedFolders,
    tags,
    fetchTags,
  };
}
