/**
 * Simple non-AI tokenizer to normalize text for search.
 * It removes accents, punctuation, symbols, and common stopwords.
 */

const PT_STOPWORDS = new Set([
  "a", "o", "as", "os", "ao", "aos", "da", "do", "das", "dos", "de", "e", "eu", "me", "mim", "meu", "minha", 
  "meus", "minhas", "te", "ti", "teu", "tua", "teus", "tuas", "se", "si", "seu", "sua", "seus", "suas", 
  "ele", "ela", "eles", "elas", "nós", "vós", "nos", "vos", "nosso", "nossa", "nossos", "nossas", 
  "vosso", "vossa", "vossos", "vossas", "este", "esta", "estes", "estas", "aquele", "aquela", 
  "aqueles", "aquelas", "isto", "isso", "aquilo", "em", "um", "uma", "uns", "umas", "à", "às", 
  "que", "quem", "qual", "como", "onde", "quando", "por", "para", "com", "sem", "foi", "está", "estou"
]);

const EN_STOPWORDS = new Set([
  "a", "an", "the", "and", "but", "if", "or", "as", "at", "by", "for", "from", "in", "into", 
  "near", "of", "off", "on", "onto", "out", "over", "past", "to", "with", "is", "was", "were", "been"
]);

/**
 * Normalizes text by removing accents/diacritics.
 * Example: "cão" -> "cao"
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Tokenizes a string by normalizing characters, removing punctuation,
 * and filtering out common stopwords. Returns a space-separated string of unique tokens.
 */
export function tokenize(text: string | null | undefined): string {
  if (!text) return "";

  // 1. Normalize (lowercase + remove accents)
  const normalized = normalizeText(text);

  // 2. Remove punctuation and special characters, keeping only alphanumeric and spaces
  const clean = normalized.replace(/[^\w\s]/gi, " ");

  // 3. Split into words
  const words = clean.split(/\s+/);

  // 4. Filter stopwords and short words
  const tokens = Array.from(new Set(
    words.filter((word) => {
      if (word.length < 2) return false;
      if (PT_STOPWORDS.has(word)) return false;
      if (EN_STOPWORDS.has(word)) return false;
      return true;
    })
  ));

  return tokens.join(" ");
}
