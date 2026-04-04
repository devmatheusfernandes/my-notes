import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { folder, Folder, CreateFolderDTO } from "@/schemas/folderSchema";
import { FOLDERS_COLLECTION_NAME, NOTES_COLLECTION_NAME } from "@/lib/firebase/collections-name";

export const folderService = {
  async createFolder(userId: string, data: CreateFolderDTO): Promise<Folder> {
    try {
      const newFolderRef = doc(collection(db, FOLDERS_COLLECTION_NAME));

      const rawFolder = {
        ...data,
        id: newFolderRef.id,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newFolder = folder.parse(rawFolder);
      await setDoc(newFolderRef, newFolder);
      return newFolder;
    } catch (error) {
      console.error("Erro ao criar pasta:", error);
      throw new Error("Erro ao criar pasta");
    }
  },

  async getFoldersByUser(userId: string): Promise<Folder[]> {
    try {
      const q = query(
        collection(db, FOLDERS_COLLECTION_NAME),
        where("userId", "==", userId),
      );

      const querySnapshot = await getDocs(q);
      const folders: Folder[] = [];

      querySnapshot.forEach((doc) => {
        folders.push(doc.data() as Folder);
      });

      return folders;
    } catch (error) {
      console.error("Erro ao obter pastas do usuário:", error);
      throw new Error("Erro ao obter pastas do usuário");
    }
  },

  async getFolderDescendants(userId: string, folderId: string): Promise<{ folderIds: string[]; noteIds: string[] }> {
    try {
      const allFolders = await this.getFoldersByUser(userId);

      const folderIds: string[] = [];
      const findChildren = (parentId: string) => {
        const children = allFolders.filter(f => f.parentId === parentId);
        for (const child of children) {
          folderIds.push(child.id);
          findChildren(child.id);
        }
      };

      findChildren(folderId);

      // Get all notes to filter those belonging to any of these folders
      const notesQuery = query(
        collection(db, NOTES_COLLECTION_NAME),
        where("userId", "==", userId)
      );
      const notesSnapshot = await getDocs(notesQuery);
      const noteIds: string[] = [];

      const targetFolderIds = new Set([folderId, ...folderIds]);
      notesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.folderId && targetFolderIds.has(data.folderId)) {
          noteIds.push(doc.id);
        }
      });

      return { folderIds, noteIds };
    } catch (error) {
      console.error("Erro ao buscar descendentes da pasta:", error);
      return { folderIds: [], noteIds: [] };
    }
  },

  async deleteFolder(userId: string, folderId: string): Promise<void> {
    try {
      const { folderIds, noteIds } = await this.getFolderDescendants(userId, folderId);
      const batch = writeBatch(db);

      // Add folder itself
      batch.delete(doc(db, FOLDERS_COLLECTION_NAME, folderId));

      // Add subfolders
      folderIds.forEach(id => {
        batch.delete(doc(db, FOLDERS_COLLECTION_NAME, id));
      });

      // Add notes
      noteIds.forEach(id => {
        batch.delete(doc(db, NOTES_COLLECTION_NAME, id));
      });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao deletar pasta (cascata):", error);
      throw new Error("Não foi possível excluir a pasta e seu conteúdo.");
    }
  },

  async updateFolder(folderId: string, data: Partial<Folder>, userId?: string): Promise<void> {
    try {
      const folderRef = doc(db, FOLDERS_COLLECTION_NAME, folderId);

      // If we are updating trashed or archived status, we might want to cascade
      const shouldCascade = userId && (data.trashed !== undefined || data.archived !== undefined);

      if (shouldCascade && userId) {
        const { folderIds, noteIds } = await this.getFolderDescendants(userId, folderId);
        const batch = writeBatch(db);

        // Update the folder itself
        batch.update(folderRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        });

        // Update subfolders
        folderIds.forEach(id => {
          batch.update(doc(db, FOLDERS_COLLECTION_NAME, id), {
            ...data,
            updatedAt: new Date().toISOString(),
          });
        });

        // Update notes
        noteIds.forEach(id => {
          batch.update(doc(db, NOTES_COLLECTION_NAME, id), {
            ...data,
            updatedAt: new Date().toISOString(),
          });
        });

        await batch.commit();
      } else {
        await updateDoc(folderRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar pasta no Firebase:", error);
      throw new Error("Não foi possível atualizar a pasta.");
    }
  },
};
