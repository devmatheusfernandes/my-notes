import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { letterSchema, Letter, CreateLetterDTO } from "@/schemas/letterSchema";
import { LETTERS_COLLECTION_NAME } from "@/lib/firebase/collections-name";

export const letterService = {
  async createLetter(userId: string, data: CreateLetterDTO): Promise<Letter> {
    try {
      const newLetterRef = doc(collection(db, LETTERS_COLLECTION_NAME));

      const rawLetter = {
        ...data,
        id: newLetterRef.id,
        userId: userId,
        createdAt: data.createdAt || new Date().toISOString(),
        isExpired: false,
      };

      const newLetter = letterSchema.parse(rawLetter);
      await setDoc(newLetterRef, newLetter);

      // Sync to Turso for Vector Search (RAG)
      const syncContent = `${newLetter.title}\n${newLetter.content}`;
      
      if (typeof window === "undefined") {
        const { vectorService } = await import("@/services/vectorService");
        await vectorService.queueForEmbedding({
          userId,
          sourceId: newLetter.id,
          sourceType: "letter",
          content: syncContent,
        });
      } else {
        fetch("/api/sync/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{
              sourceId: newLetter.id,
              sourceType: "letter",
              content: syncContent,
            }]
          })
        }).catch(err => console.warn("[letterService] Local sync failed:", err));
      }

      return newLetter;
    } catch (error) {
      console.error("Erro ao criar carta no Firebase:", error);
      throw new Error("Não foi possível salvar a carta.");
    }
  },

  async getLettersByUser(userId: string): Promise<Letter[]> {
    try {
      const q = query(
        collection(db, LETTERS_COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const letters: Letter[] = [];

      querySnapshot.forEach((doc) => {
        letters.push(doc.data() as Letter);
      });

      return letters;
    } catch (error) {
      console.error("Erro ao buscar cartas:", error);
      throw new Error("Não foi possível carregar suas cartas.");
    }
  },

  async deleteLetter(letterId: string): Promise<void> {
    try {
      const letterRef = doc(db, LETTERS_COLLECTION_NAME, letterId);
      await deleteDoc(letterRef);

      // Remove from Vector Search (RAG)
      if (typeof window !== "undefined") {
        fetch("/api/sync/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceIds: [letterId],
            sourceType: "letter",
          })
        }).catch(err => console.warn("[letterService] Sync removal failed:", err));
      }
    } catch (error) {
      console.error("Erro ao deletar carta no Firebase:", error);
      throw new Error("Não foi possível excluir a carta.");
    }
  },
};
