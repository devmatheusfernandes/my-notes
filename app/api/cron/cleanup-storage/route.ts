import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getErrorMessage } from "@/utils/getErrorMessage";

export const dynamic = "force-dynamic";

const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting cleanup of orphaned storage files...");
    const now = Date.now();

    // 1. Fetch all notes to index active URLs
    const notesSnap = await adminDb.collection("notes").get();
    const activeUrls = new Set<string>();

    notesSnap.forEach(doc => {
      const data = doc.data();
      if (data.type === "pdf" && data.fileUrl) {
        activeUrls.add(data.fileUrl);
      }
      if (data.content) {
        extractUrlsFromContent(data.content, activeUrls);
      }
    });

    console.log(`Found ${activeUrls.size} active URLs in notes.`);

    // 2. Fetch all media metadata
    const mediaSnap = await adminDb.collection("media").get();
    let deletedCount = 0;
    let deletedBytes = 0;

    const bucket = adminStorage.bucket();

    for (const mediaDoc of mediaSnap.docs) {
      const media = mediaDoc.data();
      const isOrphaned = !activeUrls.has(media.downloadUrl);

      if (isOrphaned) {
        const createdAt = media.createdAt ? media.createdAt.toDate().getTime() : 0;
        const age = now - createdAt;

        if (age > GRACE_PERIOD_MS) {
          console.log(`Deleting orphaned media: ${media.storagePath} (Id: ${mediaDoc.id})`);

          try {
            // Delete from Storage
            const file = bucket.file(media.storagePath);
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
            }

            // Delete from Firestore
            await mediaDoc.ref.delete();

            // Update user usage quota
            await adminDb.collection("usage").doc(media.userId).update({
              totalBytesUsed: FieldValue.increment(-media.size),
              uploadCount: FieldValue.increment(-1)
            });

            deletedCount++;
            deletedBytes += media.size;
          } catch (err) {
            console.error(`Failed to delete ${media.storagePath}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup finished. Deleted ${deletedCount} files (${(deletedBytes / (1024 * 1024)).toFixed(2)} MB).`,
      deletedCount,
      deletedBytes
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Cleanup Storage Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractUrlsFromContent(content: unknown, urls: Set<string>) {
  if (!content) return;
  if (Array.isArray(content)) {
    content.forEach(item => extractUrlsFromContent(item, urls));
  } else if (content && typeof content === "object") {
    const obj = content as Record<string, unknown>;
    if (obj.type === "image" && obj.attrs && typeof obj.attrs === "object") {
      const attrs = obj.attrs as Record<string, unknown>;
      if (typeof attrs.src === "string") {
        urls.add(attrs.src);
      }
    }
    if (obj.content) {
      extractUrlsFromContent(obj.content, urls);
    }
  }
}
