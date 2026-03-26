"use client";

import { useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SelectionProvider } from "@/components/hub/selection-context";
import { SelectionActionBar } from "@/components/hub/selection-action-bar";
import { useAuthStore } from "@/store/authStore";

export default function TrashClientPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { fetchNotes, notes } = useNotes();
  const { fetchFolders, folders } = useFolders();

  useEffect(() => {
    fetchNotes(userId);
    fetchFolders(userId);
  }, [fetchNotes, fetchFolders, userId]);

  const trashedNotes = notes.filter((n) => n.trashed);
  const trashedFolders = folders.filter((f) => f.trashed);

  return (
    <SelectionProvider>
      <main>
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold text-destructive">Lixeira</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Itens na lixeira podem ser excluídos permanentemente ou restaurados.
          </p>
          <SelectionActionBar />
        </div>
        <ItemsBentoGrid notes={trashedNotes} folders={trashedFolders} />
      </main>
    </SelectionProvider>
  );
}
