import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { note, Note, CreateNoteDTO } from "@/schemas/noteSchema";
import { NOTES_COLLECTION_NAME } from "@/lib/firebase/collections-name";

export const noteService = {
  async createNote(userId: string, data: CreateNoteDTO): Promise<Note> {
    try {
      const newNoteRef = doc(collection(db, NOTES_COLLECTION_NAME));

      const rawNote = {
        ...data,
        id: newNoteRef.id,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newNote = note.parse(rawNote);
      await setDoc(newNoteRef, newNote);
      return newNote;
    } catch (error) {
      console.error("Erro ao criar nota no Firebase:", error);
      throw new Error("Não foi possível salvar a nota no banco de dados.");
    }
  },

  async getNotesByUser(userId: string): Promise<Note[]> {
    try {
      const q = query(
        collection(db, NOTES_COLLECTION_NAME),
        where("userId", "==", userId),
      );

      const querySnapshot = await getDocs(q);
      const notes: Note[] = [];

      querySnapshot.forEach((doc) => {
        notes.push(doc.data() as Note);
      });

      return notes;
    } catch (error) {
      console.error("Erro ao buscar notas:", error);
      throw new Error("Não foi possível carregar suas notas.");
    }
  },

  async deleteNote(noteId: string): Promise<void> {
    try {
      const noteRef = doc(db, NOTES_COLLECTION_NAME, noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error("Erro ao deletar nota no Firebase:", error);
      throw new Error("Não foi possível excluir a nota.");
    }
  },

  async updateNote(noteId: string, data: Partial<Note>): Promise<void> {
    try {
      const noteRef = doc(db, NOTES_COLLECTION_NAME, noteId);
      await updateDoc(noteRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao atualizar nota no Firebase:", error);
      throw new Error("Não foi possível atualizar a nota.");
    }
  },

  async createManyNotes(userId: string, notesData: CreateNoteDTO[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const data of notesData) {
        const newNoteRef = doc(collection(db, NOTES_COLLECTION_NAME));
        const rawNote = {
          ...data,
          id: newNoteRef.id,
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const newNote = note.parse(rawNote);
        batch.set(newNoteRef, newNote);
      }

      await batch.commit();
    } catch (error) {
      console.error("Erro ao criar múltiplas notas no Firebase:", error);
      throw new Error("Não foi possível realizar a importação em lote.");
    }
  },
};
