"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotes } from "@/hooks/use-notes";
import { useNoteStore } from "@/store/noteStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { Button } from "@/components/ui/button";
import { useId } from "@/utils/searchParams";
import Tiptap from "@/components/tiptap/TipTap";

export default function NotePage() {
  const router = useRouter();
  const noteId = useId();

  const { user } = useAuthStore();
  const userId = user?.uid ?? "";

  const { notes, isLoading } = useNotes(userId);
  const unlockedNotes = useNoteStore((s) => s.unlockedNotes);

  const note = useMemo(
    () => (noteId ? (notes.find((n) => n.id === noteId) ?? null) : null),
    [noteId, notes],
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
                <Tiptap content={note.content || ""} />
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
