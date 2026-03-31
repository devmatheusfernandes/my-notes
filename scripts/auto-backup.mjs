import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { google } from "googleapis";

const FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function initFirebase() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(FIREBASE_CONFIG),
      storageBucket: `${FIREBASE_CONFIG.projectId}.firebasestorage.app`
    });
  }
}

async function getDriveClient(refreshToken) {
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oAuth2Client });
}

async function performBackup(userId, refreshToken, db, storage) {
  try {
    const drive = await getDriveClient(refreshToken);

    // Aggregation (using Admin SDK)
    const [notesSnap, foldersSnap, tagsSnap] = await Promise.all([
      db.collection("notes").where("userId", "==", userId).get(),
      db.collection("folders").where("userId", "==", userId).get(),
      db.collection("tags").where("userId", "==", userId).get(),
    ]);

    const rawNotes = notesSnap.docs.map(d => d.data());
    const folders = foldersSnap.docs.map(d => d.data());
    const tags = tagsSnap.docs.map(d => d.data());

    // Fetch PDFs from Storage and Base64 Encode
    const notesWithFiles = await Promise.all(rawNotes.map(async (note) => {
      if (note.type === "pdf" && note.fileUrl) {
        try {
          const pathMatch = note.fileUrl.match(/\/o\/([^?]+)/);
          if (pathMatch) {
            const path = decodeURIComponent(pathMatch[1]);
            const [file] = await storage.bucket().file(path).download();
            const base64 = file.toString("base64");
            return { ...note, fileBase64: `data:application/pdf;base64,${base64}` };
          }
        } catch (err) {
          console.warn(`[${userId}] Failed to download PDF for note ${note.id}: ${err.message}`);
        }
      }
      return note;
    }));

    const payload = {
      exportedAt: new Date().toISOString(),
      notes: notesWithFiles,
      folders,
      tags
    };

    const json = JSON.stringify(payload, null, 2);
    const filename = `capynotes-backup-${new Date().toISOString().replace(/[:\.]/g, "-")}.json`;

    // Ensure Folder
    let folderId;
    const folderSearch = await drive.files.list({
      q: "name = 'CapyNotes Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id,name)",
      spaces: "drive"
    });

    if (folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      const folderCreate = await drive.files.create({
        resource: { name: "CapyNotes Backups", mimeType: "application/vnd.google-apps.folder" },
        fields: "id"
      });
      folderId = folderCreate.data.id;
    }

    // Upload
    await drive.files.create({
      resource: { name: filename, parents: [folderId] },
      media: { mimeType: "application/json", body: json },
      fields: "id"
    });

    // Update settings: lastBackupAt
    await db.collection("userSettings").doc(userId).update({
      lastBackupAt: new Date().toISOString()
    });

    console.log(`[${userId}] Backup successful!`);
  } catch (err) {
    console.error(`[${userId}] Backup failed: ${err.message}`);
  }
}

async function runAutoBackup() {
  initFirebase();
  const db = getFirestore();
  const storage = getStorage();

  const currentHour = new Date().getHours();
  console.log(`Running auto-backup check at hour: ${currentHour}`);

  const snapshot = await db.collection("userSettings").where("autoBackupEnabled", "==", true).get();

  if (snapshot.empty) {
    console.log("No users with auto-backup enabled.");
    return;
  }

  for (const doc of snapshot.docs) {
    const settings = doc.data();
    const userId = doc.id;
    const refreshToken = settings.driveRefreshToken;

    if (!refreshToken) {
      console.log(`[${userId}] Skipping: No Drive refresh token.`);
      continue;
    }

    const lastBackup = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null;
    const hoursSinceLast = lastBackup ? (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60) : 999;

    if (hoursSinceLast > 20) {
      console.log(`[${userId}] Triggering backup...`);
      await performBackup(userId, refreshToken, db, storage);
    } else {
      console.log(`[${userId}] Already backed up recently.`);
    }
  }
}

runAutoBackup().catch(err => {
  console.error("Auto-backup script crashed:", err);
  process.exit(1);
});
