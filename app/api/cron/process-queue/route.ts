import { NextResponse } from "next/server";
import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { creditService } from "@/services/creditService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

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
      .limit(150);

    if (pendingItems.length === 0) {
      return NextResponse.json({ message: "No pending items found" });
    }

    // 1. Pre-filter by credits (parallel check)
    const uniqueUserIds = [...new Set(pendingItems.map(i => i.userId as string))];
    const userCreditStatus = new Map<string, boolean>();

    await Promise.all(uniqueUserIds.map(async (uid) => {
      if (uid === 'shared') {
        userCreditStatus.set(uid, true);
        return;
      }
      const has = await creditService.hasCredits(uid);
      userCreditStatus.set(uid, has);
    }));

    const validItems = pendingItems.filter(item => userCreditStatus.get(item.userId as string));

    if (validItems.length === 0) {
      //console.warn("[VECTOR-CRON] Todos os itens ignorados por falta de créditos.");
      return NextResponse.json({ message: "No items with available credits found" });
    }

    // 2. Process in Gemini Batch
    const batchRequests = validItems.map(item => ({
      content: { role: "user", parts: [{ text: item.contentToEmbed }] }
    }));

    const result = await model.batchEmbedContents({
      requests: batchRequests,
    });

    // 3. Prepare Database and Firestore Batch Operations
    const dbUpdates = [];
    const logPromises = [];
    const deductPromises: Record<string, number> = {};

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      const embedding = result.embeddings[i];

      if (!embedding || !embedding.values) {
        //console.error(`[VECTOR-CRON] Erro ao gerar embedding para item ${item.id}`);
        // Prepare update for error status
        dbUpdates.push(
          db.update(embeddingsQueue)
            .set({ syncStatus: "error", updatedAt: new Date() })
            .where(eq(embeddingsQueue.id, item.id))
        );
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

      // Accumulate credit deductions (avoiding too many parallel requests to Firestore)
      if (item.userId !== 'shared') {
        deductPromises[item.userId] = (deductPromises[item.userId] || 0) + 1;
        logPromises.push(creditService.logTransaction({
          userId: item.userId,
          amount: 1,
          type: "vectorize",
          details: { sourceId: item.sourceId, sourceType: item.sourceType }
        }));
      }
    }

    // 4. Execute all updates
    // Drizzle Batch for Turso
    if (dbUpdates.length > 0) {
      await db.batch(dbUpdates as unknown as [Parameters<typeof db.batch>[0][0], ...Parameters<typeof db.batch>[0][0][]]);
    }

    // Parallel Firestore updates
    const creditOperations = Object.entries(deductPromises).map(([uid, amount]) =>
      creditService.deductCredits(uid, amount)
    );

    await Promise.all([...creditOperations, ...logPromises]);

    //console.log(`[VECTOR-CRON] Processados: ${validItems.length} | Sucesso: ${dbUpdates.length} | Créditos deduzidos.`);

    return NextResponse.json({
      success: true,
      processed: validItems.length,
      skipped: pendingItems.length - validItems.length
    });
  } catch (error: unknown) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
