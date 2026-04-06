import { NextResponse } from "next/server";
import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromSession } from "@/utils/auth-server";
import { creditService } from "@/services/creditService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "user";
    const targetUserId = type === "shared" ? "shared" : user.uid;

    // 1. Credit Check (only for user-owned processing)
    if (type !== "shared") {
      const hasCredits = await creditService.hasCredits(user.uid);
      if (!hasCredits) {
        return NextResponse.json(
          { error: "Limite de créditos de IA atingido para este mês." },
          { status: 403 }
        );
      }
    }

    // Fetch up to 50 pending records specifically for the target context
    const pendingItems = await db
      .select()
      .from(embeddingsQueue)
      .where(
        and(
          eq(embeddingsQueue.syncStatus, "pending"),
          eq(embeddingsQueue.userId, targetUserId)
        )
      )
      .limit(50);

    if (pendingItems.length === 0) {
      return NextResponse.json({ message: "Nenhum item pendente encontrado para este usuário." });
    }

    // 2. Process in Gemini Batch
    const batchRequests = pendingItems.map(item => ({
      content: { role: "user", parts: [{ text: item.contentToEmbed }] }
    }));

    const result = await model.batchEmbedContents({
      requests: batchRequests,
    });

    // 3. Prepare Database and Firestore Batch Operations
    const dbUpdates = [];
    const logPromises = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      const embedding = result.embeddings[i];

      if (!embedding || !embedding.values) {
        //console.error(`[VECTOR-MANUAL] Erro ao gerar embedding para item ${item.id}`);
        dbUpdates.push(
          db.update(embeddingsQueue)
            .set({ syncStatus: "error", updatedAt: new Date() })
            .where(eq(embeddingsQueue.id, item.id))
        );
        errorCount++;
        continue;
      }

      // Convert float array to f32 blob (Buffer)
      const buffer = Buffer.alloc(embedding.values.length * 4);
      embedding.values.forEach((val, index) => buffer.writeFloatLE(val, index * 4));

      // Prepare sync update
      dbUpdates.push(
        db.update(embeddingsQueue)
          .set({
            embedding: buffer,
            syncStatus: "synced",
            updatedAt: new Date(),
          })
          .where(eq(embeddingsQueue.id, item.id))
      );

      // Accumulate credit logs
      if (targetUserId !== "shared") {
        logPromises.push(creditService.logTransaction({
          userId: user.uid,
          amount: 1,
          type: "manual_process",
          details: { sourceId: item.id, sourceType: item.sourceType }
        }));
      }

      successCount++;
    }

    // 4. Execute all updates
    if (dbUpdates.length > 0) {
      await db.batch(dbUpdates as unknown as [Parameters<typeof db.batch>[0][0], ...Parameters<typeof db.batch>[0][0][]]);
    }

    // Parallel Firestore updates
    if (targetUserId !== "shared" && successCount > 0) {
      await Promise.all([
        creditService.deductCredits(user.uid, successCount),
        ...logPromises
      ]);
    }

    return NextResponse.json({
      success: true,
      processed: pendingItems.length,
      successCount,
      errorCount
    });
  } catch (error: unknown) {
    console.error("Manual Process Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
