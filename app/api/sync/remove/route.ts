import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { db } from "@/lib/db/turso";
import { embeddingsQueue } from "@/lib/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceIds, sourceType } = await req.json();

    if (!Array.isArray(sourceIds) || !sourceType) {
      return NextResponse.json({ error: "Invalid request. Provide sourceIds (array) and sourceType." }, { status: 400 });
    }

    if (sourceIds.length === 0) {
      return NextResponse.json({ success: true, removedCount: 0 });
    }

    // Only allow users to delete their own data
    await db
      .delete(embeddingsQueue)
      .where(
        and(
          eq(embeddingsQueue.sourceType, sourceType),
          inArray(embeddingsQueue.sourceId, sourceIds),
          or(
            eq(embeddingsQueue.userId, user.uid)
          )
        )
      );

    return NextResponse.json({ success: true, removedCount: sourceIds.length });
  } catch (error: unknown) {
    console.error("Sync Remove Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
