import { indexedDbService } from "./indexedDbService";
import { BIBLE_BOOKS_PT } from "@/data/constants/bible-books-pt";

export interface PublicationContent {
  title: string;
  bookTitle: string;
  content: string; // HTML if paragraph, else string context
  text: string;    // Plain text version
}

export const publicationService = {
  /**
   * Parse a jwpub bible URL into its components
   * Example: jwpub://b/NWTR/45:12:11
   */
  parseBibleUrl(url: string) {
    if (!url.startsWith("jwpub://b/")) return null;

    const parts = url.replace("jwpub://b/", "").split("/");
    const version = parts[0]; // NWTR, etc
    const ref = parts[1] || "";

    // 45:12:11 or 23:55:12:15 or 50:4:6:4:7
    const [bookIdStr, chapterStr, ...versesStr] = ref.split(":");
    const bookNum = parseInt(bookIdStr, 10);
    const chapter = parseInt(chapterStr, 10);
    const rawVerses = versesStr.map(v => parseInt(v, 10)).filter(v => !isNaN(v));

    // Deduplicate and filter out chapter markers (e.g., the '4' in 50:4:6:4:7)
    // A chapter number in the verse list is only kept if it's the only verse 
    // or if it's contiguous with other verses (likely a range).
    let uniqueVerses = [...new Set(rawVerses)];
    if (uniqueVerses.length > 1 && uniqueVerses.includes(chapter)) {
      const isUseful = uniqueVerses.includes(chapter - 1) || uniqueVerses.includes(chapter + 1);
      if (!isUseful) {
        uniqueVerses = uniqueVerses.filter(v => v !== chapter);
      }
    }
    uniqueVerses.sort((a, b) => a - b);

    // Book 1 is Genesis (Index 0). So Index = BookNum - 1.
    const bookName = BIBLE_BOOKS_PT[bookNum - 1];

    if (!bookName) return null;

    let finalVerses = uniqueVerses;
    // If exactly two verses are provided (e.g., 12:15), assume it's a range
    if (uniqueVerses.length === 2 && uniqueVerses[0] < uniqueVerses[1]) {
      finalVerses = [];
      for (let v = uniqueVerses[0]; v <= uniqueVerses[1]; v++) {
        finalVerses.push(v);
      }
    }

    return {
      version,
      book: bookName,
      chapter,
      verses: finalVerses
    };
  },

  /**
   * Parse a jwpub URL into its components
   * Example: jwpub://p/SYMBOL/CHAPTER:PARAGRAPH
   */
  parseJwpubUrl(url: string) {
    if (!url.startsWith("jwpub://p/")) return null;

    // Remove prefix and split
    const parts = url.replace("jwpub://p/", "").split("/");
    const symbol = parts[0];
    const ref = parts[1] || "0";

    const [chapterStr, paragraphStr] = ref.split(":");
    return {
      symbol,
      chapterIndex: parseInt(chapterStr, 10) || 0,
      paragraphIndex: paragraphStr ? parseInt(paragraphStr, 10) : undefined
    };
  },

  /**
   * Fetches content from IndexedDB based on a symbol, chapter, and optional paragraph
   */
  async getContent(symbol: string, chapterIndex: number, paragraphIndex?: number): Promise<PublicationContent | null> {
    const pub = await indexedDbService.getPublication(symbol);
    if (!pub) return null;

    const chapter = pub.chapters[chapterIndex];
    if (!chapter) return null;

    if (paragraphIndex !== undefined) {
      const paragraph = chapter.paragraphs?.[paragraphIndex];
      if (paragraph) {
        return {
          title: chapter.title,
          bookTitle: pub.title,
          content: paragraph.html,
          text: paragraph.content
        };
      }
    }

    // Default to chapter level info if no paragraph specified or found
    return {
      title: chapter.title,
      bookTitle: pub.title,
      content: chapter.html,
      text: chapter.title
    };
  },

  /**
   * Mock for future full-text search across all local publications
   */
  async search(query: string) {
    console.warn("Search for publications is not yet implemented. Query:", query);
    // Idea: store.getAll() and filter by text content, or use a separate full-text index
    return [];
  }
};
