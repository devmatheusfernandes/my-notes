"use server";

import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { NOTES_COLLECTION_NAME } from "@/lib/collections-name";
import { revalidatePath } from "next/cache";

export async function uploadPdfAction(formData: FormData) {
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;
  const folderId = formData.get("folderId") as string;

  if (!file || !userId) {
    throw new Error("Dados de upload incompletos.");
  }

  const rawTitle = file.name.replace(/\.pdf$/i, "").trim();
  const title = (rawTitle || "PDF").slice(0, 20);

  const noteRef = adminDb.collection(NOTES_COLLECTION_NAME).doc();
  const noteId = noteRef.id;

  const newNote = {
    id: noteId,
    userId,
    title,
    content: null,
    folderId: folderId || "Raiz",
    type: "pdf",
    archived: false,
    trashed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await noteRef.set(newNote);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `users/${userId}/pdf/${noteId}.pdf`;
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);

    await fileRef.save(buffer, {
      contentType: "application/pdf",
      metadata: {
        firebaseStorageDownloadTokens: crypto.randomUUID(),
      },
    });
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-09-2491",
    });

    await noteRef.update({ fileUrl: url });

    revalidatePath("/hub/items");
    return { success: true, note: { ...newNote, fileUrl: url } };
  } catch (error) {
    console.error("Erro no upload (Server Action):", error);
    await noteRef.delete().catch(() => { });
    throw new Error("Erro ao processar o upload no servidor.");
  }
}
