"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotes } from "@/hooks/use-notes";
import { useNoteStore } from "@/store/noteStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { Button } from "@/components/ui/button";
import { useId } from "@/utils/searchParams";
import Tiptap from "@/components/tiptap/TipTap";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Content } from "@tiptap/react";

export default function NotePage() {
  const router = useRouter();
  const noteId = useId();

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
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl">

        <div className="mt-8">
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
              <div className="mt-8">
                <Tiptap content={note.content || ""} onChange={handleUpdate} />
              </div>
            )
          ) : (
            <div className="mt-6 rounded-2xl border bg-card p-12 text-center shadow-sm">
              <div className="text-3xl mb-4">🔒</div>
              <p className="text-lg font-medium text-muted-foreground">Conteúdo protegido por senha.</p>
              <Button variant="secondary" className="mt-4" onClick={() => setUnlockOpen(true)}>
                Desbloquear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-sm transition-all hover:bg-background">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="text-muted-foreground">Salvando...</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">Sincronizado</span>
          </>
        )}
        {saveStatus === "error" && (
          <>
            <AlertCircle className="h-3 w-3 text-destructive" />
            <span className="text-destructive">Erro ao salvar</span>
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
    </main>
  );
}
