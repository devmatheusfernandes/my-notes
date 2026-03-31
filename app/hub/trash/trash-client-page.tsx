"use client";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";
import { ItemsBentoGrid } from "@/components/items/bento-grid";
import { SelectionProvider } from "@/components/hub/selection-context";
import { SelectionActionBar } from "@/components/hub/selection-action-bar";
import { useAuthStore } from "@/store/authStore";

import { motion } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";

export default function TrashClientPage() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const { notes } = useNotes(userId);
  const { folders } = useFolders(userId);

  const trashedNotes = notes.filter((n) => n.trashed);
  const trashedFolders = folders.filter((f) => f.trashed);

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
          <h1 className="page-title">Lixeira</h1>
          <p className="page-description">
            Itens na lixeira podem ser excluídos permanentemente ou restaurados.
          </p>
          <SelectionActionBar />
        </motion.div>
        
        <motion.div variants={itemFadeInUpVariants}>
          <ItemsBentoGrid notes={trashedNotes} folders={trashedFolders} />
        </motion.div>
      </motion.main>
    </SelectionProvider>
  );
}
