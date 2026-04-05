import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { NOTES_COLLECTION_NAME, VIDEOS_COLLECTION } from "@/lib/firebase/collections-name";
import { vectorService } from "@/services/vectorService";
import { extractTextFromTiptap } from "@/lib/notes/extract-text";
import { Note } from "@/schemas/noteSchema";
import { VideoData } from "@/schemas/videos";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Sync Notes
    const notesSnapshot = await adminDb
      .collection(NOTES_COLLECTION_NAME)
      .where("updatedAt", ">=", last24h)
      .get();
    
    const notesToSync = notesSnapshot.docs.map(doc => {
        const data = doc.data() as Note;
        return {
            userId: data.userId,
            sourceId: data.id,
            sourceType: "note" as const,
            content: `${data.title}\n${extractTextFromTiptap(data.content)}`,
        };
    });

    // Sync Videos
    const videosSnapshot = await adminDb
        .collection(VIDEOS_COLLECTION)
        .where("updatedAt", ">=", last24h)
        .get();

    const videosToSync = videosSnapshot.docs.map(doc => {
        const data = doc.data() as VideoData;
        return {
            userId: "shared",
            sourceId: data.id,
            sourceType: "video" as const,
            content: `${data.title}\n${data.contentText || ""}`,
        };
    });

    const allToSync = [...notesToSync, ...videosToSync];
    
    if (allToSync.length > 0) {
        await vectorService.queueMany(allToSync);
    }

    return NextResponse.json({ 
        success: true, 
        notesSynced: notesToSync.length, 
        videosSynced: videosToSync.length 
    });
  } catch (error: unknown) {
    console.error("Daily Sync Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
