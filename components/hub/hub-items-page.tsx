"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SmartCreateButton } from "@/components/items/create-button";
import { Input } from "@/components/ui/input";
import { SelectionProvider } from "@/components/hub/selection-context";
import { useAuthStore } from "@/store/authStore";
import HubBreadcrumb from "./hub-breadcrumb";
import { useNotesSearch } from "@/hooks/use-notes-search";
import { SearchX } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useFolderId } from "@/utils/searchParams";
import { useFolderStore } from "@/store/folderStore";
import { UnlockDrawer } from "@/components/modals/unlock-drawer";
import { useRouter } from "next/navigation";
import { SelectionActionBar } from "./selection-action-bar";

function LockedFolderGate({ folderId }: { folderId: string }) {
  const router = useRouter();
  const [unlockOpen, setUnlockOpen] = useState(true);

  return (
    <>
      <div className="mt-6 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Pasta trancada. Destranque para acessar o conteúdo.
      </div>
      <UnlockDrawer
        open={unlockOpen}
        onOpenChange={(open) => {
          if (open) {
            setUnlockOpen(true);
            return;
          }

          setUnlockOpen(false);
          router.push("/hub/items");
        }}
        item={{ kind: "folder", id: folderId }}
        onUnlocked={() => {}}
      />
    </>
  );
}

export default function HubItemsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { fetchNotes, notes } = useNotes();
  const { fetchFolders, folders } = useFolders();
  const folderId = useFolderId();
  const unlockedFolders = useFolderStore((s) => s.unlockedFolders);

  const lastFetchedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const isNewUser = lastFetchedUserIdRef.current !== userId;
    if (isNewUser) {
      lastFetchedUserIdRef.current = userId;
      fetchNotes(userId).catch(() => {});
      fetchFolders(userId).catch(() => {});
      return;
    }

    if (notes.length === 0) fetchNotes(userId).catch(() => {});
    if (folders.length === 0) fetchFolders(userId).catch(() => {});
  }, [fetchFolders, fetchNotes, folders.length, notes.length, userId]);

  const activeNotes = useMemo(() => {
    return notes.filter((n) => !n.archived && !n.trashed);
  }, [notes]);

  const activeFolders = useMemo(() => {
    return folders.filter((f) => !f.archived && !f.trashed);
  }, [folders]);

  const currentFolder = useMemo(() => {
    if (!folderId) return null;
    return activeFolders.find((f) => f.id === folderId) ?? null;
  }, [activeFolders, folderId]);

  const isFolderUnlockedInSession = useMemo(() => {
    if (!folderId) return false;
    return unlockedFolders.has(folderId);
  }, [folderId, unlockedFolders]);

  const isFolderBlocked = useMemo(() => {
    return (
      !!folderId && !!currentFolder?.isLocked && !isFolderUnlockedInSession
    );
  }, [currentFolder?.isLocked, folderId, isFolderUnlockedInSession]);

  const { searchQuery, setSearchQuery, filteredNotes } =
    useNotesSearch(activeNotes);

  const normalizedQuery = useMemo(() => {
    return searchQuery.trim().toLowerCase();
  }, [searchQuery]);

  const hasQuery = normalizedQuery.length > 0;

  const displayedFolders = useMemo(() => {
    if (!hasQuery) return activeFolders;
    return activeFolders.filter((f) => {
      return (f.title ?? "").toLowerCase().includes(normalizedQuery);
    });
  }, [activeFolders, hasQuery, normalizedQuery]);

  const shouldShowEmptyResults =
    hasQuery && filteredNotes.length === 0 && displayedFolders.length === 0;

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
          <SelectionActionBar />
        </div>
        <SmartCreateButton />
        {isFolderBlocked && folderId ? (
          <LockedFolderGate key={folderId} folderId={folderId} />
        ) : shouldShowEmptyResults ? (
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
          <ItemsBentoGrid notes={filteredNotes} folders={displayedFolders} />
        )}
      </main>
    </SelectionProvider>
  );
}
