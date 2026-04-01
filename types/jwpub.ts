export interface JwpubReference {
  label: string;
  url: string; // Ex: jwpub://b/NWTR/45:12:11
}

export interface JwpubParagraph {
  index: number;
  type: "p" | "h1" | "h2" | "h3" | "li" | "blockquote" | "caption";
  content: string; // Plain text
  html: string;    // Formatted HTML
  images: string[]; // IDs for the image bucket store
  references: JwpubReference[];
}

export interface JwpubChapter {
  id: string;
  title: string;
  html: string; // The full high-fidelity HTML content
  paragraphs: JwpubParagraph[]; // Still kept for metadata/notes if needed
}

export interface JwpubPublication {
  symbol: string;  // Ex: 'wp23'
  title: string;
  chapters: JwpubChapter[];
  footnotes?: Record<string, string>; // FootnoteId -> content HTML
  lastAccessed: string;
}

export interface JwpubImage {
  id: string;      // The jwpub-media:// name or a random ID
  blob: Blob;
  mimeType: string;
}
