import { NextResponse } from "next/server";
import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-2-preview" });

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch up to 50 pending records
    const pendingItems = await db
      .select()
      .from(embeddingsQueue)
      .where(eq(embeddingsQueue.syncStatus, "pending"))
      .limit(50);

    if (pendingItems.length === 0) {
      return NextResponse.json({ message: "No pending items found" });
    }

    // Process in batch
    for (const item of pendingItems) {
      try {
        const result = await model.embedContent(item.contentToEmbed);
        const embeddingArray = result.embedding.values;

        // Convert float array to f32 blob (Buffer)
        const buffer = Buffer.alloc(embeddingArray.length * 4);
        embeddingArray.forEach((val, i) => buffer.writeFloatLE(val, i * 4));

        await db
          .update(embeddingsQueue)
          .set({
            embedding: buffer,
            syncStatus: "synced",
            updatedAt: new Date(),
          })
          .where(eq(embeddingsQueue.id, item.id));
      } catch (err) {
        console.error(`Error embedding item ${item.id}:`, err);
        await db
          .update(embeddingsQueue)
          .set({
            syncStatus: "error",
            updatedAt: new Date(),
          })
          .where(eq(embeddingsQueue.id, item.id));
      }
    }

    return NextResponse.json({ success: true, processed: pendingItems.length });
  } catch (error: unknown) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
