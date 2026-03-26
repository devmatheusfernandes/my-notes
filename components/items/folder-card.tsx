import { cn } from "@/lib/utils";
import { Folder } from "@/schemas/folderSchema";
import { formatDateToLocale } from "@/utils/dates";
import { getBentoClasses } from "@/utils/items";
import { FolderIcon, MoreVertical } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSelection } from "@/components/hub/selection-context";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useLongPress } from "@/hooks/use-long-press";
import { useFolders } from "@/hooks/use-folders";
import { useState } from "react";
import { toast } from "sonner";

export default function FolderCard({
  folder,
  className,
  index = 0,
}: {
  folder: Folder;
  className?: string;
  index?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isTrashPage = pathname === "/hub/trash";
  const isArchivedPage = pathname === "/hub/archived";

  const { selectedFolderIds, toggleFolder, isSelectionActive } = useSelection();
  const { deleteFolder, updateFolder } = useFolders();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isSelected = selectedFolderIds.has(folder.id);

  const handleToggle = () => toggleFolder(folder.id);

  const longPressProps = useLongPress(() => {
    if (!isSelectionActive) handleToggle();
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionActive) {
      e.preventDefault();
      e.stopPropagation();
      handleToggle();
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
    
    const promise = isTrashPage ? deleteFolder(folder.id) : updateFolder(folder.id, { trashed: true });

    toast.promise(promise, {
      loading: isTrashPage ? "Excluindo pasta..." : "Movendo pasta para a lixeira...",
      success: () => isTrashPage ? "Pasta excluída com sucesso." : "Pasta movida para a lixeira.",
      error: () => {
        setIsDeleting(false);
        return isTrashPage ? "Não foi possível excluir a pasta." : "Não foi possível mover a pasta.";
      }
    });
  };

  const handleArchive = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isUnarchiving = isArchivedPage;
    toast.promise(updateFolder(folder.id, { archived: !isUnarchiving }), {
      loading: isUnarchiving ? "Desarquivando pasta..." : "Arquivando pasta...",
      success: () => isUnarchiving ? "Pasta desarquivada." : "Pasta arquivada com sucesso.",
      error: () => "Falha ao processar pasta."
    });
  };

  const handleRestore = async (e?: Event | React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast.promise(updateFolder(folder.id, { trashed: false }), {
      loading: "Restaurando pasta...",
      success: () => "Pasta restaurada com sucesso.",
      error: () => "Falha ao restaurar pasta."
    });
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <article
            onClick={handleClick}
            {...longPressProps}
            className={cn(
              "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card p-5 text-foreground transition-all duration-300 hover:bg-muted active:scale-[0.98]",
              isSelected ? "ring-2 ring-primary bg-muted/80" : "",
              isDeleting ? "opacity-50 pointer-events-none" : "",
              getBentoClasses(index),
              className,
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center transition-opacity border border-transparent rounded",
                    isSelected ? "opacity-100" : "opacity-0 md:group-hover:opacity-100 hover:border-border"
                  )}
                  onClick={handleCheckboxClick}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                </div>
                <div className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  {formatDateToLocale(folder.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-foreground hidden md:block" />
                <div className="md:hidden block" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 -mr-2 -mt-1 rounded-full hover:bg-background/80 transition-colors">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); attemptDelete(); }}>
                        {isTrashPage ? "Excluir Definitivamente" : "Mover para Lixeira"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <h3 className="mb-2 text-base font-bold leading-tight tracking-tight md:text-lg line-clamp-2">
              {folder.title}
            </h3>
            <p className="mt-auto text-xs leading-relaxed text-zinc-500 md:text-sm">
              Abrir pasta
            </p>
          </article>
        </ContextMenuTrigger>
        
        <ContextMenuContent>
          <ContextMenuItem onClick={handleToggle}>
            {isSelected ? "Desmarcar" : "Selecionar"}
          </ContextMenuItem>
          
          {!isTrashPage && (
            <ContextMenuItem onClick={handleArchive}>
              {isArchivedPage ? "Desarquivar" : "Arquivar"}
            </ContextMenuItem>
          )}

          {isTrashPage && (
            <ContextMenuItem onClick={handleRestore}>
              Restaurar
            </ContextMenuItem>
          )}

          <ContextMenuItem>Mover para</ContextMenuItem>
          <ContextMenuItem>Baixar</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" onClick={attemptDelete}>
            {isTrashPage ? "Excluir Definitivamente" : "Mover para Lixeira"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>{isTrashPage ? "Excluir Definitivamente?" : "Mover para a Lixeira?"}</DrawerTitle>
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
    </>
  );
}
