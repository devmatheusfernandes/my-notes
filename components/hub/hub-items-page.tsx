"use client";

import { useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SmartCreateButton } from "@/components/items/create-button";
import TagChips from "@/components/items/tag-chips";
import { Input } from "@/components/ui/input";
import { SelectionProvider } from "@/components/hub/selection-context";
import { SelectionActionBar } from "@/components/hub/selection-action-bar";

export default function HubItemsPage({
  userId = "user_teste_123",
}: {
  userId?: string;
}) {
  const { fetchNotes, notes } = useNotes();
  const { fetchFolders, folders } = useFolders();

  useEffect(() => {
    fetchNotes(userId);
    fetchFolders(userId);
  }, [fetchNotes, fetchFolders, userId]);

  return (
    <SelectionProvider>
      <main>
        <div className="w-full mb-3 flex flex-col justify-start items-start gap-2">
          <Input placeholder="Buscar nota..." className="mb-1" />
          <TagChips value={"undefined"} onChange={() => { }} />
          <SelectionActionBar />
        </div>
        <SmartCreateButton userId={userId} />
        <ItemsBentoGrid notes={notes} folders={folders} />
      </main>
    </SelectionProvider>
  );
}
