"use client";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SelectionProvider } from "@/components/hub/selection-context";
import { SelectionActionBar } from "@/components/hub/selection-action-bar";
import { useAuthStore } from "@/store/authStore";

export default function ArchivedClientPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { notes } = useNotes(userId);
  const { folders } = useFolders(userId);

  const archivedNotes = notes.filter((n) => n.archived && !n.trashed);
  const archivedFolders = folders.filter((f) => f.archived && !f.trashed);

  return (
    <SelectionProvider>
      <main>
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold">Itens Arquivados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seus itens arquivados não aparecem na tela inicial.
          </p>
          <SelectionActionBar />
        </div>
        <ItemsBentoGrid notes={archivedNotes} folders={archivedFolders} />
      </main>
    </SelectionProvider>
  );
}
