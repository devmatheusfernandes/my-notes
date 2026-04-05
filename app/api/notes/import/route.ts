import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { noteService } from "@/services/noteService";
import { z } from "zod";

const importSchema = z.array(z.any()); // Simplified check as noteService handles parsing

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    const body = await req.json();
    
    const validatedData = importSchema.parse(body);

    await noteService.createManyNotes(user.uid, validatedData);

    return NextResponse.json({ success: true, count: validatedData.length });
  } catch (error: unknown) {
    console.error("Erro na rota de importação:", error);
    const message = error instanceof Error ? error.message : "Erro interno no servidor";
    return NextResponse.json(
      { error: message },
      { status: message?.includes("Não autorizado") ? 401 : 500 }
    );
  }
}
