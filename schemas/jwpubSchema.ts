import { z } from "zod";

export const jwpubReferenceSchema = z.object({
  label: z.string(),
  url: z.string(), // Ex: jwpub://b/NWTR/45:12:11
});

export const jwpubParagraphSchema = z.object({
  id: z.string().optional(), // 'p9' from data-pid
  index: z.number(),         // Sequential index in chapter
  type: z.enum(["p", "h1", "h2", "h3", "li", "blockquote", "caption"]),
  content: z.string(),       // Plain text
  html: z.string(),          // Formatted HTML
  page: z.number().optional(), // Latest page number found
  paragraphNumber: z.number().optional(), // Explicit parNum value
  sectionTitle: z.string().optional(), // Latest header text
  images: z.array(z.string()), // IDs for the image bucket store
  references: z.array(jwpubReferenceSchema),
});

export const jwpubChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  html: z.string(), // The full high-fidelity HTML content
  paragraphs: z.array(jwpubParagraphSchema), // Still kept for metadata/notes if needed
});

export const jwpubPublicationSchema = z.object({
  symbol: z.string(),  // Ex: 'wp23'
  title: z.string(),
  chapters: z.array(jwpubChapterSchema),
  footnotes: z.record(z.string(), z.string()).optional(), // FootnoteId -> content HTML
  lastAccessed: z.string().datetime().or(z.string()), // Permite ISO string completo ou string genérica
});

export const jwpubMetadataSchema = z.object({
  symbol: z.string(),
  title: z.string(),
  lastAccessed: z.string(),
});

export const jwpubImageSchema = z.object({
  id: z.string(),
  blob: z.instanceof(Blob),
  mimeType: z.string(),
});

export type JwpubReference = z.infer<typeof jwpubReferenceSchema>;
export type JwpubParagraph = z.infer<typeof jwpubParagraphSchema>;
export type JwpubChapter = z.infer<typeof jwpubChapterSchema>;
export type JwpubPublication = z.infer<typeof jwpubPublicationSchema>;
export type JwpubMetadata = z.infer<typeof jwpubMetadataSchema>;
export type JwpubImage = z.infer<typeof jwpubImageSchema>;
