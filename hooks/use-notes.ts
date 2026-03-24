import { useCallback } from "react";
import { useNoteStore } from "@/store/noteStore";
import { noteService } from "@/services/noteService";
import { CreateNoteDTO } from "@/schemas/noteSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useNotes() {
  const { notes, isLoading, error, setNotes, addNote, removeNote, setLoading, setError } =
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

  const createNote = async (userId: string, data: CreateNoteDTO) => {
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
  };
  const deleteNote = async (noteId: string) => {
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
  };

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
  };
}
