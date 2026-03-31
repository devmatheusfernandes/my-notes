"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotes } from "@/hooks/use-notes";
import { useNoteStore } from "@/store/noteStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { Button } from "@/components/ui/button";
import { useId } from "@/utils/searchParams";

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

  const contentText =
    typeof note.content === "string"
      ? note.content
      : note.content
        ? JSON.stringify(note.content, null, 2)
        : "";

  return (
    <main className="w-full">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push("/hub/items")}>
          Voltar
        </Button>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold">
          {note.title || "Sem Título"}{" "}
          {note.pinned ? <span className="text-base">📌</span> : null}
          {note.isLocked ? <span className="ml-1 text-base">🔒</span> : null}
        </h1>
        {!isBlocked ? (
          note.type === "pdf" ? (
            note.fileUrl ? (
              <div className="mt-4 flex flex-col gap-3">
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
                  className="h-[75vh] w-full rounded-xl border bg-card"
                />
              </div>
            ) : (
              <div className="mt-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                PDF sem arquivo.
              </div>
            )
          ) : (
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border bg-card p-4 text-sm text-foreground">
              {contentText || "Nota vazia..."}
            </pre>
          )
        ) : (
          <div className="mt-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            Conteúdo protegido.
          </div>
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
