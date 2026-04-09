import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { and, eq, sql, or } from "drizzle-orm";

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
    sourceType: "note" | "video" | "publication";
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
  },

  async getExistingSourceIdsByPrefix(userId: string, prefix: string, sourceType: "note" | "video" | "publication") {
    const results = await db
      .select({ sourceId: embeddingsQueue.sourceId })
      .from(embeddingsQueue)
      .where(
        and(
          eq(embeddingsQueue.userId, userId),
          eq(embeddingsQueue.sourceType, sourceType),
          sql`${embeddingsQueue.sourceId} LIKE ${prefix + "%"}`
        )
      );
    
    return results.map(r => r.sourceId);
  },

  async getRemotePublicationSymbols(userId: string) {
    const results = await db
      .select({ sourceId: embeddingsQueue.sourceId })
      .from(embeddingsQueue)
      .where(
        and(
          eq(embeddingsQueue.userId, userId),
          eq(embeddingsQueue.sourceType, "publication")
        )
      );
    
    // Extract symbol: everything before the last hyphen to handle symbols with internal hyphens
    const symbols = new Set(results.map(r => {
      const lastHyphenIndex = r.sourceId.lastIndexOf("-");
      return lastHyphenIndex !== -1 ? r.sourceId.substring(0, lastHyphenIndex) : r.sourceId;
    }));
    
    return Array.from(symbols);
  },

  async getPublicationContent(userId: string, symbol: string) {
    const results = await db
      .select()
      .from(embeddingsQueue)
      .where(
        and(
          eq(embeddingsQueue.userId, userId),
          eq(embeddingsQueue.sourceType, "publication"),
          sql`${embeddingsQueue.sourceId} LIKE ${symbol + "-%"}`
        )
      );
    
    return results;
  },

  async getSyncedIds(userId: string) {
    const results = await db
      .select({ 
        sourceId: embeddingsQueue.sourceId,
        sourceType: embeddingsQueue.sourceType 
      })
      .from(embeddingsQueue)
      .where(
        and(
          or(
            eq(embeddingsQueue.userId, userId),
            eq(embeddingsQueue.userId, "shared")
          ),
          eq(embeddingsQueue.syncStatus, "synced")
        )
      );
    
    return results;
  }
};


