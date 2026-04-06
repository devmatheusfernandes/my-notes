import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export const searchService = {
  async semanticSearch(queryText: string, userId: string, limit: number = 20) {
    // 1. Generate embedding for the query
    const result = await model.embedContent(queryText);
    const embeddingArray = result.embedding.values;

    // 2. Convert to f32 blob for comparison
    const buffer = Buffer.alloc(embeddingArray.length * 4);
    embeddingArray.forEach((val, i) => buffer.writeFloatLE(val, i * 4));

    // 3. Search in Turso
    // Using libSQL's vector_distance_cos extension. 
    // Filter: User's notes OR Shared videos.
    const results = await db
      .select({
        id: embeddingsQueue.id,
        sourceId: embeddingsQueue.sourceId,
        sourceType: embeddingsQueue.sourceType,
        content: embeddingsQueue.contentToEmbed,
        score: sql<number>`vector_distance_cos(${embeddingsQueue.embedding}, ${buffer})`
      })
      .from(embeddingsQueue)
      .where(
        and(
          eq(embeddingsQueue.syncStatus, 'synced'),
          or(
            eq(embeddingsQueue.userId, userId),
            eq(embeddingsQueue.userId, 'shared')
          )
        )
      )
      .orderBy(sql`vector_distance_cos(${embeddingsQueue.embedding}, ${buffer}) ASC`)
      .limit(limit);

    return results;
  }
};
