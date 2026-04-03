import { JwpubParagraph } from "@/schemas/jwpubSchema";
import { indexedDbService } from "@/services/indexedDbService";

export interface JwpubParsedReference {
  symbol: string;
  chapterId?: string;
  page?: number;
  startParagraph?: number;
  endParagraph?: number;
  isExplicitParagraph?: boolean; // If true, search by paragraphNumber field
  isLogicalChapter?: boolean;    // If true, prioritize searching for "Capítulo X" or "Lição X"
}

export const jwpubReference = {
  /**
   * Parses a wide range of JW reference formats.
   * Examples:
   * - "w95 15/2 p. 14 par. 2"
   * - "w21.05 p. 15 par. 4"
   * - "w22.02 4 §§ 7 - 8"
   * - "it-1 p. 250 par. 3"
   * - "cl cap. 15 p. 150 par. 5"
   * - Legado: "wp23 4:5-7"
   */
  parseReferenceString(query: string): JwpubParsedReference | null {
    const q = query.trim();

    // 1. Flexible format: [Symbol] [Optional Chapter/Article] [Optional Page] [Optional Paragraph]
    // Captures the keyword (cap, lição, etc) in match[2]
    const flexibleRegex = /^([a-zA-Z0-9.-]+)(?:\s+(cap\.|capítulo|lição|article|[\d\/]+)?\s*([\w\/]+))?(?:\s+(?:p\.|pág\.|pag\.)\s*(\d+))?(?:\s+(?:par\.|pars\.|pp\.|\§\§|\§)\s*(\d+)(?:\s*-\s*(\d+))?)?$/i;
    let match = q.match(flexibleRegex);

    if (match && (match[3] || match[4] || match[5])) {
      const keyword = match[2]?.toLowerCase() || "";
      const isLogical = keyword.includes("cap") || keyword.includes("liç") || keyword.includes("lic");
      const hasExplicitPar = !!match[5];
      
      return {
        symbol: match[1],
        chapterId: match[3],
        page: match[4] ? parseInt(match[4], 10) : undefined,
        startParagraph: match[5] ? parseInt(match[5], 10) : undefined,
        endParagraph: match[6] ? parseInt(match[6], 10) : (match[5] ? parseInt(match[5], 10) : undefined),
        isExplicitParagraph: hasExplicitPar,
        isLogicalChapter: isLogical
      };
    }

    // 2. Format: [Symbol] [Chapter]:[Paragraphs] (legacy/bible-style)
    const legacyRegex = /^([a-zA-Z0-9.-]+)\s+([\w\/]+):(\d+)(?:-(\d+))?$/;
    match = q.match(legacyRegex);
    if (match) {
      return {
        symbol: match[1],
        chapterId: match[2],
        startParagraph: parseInt(match[3], 10),
        endParagraph: match[4] ? parseInt(match[4], 10) : parseInt(match[3], 10),
        isExplicitParagraph: false // Legacy uses index
      };
    }

    return null;
  },

  /**
   * Retrieves specific paragraphs from IndexedDB based on a reference string
   */
  async getReferencedContent(query: string): Promise<JwpubParagraph[]> {
    const ref = this.parseReferenceString(query);
    if (!ref) return [];

    const pub = await indexedDbService.getPublication(ref.symbol);
    if (!pub) return [];

    let chapter = null;
    if (ref.chapterId) {
      const searchId = ref.chapterId.toLocaleLowerCase();
      
      // If logical chapter (cap. or lição), prioritize searching in content/title
      if (ref.isLogicalChapter) {
        // Pattern: [Term] [number] [non-digit or end]
        const pattern = new RegExp(`^\\s*(capítulo|lição|chapter|lesson)\\s+${searchId}(\\b|:|\\s)`, 'i');
        chapter = pub.chapters.find(c => 
          pattern.test(c.title) || 
          c.paragraphs.slice(0, 5).some(p => pattern.test(p.content))
        );
      }

      // Fallback to ID or normal title search if not found yet
      if (!chapter) {
        chapter = pub.chapters.find(c => 
          c.id.toLocaleLowerCase() === searchId || 
          c.title.toLocaleLowerCase().includes(searchId)
        );
      }
    }

    // If no chapter found by ID/Title, and we have a page, search chapters for that page
    if (!chapter && ref.page) {
      chapter = pub.chapters.find(c => c.paragraphs.some(p => p.page === ref.page));
    }

    if (!chapter) return [];

    return chapter.paragraphs.filter(p => {
      // Filter by Page if specified
      if (ref.page && p.page !== ref.page) return false;

      // Filter by Paragraph
      if (ref.startParagraph !== undefined && ref.endParagraph !== undefined) {
        const val = ref.isExplicitParagraph ? p.paragraphNumber : p.index;
        if (val === undefined) return false;
        return val >= ref.startParagraph && val <= ref.endParagraph;
      }

      return true;
    });
  }
};
