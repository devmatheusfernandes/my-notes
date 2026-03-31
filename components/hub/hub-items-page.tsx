"use client";

import { useMemo, useRef, useState } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { useTags } from "@/hooks/use-tags";
import { uploadPdfAction } from "@/app/actions/note-actions";
import { Note } from "@/schemas/noteSchema";
import { Folder } from "@/schemas/folderSchema";
import { Tag } from "@/schemas/tagSchema";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SmartCreateButton } from "@/components/items/create-button";
import { Input } from "@/components/ui/input";
import { SelectionProvider } from "@/components/hub/selection-context";
import { useAuthStore } from "@/store/authStore";
import HubBreadcrumb from "./hub-breadcrumb";
import { useNotesSearch } from "@/hooks/use-notes-search";
import { SearchX } from "lucide-react";
import { motion } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useFolderId } from "@/utils/searchParams";
import { useFolderStore } from "@/store/folderStore";
import { SelectionActionBar } from "./selection-action-bar";
import { toast } from "sonner";
import LockedFolderGate from "@/components/hub/locked-folder-gate";
import TagChips from "../items/tag-chips";

export default function HubItemsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";

  const { notes, addNote } = useNotes(userId);
  const { folders } = useFolders(userId);
  const { tags } = useTags(userId);

  const folderId = useFolderId();
  const unlockedFolders = useFolderStore((s) => s.unlockedFolders);

  const dragDepthRef = useRef(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const activeNotes = useMemo(() => {
    return notes.filter((n: Note) => !n.archived && !n.trashed);
  }, [notes]);

  const activeTags = useMemo(() => {
    const noteTagIds = new Set(activeNotes.flatMap((n: Note) => n.tagIds ?? []));
    return tags.filter((t: Tag) => noteTagIds.has(t.id));
  }, [activeNotes, tags]);

  const tagFilteredNotes = useMemo(() => {
    if (!selectedTagId) return activeNotes;
    return activeNotes.filter((n: Note) => (n.tagIds ?? []).includes(selectedTagId));
  }, [activeNotes, selectedTagId]);

  const activeFolders = useMemo(() => {
    return folders.filter((f: Folder) => !f.archived && !f.trashed);
  }, [folders]);

  const currentFolder = useMemo(() => {
    if (!folderId) return null;
    return activeFolders.find((f: Folder) => f.id === folderId) ?? null;
  }, [activeFolders, folderId]);

  const isFolderUnlockedInSession = useMemo(() => {
    if (!folderId) return false;
    return unlockedFolders.has(folderId);
  }, [folderId, unlockedFolders]);

  const isFolderBlocked = useMemo(() => {
    return (
      !!folderId && !!currentFolder?.isLocked && !isFolderUnlockedInSession
    );
  }, [currentFolder?.isLocked, folderId, isFolderUnlockedInSession]);

  const { searchQuery, setSearchQuery, filteredNotes } =
    useNotesSearch(tagFilteredNotes);

  const normalizedQuery = useMemo(() => {
    return searchQuery.trim().toLowerCase();
  }, [searchQuery]);

  const hasQuery = normalizedQuery.length > 0;

  const displayedFolders = useMemo(() => {
    if (!hasQuery) return activeFolders;
    return activeFolders.filter((f: Folder) => {
      return (f.title ?? "").toLowerCase().includes(normalizedQuery);
    });
  }, [activeFolders, hasQuery, normalizedQuery]);

  const shouldShowEmptyResults =
    hasQuery && filteredNotes.length === 0 && displayedFolders.length === 0;

  const uploadPdfFile = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Envie um arquivo PDF.");
      return;
    }

    const MAX_SINGLE_UPLOAD_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SINGLE_UPLOAD_BYTES) {
      toast.error("O PDF precisa ter no máximo 10 MB.");
      return;
    }

    const toastId = toast.loading("Enviando PDF...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("folderId", folderId ?? "Raiz");

      const result = await uploadPdfAction(formData);

      if (result.success) {
        toast.success(`PDF enviado: ${result.note.title}`, { id: toastId });
        if (result.note) {
          addNote(result.note as Note);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar PDF:", error);
      toast.error("Erro ao enviar PDF!", { id: toastId });
    }
  };

  return (
    <SelectionProvider>
      <motion.main
        className="relative page-container"
        variants={pageContainerVariants}
        initial="hidden"
        animate="visible"
        onDragEnter={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          dragDepthRef.current += 1;
          setIsDraggingFiles(true);
        }}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setIsDraggingFiles(true);
        }}
        onDragLeave={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          dragDepthRef.current -= 1;
          if (dragDepthRef.current <= 0) {
            dragDepthRef.current = 0;
            setIsDraggingFiles(false);
          }
        }}
        onDrop={async (e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          dragDepthRef.current = 0;
          setIsDraggingFiles(false);

          if (!userId) {
            toast.error("Faça login para enviar arquivos.");
            return;
          }

          if (isFolderBlocked) {
            toast.error("Pasta trancada. Destranque para enviar PDFs.");
            return;
          }

          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length === 0) return;

          const pdfs = files.filter(
            (f) =>
              f.type === "application/pdf" ||
              f.name.toLowerCase().endsWith(".pdf"),
          );

          if (pdfs.length === 0) {
            toast.error("Arraste um arquivo PDF.");
            return;
          }

          for (const file of pdfs) {
            await uploadPdfFile(file);
          }
        }}
      >
        {isDraggingFiles ? (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/70">
            <div className="mx-4 w-full max-w-lg rounded-2xl border bg-card p-6 text-center">
              <div className="text-lg font-semibold">Solte para enviar PDF</div>
              <div className="mt-1 text-sm text-muted-foreground">
                O upload cria uma nota do tipo PDF na pasta atual.
              </div>
            </div>
          </div>
        ) : null}
        <motion.div
          variants={itemFadeInUpVariants}
          className="w-full mb-3 flex flex-col justify-start items-start gap-2"
        >
          <HubBreadcrumb />
          <Input
            placeholder="Buscar nota ou pasta..."
            className="mb-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <TagChips
            tags={activeTags}
            value={selectedTagId}
            onChange={setSelectedTagId}
          />
          <SelectionActionBar />
        </motion.div>
        <motion.div variants={itemFadeInUpVariants}>
          <SmartCreateButton />
        </motion.div>
        <motion.div variants={itemFadeInUpVariants}>
          {isFolderBlocked && folderId ? (
            <LockedFolderGate key={folderId} folderId={folderId} />
          ) : shouldShowEmptyResults ? (
            <Empty className="mt-8 border-none">
              <EmptyContent>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>Nenhum resultado encontrado</EmptyTitle>
                <EmptyDescription>
                  Sua busca por &quot;{searchQuery}&quot; não retornou resultados.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <ItemsBentoGrid notes={filteredNotes} folders={displayedFolders} />
          )}
        </motion.div>
      </motion.main>
    </SelectionProvider>
  );
}
