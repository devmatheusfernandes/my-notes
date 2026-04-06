import { cn } from "@/lib/utils";
import { Note } from "@/schemas/noteSchema";
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
import { useLongPress } from "@/hooks/use-long-press";
import { MoreVertical, FileText, Pin, LockIcon } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useNoteStore } from "@/store/noteStore";
import { useAuthStore } from "@/store/authStore";
import { useSettings } from "@/hooks/use-settings";
import { useDraggable } from "@dnd-kit/core";
import { extractNoteMetadata, toggleTaskInContent } from "@/utils/note-metadata";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { HighlightedText } from "@/components/ui/highlighted-text";

export default function NoteCard({
  note,
  className,
  searchQuery = "",
  onOpenDelete,
  onOpenUnlock,
}: {
  note: Note;
  className?: string;
  searchQuery?: string;
  onOpenDelete?: (note: Note) => void;
  onOpenUnlock?: (note: Note) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isTrashPage = pathname === "/hub/trash";
  const isArchivedPage = pathname === "/hub/archived";

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { selectedNoteIds, toggleNote, isSelectionActive } = useSelection();
  const { updateNote } = useNotes(userId);
  const { settings, fetchSettings } = useSettings();
  const { unlockedNotes, lockNote } = useNoteStore();
  const [isDeleting] = useState(false);

  const isSelected = selectedNoteIds.has(note.id);
  const isUnlockedInSession = unlockedNotes.has(note.id);
  const isMasked = note.isLocked && !isUnlockedInSession;
  const hasRealTitle = note.title && note.title.trim() !== "" && note.title !== "Nota nova";
  const metadata = useMemo(() => extractNoteMetadata(note), [note]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `note-${note.id}`,
    disabled: isSelectionActive || isMasked || isTrashPage,
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
    if (isSelectionActive) {
      e.preventDefault();
      e.stopPropagation();
      handleToggle();
      return;
    }

    if (isMasked) {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).blur();
      onOpenUnlock?.(note);
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
    if (e) {
      e.stopPropagation();
      if (e.currentTarget) (e.currentTarget as HTMLElement).blur();
    }
    onOpenDelete?.(note);
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

  const handleTaskToggle = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (isMasked) return;

    const newContent = toggleTaskInContent(note.content, index);
    await updateNote(note.id, { content: newContent });
  };

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
              "group relative flex flex-col justify-between overflow-hidden rounded-sm transition-all duration-300 cursor-pointer min-h-[180px]",
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
                "absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-background/90 backdrop-blur-sm transition-all shadow-sm",
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
              <div className={cn(
                "absolute top-3 z-10 transition-all",
                isSelected ? "left-11" : "left-3 group-hover:left-11"
              )}>
                <Badge variant="secondary" className="gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-600 border-red-500/20">
                  <FileText className="h-3 w-3" />
                  <span className="text-[10px] font-bold">PDF</span>
                </Badge>
              </div>
            )}

            {/* Pin Overlay (Corner) */}
            {note.pinned && (
              <div className="absolute top-2 right-2 z-20 pointer-events-none">
                <Pin className="h-3.5 w-3.5 text-primary/70 fill-primary/10" />
              </div>
            )}

            {/* Content Area */}
            <div className="flex flex-col p-4 pt-4 flex-1 relative min-h-0">
              {isMasked ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="p-3 rounded-full bg-muted/50 border border-border/40">
                    <LockIcon className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <span className="mt-3 text-xs font-medium text-muted-foreground/40 uppercase tracking-widest">
                    Protegido
                  </span>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Title Row */}
                  {hasRealTitle && (
                    <h3 className="text-[17px] font-bold leading-tight tracking-tight text-foreground mb-1.5 line-clamp-2">
                      <HighlightedText text={note.title} highlight={searchQuery} />
                    </h3>
                  )}

                  {/* Actions Overlay (Desktop only) */}
                  <div className="absolute top-0 right-0 p-1 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleToggle();
                        }}>
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
                        <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleTogglePin}>
                          {note.pinned ? "Desafixar" : "Fixar"}
                        </DropdownMenuItem>
                        {!isTrashPage && (
                          <DropdownMenuItem onClick={handleToggleLock}>
                            {note.isLocked ? "Destrancar" : "Trancar"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>Baixar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={attemptDelete}
                        >
                          {isTrashPage ? "Excluir Definitivamente" : "Mover para Lixeira"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                    {/* Checklist Preview */}
                    {metadata.tasks.length > 0 ? (
                      <div className="flex flex-col gap-0.5 my-1">
                        {metadata.tasks.map((task, i) => (
                          <div key={i} className="flex items-center gap-2 group/task" onClick={(e) => handleTaskToggle(e, i)}>
                            <Checkbox checked={task.checked} className="h-3.5 w-3.5" />
                            <span className={cn(
                              "text-sm truncate",
                              task.checked ? "text-muted-foreground line-through decoration-muted-foreground/30" : "text-foreground/90"
                            )}>
                              <HighlightedText text={task.label} highlight={searchQuery} />
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[14px] leading-relaxed text-muted-foreground/90 line-clamp-[8] whitespace-pre-wrap">
                        <HighlightedText text={metadata.previewText || "Sem conteúdo..."} highlight={searchQuery} />
                      </p>
                    )}
                  </div>

                  {/* PDF Badge Integration */}
                  {note.type === "pdf" && !isMasked && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-60">
                      <FileText className="h-3 w-3 text-red-500" />
                      <span className="text-[10px] font-bold tracking-wider text-red-600/80">PDF ATTACHED</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}>
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
    </>
  );
}
