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
import { useNotesSearch } from "@/hooks/use-notes-search";
import { SearchX } from "lucide-react";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

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

  const { searchQuery, setSearchQuery, sortedNotes } = useNotesSearch(activeNotes);

  const displayedFolders = activeFolders.filter((f) => {
    if (!searchQuery.trim()) return true;
    return f.title?.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  return (
    <SelectionProvider>
      <main>
        <div className="w-full mb-3 flex flex-col justify-start items-start gap-2">
          <HubBreadcrumb />
          <Input 
            placeholder="Buscar nota ou pasta..." 
            className="mb-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <TagChips value={"undefined"} onChange={() => { }} />
          <SelectionActionBar />
        </div>
        <SmartCreateButton />
        {searchQuery.trim() !== "" && sortedNotes.length === 0 && displayedFolders.length === 0 ? (
          <Empty className="mt-8 border-none">
            <EmptyContent>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>Nenhum resultado encontrado</EmptyTitle>
              <EmptyDescription>
                Sua busca por &quot;{searchQuery}&quot; não retornou resultados.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ItemsBentoGrid notes={sortedNotes} folders={displayedFolders} />
        )}
      </main>
    </SelectionProvider>
  );
}
