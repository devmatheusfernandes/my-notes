import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const vectorService = {
  async queueForEmbedding(params: {
    userId: string;
    sourceId: string;
    sourceType: "note" | "video";
    content: string;
  }) {
    const { userId, sourceId, sourceType, content } = params;
    
    await db.insert(embeddingsQueue).values({
      userId,
      sourceId,
      sourceType,
      contentToEmbed: content,
      syncStatus: "pending",
      embedding: null,
    }).onConflictDoUpdate({
      target: [embeddingsQueue.sourceId, embeddingsQueue.sourceType],
      set: {
        contentToEmbed: content,
        syncStatus: "pending",
        embedding: null,
        updatedAt: new Date(),
      }
    });
  },

  async queueMany(items: {
    userId: string;
    sourceId: string;
    sourceType: "note" | "video";
    content: string;
  }[]) {
    if (items.length === 0) return;
    
    const values = items.map(item => ({
      userId: item.userId,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      contentToEmbed: item.content,
      syncStatus: "pending" as const,
    }));

    await db.insert(embeddingsQueue).values(values).onConflictDoUpdate({
        target: [embeddingsQueue.sourceId, embeddingsQueue.sourceType],
        set: {
            contentToEmbed: sql`excluded.content_to_embed`,
            syncStatus: 'pending',
            embedding: null,
            updatedAt: new Date(),
        }
    });
  }
};


