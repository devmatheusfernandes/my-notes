"use client";

import dynamic from 'next/dynamic';
import { useNotes } from '@/hooks/use-notes';
import { useTags } from '@/hooks/use-tags';
import { useAuthStore } from '@/store/authStore';
import { buildGraphData } from '@/lib/notes/graph-utils';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageContainerVariants, itemFadeInUpVariants } from '@/lib/animations';
import Header from '@/components/hub/hub-header';
import { Loading } from '@/components/ui/loading';

// Dynamically import GraphView because it uses browser-only APIs (Canvas/Bodymovin/ForceGraph)
const GraphView = dynamic(() => import('@/components/graph/notes-graph-view'), {
  ssr: false,
  loading: () => (
    <Loading />
  ),
});

export default function GraphPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? "";

  const { notes, isLoading: notesLoading } = useNotes(userId);
  const { tags, isLoading: tagsLoading } = useTags(userId);

  const graphData = useMemo(() => {
    if (notesLoading || tagsLoading) return { nodes: [], links: [] };
    return buildGraphData(notes, tags);
  }, [notes, tags, notesLoading, tagsLoading]);

  return (
    <>
      <Header showBreadcrumb={false} scrollSearch={false} showSearch={false} />
      <motion.main
        className="page-container"
        variants={pageContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemFadeInUpVariants} className="mb-8">
          <h1 className="page-title">Grafo de Notas</h1>
          <p className="page-description">
            Visualize as conexões entre seus pensamentos através de um grafo interativo.
          </p>
        </motion.div>

        <motion.div variants={itemFadeInUpVariants} className="flex-1 w-full relative overflow-hidden min-h-[500px]">
          {notesLoading || tagsLoading ? (
            <Loading />
          ) : (
            <GraphView data={graphData} />
          )}
        </motion.div>
      </motion.main>
    </>
  );
}
