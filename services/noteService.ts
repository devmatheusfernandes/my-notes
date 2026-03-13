import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { note, Note, CreateNoteDTO } from "@/schemas/noteSchema";
import { NOTES_COLLECTION_NAME } from "@/lib/collections-name";

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
};
