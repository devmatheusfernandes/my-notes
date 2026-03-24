"use client";

import { useSelection } from "./selection-context";
import { Button } from "@/components/ui/button";
import { CheckSquare, XSquare, Trash2, FolderOutput, Tag as TagIcon, Download, Save, Share2, Archive, Pin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SelectionActionBar() {
  const { isSelectionActive, selectedNoteIds, selectedFolderIds, selectAll, clearSelection } = useSelection();

  if (!isSelectionActive) return null;

  const selectedCount = selectedNoteIds.size + selectedFolderIds.size;

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-2 duration-200 ease-in-out">
      <div className="flex w-full items-center justify-between bg-card text-card-foreground p-2 rounded-lg shadow-sm border border-border overflow-x-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap min-w-max">
          <span className="text-sm font-medium mr-2 px-2">{selectedCount} selecionados</span>
          
          <Button variant="ghost" size="sm" onClick={selectAll} className="gap-2 h-8 px-2 sm:px-3">
            <CheckSquare className="h-4 w-4" /> <span className="hidden sm:inline">Selecionar tudo</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-2 h-8 px-2 sm:px-3">
            <XSquare className="h-4 w-4" /> <span className="hidden sm:inline">Limpar</span>
          </Button>
          
          <Separator orientation="vertical" className="h-5 mx-1" />
          
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
    </div>
  );
}
