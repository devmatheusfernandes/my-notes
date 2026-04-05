import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getUserFromSession();

    const result = await db
      .select({
        pending: sql`count(*) FILTER (WHERE sync_status = 'pending')`,
        synced: sql`count(*) FILTER (WHERE sync_status = 'synced')`,
        error: sql`count(*) FILTER (WHERE sync_status = 'error')`,
        total: sql`count(*)`,
      })
      .from(embeddingsQueue)
      .where(
        eq(embeddingsQueue.userId, user.uid)
      );

    const counts = result[0] || { pending: 0, synced: 0, error: 0, total: 0 };
    
    // Format response
    return NextResponse.json({
        pending: Number(counts.pending || 0),
        synced: Number(counts.synced || 0),
        error: Number(counts.error || 0),
        total: Number(counts.total || 0),
        isComplete: Number(counts.pending || 0) === 0
    });
  } catch (error: unknown) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 401 });
  }
}
