import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { vectorService } from "@/services/vectorService";

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    interface EmbeddingItem {
      userId: string;
      sourceId: string;
      sourceType: "note" | "video";
      content: string;
    }

    // Sanitize items: ensure userId is either 'shared' or matches the current user
    const sanitizedItems = items.map((item: EmbeddingItem) => {
        const isShared = item.userId === "shared";
        return {
            ...item,
            userId: isShared ? "shared" : user.uid
        };
    });

    await vectorService.queueMany(sanitizedItems);

    return NextResponse.json({ success: true, count: sanitizedItems.length });
  } catch (error: unknown) {
    console.error("Sync Queue Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
