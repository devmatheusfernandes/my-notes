import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/firebase-admin";
import { google, drive_v3 } from "googleapis";
import { Note } from "@/schemas/noteSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function getDriveClient(refreshToken: string): Promise<drive_v3.Drive> {
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: oAuth2Client });
}

async function performBackup(userId: string, refreshToken: string) {
  try {
    const drive = await getDriveClient(refreshToken);
    const bucket = adminStorage.bucket();

    // Aggregation
    const [notesSnap, foldersSnap, tagsSnap] = await Promise.all([
      adminDb.collection("notes").where("userId", "==", userId).get(),
      adminDb.collection("folders").where("userId", "==", userId).get(),
      adminDb.collection("tags").where("userId", "==", userId).get(),
    ]);

    const rawNotes = notesSnap.docs.map(d => d.data() as Note);
    const folders = foldersSnap.docs.map(d => d.data());
    const tags = tagsSnap.docs.map(d => d.data());

    // Fetch PDFs from Storage and Base64 Encode
    const notesWithFiles = await Promise.all(rawNotes.map(async (note) => {
      if (note.type === "pdf" && note.fileUrl) {
        try {
          const pathMatch = note.fileUrl.match(/\/o\/([^?]+)/);
          if (pathMatch) {
            const path = decodeURIComponent(pathMatch[1]);
            const [file] = await bucket.file(path).download();
            const base64 = file.toString("base64");
            return { ...note, fileBase64: `data:application/pdf;base64,${base64}` };
          }
        } catch (err: unknown) {
          const message = getErrorMessage(err);
          console.warn(`[${userId}] Failed to download PDF for note ${note.id}: ${message}`);
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
    let folderId: string | null | undefined;
    const folderSearch = await drive.files.list({
      q: "name = 'CapyNotes Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id,name)",
      spaces: "drive"
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      const folderCreate = await drive.files.create({
        requestBody: { name: "CapyNotes Backups", mimeType: "application/vnd.google-apps.folder" },
        fields: "id"
      });
      folderId = folderCreate.data.id;
    }

    if (!folderId) throw new Error("Could not find or create backup folder");

    // Upload
    await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType: "application/json", body: json },
      fields: "id"
    });

    // Update settings: lastBackupAt
    await adminDb.collection("userSettings").doc(userId).update({
      lastBackupAt: new Date().toISOString()
    });

    console.log(`[${userId}] Backup successful!`);
    return true;
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error(`[${userId}] Backup failed: ${message}`);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentHour = new Date().getHours();
    console.log(`Running auto-backup check at hour: ${currentHour}`);

    const snapshot = await adminDb.collection("userSettings").where("autoBackupEnabled", "==", true).get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No users with auto-backup enabled." });
    }

    const results = [];
    for (const doc of snapshot.docs) {
      const settings = doc.data();
      const userId = doc.id;
      const refreshToken = settings.driveRefreshToken;

      if (!refreshToken) {
        results.push({ userId, status: "skipped", reason: "No Drive refresh token" });
        continue;
      }

      const lastBackup = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null;
      const hoursSinceLast = lastBackup ? (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60) : 999;

      if (hoursSinceLast > 20) {
        console.log(`[${userId}] Triggering backup...`);
        const success = await performBackup(userId, refreshToken);
        results.push({ userId, status: success ? "success" : "failed" });
      } else {
        results.push({ userId, status: "skipped", reason: "Already backed up recently" });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Auto-backup Cron Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
