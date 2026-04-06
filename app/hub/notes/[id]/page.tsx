"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotes } from "@/hooks/use-notes";
import { useNoteStore } from "@/store/noteStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { Button } from "@/components/ui/button";
import { useId } from "@/utils/searchParams";
import { SimpleEditor } from "@/components/tiptap-editor/simple-editor";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Content } from "@tiptap/react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ReferenceSidebar } from "@/components/tiptap-ui/reference-sidebar";

export default function NotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = useId();
  const highlightTerm = searchParams.get("h") || undefined;

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";

  const { notes, isLoading, updateNote } = useNotes(userId);
  const unlockedNotes = useNoteStore((s) => s.unlockedNotes);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const note = useMemo(
    () => (noteId ? (notes.find((n) => n.id === noteId) ?? null) : null),
    [noteId, notes],
  );

  const handleUpdate = useCallback(
    async ({ json, text }: { json: Content; text: string }) => {
      setSaveStatus("saving");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (noteId) {
            await updateNote(noteId, {
              content: json,
              searchText: text,
            });
            setSaveStatus("saved");
          }
        } catch {
          setSaveStatus("error");
        }
      }, 1500);
    },
    [noteId, updateNote]
  );
  
  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      setSaveStatus("saving");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (noteId) {
            await updateNote(noteId, {
              title: newTitle,
            });
            setSaveStatus("saved");
          }
        } catch {
          setSaveStatus("error");
        }
      }, 1500);
    },
    [noteId, updateNote]
  );

  const isUnlockedInSession = !!noteId && unlockedNotes.has(noteId);
  const isBlocked = !!note?.isLocked && !isUnlockedInSession;

  const [unlockOpen, setUnlockOpen] = useState(isBlocked);

  useEffect(() => {
    setUnlockOpen(isBlocked);
  }, [isBlocked]);

  if (!noteId) {
    return (
      <main className="w-full">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push("/hub/items")}>
            Voltar
          </Button>
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          Nota não encontrada.
        </div>
      </main>
    );
  }

  if (!note) {
    return (
      <main className="w-full">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push("/hub/items")}>
            Voltar
          </Button>
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          {isLoading ? "Carregando nota..." : "Nota não encontrada."}
        </div>
      </main>
    );
  }

  return (
    <SidebarLayout sidebarContent={<ReferenceSidebar />}>
      {!isBlocked ? (
        note.type === "pdf" ? (
          note.fileUrl ? (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" asChild>
                  <a href={note.fileUrl} target="_blank" rel="noreferrer">
                    Abrir PDF
                  </a>
                </Button>
                <Button asChild>
                  <a href={note.fileUrl} target="_blank" rel="noreferrer">
                    Baixar
                  </a>
                </Button>
              </div>
              <iframe
                title={note.title || "PDF"}
                src={note.fileUrl}
                className="h-[80vh] w-full rounded-2xl border bg-card shadow-lg"
              />
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
              PDF sem arquivo.
            </div>
          )
        ) : (
          <SimpleEditor
            content={note.content || ""}
            title={note.title || ""}
            userId={userId}
            onChange={handleUpdate}
            onTitleChange={handleTitleChange}
            highlightTerm={highlightTerm}
          />
        )
      ) : (
        <div className="max-w-2xl mx-auto mt-12 px-4">
          <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
            <div className="text-3xl mb-4">🔒</div>
            <p className="text-lg font-medium text-muted-foreground">Conteúdo protegido por senha.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setUnlockOpen(true)}>
              Desbloquear
            </Button>
          </div>
        </div>
      )}

      {/* Sync Status Indicator */}
      <div className="fixed top-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 flex items-center gap-2 rounded-full border bg-background/80 p-2 sm:px-4 sm:py-2 text-xs font-medium shadow-lg backdrop-blur-sm transition-all hover:bg-background z-[100]">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="hidden sm:inline text-muted-foreground line-clamp-1">Salvando...</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCircle2 className="h-4 w-4 sm:h-3 sm:w-3 text-green-500" />
            <span className="hidden sm:inline text-muted-foreground line-clamp-1">Sincronizado</span>
          </>
        )}
        {saveStatus === "error" && (
          <>
            <AlertCircle className="h-4 w-4 sm:h-3 sm:w-3 text-destructive" />
            <span className="hidden sm:inline text-destructive line-clamp-1">Erro ao salvar</span>
          </>
        )}
      </div>

      <UnlockDrawer
        open={unlockOpen}
        onOpenChange={(open) => {
          if (open) {
            setUnlockOpen(true);
            return;
          }
          router.push("/hub/items");
        }}
        item={{ kind: "note", id: noteId }}
        onUnlocked={() => {
          setUnlockOpen(false);
        }}
      />
    </SidebarLayout>
  );
}
