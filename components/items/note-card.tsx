import { cn } from "@/lib/utils";
import { Note } from "@/schemas/noteSchema";
import { formatDateToLocale } from "@/utils/dates";
import { usePathname, useRouter } from "next/navigation";
import { useSelection } from "@/components/hub/selection-context";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { useLongPress } from "@/hooks/use-long-press";
import { MoreVertical, Pencil, FileText } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { toast } from "sonner";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNoteStore } from "@/store/noteStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { useAuthStore } from "@/store/authStore";
import { useSettings } from "@/hooks/use-settings";
import { storageService } from "@/services/storageService";
import { useDraggable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { extractNoteMetadata, toggleTaskInContent } from "@/utils/note-metadata";
import { useTags } from "@/hooks/use-tags";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function NoteCard({
  note,
  className,
}: {
  note: Note;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isTrashPage = pathname === "/hub/trash";
  const isArchivedPage = pathname === "/hub/archived";

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { selectedNoteIds, toggleNote, isSelectionActive } = useSelection();
  const { deleteNote, updateNote } = useNotes(userId);
  const { tags: allTags } = useTags(userId);
  const { settings, fetchSettings } = useSettings();
  const { unlockedNotes, lockNote } = useNoteStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUnlockDrawerOpen, setIsUnlockDrawerOpen] = useState(false);

  // Inline Rename State
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedNoteIds.has(note.id);
  const isUnlockedInSession = unlockedNotes.has(note.id);
  const isMasked = note.isLocked && !isUnlockedInSession;

  const metadata = useMemo(() => extractNoteMetadata(note), [note]);

  const noteTags = useMemo(() => {
    return (note.tagIds || [])
      .map(id => allTags.find(t => t.id === id))
      .filter(Boolean);
  }, [note.tagIds, allTags]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `note-${note.id}`,
    disabled: isRenaming || isSelectionActive || isMasked || isTrashPage,
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 100,
    }
    : undefined;

  const handleToggle = () => toggleNote(note.id);

  const longPressProps = useLongPress(() => {
    if (!isSelectionActive) handleToggle();
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isRenaming) return;

    if (isSelectionActive) {
      e.preventDefault();
      e.stopPropagation();
      handleToggle();
      return;
    }

    if (isMasked) {
      e.preventDefault();
      e.stopPropagation();
      setIsUnlockDrawerOpen(true);
      return;
    } else {
      router.push(`/hub/notes/${note.id}`);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleToggle();
  };

  const attemptDelete = (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDrawerOpen(false);
    setIsDeleting(true);

    const promise = isTrashPage
      ? (async () => {
        if (note.type === "pdf" && userId) {
          await storageService.deleteFile(userId, `pdf/${note.id}.pdf`);
        }
        await deleteNote(note.id);
      })()
      : updateNote(note.id, { trashed: true });

    toast.promise(promise, {
      loading: isTrashPage
        ? "Excluindo nota..."
        : "Movendo nota para a lixeira...",
      success: () =>
        isTrashPage
          ? "Nota excluída com sucesso."
          : "Nota movida para a lixeira.",
      error: () => {
        setIsDeleting(false);
        return isTrashPage
          ? "Não foi possível excluir a nota."
          : "Não foi possível mover a nota.";
      },
    });
  };

  const handleArchive = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isUnarchiving = isArchivedPage;
    toast.promise(updateNote(note.id, { archived: !isUnarchiving }), {
      loading: isUnarchiving ? "Desarquivando nota..." : "Arquivando nota...",
      success: () =>
        isUnarchiving ? "Nota desarquivada." : "Nota arquivada com sucesso.",
      error: () => "Falha ao processar nota.",
    });
  };

  const handleRestore = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast.promise(updateNote(note.id, { trashed: false }), {
      loading: "Restaurando nota...",
      success: () => "Nota restaurada com sucesso.",
      error: () => "Falha ao restaurar nota.",
    });
  };

  const handleTogglePin = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextPinned = !note.pinned;
    toast.promise(updateNote(note.id, { pinned: nextPinned }), {
      loading: nextPinned ? "Fixando nota..." : "Desafixando nota...",
      success: () => (nextPinned ? "Nota fixada." : "Nota desafixada."),
      error: () => "Falha ao atualizar nota.",
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

  const handleToggleLock = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();

    const nextLocked = !note.isLocked;
    if (nextLocked) {
      const s = await ensureSettingsLoaded();
      const hasPin = !!s?.pinHash && !!s?.pinSalt;
      if (!hasPin) {
        toast.error("Defina um PIN em Configurações antes de trancar notas.");
        router.push("/hub/settings");
        return;
      }
    }

    if (nextLocked) lockNote(note.id);

    toast.promise(updateNote(note.id, { isLocked: nextLocked }), {
      loading: nextLocked ? "Trancando nota..." : "Destrancando nota...",
      success: () => (nextLocked ? "Nota trancada." : "Nota destrancada."),
      error: () => "Falha ao atualizar nota.",
    });
  };

  const startRenaming = (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsRenaming(true);
    setNewTitle(note.title);
  };

  const handleRename = async () => {
    if (newTitle.trim() === "" || newTitle === note.title) {
      setIsRenaming(false);
      return;
    }

    try {
      await updateNote(note.id, { title: newTitle.trim() });
      toast.success("Nota renomeada!");
    } catch {
      toast.error("Erro ao renomear nota.");
      setNewTitle(note.title);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleTaskToggle = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (isMasked) return;

    const newContent = toggleTaskInContent(note.content, index);
    await updateNote(note.id, { content: newContent });
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <article
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleClick}
            {...longPressProps}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer min-h-[180px]",
              "bg-card border shadow-sm hover:shadow-md hover:border-border/80",
              isSelected
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/40",
              isDragging && "opacity-50 grayscale scale-[0.95] rotate-1 z-50",
              isDeleting ? "opacity-50 pointer-events-none" : "",
              className,
            )}
          >
            {/* Capa de Imagem */}
            <AnimatePresence>
              {!isMasked && metadata.firstImage && (
                <div className="relative w-full h-24 overflow-hidden shrink-0 border-b border-border/10">
                  <motion.img
                    src={metadata.firstImage}
                    alt="Capa"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
            </AnimatePresence>

            {/* Checkbox em overlay flutuante (Google Keep style) */}
            <div
              className={cn(
                "absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-background/90 backdrop-blur-sm transition-all shadow-sm",
                isSelected
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100",
              )}
              onClick={handleCheckboxClick}
            >
              <Checkbox checked={isSelected} className="pointer-events-none" />
            </div>

            {/* Badge PDF */}
            {note.type === "pdf" && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="secondary" className="gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-600 border-red-500/20">
                  <FileText className="h-3 w-3" />
                  <span className="text-[10px] font-bold">PDF</span>
                </Badge>
              </div>
            )}

            <div className="flex flex-col p-5 pt-4 flex-1">
              {/* Conteúdo da Nota */}
              <div className="flex flex-col gap-2 mb-3">
                {isRenaming ? (
                  <Input
                    ref={inputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename();
                      if (e.key === "Escape") {
                        setIsRenaming(false);
                        setNewTitle(note.title);
                      }
                    }}
                    className="h-7 text-base font-semibold py-0 px-1 -ml-1 border-primary focus-visible:ring-1 focus-visible:ring-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 className="text-base font-semibold leading-tight tracking-tight text-foreground pr-8 line-clamp-2">
                    {note.title || "Sem Título"}{" "}
                    {note.pinned ? <span className="text-sm">📌</span> : null}
                    {note.isLocked ? (
                      <span className="ml-1 text-sm">🔒</span>
                    ) : null}
                  </h3>
                )}

                {/* Checklist Preview */}
                {!isRenaming && !isMasked && metadata.tasks.length > 0 ? (
                  <div className="flex flex-col gap-1 my-1">
                    {metadata.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 group/task" onClick={(e) => handleTaskToggle(e, i)}>
                        <Checkbox checked={task.checked} className="h-3.5 w-3.5" />
                        <span className={cn(
                          "text-xs truncate",
                          task.checked ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground/80"
                        )}>
                          {task.label}
                        </span>
                      </div>
                    ))}
                    {metadata.tasks.length >= 5 && (
                      <span className="text-[10px] text-muted-foreground/60 font-medium ml-6">
                        + ver mais itens
                      </span>
                    )}
                  </div>
                ) : (
                  <p
                    className={cn(
                      "text-sm leading-relaxed text-muted-foreground line-clamp-4",
                      isMasked ? "select-none blur-sm" : "",
                    )}
                  >
                    {isMasked
                      ? "Conteúdo protegido..."
                      : metadata.previewText || "Nenhuma prévia disponível..."}
                  </p>
                )}
              </div>

              {/* Tags */}
              {!isMasked && noteTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1 mb-3">
                  {noteTags.map((tag) => (
                    tag && (
                      <div
                        key={tag.id}
                        className="h-1.5 w-6 rounded-full"
                        style={{ backgroundColor: tag.color || "#888" }}
                        title={tag.title}
                      />
                    )
                  ))}
                </div>
              )}

              {/* Rodapé: Data e Ações */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                <span className="text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">
                  {formatDateToLocale(note.createdAt)}
                </span>

                <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mb-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle();
                        }}
                      >
                        {isSelected ? "Desmarcar" : "Selecionar"}
                      </DropdownMenuItem>

                      {!isTrashPage && (
                        <DropdownMenuItem onClick={handleArchive}>
                          {isArchivedPage ? "Desarquivar" : "Arquivar"}
                        </DropdownMenuItem>
                      )}

                      {isTrashPage && (
                        <DropdownMenuItem onClick={handleRestore}>
                          Restaurar
                        </DropdownMenuItem>
                      )}

                      {!isTrashPage && (
                        <DropdownMenuItem onClick={startRenaming}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleTogglePin}>
                        {note.pinned ? "Desafixar" : "Fixar"}
                      </DropdownMenuItem>
                      {!isTrashPage ? (
                        <DropdownMenuItem onClick={handleToggleLock}>
                          {note.isLocked ? "Destrancar" : "Trancar"}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem>Baixar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          attemptDelete();
                        }}
                      >
                        {isTrashPage
                          ? "Excluir Definitivamente"
                          : "Mover para Lixeira"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </article>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleToggle}>
            {isSelected ? "Desmarcar" : "Selecionar"}
          </ContextMenuItem>

          {!isTrashPage && (
            <ContextMenuItem onClick={handleArchive}>
              {isArchivedPage ? "Desarquivar" : "Arquivar"}
            </ContextMenuItem>
          )}

          {isTrashPage && (
            <ContextMenuItem onClick={handleRestore}>Restaurar</ContextMenuItem>
          )}

          {!isTrashPage && (
            <ContextMenuItem onClick={startRenaming}>
              <Pencil className="h-4 w-4 mr-2" />
              Renomear
            </ContextMenuItem>
          )}

          <ContextMenuItem>Mover para</ContextMenuItem>
          <ContextMenuItem onClick={handleTogglePin}>
            {note.pinned ? "Desafixar" : "Fixar"}
          </ContextMenuItem>
          {!isTrashPage ? (
            <ContextMenuItem onClick={handleToggleLock}>
              {note.isLocked ? "Destrancar" : "Trancar"}
            </ContextMenuItem>
          ) : null}
          <ContextMenuItem>Baixar</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={attemptDelete}
          >
            {isTrashPage ? "Excluir Definitivamente" : "Mover para Lixeira"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>
                {isTrashPage
                  ? "Excluir Definitivamente?"
                  : "Mover para a Lixeira?"}
              </DrawerTitle>
              <DrawerDescription>
                {isTrashPage
                  ? `Tem certeza que deseja excluir permanentemente "${note.title || "Sem Título"}"? Essa ação não pode ser desfeita.`
                  : `Tem certeza que deseja mover "${note.title || "Sem Título"}" para a lixeira? Você poderá restaurá-la mais tarde.`}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {isTrashPage ? "Confirmar Exclusão" : "Mover para Lixeira"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <UnlockDrawer
        open={isUnlockDrawerOpen}
        onOpenChange={setIsUnlockDrawerOpen}
        item={{ kind: "note", id: note.id }}
        onUnlocked={() => {
          setIsUnlockDrawerOpen(false);
          router.push(`/hub/notes/${note.id}`);
        }}
      />
    </>
  );
}
