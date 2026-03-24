"use client";

import { useSelection } from "./selection-context";
import { Button } from "@/components/ui/button";
import { CheckSquare, XSquare, Trash2, FolderOutput, Tag as TagIcon, Download, Save, Share2, Archive, Pin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { useNotes } from "@/hooks/use-notes";
import { toast } from "sonner";
import { useState } from "react";

export function SelectionActionBar() {
  const { isSelectionActive, selectedNoteIds, selectedFolderIds, selectAll, clearSelection } = useSelection();
  const { deleteNote } = useNotes();
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!isSelectionActive) return null;

  const selectedCount = selectedNoteIds.size + selectedFolderIds.size;

  const handleConfirmDelete = async () => {
    setIsDrawerOpen(false);
    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    const deletePromises = Array.from(selectedNoteIds).map(async (noteId) => {
      try {
        await deleteNote(noteId);
        successCount++;
      } catch {
        errorCount++;
      }
    });

    toast.promise(Promise.all(deletePromises), {
      loading: "Excluindo notas selecionadas...",
      success: () => {
        setIsDeleting(false);
        clearSelection();
        if (errorCount > 0) {
          return `${successCount} nota(s) excluída(s), ${errorCount} erro(s).`;
        }
        return `${successCount} nota(s) excluída(s) com sucesso.`;
      },
      error: () => {
        setIsDeleting(false);
        return "Erro ao excluir algumas notas.";
      }
    });
  };

  const attemptDelete = () => {
    if (selectedFolderIds.size > 0) {
      toast.info("A deleção de pastas será implementada futuramente.");
      if (selectedNoteIds.size === 0) return;
    }
    setIsDrawerOpen(true);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-2 duration-200 ease-in-out">
      <div className="flex w-full items-center justify-between bg-card text-card-foreground p-2 rounded-lg shadow-sm border border-border overflow-x-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap min-w-max">
          <span className="text-sm font-medium mr-2 px-2">{selectedCount} selecionados</span>

          <Button variant="ghost" size="sm" onClick={selectAll} className="gap-2 h-8 px-2 sm:px-3" disabled={isDeleting}>
            <CheckSquare className="h-4 w-4" /> <span className="hidden sm:inline">Selecionar tudo</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-2 h-8 px-2 sm:px-3" disabled={isDeleting}>
            <XSquare className="h-4 w-4" /> <span className="hidden sm:inline">Limpar</span>
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><FolderOutput className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Mover para</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><TagIcon className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Tag</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Pin className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Fixar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Archive className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Arquivar</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Share2 className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Compartilhar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Download className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Baixar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Save className="h-4 w-4" /></Button>
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
              <DrawerTitle>Excluir itens?</DrawerTitle>
              <DrawerDescription>
                Tem certeza que deseja excluir {selectedNoteIds.size} nota(s)? Essa ação não pode ser desfeita.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive" onClick={handleConfirmDelete}>Confirmar Exclusão</Button>
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
