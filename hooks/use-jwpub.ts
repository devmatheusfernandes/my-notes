import { useState, useCallback } from "react";
import useSWR from "swr";
import { jwpubService } from "@/services/jwpubService";
import { indexedDbService } from "@/services/indexedDbService";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { JwpubPublication, JwpubChapter } from "@/schemas/jwpubSchema";

const CACHE_KEY = "jwpub_publications";

export function useJwpub() {
  const { data: symbols, mutate: mutateSymbols } = useSWR("jwpub_symbols", () => indexedDbService.listPublications());
  const { data: publications, isLoading, mutate: mutatePubs } = useSWR(CACHE_KEY, () => indexedDbService.getPublicationsMetadata());
  const { data: remoteData, mutate: mutateRemote } = useSWR<{ symbols: string[] }>("/api/sync/publications", (url: string) => fetch(url).then(res => res.json()));

  const [processingSymbol, setProcessingSymbol] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const refresh = useCallback(() => {
    mutateSymbols();
    mutatePubs();
    mutateRemote();
  }, [mutateSymbols, mutatePubs, mutateRemote]);

  const uploadJwpub = useCallback(async (file: File) => {
    setProcessingSymbol("upload");
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
          setProcessingSymbol(null);
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
      setProcessingSymbol(null);
    }
  }, [refresh]);

  const importFromCloud = useCallback(async (symbol: string) => {
    setProcessingSymbol(symbol);
    setDownloadProgress(0);
    try {
      // 1. Get metadata/skeleton
      const infoRes = await fetch(`/api/sync/publications/${symbol}?info=true`);
      if (!infoRes.ok) throw new Error("Falha ao obter metadados da nuvem.");
      const info = await infoRes.json();
      
      const { chapterIds, title } = info;
      const total = chapterIds.length;
      
      const fullPub: JwpubPublication = {
        symbol,
        title,
        chapters: [] as JwpubChapter[],
        lastAccessed: new Date().toISOString()
      };

      const CHUNK_SIZE = 25;
      for (let i = 0; i < chapterIds.length; i += CHUNK_SIZE) {
        const chunkIds = chapterIds.slice(i, i + CHUNK_SIZE);
        const chunkRes = await fetch(`/api/sync/publications/${symbol}?ids=${chunkIds.join(",")}`);
        if (!chunkRes.ok) throw new Error("Falha ao baixar capítulos da nuvem.");
        
        const chunkData = await chunkRes.json();
        fullPub.chapters.push(...chunkData.chapters);
        
        const progress = Math.round(((i + chunkIds.length) / total) * 100);
        setDownloadProgress(progress);
        
        // Save intermediate progress to IndexedDB
        await indexedDbService.savePublication(fullPub);
      }
      
      refresh();
      toast.success(`Publicação ${symbol} recuperada da nuvem!`);
      return fullPub;
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message || "Falha ao baixar da nuvem.");
      throw err;
    } finally {
      setProcessingSymbol(null);
      setDownloadProgress(0);
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
    remoteSymbols: remoteData?.symbols || [],
    isLoading: isLoading || (!remoteData && !publications),
    isProcessing: !!processingSymbol,
    processingSymbol,
    downloadProgress,
    uploadJwpub,
    importFromCloud,
    getPublication,
    deletePublication,
    refresh
  };
}
