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
import { extractTextFromTiptap } from "@/lib/notes/extract-text";

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

      // Sync to Turso for Vector Search
      const syncContent = `${newNote.title}\n${extractTextFromTiptap(newNote.content)}`;
      
      if (typeof window === "undefined") {
        const { vectorService } = await import("@/services/vectorService");
        await vectorService.queueForEmbedding({
          userId,
          sourceId: newNote.id,
          sourceType: "note",
          content: syncContent,
        });
      } else {
        // Client-side: call our new sync-queue API
        fetch("/api/sync/queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: [{
                    sourceId: newNote.id,
                    sourceType: "note",
                    content: syncContent,
                }]
            })
        }).catch(err => console.error("Erro ao sincronizar nota para busca:", err));
      }

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

  async deleteNote(userId: string, noteId: string): Promise<void> {
    try {
      const noteRef = doc(db, NOTES_COLLECTION_NAME, noteId);
      await deleteDoc(noteRef);

      // Sync to Turso for Vector Search (Server-side only)
      if (typeof window === "undefined") {
        const { db: tursoDb } = await import("@/lib/db/turso");
        const { embeddingsQueue } = await import("@/lib/db/schema");
        const { and, eq } = await import("drizzle-orm");
        
        await tursoDb
          .delete(embeddingsQueue)
          .where(
            and(
              eq(embeddingsQueue.sourceId, noteId),
              eq(embeddingsQueue.sourceType, "note"),
              eq(embeddingsQueue.userId, userId)
            )
          );
      }
    } catch (error) {
      console.error("Erro ao deletar nota no Firebase:", error);
      throw new Error("Não foi possível excluir a nota.");
    }
  },

  async updateNote(userId: string, noteId: string, data: Partial<Note>): Promise<void> {
    try {
      const noteRef = doc(db, NOTES_COLLECTION_NAME, noteId);
      await updateDoc(noteRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });

      // If content was updated, re-queue for embedding
      if (data.content || data.title) {
        const syncContent = `${data.title || ""}\n${extractTextFromTiptap(data.content)}`;
        
        if (typeof window === "undefined") {
          const { vectorService } = await import("@/services/vectorService");
          await vectorService.queueForEmbedding({
            userId,
            sourceId: noteId,
            sourceType: "note",
            content: syncContent,
          });
        } else {
          fetch("/api/sync/queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: [{
                    sourceId: noteId,
                    sourceType: "note",
                    content: syncContent,
                }]
            })
          }).catch(err => console.error("Erro ao ressincronizar nota:", err));
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar nota no Firebase:", error);
      throw new Error("Não foi possível atualizar a nota.");
    }
  },

  async createManyNotes(userId: string, notesData: CreateNoteDTO[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const syncedNotes: { noteId: string; content: string; userId: string }[] = [];

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

        syncedNotes.push({
            userId,
            noteId: newNote.id,
            content: `${newNote.title}\n${extractTextFromTiptap(newNote.content)}`,
        });
      }

      await batch.commit();

      // Sync all to Turso
      const itemsToSync = syncedNotes.map(n => ({
        sourceId: n.noteId,
        sourceType: "note" as const,
        content: n.content,
      }));

      if (typeof window === "undefined") {
        const { vectorService } = await import("@/services/vectorService");
        await vectorService.queueMany(itemsToSync.map(i => ({ ...i, userId })));
      } else {
        fetch("/api/sync/queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsToSync })
        }).catch(err => console.error("Erro ao sincronizar lote de notas:", err));
      }
    } catch (error) {
      console.error("Erro ao criar múltiplas notas no Firebase:", error);
      throw new Error("Não foi possível realizar a importação em lote.");
    }
  },
};
