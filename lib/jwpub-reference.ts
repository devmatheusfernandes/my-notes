import { JwpubParagraph } from "@/schemas/jwpubSchema";
import { indexedDbService } from "@/services/indexedDbService";

export interface JwpubParsedReference {
  symbol: string;
  chapterId: string;
  startParagraph: number;
  endParagraph: number;
}

export const jwpubReference = {
  /**
   * Parses strings like "wp23 4:5-7" or "wp23 4:5"
   */
  parseReferenceString(query: string): JwpubParsedReference | null {
    const regex = /^([a-zA-Z0-9]+)\s+(\d+):(\d+)(?:-(\d+))?$/;
    const match = query.trim().match(regex);

    if (!match) return null;

    return {
      symbol: match[1],
      chapterId: match[2],
      startParagraph: parseInt(match[3], 10),
      endParagraph: match[4] ? parseInt(match[4], 10) : parseInt(match[3], 10),
    };
  },

  /**
   * Retrieves specific paragraphs from IndexedDB based on a reference string
   */
  async getReferencedContent(query: string): Promise<JwpubParagraph[]> {
    const ref = this.parseReferenceString(query);
    if (!ref) return [];

    const pub = await indexedDbService.getPublication(ref.symbol);
    if (!pub) return [];

    const chapter = pub.chapters.find(c => c.id === ref.chapterId || c.title.includes(ref.chapterId));
    if (!chapter) return [];

    // Filter paragraphs by index range
    return chapter.paragraphs.filter(p => p.index >= ref.startParagraph && p.index <= ref.endParagraph);
  }
};
