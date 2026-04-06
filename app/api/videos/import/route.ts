import { NextResponse } from "next/server";
import { importAllVideos } from "@/scripts/importAllVideos";
import { getUserFromSession } from "@/utils/auth-server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Check for Bearer token (Cron Job) or Session (Manual)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Se não for o segredo do cron, exige sessão de usuário (para teste manual na UI)
        await getUserFromSession();
    }

    console.log("🚀 Iniciando importação semanal de vídeos via API...");
    await importAllVideos();
    
    return NextResponse.json({ 
        success: true, 
        message: "Importação de novos vídeos concluída com sucesso" 
    });
  } catch (error: unknown) {
    console.error("Erro na rota de importação de vídeos:", error);
    return NextResponse.json(
        { error: error instanceof Error ? error.message : "Erro desconhecido durante a importação" }, 
        { status: 500 }
    );
  }
}
