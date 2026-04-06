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
      
      // Re-import protection: check if exists
      const existingSymbols = await indexedDbService.listPublications();
      if (existingSymbols.includes(pub.symbol)) {
        const confirm = await new Promise<boolean>((resolve) => {
          toast.warning(`A publicação "${pub.symbol}" já está instalada.`, {
            description: "Deseja reinstalar? Isso consumirá créditos de IA para gerar novos embeddings.",
            duration: Infinity,
            action: {
              label: "Reinstalar",
              onClick: () => resolve(true),
            },
            cancel: {
              label: "Cancelar",
              onClick: () => resolve(false),
            },
            onDismiss: () => resolve(false),
          });
        });

        if (!confirm) {
          setIsProcessing(false);
          return null;
        }
      }

      await indexedDbService.savePublication(pub);
      
      // Sync chapters to Turso - only if not already there
      const allChapters = pub.chapters.map(ch => ({
        sourceId: `${pub.symbol}-${ch.id}`,
        sourceType: "publication" as const, 
        content: `${pub.title} - ${ch.title}\n${ch.paragraphs.map(p => p.content).join("\n")}`,
      }));

      // Check which ones are already in the cloud
      const checkResponse = await fetch("/api/sync/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: pub.symbol, sourceType: "publication" })
      });

      let chaptersToSync = allChapters;
      if (checkResponse.ok) {
        const { existingSourceIds } = await checkResponse.json();
        if (Array.isArray(existingSourceIds)) {
            chaptersToSync = allChapters.filter(ch => !existingSourceIds.includes(ch.sourceId));
        }
      }

      if (chaptersToSync.length > 0) {
        const syncResponse = await fetch("/api/sync/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: chaptersToSync })
        });

        if (!syncResponse.ok) {
          throw new Error("Falha ao sincronizar capítulos com a nuvem.");
        }
      }

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
      
      if (!pub) return;

      toast.promise(async () => {
        // 1. Remove from cloud first to ensure it's done before local is gone
        const chapterIds = pub.chapters.map(ch => `${pub.symbol}-${ch.id}`);
        const response = await fetch("/api/sync/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              sourceIds: chapterIds,
              sourceType: "publication",
          })
        });

        if (!response.ok) {
          throw new Error("Erro ao limpar dados na nuvem.");
        }

        // 2. Remove locally (including images, handled inside indexedDbService)
        await indexedDbService.deletePublication(symbol);
        
        refresh();
      }, {
        loading: `Removendo ${symbol}...`,
        success: "Publicação removida com sucesso.",
        error: (err) => `Erro ao remover: ${getErrorMessage(err)}`
      });

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
