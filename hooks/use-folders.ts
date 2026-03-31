import { useCallback, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { folderService } from "@/services/folderService";
import { CreateFolderDTO, Folder } from "@/schemas/folderSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useFolderStore } from "@/store/folderStore";

export function useFolders(userId?: string) {
  const { mutate } = useSWRConfig();
  const cacheKey = useMemo(() => (userId ? ["folders", userId] : null), [userId]);

  const { data: folders = [], error: swrError, isLoading: swrLoading } = useSWR<Folder[]>(
    cacheKey,
    () => folderService.getFoldersByUser(userId!)
  );

  const { error: storeError, isLoading: storeLoading, setError, setLoading } = useFolderStore();

  const isLoading = swrLoading || storeLoading;
  const error = swrError ? getErrorMessage(swrError) : storeError;

  const fetchFolders = useCallback(async () => {
    if (!cacheKey) return;
    await mutate(cacheKey);
  }, [cacheKey, mutate]);

  const createFolder = useCallback(
    async (folderUserId: string, data: CreateFolderDTO) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      const optimisticFolder: Folder = {
        title: data.title || "Nova Pasta",
        id: "temp-" + Date.now(),
        userId: folderUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: data.archived || false,
        trashed: data.trashed || false,
        isLocked: data.isLocked || false,
        parentId: data.parentId,
        color: data.color,
      };

      try {
        await mutate(
          cacheKey,
          async () => {
            const newFolder = await folderService.createFolder(folderUserId, data);
            return [newFolder, ...folders];
          },
          {
            optimisticData: [optimisticFolder, ...folders],
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
        throw new Error(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, mutate, folders, setError, setLoading]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      try {
        await mutate(
          cacheKey,
          async () => {
            await folderService.deleteFolder(folderId);
            return folders.filter((f) => f.id !== folderId);
          },
          {
            optimisticData: folders.filter((f) => f.id !== folderId),
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
        throw new Error(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, mutate, folders, setError, setLoading]
  );

  const updateFolderStore = useCallback(
    async (folderId: string, data: Partial<Folder>) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      try {
        await mutate(
          cacheKey,
          async () => {
            await folderService.updateFolder(folderId, data);
            return folders.map((f) => (f.id === folderId ? { ...f, ...data, updatedAt: new Date().toISOString() } : f));
          },
          {
            optimisticData: folders.map((f) => (f.id === folderId ? { ...f, ...data } : f)),
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
        throw new Error(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, mutate, folders, setError, setLoading]
  );

  return {
    folders,
    isLoading,
    error,
    fetchFolders,
    createFolder,
    deleteFolder,
    updateFolder: updateFolderStore,
  };
}

