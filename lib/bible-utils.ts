import { normalizeBookToken } from "@/data/constants/bible-abreviations";

export interface ParsedReference {
  book: string;
  chapter: number;
  verses: number[];
  range?: { start: number; end: number };
}

/**
 * Parses a Bible reference string like:
 * - "Ge 1:1"
 * - "Ge 1:1-5"
 * - "Ge 1:2, 6, 12"
 */
export function parseBibleReference(ref: string): ParsedReference | null {
  const trimmed = ref.trim();
  // Match pattern: [Book] [Chapter]:[Verses]
  const match = trimmed.match(/^(.+?)\s+(\d+)[:\s]+([\d\s,\-]+)$/);

  if (!match) return null;

  const bookToken = match[1];
  const chapter = parseInt(match[2], 10);
  const versesPart = match[3];

  const book = normalizeBookToken(bookToken);
  if (!book) return null;

  let verses: number[] = [];
  let range: { start: number; end: number } | undefined = undefined;

  if (versesPart.includes("-")) {
    const parts = versesPart.split("-").map(p => parseInt(p.trim(), 10));
    if (parts.length === 2) {
      range = { start: parts[0], end: parts[1] };
      for (let i = parts[0]; i <= parts[1]; i++) {
        verses.push(i);
      }
    }
  } else if (versesPart.includes(",")) {
    verses = versesPart.split(",").map(p => parseInt(p.trim(), 10));
  } else {
    verses = [parseInt(versesPart.trim(), 10)];
  }

  return { book, chapter, verses, range };
}

/**
 * Fetches Bible text for a given reference string.
 * Used for tooltips or easily referencing parts of the bible.
 */
export async function getBibleText(ref: string, version: string = "NWT"): Promise<string> {
  const parsed = parseBibleReference(ref);
  if (!parsed) return "Referência inválida";

  try {
    const response = await fetch(`/api/bible?v=${version}&b=${encodeURIComponent(parsed.book)}&c=${parsed.chapter}`);
    if (!response.ok) return "Erro ao buscar texto";

    const data = await response.json();
    const verses = data.verses as { verse: number; text: string }[];

    const selected = verses.filter(v => parsed.verses.includes(v.verse));

    if (selected.length === 0) return "Versículos não encontrados";

    return selected.map(v => `${v.verse} ${v.text}`).join(" ");

  } catch (e) {
    console.error("Error fetching bible text:", e);
    return "Erro de conexão";
  }
}
