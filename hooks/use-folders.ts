import { useCallback } from "react";
import { useFolderStore } from "@/store/folderStore";
import { folderService } from "@/services/folderService";
import { CreateFolderDTO } from "@/schemas/folderSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useFolders() {
  const {
    folders,
    isLoading,
    error,
    setFolders,
    addFolder,
    removeFolder,
    setLoading,
    setError,
  } = useFolderStore();

  const fetchFolders = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);

      try {
        const fetchedFolders = await folderService.getFoldersByUser(userId);
        setFolders(fetchedFolders);
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [setFolders, setLoading, setError],
  );

  const createFolder = async (userId: string, data: CreateFolderDTO) => {
    setLoading(true);
    setError(null);

    try {
      const newFolder = await folderService.createFolder(userId, data);
      addFolder(newFolder);
      return newFolder;
    } catch (error) {
      const secureMessage = getErrorMessage(error);
      setError(secureMessage);
      throw new Error(secureMessage);
    } finally {
      setLoading(false);
    }
  };
  const deleteFolder = async (folderId: string) => {
    setLoading(true);
    setError(null);

    try {
      await folderService.deleteFolder(folderId);
      removeFolder(folderId);
    } catch (error) {
      const secureMessage = getErrorMessage(error);
      setError(secureMessage);
      throw new Error(secureMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    folders,
    isLoading,
    error,
    fetchFolders,
    createFolder,
    deleteFolder,
  };
}
