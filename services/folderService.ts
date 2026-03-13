import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { folder, Folder, CreateFolderDTO } from "@/schemas/folderSchema";
import { FOLDERS_COLLECTION_NAME } from "@/lib/collections-name";

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
};
