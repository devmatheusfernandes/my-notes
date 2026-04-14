import { useCallback, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { letterService } from "@/services/letterService";
import { CreateLetterDTO, Letter } from "@/schemas/letterSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useLetterStore } from "@/store/letterStore";

export function useLetters(userId?: string) {
  const { mutate } = useSWRConfig();
  const cacheKey = useMemo(() => (userId ? ["letters", userId] : null), [userId]);

  const { data: letters = [], error: swrError, isLoading: swrLoading } = useSWR<Letter[]>(
    cacheKey,
    () => letterService.getLettersByUser(userId!)
  );

  const { error: storeError, isLoading: storeLoading, setError, setLoading } = useLetterStore();

  const isLoading = swrLoading || storeLoading;
  const error = swrError ? getErrorMessage(swrError) : storeError;

  const createLetter = useCallback(
    async (letterUserId: string, data: CreateLetterDTO) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      const optimisticLetter: Letter = {
        ...data,
        id: "temp-" + Date.now(),
        userId: letterUserId,
        createdAt: new Date().toISOString(),
        isExpired: false,
      };

      try {
        await mutate(
          cacheKey,
          async (currentLetters: Letter[] | undefined) => {
            const newLetter = await letterService.createLetter(letterUserId, data);
            return [newLetter, ...(currentLetters || [])];
          },
          {
            optimisticData: [optimisticLetter, ...letters],
            rollbackOnError: true,
            revalidate: true,
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
    [cacheKey, mutate, letters, setError, setLoading]
  );

  const deleteLetter = useCallback(
    async (letterId: string) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      try {
        await mutate(
          cacheKey,
          async (currentLetters: Letter[] | undefined) => {
            await letterService.deleteLetter(letterId);
            return (currentLetters || []).filter((l) => l.id !== letterId);
          },
          {
            optimisticData: letters.filter((l) => l.id !== letterId),
            rollbackOnError: true,
            revalidate: true,
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
    [cacheKey, mutate, letters, setError, setLoading]
  );

  return {
    letters,
    isLoading,
    error,
    createLetter,
    deleteLetter,
  };
}
