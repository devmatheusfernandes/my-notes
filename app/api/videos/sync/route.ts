import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { TEST_VIDEOS_COLLECTION } from "@/lib/firebase/collections-name";
import { vectorService } from "@/services/vectorService";
import { VideoData } from "@/schemas/videos";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Check for Bearer token (Cron Job) or Session (Manual)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        await getUserFromSession();
    }

    const snapshot = await adminDb.collection(TEST_VIDEOS_COLLECTION).get();
    const videos: VideoData[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as VideoData;
      videos.push({
        ...data,
        id: data.id || doc.id // Garante que o ID existe (do dado ou do documento)
      });
    });

    const vectorVideos = videos
      .filter(v => (v.title || v.contentText)) // Filtra se tiver alguma coisa
      .map(v => ({
        userId: "shared",
        sourceId: v.id,
        sourceType: "video" as const,
        content: `${v.title || "Sem título"}\n${v.contentText || ""}`,
      }));

    await vectorService.queueMany(vectorVideos);

    return NextResponse.json({ success: true, count: vectorVideos.length });
  } catch (error: unknown) {
    console.error("Erro na rota de sincronização de vídeos:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
