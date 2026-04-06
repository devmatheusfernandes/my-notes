import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import * as admin from "firebase-admin";
import { VIDEOS_COLLECTION } from "@/lib/firebase/collections-name";
import { vectorService } from "@/services/vectorService";
import { VideoData } from "@/schemas/videos";

export async function POST(req: Request) {
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 20000; // 20 seconds limit for serverless functions
  const BATCH_SIZE = 100;
  let totalProcessed = 0;

  try {
    const authHeader = req.headers.get("authorization");
    
    // Check for Bearer token (Cron Job) or Session (Manual)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        await getUserFromSession();
    }

    while (Date.now() - startTime < MAX_RUNTIME_MS) {
      // 1. Get a batch of videos not yet synced
      // Note: `!= true` will catch `false` and `undefined` (missing field)
      const snapshot = await adminDb.collection(VIDEOS_COLLECTION)
        .where("vectorSynced", "!=", true)
        .limit(BATCH_SIZE)
        .get();

      if (snapshot.empty) break;

      const videosData: VideoData[] = [];
      const docIds: string[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as VideoData;
        const id = data.id || doc.id;
        videosData.push({ ...data, id });
        docIds.push(doc.id);
      });

      // 2. Prepare and queue for vector embedding
      const vectorVideos = videosData
        .filter(v => v.title || v.contentText)
        .map(v => ({
          userId: "shared",
          sourceId: v.id,
          sourceType: "video" as const,
          content: `${v.title || "Sem título"}\n${v.contentText || ""}`,
        }));

      if (vectorVideos.length > 0) {
        await vectorService.queueMany(vectorVideos);
      }

      // 3. Mark as synced in Firestore in bulk
      const writeBatch = adminDb.batch();
      docIds.forEach(id => {
        writeBatch.update(adminDb.collection(VIDEOS_COLLECTION).doc(id), {
          vectorSynced: true,
          vectorSyncedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await writeBatch.commit();

      totalProcessed += docIds.length;
      console.log(`✅ Sincronizados ${docIds.length} vídeos. Total nesta rodada: ${totalProcessed}`);

      // If we got fewer than BATCH_SIZE, it means we reached the end
      if (docIds.length < BATCH_SIZE) break;
    }

    return NextResponse.json({ 
      success: true, 
      processed: totalProcessed,
      finished: totalProcessed === 0 || totalProcessed % BATCH_SIZE !== 0,
      duration: `${(Date.now() - startTime) / 1000}s`
    });

  } catch (error: unknown) {
    console.error("Erro na rota de sincronização de vídeos:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erro desconhecido",
      processedSoFar: totalProcessed
    }, { status: 500 });
  }
}
