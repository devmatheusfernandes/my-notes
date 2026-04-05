import { useState, useCallback } from "react";
import useSWR from "swr";
import { jwpubService } from "@/services/jwpubService";
import { indexedDbService } from "@/services/indexedDbService";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/getErrorMessage";

const CACHE_KEY = "jwpub_publications";

export function useJwpub() {
  const { data: symbols, mutate: mutateSymbols } = useSWR("jwpub_symbols", () => indexedDbService.listPublications());
  const { data: publications, isLoading, mutate: mutatePubs } = useSWR(CACHE_KEY, () => indexedDbService.getPublicationsMetadata());

  const [isProcessing, setIsProcessing] = useState(false);

  const refresh = useCallback(() => {
    mutateSymbols();
    mutatePubs();
  }, [mutateSymbols, mutatePubs]);

  const uploadJwpub = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const pub = await jwpubService.processFile(file);
      await indexedDbService.savePublication(pub);
      
      // Sync chapters to Turso
      const chaptersToSync = pub.chapters.map(ch => ({
        sourceId: `${pub.symbol}-${ch.id}`,
        sourceType: "note" as const, // JWPUB chapters are treated like notes for embedding
        content: `${pub.title} - ${ch.title}\n${ch.paragraphs.map(p => p.content).join("\n")}`,
      }));

      fetch("/api/sync/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chaptersToSync })
      }).catch(err => console.error("Erro ao sincronizar capítulos JWPUB:", err));

      refresh();
      toast.success(`Publicação ${pub.symbol} carregada com sucesso!`);
      return pub;
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("Failed to upload JWPUB:", err);
      toast.error(message || "Falha ao processar arquivo JWPUB.");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [refresh]);

  const getPublication = useCallback(async (symbol: string) => {
    return await indexedDbService.getPublication(symbol);
  }, []);

  const deletePublication = useCallback(async (symbol: string) => {
    try {
      const pub = await indexedDbService.getPublication(symbol);
      
      await indexedDbService.deletePublication(symbol);
      
      if (pub) {
        const chapterIds = pub.chapters.map(ch => `${pub.symbol}-${ch.id}`);
        fetch("/api/sync/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              sourceIds: chapterIds,
              sourceType: "note",
          })
        }).catch(err => console.error("Erro ao remover capítulos do índice:", err));
      }

      refresh();
      toast.success("Publicação removida.");
    } catch (err) {
      console.error("Erro ao remover publicação:", err);
      toast.error("Erro ao remover publicação.");
    }
  }, [refresh]);

  return {
    symbols,
    publications,
    isLoading,
    isProcessing,
    uploadJwpub,
    getPublication,
    deletePublication,
    refresh
  };
}
