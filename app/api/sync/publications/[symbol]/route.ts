import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth-server";
import { vectorService } from "@/services/vectorService";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol } = await params;
    if (!symbol) {
      return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const infoOnly = searchParams.get("info") === "true";
    const idsParam = searchParams.get("ids");
    const ids = idsParam ? idsParam.split(",") : null;

    if (infoOnly) {
        // Just return the list of chapter IDs and title for the skeleton
        const content = await vectorService.getPublicationContent(user.uid, symbol);
        
        // Extract title from the first one
        const publicationTitle = content.length > 0 
            ? content[0].contentToEmbed.split(" - ")[0] 
            : symbol;

        const chapterIds = content.map(item => {
            const lastHyphenIndex = item.sourceId.lastIndexOf("-");
            return lastHyphenIndex !== -1 ? item.sourceId.substring(lastHyphenIndex + 1) : item.sourceId;
        });

        return NextResponse.json({ 
            symbol, 
            title: publicationTitle, 
            chapterIds 
        });
    }

    let content;
    if (ids) {
        // Fetch specific chapters
        // We need a way to fetch by specific sourceIds in vectorService
        const sourceIds = ids.map(id => `${symbol}-${id}`);
        // For simplicity, we can just use getPublicationContent and filter, 
        // but let's assume we might want to optimize this later.
        const allContent = await vectorService.getPublicationContent(user.uid, symbol);
        content = allContent.filter(item => sourceIds.includes(item.sourceId));
    } else {
        content = await vectorService.getPublicationContent(user.uid, symbol);
    }
    
    // Transform content back into a format suitable for IndexedDB (lite version)
    const processedChapters = content.map(item => {
      const parts = item.contentToEmbed.split("\n");
      const firstLine = parts[0] || "";
      const titleMatch = firstLine.match(/^(.*) - (.*)$/);
      
      const chapterTitle = titleMatch ? titleMatch[2] : "Capítulo";
      const paragraphsContent = parts.slice(1);

      // Extract chapter ID from sourceId (symbol-chapterId)
      const lastHyphenIndex = item.sourceId.lastIndexOf("-");
      const chapterId = lastHyphenIndex !== -1 ? item.sourceId.substring(lastHyphenIndex + 1) : item.sourceId;

      return {
        id: chapterId,
        title: chapterTitle,
        paragraphs: paragraphsContent.map((p, idx) => ({
          index: idx,
          type: "p" as const,
          content: p,
          html: `<p>${p}</p>`,
          images: [],
          references: [],
        })),
        html: `<h1>${chapterTitle}</h1>${paragraphsContent.map(p => `<p>${p}</p>`).join("")}`
      };
    });

    const publicationTitle = processedChapters.length > 0 
      ? content[0].contentToEmbed.split(" - ")[0] 
      : symbol;

    return NextResponse.json({
        symbol,
        title: publicationTitle,
        chapters: processedChapters,
        lastAccessed: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error("Fetch Publication Content Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
