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
import { MoreVertical } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { toast } from "sonner";
import { useState } from "react";
import { useNoteStore } from "@/store/noteStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { useAuthStore } from "@/store/authStore";
import { useSettings } from "@/hooks/use-settings";
import { storageService } from "@/services/storageService";

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
  const { settings, fetchSettings } = useSettings();
  const { unlockedNotes, lockNote } = useNoteStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUnlockDrawerOpen, setIsUnlockDrawerOpen] = useState(false);

  const isSelected = selectedNoteIds.has(note.id);
  const isUnlockedInSession = unlockedNotes.has(note.id);
  const isMasked = note.isLocked && !isUnlockedInSession;

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

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <article
            onClick={handleClick}
            {...longPressProps}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-pointer min-h-[160px]",
              "bg-card border shadow-sm hover:shadow-md hover:border-border/80",
              isSelected
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/40",
              isDeleting ? "opacity-50 pointer-events-none" : "",
              className,
            )}
          >
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

            {/* Conteúdo da Nota */}
            <div className="flex flex-col gap-2 mb-4">
              <h3 className="text-base font-semibold leading-tight tracking-tight text-foreground pr-8 line-clamp-2">
                {note.title || "Sem Título"}{" "}
                {note.pinned ? <span className="text-sm">📌</span> : null}
                {note.isLocked ? (
                  <span className="ml-1 text-sm">🔒</span>
                ) : null}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed text-muted-foreground line-clamp-4",
                  isMasked ? "select-none blur-sm" : "",
                )}
              >
                {isMasked
                  ? "Conteúdo protegido..."
                  : note.searchText ||
                    (typeof note.content === "string" ? note.content : "") ||
                    "Nenhuma prévia disponível..."}
              </p>
            </div>

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
