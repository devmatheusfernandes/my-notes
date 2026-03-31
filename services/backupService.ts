import { auth, db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import {
  ref,
  getBlob,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import {
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  linkWithPopup
} from "firebase/auth";
import type { Content } from "@tiptap/react";
import {
  NOTES_COLLECTION_NAME,
  FOLDERS_COLLECTION_NAME,
  TAGS_COLLECTION_NAME
} from "@/lib/collections-name";
import type { Note } from "@/schemas/noteSchema";
import type { Folder } from "@/schemas/folderSchema";
import type { Tag } from "@/schemas/tagSchema";
import { settingsService } from "./settingsService";

export type BackupPayload = {
  exportedAt: string;
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  media?: Record<string, string>; // Maps storage path or URL to base64
};

export type BackupResult = {
  success: boolean;
  lastBackupAt?: string;
  error?: string;
};

export interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

// helpers from user snippet
function getCachedDriveToken(): string | null {
  try {
    const raw = localStorage.getItem("driveAccessToken")
    const exp = Number(localStorage.getItem("driveAccessTokenExpiresAt") || 0)
    if (!raw || !exp) return null
    const now = Date.now()
    if (now < exp - 30000) return raw
    return null
  } catch {
    return null
  }
}

function setCachedDriveToken(token: string, ttlMs = 55 * 60 * 1000) {
  try {
    localStorage.setItem("driveAccessToken", token)
    localStorage.setItem("driveAccessTokenExpiresAt", String(Date.now() + Math.max(60000, ttlMs)))
  } catch { }
}

async function getDriveAccessToken(allowPopup = true, force = false): Promise<string | null> {
  if (!force) {
    const cached = getCachedDriveToken()
    if (cached) return cached
  }

  if (!allowPopup) return null;

  const provider = new GoogleAuthProvider()
  provider.addScope("https://www.googleapis.com/auth/drive.file")
  // For Auto-Backup via GH Actions/Server-side, we need a refresh token.
  // We'll request offline access but signInWithPopup might not return it directly.
  // provider.setCustomParameters({ access_type: 'offline', prompt: 'consent' });

  let result
  const current = auth.currentUser
  if (current) {
    const hasGoogle = current.providerData?.some((p) => p.providerId === "google.com")
    try {
      result = hasGoogle ? await reauthenticateWithPopup(current, provider) : await linkWithPopup(current, provider)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || ""
      if (
        code === "auth/provider-already-linked" ||
        code === "auth/credential-already-in-use" ||
        code === "auth/account-exists-with-different-credential"
      ) {
        result = await reauthenticateWithPopup(current, provider)
      } else {
        throw err
      }
    }
  } else {
    result = await signInWithPopup(auth, provider)
  }

  const credential = GoogleAuthProvider.credentialFromResult(result)
  const accessToken = credential?.accessToken
  if (!accessToken) {
    throw new Error("Falha ao obter token do Google Drive.")
  }
  setCachedDriveToken(accessToken)
  return accessToken
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function findImagesInContent(content: unknown): string[] {
  const images: string[] = [];
  if (!content) return images;

  if (Array.isArray(content)) {
    content.forEach(item => {
      images.push(...findImagesInContent(item));
    });
  } else if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (obj.type === 'image' && obj.attrs && typeof obj.attrs === 'object') {
      const attrs = obj.attrs as Record<string, unknown>;
      if (typeof attrs.src === 'string') {
        images.push(attrs.src);
      }
    }
    if (obj.content) {
      images.push(...findImagesInContent(obj.content));
    }
  }
  return images;
}

function replaceImageUrls(content: unknown, urlMap: Record<string, string>): unknown {
  if (!content) return content;

  if (Array.isArray(content)) {
    return content.map(item => replaceImageUrls(item, urlMap));
  } else if (content && typeof content === 'object') {
    const newContent = { ...(content as Record<string, unknown>) };
    if (newContent.type === 'image' && newContent.attrs && typeof newContent.attrs === 'object') {
      const attrs = { ...(newContent.attrs as Record<string, unknown>) };
      if (typeof attrs.src === 'string') {
        const oldUrl = attrs.src;
        if (urlMap[oldUrl]) {
          attrs.src = urlMap[oldUrl];
          newContent.attrs = attrs;
        }
      }
    }
    if (newContent.content) {
      newContent.content = replaceImageUrls(newContent.content, urlMap);
    }
    return newContent;
  }
  return content;
}

// Adapted aggregation to use top-level collections
async function fetchUserDataForBackup(userId: string): Promise<BackupPayload> {
  const [notesSnap, foldersSnap, tagsSnap] = await Promise.all([
    getDocs(query(collection(db, NOTES_COLLECTION_NAME), where("userId", "==", userId))),
    getDocs(query(collection(db, FOLDERS_COLLECTION_NAME), where("userId", "==", userId))),
    getDocs(query(collection(db, TAGS_COLLECTION_NAME), where("userId", "==", userId))),
  ]);

  const rawNotes = notesSnap.docs.map((d) => d.data() as Note);
  const folders = foldersSnap.docs.map((d) => d.data() as Folder);
  const tags = tagsSnap.docs.map((d) => d.data() as Tag);

  const mediaPayload: Record<string, string> = {};

  // Fetch and encode PDFs and Tiptap Images
  const notesWithFiles = await Promise.all(rawNotes.map(async (note) => {
    const processedNote = { ...note };

    // 1. Handle PDF attachments
    if (note.type === "pdf" && note.fileUrl) {
      try {
        const pathMatch = note.fileUrl.match(/\/o\/([^?]+)/);
        if (pathMatch) {
          const path = decodeURIComponent(pathMatch[1]);
          const fileRef = ref(storage, path);
          const blob = await getBlob(fileRef);
          const base64 = await blobToBase64(blob);
          mediaPayload[note.fileUrl] = base64;
        }
      } catch (err) {
        console.warn(`Could not backup PDF file for note ${note.id}`, err);
      }
    }

    // 2. Handle Images inside Tiptap content
    if (note.type === "note" && note.content) {
      const urls = findImagesInContent(note.content);
      for (const url of urls) {
        if (url.includes("firebasestorage.googleapis.com")) {
          try {
            const pathMatch = url.match(/\/o\/([^?]+)/);
            if (pathMatch) {
              const path = decodeURIComponent(pathMatch[1]);
              const fileRef = ref(storage, path);
              const blob = await getBlob(fileRef);
              const base64 = await blobToBase64(blob);
              mediaPayload[url] = base64;
            }
          } catch (err) {
            console.warn(`Could not backup image ${url} for note ${note.id}`, err);
          }
        }
      }
    }

    return processedNote;
  }));

  return {
    exportedAt: new Date().toISOString(),
    notes: notesWithFiles,
    folders,
    tags,
    media: mediaPayload
  };
}

// Google Drive API Helpers
async function ensureBackupFolder(token: string): Promise<string> {
  const searchUrl =
    "https://www.googleapis.com/drive/v3/files?q=" +
    encodeURIComponent("name = 'CapyNotes Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false") +
    "&fields=files(id,name)&spaces=drive";

  const searchResp = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (searchResp.ok) {
    const data = await searchResp.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id as string;
    }
  }

  const createResp = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "CapyNotes Backups", mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!createResp.ok) {
    throw new Error("Falha ao criar pasta no Drive.");
  }
  const created = await createResp.json();
  return created.id as string;
}

