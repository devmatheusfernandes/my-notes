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
      await indexedDbService.deletePublication(symbol);
      refresh();
      toast.success("Publicação removida.");
    } catch (err) {
      getErrorMessage(err);
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
