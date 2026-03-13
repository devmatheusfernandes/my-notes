import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    arrayUnion,
    arrayRemove,
    updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { tag, Tag, CreateTagDTO } from "@/schemas/tagSchema";
import { TAGS_COLLECTION_NAME, NOTES_COLLECTION_NAME } from "@/lib/collections-name";

export const tagService = {
    async createTag(userId: string, data: CreateTagDTO): Promise<Tag> {
        try {
            const newTagRef = doc(collection(db, TAGS_COLLECTION_NAME));

            const verifyTagExists = query(
                collection(db, TAGS_COLLECTION_NAME),
                where("userId", "==", userId),
                where("name", "==", data.title),
            );

            const querySnapshot = await getDocs(verifyTagExists);
            if (!querySnapshot.empty) {
                throw new Error("Já existe uma tag com este nome.");
            }

            const rawTag = {
                ...data,
                id: newTagRef.id,
                userId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const newTag = tag.parse(rawTag);
            await setDoc(newTagRef, newTag);
            return newTag;
        }  catch (error) {
            console.error("Erro ao criar tag no Firebase:", error);
            if (error instanceof Error && error.message === "Já existe uma tag com este nome.") {
                throw error; 
            }
                throw new Error("Não foi possível salvar a tag no banco de dados.");
        }
    },

    async getTagsByUser(userId: string): Promise<Tag[]> {
        try {
            const q = query(
                collection(db, TAGS_COLLECTION_NAME),
                where("userId", "==", userId),
            );

            const querySnapshot = await getDocs(q);
            const tags: Tag[] = [];

            querySnapshot.forEach((doc) => {
                tags.push(doc.data() as Tag);
            });

            return tags;
        } catch (error) {
            console.error("Erro ao buscar tags:", error);
            throw new Error("Não foi possível carregar suas tags.");
        }
    },

    async applyTagToNote(noteId: string, tagId: string): Promise<void> {
        try {
            const noteRef = doc(db, NOTES_COLLECTION_NAME, noteId);
            await updateDoc(noteRef, { 
                tagIds: arrayUnion(tagId), 
                updatedAt: new Date().toISOString() 
            }); 
        } catch (error) {
            console.error("Erro ao aplicar tag à nota:", error);
            throw new Error("Não foi possível aplicar a tag à nota.");
        }
    },

    async removeTagFromNote(noteId: string, tagId: string): Promise<void> {
        try {
            const noteRef = doc(db, NOTES_COLLECTION_NAME, noteId);
            await setDoc(
                noteRef,
                { tagIds: arrayRemove(tagId), updatedAt: new Date().toISOString() },
                { merge: true },
            );
        } catch (error) {
            console.error("Erro ao remover tag da nota:", error);
            throw new Error("Não foi possível remover a tag da nota.");
        }
    }
}
