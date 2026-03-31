import { useCallback } from "react";
import { useNoteStore } from "@/store/noteStore";
import { noteService } from "@/services/noteService";
import { CreateNoteDTO, Note } from "@/schemas/noteSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useNotes() {
  const { notes, isLoading, error, setNotes, addNote, removeNote, updateNote, setLoading, setError } =
    useNoteStore();

  const fetchNotes = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);

      try {
        const fetchedNotes = await noteService.getNotesByUser(userId);
        setNotes(fetchedNotes);
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [setNotes, setLoading, setError],
  );

  const createNote = useCallback(
    async (userId: string, data: CreateNoteDTO) => {
      setLoading(true);
      setError(null);

      try {
        const newNote = await noteService.createNote(userId, data);
        addNote(newNote);
        return newNote;
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
        throw new Error(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [addNote, setLoading, setError],
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      setLoading(true);
      setError(null);

      try {
        await noteService.deleteNote(noteId);
        removeNote(noteId);
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
        throw new Error(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [removeNote, setLoading, setError],
  );

  const updateNoteStore = useCallback(
    async (noteId: string, data: Partial<Note>) => {
      // We update state immediately for snappy UI (optimistic update effect)
      // But since Zustand expects synchronous calls, we'll just handle error if it fails
      // Alternatively wait for DB and then update UI.
      setLoading(true);
      setError(null);
      try {
        await noteService.updateNote(noteId, data);
        updateNote(noteId, data);
      } catch (error) {
        const secureMessage = getErrorMessage(error);
        setError(secureMessage);
        throw new Error(secureMessage);
      } finally {
        setLoading(false);
      }
    },
    [updateNote, setLoading, setError],
  );

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
    updateNote: updateNoteStore,
    addNote,
  };
}
