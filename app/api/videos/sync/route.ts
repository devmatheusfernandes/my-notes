import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { VIDEOS_COLLECTION } from "@/lib/firebase/collections-name";
import { vectorService } from "@/services/vectorService";
import { VideoData } from "@/schemas/videos";

export async function POST() {
  try {
    // Ensuring the user is authenticated to trigger the sync
    await getUserFromSession();

    const snapshot = await adminDb.collection(VIDEOS_COLLECTION).get();
    const videos: VideoData[] = [];
    
    snapshot.forEach(doc => {
        videos.push(doc.data() as VideoData);
    });

    const vectorVideos = videos
        .filter(v => !!v.contentText || !!v.title)
        .map(v => ({
            userId: "shared", // Public for all authenticated users
            sourceId: v.id,
            sourceType: "video" as const,
            content: `${v.title}\n${v.contentText || ""}`,
        }));

    await vectorService.queueMany(vectorVideos);
    
    return NextResponse.json({ success: true, count: vectorVideos.length });
  } catch (error: unknown) {
    console.error("Erro na rota de sincronização de vídeos:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
