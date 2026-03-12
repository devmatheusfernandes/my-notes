"use client";
import { useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SmartCreateButton } from "@/components/items/create-button";

export default function FolderPage() {
  const { fetchNotes, notes } = useNotes();
  const { fetchFolders, folders } = useFolders();
  const userId = "user_teste_123";

  useEffect(() => {
    fetchNotes(userId);
    fetchFolders(userId);
  }, [fetchFolders, fetchNotes, userId]);

  return (
    <main>
      <SmartCreateButton userId={userId} />
      <ItemsBentoGrid notes={notes} folders={folders} />
    </main>
  );
}
