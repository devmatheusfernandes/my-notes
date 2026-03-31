"use client";
import { useMemo } from "react";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SelectionProvider } from "@/components/hub/selection-context";
import { SelectionActionBar } from "@/components/hub/selection-action-bar";
import { useAuthStore } from "@/store/authStore";
import { useNotesSearch } from "@/hooks/use-notes-search";
import Header from "@/components/hub/hub-header";

import { motion } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";

export default function ArchivedClientPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { notes } = useNotes(userId);
  const { folders } = useFolders(userId);

  const archivedNotes = useMemo(() => notes.filter((n) => n.archived && !n.trashed), [notes]);
  const archivedFolders = useMemo(() => folders.filter((f) => f.archived && !f.trashed), [folders]);

  const { searchQuery, setSearchQuery, filteredNotes } = useNotesSearch(archivedNotes);

  const displayedFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return archivedFolders;
    return archivedFolders.filter((f) => (f.title ?? "").toLowerCase().includes(query));
  }, [archivedFolders, searchQuery]);

  return (
    <SelectionProvider>
      <Header
        scrollSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showBreadcrumb={false}
      />
      <motion.main
        className="page-container"
        variants={pageContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemFadeInUpVariants}
          className="w-full mb-6"
        >
          <SelectionActionBar />
        </motion.div>

        <motion.div variants={itemFadeInUpVariants}>
          <ItemsBentoGrid notes={filteredNotes} folders={displayedFolders} searchQuery={searchQuery} />
        </motion.div>
      </motion.main>
    </SelectionProvider>
  );
}
