"use client";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SelectionProvider } from "@/components/hub/selection-context";
import { SelectionActionBar } from "@/components/hub/selection-action-bar";
import { useAuthStore } from "@/store/authStore";

import { motion } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";

export default function ArchivedClientPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { notes } = useNotes(userId);
  const { folders } = useFolders(userId);

  const archivedNotes = notes.filter((n) => n.archived && !n.trashed);
  const archivedFolders = folders.filter((f) => f.archived && !f.trashed);

  return (
    <SelectionProvider>
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
          <h1 className="page-title">Itens Arquivados</h1>
          <p className="page-description">
            Seus itens arquivados não aparecem na tela inicial.
          </p>
          <SelectionActionBar />
        </motion.div>
        
        <motion.div variants={itemFadeInUpVariants}>
          <ItemsBentoGrid notes={archivedNotes} folders={archivedFolders} />
        </motion.div>
      </motion.main>
    </SelectionProvider>
  );
}
