import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { LETTERS_COLLECTION_NAME } from "@/lib/firebase/collections-name";
import { db as tursoDb } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting cleanup of expired letters...");
    const now = new Date().toISOString();

    // Busca cartas onde expiresAt é anterior a agora
    const expiredLettersSnap = await adminDb
      .collection(LETTERS_COLLECTION_NAME)
      .where("expiresAt", "<", now)
      .get();

    let deletedCount = 0;

    if (expiredLettersSnap.empty) {
      return NextResponse.json({
        success: true,
        message: "No expired letters found.",
        deletedCount: 0,
      });
    }

    const batch = adminDb.batch();
    expiredLettersSnap.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();

    // Remove from Vector Search (RAG)
    try {
      const expiredIds = expiredLettersSnap.docs.map(doc => doc.id);
      
      // Process in chunks to avoid SQLite limits
      const CHUNK_SIZE = 500;
      for (let i = 0; i < expiredIds.length; i += CHUNK_SIZE) {
        const chunk = expiredIds.slice(i, i + CHUNK_SIZE);
        await tursoDb
          .delete(embeddingsQueue)
          .where(
            and(
              eq(embeddingsQueue.sourceType, "letter"),
              inArray(embeddingsQueue.sourceId, chunk)
            )
          );
      }
      console.log(`Successfully removed ${expiredIds.length} expired letters from RAG queue.`);
    } catch (ragError) {
      console.error("Error removing expired letters from RAG queue:", ragError);
      // We don't fail the whole operation if RAG cleanup fails, but we log it
    }

    console.log(`Cleanup finished. Deleted ${deletedCount} expired letters.`);

    return NextResponse.json({
      success: true,
      message: `Cleanup finished. Deleted ${deletedCount} letters.`,
      deletedCount,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Cleanup Letters Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
