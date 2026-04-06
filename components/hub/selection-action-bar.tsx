"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Archive,
  CheckSquare,
  Download,
  FolderOutput,
  Lock,
  Pin,
  Share2,
  Trash2,
  Unlock,
  Tag as TagIcon,
  XSquare,
  ChevronRight,
  Folder as FolderIcon,
} from "lucide-react";

import { useSelection } from "./selection-context";
import { useAuthStore } from "@/store/authStore";
import { useSelectionActions } from "@/hooks/use-selection-actions";
import { useFolders } from "@/hooks/use-folders";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
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
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";

  const actions = useSelectionActions({
    userId,
    selectedNoteIds,
    selectedFolderIds,
    clearSelection,
    isTrashPage,
    isArchivedPage,
  });

  const { folders } = useFolders(userId);

  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [isTagDrawerOpen, setIsTagDrawerOpen] = useState(false);
  const [isMoveDrawerOpen, setIsMoveDrawerOpen] = useState(false);
  const [moveSearchQuery, setMoveSearchQuery] = useState("");

  const lockButtonMode = actions.selectedItemsLockState.allLocked ? "unlock" : "lock";

  if (!isSelectionActive) return null;

  const handleOpenTagDrawer = () => {
    setIsTagDrawerOpen(true);
    actions.fetchTags().catch(() => { });
  };

  const handleOpenMoveDrawer = () => {
    setIsMoveDrawerOpen(true);
  };

  const availableFolders = folders.filter((f) => !selectedFolderIds.has(f.id));

  const filteredMoveFolders = availableFolders.filter((f) =>
    (f.title ?? "").toLowerCase().includes(moveSearchQuery.toLowerCase())
  );

  const folderIdToTitle = new Map(folders.map(f => [f.id, f.title]));

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
      <div className="flex w-fit max-w-[95vw] mx-auto items-center justify-center bg-card/80 backdrop-blur-xl text-card-foreground p-2 rounded-2xl shadow-2xl border border-border/50 overflow-x-auto gap-2 pointer-events-auto ring-1 ring-black/5">
        <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap min-w-max">
          <span className="text-sm font-medium mr-2 px-2">
            {actions.totalCount} selecionados
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="gap-2 h-8 px-2 sm:px-3"
            disabled={actions.isDeleting}
          >
            <CheckSquare className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Selecionar tudo</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="gap-2 h-8 px-2 sm:px-3"
            disabled={actions.isDeleting}
          >
            <XSquare className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Limpar</span>
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <TooltipProvider delayDuration={200}>
            {/* DELETE */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive disabled:opacity-50"
                  onClick={() => setIsDeleteDrawerOpen(true)}
                  disabled={actions.isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isTrashPage ? "Excluir permanentemente" : "Excluir"}</TooltipContent>
            </Tooltip>

            {/* MOVE TO */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={handleOpenMoveDrawer}
                  disabled={actions.isMoving}
                >
                  <FolderOutput className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mover para</TooltipContent>
            </Tooltip>

            {/* TAGS */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={handleOpenTagDrawer}
                  disabled={actions.isDeleting || actions.isTagging || !actions.canTag}
                >
                  <TagIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {actions.canTag ? "Adicionar Tag" : "Selecione ao menos uma nota"}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            {/* PIN */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={actions.handlePinSelected}
                >
                  <Pin className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fixar</TooltipContent>
            </Tooltip>

            {/* LOCK/UNLOCK */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={actions.handleToggleLock}
                  disabled={actions.isLocking || !actions.selectedItemsLockState.hasAny}
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

            {/* ARCHIVE/UNARCHIVE */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={actions.handleArchive}
                  disabled={actions.isDeleting || actions.isArchiving}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isArchivedPage ? "Desarquivar" : "Arquivar"}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            {/* SHARE */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={actions.handleShare}
                  disabled={actions.isExporting}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compartilhar (.txt)</TooltipContent>
            </Tooltip>

            {/* DOWNLOAD */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      disabled={actions.isExporting}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Baixar</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => actions.handleDownload("txt")}>
                  Texto (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.handleDownload("pdf")} disabled>
                  PDF (.pdf) <span className="ml-auto text-[10px] opacity-70">EM BREVE</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.handleDownload("odt")} disabled>
                  ODT (.odt) <span className="ml-auto text-[10px] opacity-70">EM BREVE</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.handleDownload("jw")} disabled>
                  JW (.jw) <span className="ml-auto text-[10px] opacity-70">EM BREVE</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </TooltipProvider>
        </div>
      </div>

      {/* DELETE DRAWER */}
      <Drawer open={isDeleteDrawerOpen} onOpenChange={setIsDeleteDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader className="px-0 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DrawerTitle className="text-xl">
                {isTrashPage ? "Excluir Definitivamente?" : "Mover para a lixeira?"}
              </DrawerTitle>
              <DrawerDescription className="text-base pt-2">
                {isTrashPage
                  ? `Tem certeza que deseja excluir permanentemente ${actions.totalCount} iten(s)? Essa ação não pode ser desfeita.`
                  : `Tem certeza que deseja mover ${actions.totalCount} iten(s) para a lixeira? Eles podem ser restaurados depois.`}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-3 py-6">
              <Button
                variant="destructive"
                className="w-full h-12 text-base font-semibold rounded-xl transition-all"
                onClick={() => {
                  actions.handleConfirmDelete();
                  setIsDeleteDrawerOpen(false);
                }}
              >
                {isTrashPage ? "Excluir Permanentemente" : "Mover para a lixeira"}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-base rounded-xl transition-all"
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* TAGS DRAWER */}
      <Drawer open={isTagDrawerOpen} onOpenChange={setIsTagDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Tags</DrawerTitle>
              <DrawerDescription>
                {actions.selectedNotes.length} nota(s) selecionada(s)
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-8">
              {actions.tags.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma tag cadastrada.
                </div>
              ) : (
                <div className="max-h-[45vh] overflow-auto flex flex-col gap-2">
                  {actions.tags.map((tag) => {
                    const hasInAll = actions.selectedNotes.every((n) =>
                      (n.tagIds ?? []).includes(tag.id),
                    );
                    const hasInAny = actions.selectedNotes.some((n) =>
                      (n.tagIds ?? []).includes(tag.id),
                    );
                    const actionLabel = hasInAll
                      ? "Remover"
                      : hasInAny
                        ? "Adicionar (faltando)"
                        : "Adicionar";

                    return (
                      <Button
                        key={tag.id}
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => actions.handleToggleTag(tag.id)}
                        disabled={actions.isTagging}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              tag.color ?? "bg-muted-foreground/40",
                            )}
                          />
                          <span className="truncate">{tag.title}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {actionLabel}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* MOVE TO DRAWER */}
      <Drawer open={isMoveDrawerOpen} onOpenChange={setIsMoveDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle>Mover para</DrawerTitle>
              <DrawerDescription>
                Selecione a pasta de destino para {actions.totalCount} iten(s).
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-8">
              <div className="mb-4">
                <Input
                  placeholder="Buscar pasta..."
                  value={moveSearchQuery}
                  onChange={(e) => setMoveSearchQuery(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>

              <ScrollArea className="h-[40vh]">
                <div className="flex flex-col gap-1 pr-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => {
                      actions.handleMoveToFolder(undefined);
                      setIsMoveDrawerOpen(false);
                    }}
                  >
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                      <ChevronRight className="size-4 opacity-50" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">Raiz</span>
                      <span className="text-[10px] text-muted-foreground">Sem pasta específica</span>
                    </div>
                  </Button>

                  <Separator className="my-1" />

                  {filteredMoveFolders.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      {moveSearchQuery ? "Nenhuma pasta encontrada." : "Nenhuma pasta disponível para destino."}
                    </div>
                  ) : (
                    filteredMoveFolders.map((folder) => {
                      const parentTitle = folder.parentId ? folderIdToTitle.get(folder.parentId) : null;
                      
                      return (
                        <Button
                          key={folder.id}
                          variant="ghost"
                          className="w-full justify-start gap-3 h-14"
                          onClick={() => {
                            actions.handleMoveToFolder(folder.id);
                            setIsMoveDrawerOpen(false);
                            setMoveSearchQuery("");
                          }}
                        >
                          <div
                            className={cn(
                              "size-9 rounded-md flex items-center justify-center text-white shrink-0",
                              folder.color || "bg-primary/20 text-primary"
                            )}
                            style={folder.color ? { backgroundColor: folder.color } : {}}
                          >
                            <FolderIcon className="size-5 fill-current" />
                          </div>
                          <div className="flex flex-col items-start text-left truncate">
                            <span className="text-sm font-semibold truncate">{folder.title}</span>
                            {parentTitle ? (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <ChevronRight className="size-2" />
                                Subpasta de: <span className="font-medium text-foreground/70">{parentTitle}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                Pasta raiz
                              </span>
                            )}
                          </div>
                        </Button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
