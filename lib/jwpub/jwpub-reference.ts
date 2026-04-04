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
  queryWord?: string;            // Quoted title search (e.g. "Amor")
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

    // 1. Flexible format: [Symbol] [Optional Quoted Word] [Optional Chapter/Article] [Optional Page] [Optional Paragraph]
    // Captures the queryWord in match[2], keyword in match[3], chapterId in match[4]
    // Now optionally handles a leading /
    const flexibleRegex = /^\/?([a-zA-Z0-9.-]+)(?:\s+"([^"]+)")?(?:\s+(cap\.|capítulo|lição|article|[\d\/]+)?\s*([\w\/]+))?(?:\s+(?:p\.|pág\.|pag\.)\s*(\d+))?(?:\s+(?:par\.|pars\.|pp\.|\§\§|\§)\s*(\d+)(?:\s*-\s*(\d+))?)?$/i;
    let match = q.match(flexibleRegex);

    if (match && (match[2] || match[4] || match[5] || match[6])) {
      const keyword = match[3]?.toLowerCase() || "";
      const isLogical = keyword.includes("cap") || keyword.includes("liç") || keyword.includes("lic");
      const hasExplicitPar = !!match[6];
      
      return {
        symbol: match[1],
        queryWord: match[2],
        chapterId: match[4],
        page: match[5] ? parseInt(match[5], 10) : undefined,
        startParagraph: match[6] ? parseInt(match[6], 10) : undefined,
        endParagraph: match[7] ? parseInt(match[7], 10) : (match[6] ? parseInt(match[6], 10) : undefined),
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

    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

    let chapter = null;
    const searchTerms = [ref.queryWord, ref.chapterId].filter(Boolean) as string[];

    for (const term of searchTerms) {
      const normTerm = normalize(term);
      const searchLower = term.toLocaleLowerCase();

      // 1. Exact Title Match (Normalized)
      chapter = pub.chapters.find(c => normalize(c.title) === normTerm);
      if (chapter) break;

      // 2. Logical Chapter Match (Priority for 'cap.', 'lição')
      if (ref.isLogicalChapter) {
        const pattern = new RegExp(`^\\s*(capítulo|lição|chapter|lesson)\\s+${searchLower}(\\b|:|\\s)`, 'i');
        chapter = pub.chapters.find(c => 
          pattern.test(c.title) || 
          c.paragraphs.slice(0, 5).some(p => pattern.test(p.content))
        );
        if (chapter) break;
      }

      // 3. Strong Tag Match (Insight Pattern)
      chapter = pub.chapters.find(c => 
        c.paragraphs.slice(0, 3).some(p => 
          normalize(p.html).includes(`<strong>${normTerm}</strong>`) ||
          normalize(p.content).startsWith(normTerm)
        )
      );
      if (chapter) break;

      // 4. Partial Title Match
      chapter = pub.chapters.find(c => normalize(c.title).includes(normTerm));
      if (chapter) break;

      // 5. Fallback to Chapter ID
      chapter = pub.chapters.find(c => c.id.toLocaleLowerCase() === searchLower);
      if (chapter) break;
    }

    // If no chapter found by ID/Title/Word, and we have a page, search chapters for that page
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