async function uploadBackupFile(token: string, folderId: string, filename: string, content: string): Promise<void> {
  const boundary = "capynotes_backup_boundary_" + Math.random().toString(36).slice(2);
  const metadata = { name: filename, parents: [folderId], mimeType: "application/json" };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    "\r\n" +
    `--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    content +
    "\r\n" +
    `--${boundary}--`;

  const resp = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });

  if (!resp.ok) {
    throw new Error("Falha ao subir backup no Drive.");
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return await response.blob();
}

export const backupService = {
  async driveBackupNow(userId: string): Promise<BackupResult> {
    try {
      let token = await getDriveAccessToken(true);
      if (!token) throw new Error("Google Drive não vinculado.");
      const payload = await fetchUserDataForBackup(userId);
      const json = JSON.stringify(payload, null, 2);

      let folderId: string;
      try {
        folderId = await ensureBackupFolder(token);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (/401|invalid|expired|credentials/i.test(errorMessage)) {
          token = await getDriveAccessToken(true, true);
          if (!token) throw new Error("Sessão expirada. Vincule novamente.");
          folderId = await ensureBackupFolder(token);
        } else throw err;
      }

      const filename = `capynotes-backup-${new Date().toISOString().replace(/[:\.]/g, "-")}.json`;
      await uploadBackupFile(token, folderId, filename, json);

      const lastBackupAt = new Date().toISOString();
      await settingsService.updateUserSettings(userId, { lastBackupAt });

      return { success: true, lastBackupAt };
    } catch (error: unknown) {
      return { success: false, error: this.getErrorDetail(error) };
    }
  },

  getErrorDetail(error: unknown): string {
    if (!error) return "Erro desconhecido";
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("401")) return "Sessão expirada. Vincule novamente.";
      if (msg.includes("403")) return "Sem permissão no Google Drive.";
      if (msg.includes("storage/quota-exceeded")) return "Espaço insuficiente no Firebase Storage.";
      return msg;
    }
    return String(error);
  },

  async listBackupsOnDrive(): Promise<DriveFile[]> {
    try {
      const token = await getDriveAccessToken(false);
      if (!token) return []; // Silently return empty if not authenticated
      const folderId = await ensureBackupFolder(token);
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,createdTime,size)&orderBy=createdTime+desc`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error("Erro ao listar backups.");
      const data = await resp.json();
      return data.files;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async restoreFromDrive(userId: string, driveFileId: string): Promise<BackupResult> {
    try {
      const token = await getDriveAccessToken(true);
      if (!token) throw new Error("Google Drive não vinculado.");

      // 1. Download JSON
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`;
      const resp = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error("Erro ao baixar backup.");
      const payload: BackupPayload = await resp.json();

      // 2. Clear existing user data (Notes, Folders, Tags)
      const [notesSnap, foldersSnap, tagsSnap] = await Promise.all([
        getDocs(query(collection(db, NOTES_COLLECTION_NAME), where("userId", "==", userId))),
        getDocs(query(collection(db, FOLDERS_COLLECTION_NAME), where("userId", "==", userId))),
        getDocs(query(collection(db, TAGS_COLLECTION_NAME), where("userId", "==", userId))),
      ]);

      const batch = writeBatch(db);
      notesSnap.forEach((d) => batch.delete(d.ref));
      foldersSnap.forEach((d) => batch.delete(d.ref));
      tagsSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      // 3. Import Data
      const importBatch = writeBatch(db);

      // Folders
      payload.folders.forEach(f => {
        importBatch.set(doc(db, FOLDERS_COLLECTION_NAME, f.id), f);
      });

      // Tags
      payload.tags.forEach(t => {
        importBatch.set(doc(db, TAGS_COLLECTION_NAME, t.id), t);
      });

      // Notes & Media Restoration
      let totalRestoredBytes = 0;
      const urlMap: Record<string, string> = {};

      // First pass: Restore all media files to Storage
      if (payload.media) {
        for (const [oldUrl, base64] of Object.entries(payload.media)) {
          try {
            const blob = await dataUrlToBlob(base64);
            // Reconstruct path: keep the same filename but ensure it's under current userId
            const fileName = oldUrl.split('/').pop()?.split('?')[0] || `backup-${Date.now()}`;
            // If it's a Tiptap image, it likely has /images/ in path. If PDF, /notes/ or similar.
            const isImage = oldUrl.includes("/images/");
            const storagePath = isImage 
              ? `users/${userId}/images/${fileName}` 
              : `users/${userId}/notes/${fileName}`;
            
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, blob);
            const newUrl = await getDownloadURL(fileRef);
            urlMap[oldUrl] = newUrl;
            totalRestoredBytes += blob.size;
          } catch (err) {
            console.error(`Failed to restore media ${oldUrl}`, err);
          }
        }
      }

      // Second pass: Save notes with updated URLs
      for (const note of payload.notes) {
        const restoredNote = { ...note };

        if (note.type === "pdf" && note.fileUrl && urlMap[note.fileUrl]) {
          restoredNote.fileUrl = urlMap[note.fileUrl];
        }

        if (note.type === "note" && note.content) {
          restoredNote.content = replaceImageUrls(note.content, urlMap) as Content;
        }

        importBatch.set(doc(db, NOTES_COLLECTION_NAME, note.id), restoredNote);
      }

      // 4. Update user storage usage
      const usageRef = doc(db, "usage", userId);
      importBatch.set(usageRef, {
        totalBytesUsed: totalRestoredBytes,
        lastUploadAt: serverTimestamp(),
      }, { merge: true });

      await importBatch.commit();
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: this.getErrorDetail(error) };
    }
  }
};
