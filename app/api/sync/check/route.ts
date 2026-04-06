import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { vectorService } from "@/services/vectorService";

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol, sourceType } = await req.json();

    if (!symbol || !sourceType) {
      return NextResponse.json({ error: "Missing symbol or sourceType" }, { status: 400 });
    }

    // For publications, we check for sourceId prefix "symbol-"
    const prefix = sourceType === "publication" ? `${symbol}-` : symbol;

    const existingSourceIds = await vectorService.getExistingSourceIdsByPrefix(
      user.uid,
      prefix,
      sourceType as "note" | "video" | "publication"
    );

    return NextResponse.json({ existingSourceIds });
  } catch (error: unknown) {
    console.error("Sync Check Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
