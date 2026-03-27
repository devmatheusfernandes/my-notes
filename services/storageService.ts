import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { storage, db } from "@/lib/firebase";

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
    await updateDoc(usageRef, {
      totalBytesUsed: increment(file.size),
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
      try {
        const metadata = await getMetadata(fileRef);
        size = metadata.size || 0;
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

      // Decrementa o uso no Firestore
      const usageRef = doc(db, "usage", userId);
      try {
        await updateDoc(usageRef, {
          totalBytesUsed: increment(-size),
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
};
