import { cn } from "@/lib/utils";
import { Folder } from "@/schemas/folderSchema";
import { formatDateToLocale } from "@/utils/dates";
import { getBentoClasses } from "@/utils/items";
import { FolderIcon, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelection } from "@/components/hub/selection-context";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLongPress } from "@/hooks/use-long-press";

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
  const { selectedFolderIds, toggleFolder, isSelectionActive } = useSelection();
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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <article
          onClick={handleClick}
          {...longPressProps}
          className={cn(
            "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card p-5 text-foreground transition-all duration-300 hover:bg-muted active:scale-[0.98]",
            isSelected ? "ring-2 ring-primary bg-muted/80" : "",
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
                    <DropdownMenuItem onClick={handleCheckboxClick}>
                      {isSelected ? "Desmarcar" : "Selecionar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
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
        <ContextMenuItem>Mover para</ContextMenuItem>
        <ContextMenuItem>Baixar</ContextMenuItem>
        <ContextMenuItem className="text-destructive">Excluir</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
