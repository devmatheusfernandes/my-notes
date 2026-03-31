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
import { useFolders } from "@/hooks/use-folders";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useFolderStore } from "@/store/folderStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { HighlightedText } from "@/components/ui/highlighted-text";

export default function FolderCard({
  folder,
  className,
  searchQuery = "",
}: {
  folder: Folder;
  className?: string;
  searchQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isTrashPage = pathname === "/hub/trash";
  const isArchivedPage = pathname === "/hub/archived";

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";
  const { selectedFolderIds, toggleFolder, isSelectionActive } = useSelection();
  const { deleteFolder, updateFolder } = useFolders(userId);
  const { unlockedFolders } = useFolderStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUnlockDrawerOpen, setIsUnlockDrawerOpen] = useState(false);

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
      setIsUnlockDrawerOpen(true);
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
    if (e) e.stopPropagation();
    setIsDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDrawerOpen(false);
    setIsDeleting(true);

    const promise = isTrashPage
      ? deleteFolder(folder.id)
      : updateFolder(folder.id, { trashed: true });

    toast.promise(promise, {
      loading: isTrashPage
        ? "Excluindo pasta..."
        : "Movendo pasta para a lixeira...",
      success: () =>
        isTrashPage
          ? "Pasta excluída com sucesso."
          : "Pasta movida para a lixeira.",
      error: () => {
        setIsDeleting(false);
        return isTrashPage
          ? "Não foi possível excluir a pasta."
          : "Não foi possível mover a pasta.";
      },
    });
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
              "group relative flex items-center gap-3 cursor-pointer overflow-hidden rounded-2xl p-3 pr-2 transition-all duration-200 active:scale-[0.98]",
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
                  <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                  ? `Tem certeza que deseja excluir permanentemente "${folder.title}"? Essa ação não pode ser desfeita.`
                  : `Tem certeza que deseja mover "${folder.title}" para a lixeira? Tudo dentro da pasta poderá ser perdido senão existir mecanismo de restauração em massa.`}
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
        item={{ kind: "folder", id: folder.id }}
        onUnlocked={() => {
          setIsUnlockDrawerOpen(false);
          router.push(`/hub/items/${folder.id}`);
        }}
      />
    </>
  );
}
