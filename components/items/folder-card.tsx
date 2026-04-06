import { cn } from "@/lib/utils";
import { Folder } from "@/schemas/folderSchema";
import { formatDateToLocale } from "@/utils/dates";
import { FolderIcon, MoreVertical, Pencil } from "lucide-react";
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
import { useFolders } from "@/hooks/use-folders";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useFolderStore } from "@/store/folderStore";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { HighlightedText } from "@/components/ui/highlighted-text";

export default function FolderCard({
  folder,
  className,
  searchQuery = "",
  onOpenDelete,
  onOpenUnlock,
}: {
  folder: Folder;
  className?: string;
  searchQuery?: string;
  onOpenDelete?: (folder: Folder) => void;
  onOpenUnlock?: (folder: Folder) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isTrashPage = pathname === "/hub/trash";
  const isArchivedPage = pathname === "/hub/archived";

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { selectedFolderIds, toggleFolder, isSelectionActive } = useSelection();
  const { updateFolder } = useFolders(userId);
  const { unlockedFolders } = useFolderStore();
  const [isDeleting] = useState(false);

  // Inline Rename State
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(folder.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedFolderIds.has(folder.id);
  const isUnlockedInSession = unlockedFolders.has(folder.id);
  const isMasked = folder.isLocked && !isUnlockedInSession;

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `folder-${folder.id}`,
    disabled: isRenaming || isSelectionActive || isMasked || isTrashPage,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    disabled: isTrashPage || isMasked,
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 100,
    }
    : undefined;

  const handleToggle = () => toggleFolder(folder.id);

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
      (e.currentTarget as HTMLElement).blur();
      onOpenUnlock?.(folder);
      return;
    } else {
      router.push(`/hub/items/${folder.id}`);
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
    onOpenDelete?.(folder);
  };

  const handleArchive = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isUnarchiving = isArchivedPage;
    toast.promise(updateFolder(folder.id, { archived: !isUnarchiving }), {
      loading: isUnarchiving ? "Desarquivando pasta..." : "Arquivando pasta...",
      success: () =>
        isUnarchiving ? "Pasta desarquivada." : "Pasta arquivada com sucesso.",
      error: () => "Falha ao processar pasta.",
    });
  };

  const handleRestore = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast.promise(updateFolder(folder.id, { trashed: false }), {
      loading: "Restaurando pasta...",
      success: () => "Pasta restaurada com sucesso.",
      error: () => "Falha ao restaurar pasta.",
    });
  };

  const startRenaming = (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsRenaming(true);
    setNewTitle(folder.title);
  };

  const handleRename = async () => {
    if (newTitle.trim() === "" || newTitle === folder.title) {
      setIsRenaming(false);
      return;
    }

    try {
      await updateFolder(folder.id, { title: newTitle.trim() });
      toast.success("Pasta renomeada!");
    } catch {
      toast.error("Erro ao renomear pasta.");
      setNewTitle(folder.title);
    } finally {
      setIsRenaming(false);
    }
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
            ref={(node) => {
              setDraggableRef(node);
              setDroppableRef(node);
            }}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleClick}
            {...longPressProps}
            className={cn(
              "group relative flex items-center gap-3 cursor-pointer overflow-hidden rounded-sm p-3 pr-2 transition-all duration-200 active:scale-[0.98]",
              "bg-card border hover:bg-muted/80",
              isSelected
                ? "border-primary/50 bg-primary/10 hover:bg-primary/15"
                : "border-transparent bg-muted/30 hover:border-border",
              isOver && !isDragging && "ring-2 ring-primary border-primary bg-primary/5",
              isDragging && "opacity-50 grayscale scale-[0.95] rotate-1",
              isDeleting ? "opacity-50 pointer-events-none" : "",
              className,
            )}
          >
            {/* Ícone da pasta e Checkbox em sobreposição */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <div
                className={cn(
                  "absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/95 transition-opacity backdrop-blur-sm",
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 hover:opacity-100 md:group-hover:opacity-100",
                )}
                onClick={handleCheckboxClick}
              >
                <Checkbox
                  checked={isSelected}
                  className="pointer-events-none"
                />
              </div>

              {/* O truque do Google Drive é usar um ícone preenchido e com uma cor suave */}
              <FolderIcon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isSelected
                    ? "text-primary fill-primary/20"
                    : "text-zinc-600 dark:text-zinc-400 fill-zinc-600/80 dark:fill-zinc-400/80",
                )}
              />
            </div>

            {/* Informações da pasta */}
            <div className="flex flex-1 flex-col overflow-hidden">
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
                      setNewTitle(folder.title);
                    }
                  }}
                  className="h-7 text-sm font-medium py-0 px-1 -ml-1 border-primary focus-visible:ring-1 focus-visible:ring-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="truncate text-sm font-medium leading-tight text-foreground">
                  <HighlightedText text={folder.title} highlight={searchQuery} />{" "}
                  {folder.isLocked ? <span className="text-sm">🔒</span> : null}
                </h3>
              )}
              {/* Mantive a data bem sutil embaixo, caso você precise dessa informação */}
              <span className="truncate text-[11px] text-muted-foreground">
                {formatDateToLocale(folder.createdAt)}
              </span>
            </div>

            {/* Botão de Opções */}
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
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

          {!isTrashPage && (
            <ContextMenuItem onClick={startRenaming}>
              <Pencil className="h-4 w-4 mr-2" />
              Renomear
            </ContextMenuItem>
          )}

          <ContextMenuItem>Mover para</ContextMenuItem>
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
