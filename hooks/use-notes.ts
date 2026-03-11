import { useCallback } from "react";
import { useNoteStore } from "@/store/noteStore";
import { noteService } from "@/services/noteService";
import { CreateNoteDTO } from "@/schemas/noteSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useNotes() {
  const { notes, isLoading, error, setNotes, addNote, setLoading, setError } =
    useNoteStore();

  const fetchNotes = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);

      try {
        const fetchedNotes = await noteService.getNotesByUser(userId);
        setNotes(fetchedNotes);
      } catch (error) {
        const mensagemSegura = getErrorMessage(error);
        setError(mensagemSegura);
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
      console.log("Nota criada", newNote);
      return newNote;
    } catch (error) {
      const mensagemSegura = getErrorMessage(error);
      setError(mensagemSegura);
      throw new Error(mensagemSegura);
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
  };
}
