"use client";
import { useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SmartCreateButton } from "@/components/items/create-button";
import TagChips from "@/components/items/tag-chips";
import { Input } from "@/components/ui/input";

export default function NotesPage() {
  const { fetchNotes, notes } = useNotes();
  const { fetchFolders, folders } = useFolders();
  const userId = "user_teste_123";

  useEffect(() => {
    fetchNotes(userId);
    fetchFolders(userId);
  }, [fetchNotes, fetchFolders, userId]);

  return (
    <main>
      <div className="w-full pb-3 flex flex-col items-start gap-1">
        <Input placeholder="Buscar nota..." />
        <TagChips value={"undefined"} onChange={() => {}} />
      </div>
      <SmartCreateButton userId={userId} />
      <ItemsBentoGrid notes={notes} folders={folders} />
    </main>
  );
}
