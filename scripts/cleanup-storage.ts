import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";

// 1. Initialization
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), "serviceAccount.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH) && !process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Error: serviceAccount.json not found and FIREBASE_SERVICE_ACCOUNT env var not set.");
  process.exit(1);
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });
}

const db = getFirestore();
const storage = getStorage();
const bucket = storage.bucket();

const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000; // 48 hours

async function cleanupOrphanedMedia() {
  console.log("Starting cleanup of orphaned storage files...");
  const now = Date.now();

  // 1. Fetch all notes to index active URLs
  const notesSnap = await db.collection("notes").get();
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
  const mediaSnap = await db.collection("media").get();
  let deletedCount = 0;
  let deletedBytes = 0;

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
          await db.collection("usage").doc(media.userId).update({
            totalBytesUsed: FieldValue.increment(-media.size),
            uploadCount: FieldValue.increment(-1)
          });

          deletedCount++;
          deletedBytes += media.size;
        } catch (err) {
          console.error(`Failed to delete ${media.storagePath}:`, err);
        }
      } else {
        console.log(`Orphaned media ${mediaDoc.id} is still in grace period.`);
      }
    }
  }

  console.log(`Cleanup finished. Deleted ${deletedCount} files (${(deletedBytes / (1024 * 1024)).toFixed(2)} MB).`);
}

function extractUrlsFromContent(content: unknown, urls: Set<string>) {
  if (!content) return;
  if (Array.isArray(content)) {
    content.forEach(item => extractUrlsFromContent(item, urls));
  } else if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (obj.type === 'image' && obj.attrs && typeof obj.attrs === 'object') {
      const attrs = obj.attrs as Record<string, unknown>;
      if (typeof attrs.src === 'string') {
        urls.add(attrs.src);
      }
    }
    if (obj.content) {
      extractUrlsFromContent(obj.content, urls);
    }
  }
}

cleanupOrphanedMedia().catch(err => {
  console.error("Error during cleanup:", err);
  process.exit(1);
});
