import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
  listAll,
  StorageReference,
} from "firebase/storage";
import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { NOTES_COLLECTION_NAME, FOLDERS_COLLECTION_NAME } from "@/lib/collections-name";

export const storageService = {
  /**
   * Faz o upload de um arquivo garantindo a contabilização da quota do usuário.
   */
  async uploadFile(userId: string, path: string, file: File): Promise<string> {
    // 1. Opcional: checar preventivamente a cota do user antes do upload
    const usageRef = doc(db, "usage", userId);
    const usageSnap = await getDoc(usageRef);
    let currentBytes = 0;

    if (usageSnap.exists()) {
      currentBytes = usageSnap.data().totalBytesUsed || 0;
    } else {
      // Cria o documento de usage base se não existir
      await setDoc(usageRef, {
        totalBytesUsed: 0,
        uploadCount: 0,
        lastUploadAt: null,
      });
    }

    const LIMIT = 200 * 1024 * 1024;
    if (currentBytes + file.size > LIMIT) {
      throw new Error("Quota Exceeded");
    }

    // 2. Upload do Arquivo para Firebase Storage (se passar > 200MB os Security Rules também barram)
    const fileRef = ref(storage, `users/${userId}/${path}`);
    const snapshot = await uploadBytes(fileRef, file);

    // 3. Incrementa o uso de dados no Firestore
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    await updateDoc(usageRef, {
      totalBytesUsed: increment(file.size),
      imageBytesUsed: isImage ? increment(file.size) : increment(0),
      pdfBytesUsed: isPDF ? increment(file.size) : increment(0),
      uploadCount: increment(1),
      lastUploadAt: serverTimestamp(),
    });

    return getDownloadURL(snapshot.ref);
  },

  /**
   * Deleta um arquivo e desconta seu tamanho da cota do usuário.
   */
  async deleteFile(userId: string, path: string): Promise<void> {
    const fileRef = ref(storage, `users/${userId}/${path}`);

    // Antes de deletar, precisamos do tamanho para descontar!
    try {
      let size = 0;
      let contentType = "";
      try {
        const metadata = await getMetadata(fileRef);
        size = metadata.size || 0;
        contentType = metadata.contentType || "";
      } catch (error) {
        const err = error as { code?: string };
        if (err?.code === "storage/object-not-found") return;
        throw error;
      }

      try {
        await deleteObject(fileRef);
      } catch (error) {
        const err = error as { code?: string };
        if (err?.code === "storage/object-not-found") return;
        throw error;
      }

      const isImage = contentType.startsWith("image/");
      const isPDF = contentType === "application/pdf";

      // Decrementa o uso no Firestore
      const usageRef = doc(db, "usage", userId);
      try {
        await updateDoc(usageRef, {
          totalBytesUsed: increment(-size),
          imageBytesUsed: isImage ? increment(-size) : increment(0),
          pdfBytesUsed: isPDF ? increment(-size) : increment(0),
        });
      } catch (error) {
        const err = error as { code?: string };
        if (err?.code === "not-found") {
          await setDoc(
            usageRef,
            { totalBytesUsed: 0, uploadCount: 0, lastUploadAt: null },
            { merge: true },
          );
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Falha ao deletar arquivo ou atualizar quota", error);
      throw error;
    }
  },

  /**
   * Recalcula o uso de armazenamento escaneando todos os arquivos do usuário.
   */
  async recalculateUsage(userId: string): Promise<void> {
    const userStorageRef = ref(storage, `users/${userId}`);
    let totalBytesUsed = 0;
    let imageBytesUsed = 0;
    let pdfBytesUsed = 0;
    let uploadCount = 0;

    const listRecursive = async (folderRef: StorageReference) => {
      const res = await listAll(folderRef);
      
      // Process files in current folder
      for (const item of res.items) {
        const metadata = await getMetadata(item);
        const size = metadata.size || 0;
        const contentType = metadata.contentType || "";
        
        totalBytesUsed += size;
        uploadCount++;
        
        if (contentType.startsWith("image/")) {
          imageBytesUsed += size;
        } else if (contentType === "application/pdf") {
          pdfBytesUsed += size;
        }
      }
      
      // Process subfolders
      for (const folder of res.prefixes) {
        await listRecursive(folder);
      }
    };

    await listRecursive(userStorageRef);

    // Recalcula o uso do Firestore (Notas + Pastas)
    let notesBytesUsed = 0;
    try {
      const notesQuery = query(collection(db, NOTES_COLLECTION_NAME), where("userId", "==", userId));
      const foldersQuery = query(collection(db, FOLDERS_COLLECTION_NAME), where("userId", "==", userId));
      
      const [notesSnap, foldersSnap] = await Promise.all([
        getDocs(notesQuery),
        getDocs(foldersQuery)
      ]);

      notesSnap.forEach(doc => {
        notesBytesUsed += JSON.stringify(doc.data()).length;
      });
      foldersSnap.forEach(doc => {
        notesBytesUsed += JSON.stringify(doc.data()).length;
      });
    } catch (error) {
      console.error("Erro ao calcular tamanho das notas/pastas:", error);
    }

    const usageRef = doc(db, "usage", userId);
    await setDoc(usageRef, {
      totalBytesUsed,
      imageBytesUsed,
      pdfBytesUsed,
      notesBytesUsed,
      uploadCount,
      lastUploadAt: serverTimestamp(),
    }, { merge: true });
  },
};
