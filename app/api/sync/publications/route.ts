import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { vectorService } from "@/services/vectorService";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const symbols = await vectorService.getRemotePublicationSymbols(user.uid);
    return NextResponse.json({ symbols });
  } catch (error: unknown) {
    console.error("Fetch Remote Symbols Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
