import {
    collection,
    doc,
    deleteDoc,
    setDoc,
    getDoc,
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
                where("title", "==", data.title),
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

    async updateTag(
        userId: string,
        tagId: string,
        data: { title: string; color?: string },
    ): Promise<Tag> {
        try {
            const trimmedTitle = data.title.trim();
            if (!trimmedTitle) {
                throw new Error("O título não pode ser vazio");
            }

            const verifyTagExists = query(
                collection(db, TAGS_COLLECTION_NAME),
                where("userId", "==", userId),
                where("title", "==", trimmedTitle),
            );
            const querySnapshot = await getDocs(verifyTagExists);
            const conflictingTag = querySnapshot.docs.find((d) => d.id !== tagId);
            if (conflictingTag) {
                throw new Error("Já existe uma tag com este nome.");
            }

            const tagRef = doc(db, TAGS_COLLECTION_NAME, tagId);
            const currentTagSnapshot = await getDoc(tagRef);
            if (!currentTagSnapshot.exists()) {
                throw new Error("Tag não encontrada.");
            }

            const updatedAt = new Date().toISOString();
            await updateDoc(tagRef, {
                title: trimmedTitle,
                ...(data.color ? { color: data.color } : {}),
                updatedAt,
            });

            const rawUpdatedTag = {
                ...currentTagSnapshot.data(),
                title: trimmedTitle,
                ...(data.color ? { color: data.color } : {}),
                updatedAt,
            };
            return tag.parse(rawUpdatedTag);
        } catch (error) {
            console.error("Erro ao editar tag:", error);
            if (error instanceof Error && error.message === "Já existe uma tag com este nome.") {
                throw error;
            }
            throw new Error("Não foi possível editar a tag.");
        }
    },

    async deleteTag(tagId: string): Promise<void> {
        try {
            const tagRef = doc(db, TAGS_COLLECTION_NAME, tagId);
            await deleteDoc(tagRef);

            const q = query(
                collection(db, NOTES_COLLECTION_NAME),
                where("tagIds", "array-contains", tagId),
            );
            const querySnapshot = await getDocs(q);

            const updatedAt = new Date().toISOString();
            await Promise.all(
                querySnapshot.docs.map((noteDoc) =>
                    updateDoc(noteDoc.ref, {
                        tagIds: arrayRemove(tagId),
                        updatedAt,
                    }),
                ),
            );
        } catch (error) {
            console.error("Erro ao deletar tag:", error);
            throw new Error("Não foi possível deletar a tag.");
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
