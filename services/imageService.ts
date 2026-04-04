import { db, storage } from "@/lib/firebase/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { MEDIA_COLLECTION_NAME } from "@/lib/firebase/collections-name";
import { v4 as uuidv4 } from "uuid";

const IMAGE_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024; // 50MB

export interface MediaMetadata {
  id: string;
  userId: string;
  storagePath: string;
  downloadUrl: string;
  size: number;
  mimeType: string;
  name: string;
  createdAt: unknown;
}

export const imageService = {
  async uploadImage(file: File, userId: string): Promise<string> {
    if (!userId) throw new Error("Usuário não autenticado.");

    // 1. Check current usage
    const usageRef = doc(db, "usage", userId);
    const usageSnap = await getDoc(usageRef);
    const currentUsage = usageSnap.exists() ? usageSnap.data().totalBytesUsed || 0 : 0;

    if (currentUsage + file.size > IMAGE_STORAGE_LIMIT_BYTES) {
      throw new Error("Limite de armazenamento de imagens (50MB) atingido.");
    }

    // 2. Upload to Storage
    const fileId = uuidv4();
    const extension = file.name.split(".").pop();
    const fileName = `${fileId}.${extension}`;
    const storagePath = `users/${userId}/images/${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    // 3. Create Media Metadata
    const mediaRef = doc(db, MEDIA_COLLECTION_NAME, fileId);
    const mediaData: MediaMetadata = {
      id: fileId,
      userId,
      storagePath,
      downloadUrl,
      size: file.size,
      mimeType: file.type,
      name: file.name,
      createdAt: serverTimestamp(),
    };
    await setDoc(mediaRef, mediaData);

    // 4. Update Usage Record
    if (usageSnap.exists()) {
      await updateDoc(usageRef, {
        totalBytesUsed: increment(file.size),
        uploadCount: increment(1),
        lastUploadAt: serverTimestamp(),
      });
    } else {
      await setDoc(usageRef, {
        totalBytesUsed: file.size,
        uploadCount: 1,
        lastUploadAt: serverTimestamp(),
      });
    }

    return downloadUrl;
  },
};
