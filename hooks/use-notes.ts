import { useCallback, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { noteService } from "@/services/noteService";
import { CreateNoteDTO, Note } from "@/schemas/noteSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useNoteStore } from "@/store/noteStore";

export function useNotes(userId?: string) {
  const { mutate } = useSWRConfig();
  const cacheKey = useMemo(() => (userId ? ["notes", userId] : null), [userId]);

  const { data: notes = [], error: swrError, isLoading: swrLoading } = useSWR<Note[]>(
    cacheKey,
    () => noteService.getNotesByUser(userId!)
  );

  // We still use the store for UI state like unlockedNotes
  const { error: storeError, isLoading: storeLoading, setError, setLoading } = useNoteStore();

  const isLoading = swrLoading || storeLoading;
  const error = swrError ? getErrorMessage(swrError) : storeError;

  const fetchNotes = useCallback(async () => {
    if (!cacheKey) return;
    await mutate(cacheKey);
  }, [cacheKey, mutate]);

  const createNote = useCallback(
    async (noteUserId: string, data: CreateNoteDTO) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      // Optimistic note
      const optimisticNote: Note = {
        title: data.title || "Nova Nota",
        content: data.content || null,
        tagIds: data.tagIds || [],
        folderId: data.folderId,
        archived: data.archived || false,
        trashed: data.trashed || false,
        pinned: data.pinned || false,
        type: data.type || "note",
        fileUrl: data.fileUrl,
        isLocked: data.isLocked || false,
        id: "temp-" + Date.now(),
        userId: noteUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const updatedNotes = await mutate(
          cacheKey,
          async (currentNotes: Note[] | undefined) => {
            const newNote = await noteService.createNote(noteUserId, data);
            return [newNote, ...(currentNotes || [])];
          },
          {
            optimisticData: [optimisticNote, ...notes],
            rollbackOnError: true,
            populateCache: true,
            revalidate: true,
          }
        );
        return updatedNotes?.[0] as Note;
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
        throw new Error(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, mutate, notes, setError, setLoading]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      try {
        await mutate(
          cacheKey,
          async (currentNotes: Note[] | undefined) => {
            await noteService.deleteNote(userId!, noteId);
            return (currentNotes || []).filter((n) => n.id !== noteId);
          },
          {
            optimisticData: notes.filter((n) => n.id !== noteId),
            rollbackOnError: true,
            populateCache: true,
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
    [cacheKey, mutate, notes, setError, setLoading, userId]
  );

  const updateNoteStore = useCallback(
    async (noteId: string, data: Partial<Note>) => {
      if (!cacheKey) return;
      setLoading(true);
      setError(null);

      try {
        await mutate(
          cacheKey,
          async (currentNotes: Note[] | undefined) => {
            await noteService.updateNote(userId!, noteId, data);
            return (currentNotes || []).map((n) => (n.id === noteId ? { ...n, ...data, updatedAt: new Date().toISOString() } : n));
          },
          {
            optimisticData: notes.map((n) => (n.id === noteId ? { ...n, ...data } : n)),
            rollbackOnError: true,
            populateCache: true,
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
    [cacheKey, mutate, notes, setError, setLoading, userId]
  );

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
    updateNote: updateNoteStore,
    addNote: (note: Note) => mutate(cacheKey, [note, ...notes], false),
  };
}

