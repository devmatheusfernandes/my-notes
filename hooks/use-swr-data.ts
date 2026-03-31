import useSWR from "swr";
import { noteService } from "@/services/noteService";
import { folderService } from "@/services/folderService";
import { tagService } from "@/services/tagService";

// Fetcher functions using existing services
const notesFetcher = (userId: string) => noteService.getNotesByUser(userId);
const foldersFetcher = (userId: string) => folderService.getFoldersByUser(userId);
const tagsFetcher = (userId: string) => tagService.getTagsByUser(userId);

export function useNotesSWR(userId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? [`notes`, userId] : null,
    ([, id]) => notesFetcher(id),
    {
      revalidateOnFocus: false, // Opcional: para evitar refreshes excessivos
      dedupingInterval: 10000, // 10 segundos
    },
  );

  return {
    notes: data || [],
    isLoading,
    isError: error,
    mutateNotes: mutate,
  };
}

export function useFoldersSWR(userId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? [`folders`, userId] : null,
    ([, id]) => foldersFetcher(id),
  );

  return {
    folders: data || [],
    isLoading,
    isError: error,
    mutateFolders: mutate,
  };
}

export function useTagsSWR(userId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? [`tags`, userId] : null,
    ([, id]) => tagsFetcher(id),
  );

  return {
    tags: data || [],
    isLoading,
    isError: error,
    mutateTags: mutate,
  };
}
