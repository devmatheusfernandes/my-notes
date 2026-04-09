import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface SyncedItem {
  sourceId: string;
  sourceType: "note" | "video" | "publication";
}

export function useVectorStatus() {
  const { user } = useAuthStore();
  const userId = user?.uid;

  const { data, error, isLoading, mutate } = useSWR(
    userId ? "/api/vector/synced-ids" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const syncedItems: SyncedItem[] = data?.syncedItems || [];

  const isVectorized = (id: string, type: "note" | "video" | "publication") => {
    if (type === "publication") {
      // For publications, any content starting with symbols- indicates it's vectorized
      return syncedItems.some(item => item.sourceType === "publication" && item.sourceId.startsWith(`${id}-`));
    }
    return syncedItems.some((item) => item.sourceId === id && item.sourceType === type);
  };

  return {
    syncedItems,
    isVectorized,
    isLoading,
    error,
    mutate,
  };
}
