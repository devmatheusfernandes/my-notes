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
import { useAuthStore } from "@/store/authStore";
import HubBreadcrumb from "./hub-breadcrumb";

export default function HubItemsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { fetchNotes, notes } = useNotes();
  const { fetchFolders, folders } = useFolders();

  useEffect(() => {
    fetchNotes(userId);
    fetchFolders(userId);
  }, [fetchNotes, fetchFolders, userId]);

  const activeNotes = notes.filter((n) => !n.archived && !n.trashed);
  const activeFolders = folders.filter((f) => !f.archived && !f.trashed);

  return (
    <SelectionProvider>
      <main>
        <div className="w-full mb-3 flex flex-col justify-start items-start gap-2">
          <HubBreadcrumb />
          <Input placeholder="Buscar nota..." className="mb-1" />
          <TagChips value={"undefined"} onChange={() => { }} />
          <SelectionActionBar />
        </div>
        <SmartCreateButton />
        <ItemsBentoGrid notes={activeNotes} folders={activeFolders} />
      </main>
    </SelectionProvider>
  );
}
