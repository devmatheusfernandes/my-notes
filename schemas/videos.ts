import { z } from "zod";

export const videoDataSchema = z.object({
    id: z.string(),
    title: z.string(),
    categoryKey: z.string(),
    primaryCategory: z.string(),
    durationFormatted: z.string(),
    coverImage: z.string().optional(),
    subtitlesUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    book: z.string().optional(), // Bible book if detected in title
    // Fields for local state
    importedAsNote: z.boolean().optional(),
    noteId: z.string().optional(),
    contentText: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    tokens: z.array(z.string()).optional(),
    rootCategoryKey: z.string().optional(),
});

export const categoryGroupSchema = z.object({
    key: z.string(),
    title: z.string(),
    videos: z.array(videoDataSchema),
});

export type CategoryGroup = z.infer<typeof categoryGroupSchema>;
export type VideoData = z.infer<typeof videoDataSchema>;